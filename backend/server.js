const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Permite o acesso público à pasta de uploads para carregar as imagens no frontend
app.use('/uploads', express.static('uploads'));

// Configuração do Multer para guardar as imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/capas/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Configuração do Banco de Dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD || ""),
  port: process.env.DB_PORT,
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const finResult = await pool.query('SELECT * FROM VW_RESUMO_FINANCEIRO_MES');
    const membrosResult = await pool.query("SELECT COUNT(*) FROM MEMBROS WHERE STATUS = 'Ativo'");
    
    res.json({
      financeiro: finResult.rows[0] || { total_entradas: 0, total_saidas: 0, saldo_atual: 0 },
      totalMembros: membrosResult.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/aniversariantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM VW_ANIVERSARIANTES_MES');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. BUSCAR MEMBROS (Agora traz o nome da função também)
app.get('/api/membros', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, min.nome as ministerio, f.nome as funcao_nome 
      FROM MEMBROS m 
      LEFT JOIN MINISTERIOS min ON m.id_ministerio_principal = min.id 
      LEFT JOIN FUNCOES_ESCALA f ON m.id_funcao_principal = f.id
      WHERE m.status = 'Ativo' 
      ORDER BY m.nome ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CRIAR MEMBRO (Agora salva a função no banco)
app.post('/api/membros', async (req, res) => {
  const { nome, telefone, email, data_nascimento, data_batismo, id_ministerio_principal, id_funcao_principal } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO MEMBROS (nome, telefone, email, data_nascimento, data_batismo, id_ministerio_principal, id_funcao_principal) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, telefone, email, data_nascimento || null, data_batismo || null, id_ministerio_principal || null, id_funcao_principal || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. EDITAR MEMBRO (Agora atualiza a função no banco)
app.put('/api/membros/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, email, data_nascimento, data_batismo, id_ministerio_principal, id_funcao_principal } = req.body;
  try {
    const result = await pool.query(
      `UPDATE MEMBROS 
       SET nome = $1, telefone = $2, email = $3, data_nascimento = $4, data_batismo = $5, id_ministerio_principal = $6, id_funcao_principal = $7 
       WHERE id = $8 RETURNING *`,
      [nome, telefone, email, data_nascimento || null, data_batismo || null, id_ministerio_principal || null, id_funcao_principal || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/membros/:id/financeiro', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT f.id, f.valor, f.data_lancamento, c.nome as categoria, c.tipo
      FROM FINANCEIRO f
      JOIN CATEGORIAS_FINANCEIRO c ON f.id_categoria = c.id
      WHERE f.id_membro = $1
      ORDER BY f.data_lancamento DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ministerios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, cor_etiqueta FROM MINISTERIOS ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/funcoes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, id_ministerio FROM FUNCOES_ESCALA ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categorias-eventos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome FROM CATEGORIAS_EVENTOS ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/escalas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        esc.id AS id_escala,
        esc.id_membro AS id_membro,
        ev.id AS id_evento,
        ev.titulo AS titulo_evento,
        ev.data_inicio AS data_inicio,
        cat.id AS id_categoria_evento,
        cat.nome AS categoria_evento_nome,
        m.nome AS membro_nome,
        f.nome AS funcao_nome,
        min.id AS id_ministerio,
        min.nome AS ministerio_nome,
        min.cor_etiqueta AS cor_ministerio
      FROM ESCALAS esc
      JOIN EVENTOS ev ON esc.id_evento = ev.id
      LEFT JOIN CATEGORIAS_EVENTOS cat ON ev.id_categoria = cat.id
      JOIN MEMBROS m ON esc.id_membro = m.id
      LEFT JOIN FUNCOES_ESCALA f ON m.id_funcao_principal = f.id
      LEFT JOIN MINISTERIOS min ON m.id_ministerio_principal = min.id
      ORDER BY ev.data_inicio ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro na rota de escalas:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/escalas', async (req, res) => {
  const { id_evento, escalas } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); 
    
    // Limpa a escala antiga do evento
    await client.query('DELETE FROM ESCALAS WHERE id_evento = $1', [id_evento]);
    
    // Insere os novos membros com suas respectivas funções
    for (const item of escalas) {
      await client.query(
        `INSERT INTO ESCALAS (id_evento, id_membro, id_funcao) VALUES ($1, $2, $3)`,
        [id_evento, item.id_membro, item.id_funcao || null]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Escala guardada com sucesso!' });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Erro ao guardar escala:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/categorias-financeiro', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, tipo FROM CATEGORIAS_FINANCEIRO ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financeiro/registros', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.id, f.valor, f.data_lancamento, f.descricao,
        c.nome as categoria, c.tipo,
        m.nome as membro_nome
      FROM FINANCEIRO f
      JOIN CATEGORIAS_FINANCEIRO c ON f.id_categoria = c.id
      LEFT JOIN MEMBROS m ON f.id_membro = m.id
      WHERE date_trunc('month', f.data_lancamento) = date_trunc('month', CURRENT_DATE)
      ORDER BY f.data_lancamento DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financeiro/grafico/entradas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.nome as categoria, SUM(f.valor) as total
      FROM FINANCEIRO f
      JOIN CATEGORIAS_FINANCEIRO c ON f.id_categoria = c.id
      WHERE c.tipo = 'Entrada' AND date_trunc('month', f.data_lancamento) = date_trunc('month', CURRENT_DATE)
      GROUP BY c.nome
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financeiro/resumo', async (req, res) => {
  try {
    // 1. Busca o resumo do mês atual (da View que já criamos)
    const mesResult = await pool.query('SELECT * FROM VW_RESUMO_FINANCEIRO_MES');
    const mes = mesResult.rows[0] || { total_entradas: 0, total_saidas: 0, saldo_atual: 0 };

    // 2. Calcula o saldo GERAL (soma de todas as entradas menos todas as saídas de todos os tempos)
    const geralResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN C.TIPO = 'Entrada' THEN F.VALOR ELSE -F.VALOR END), 0) AS saldo_geral
      FROM FINANCEIRO F
      JOIN CATEGORIAS_FINANCEIRO C ON F.ID_CATEGORIA = C.ID
    `);
    const saldoGeral = geralResult.rows[0].saldo_geral;

    res.json({
      mes: mes,
      saldo_geral: saldoGeral
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financeiro/grafico/saidas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.nome as categoria, SUM(f.valor) as total
      FROM FINANCEIRO f
      JOIN CATEGORIAS_FINANCEIRO c ON f.id_categoria = c.id
      WHERE c.tipo = 'Saida' AND date_trunc('month', f.data_lancamento) = date_trunc('month', CURRENT_DATE)
      GROUP BY c.nome
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financeiro', async (req, res) => {
  const { valor, data_lancamento, id_categoria, descricao, id_membro } = req.body;
  
  if (!valor || !id_categoria || !data_lancamento) {
    return res.status(400).json({ error: "Valor, data e categoria são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO FINANCEIRO (valor, data_lancamento, id_categoria, descricao, id_membro) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [valor, data_lancamento, id_categoria, descricao || null, id_membro || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/eventos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, c.nome as categoria_nome, m.nome as responsavel_nome
      FROM EVENTOS e
      LEFT JOIN CATEGORIAS_EVENTOS c ON e.id_categoria = c.id
      LEFT JOIN MEMBROS m ON e.id_responsavel = m.id
      ORDER BY e.data_inicio ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/eventos', upload.single('capa'), async (req, res) => {
  const { titulo, descricao, data_inicio, local, id_categoria, id_responsavel, destaque_mural } = req.body;
  
  const imagem_capa_url = req.file ? `http://localhost:3001/uploads/capas/${req.file.filename}` : null;
  const isDestaque = destaque_mural === 'true' || destaque_mural === true; // Garante que é booleano

  try {
    const result = await pool.query(
      `INSERT INTO EVENTOS (titulo, descricao, data_inicio, local, id_categoria, id_responsavel, imagem_capa_url, destaque_mural) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [titulo, descricao, data_inicio, local, id_categoria || null, id_responsavel || null, imagem_capa_url, isDestaque]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/eventos/:id', upload.single('capa'), async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, data_inicio, local, id_categoria, id_responsavel, destaque_mural } = req.body;
  
  const isDestaque = destaque_mural === 'true' || destaque_mural === true;

  try {
    let result;
    if (req.file) {
      const imagem_capa_url = `http://localhost:3001/uploads/capas/${req.file.filename}`;
      result = await pool.query(
        `UPDATE EVENTOS 
         SET titulo = $1, descricao = $2, data_inicio = $3, local = $4, id_categoria = $5, id_responsavel = $6, imagem_capa_url = $7, destaque_mural = $8 
         WHERE id = $9 RETURNING *`,
        [titulo, descricao, data_inicio, local, id_categoria || null, id_responsavel || null, imagem_capa_url, isDestaque, id]
      );
    } else {
      result = await pool.query(
        `UPDATE EVENTOS 
         SET titulo = $1, descricao = $2, data_inicio = $3, local = $4, id_categoria = $5, id_responsavel = $6, destaque_mural = $7 
         WHERE id = $8 RETURNING *`,
        [titulo, descricao, data_inicio, local, id_categoria || null, id_responsavel || null, isDestaque, id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/eventos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM EVENTOS WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
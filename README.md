<h1 align="center">
  <img src="https://github.com/dev-tec-samuel/Comunidade-Conectada/blob/main/frontend/public/icon.png" alt="Church" width="50" height="50" /><br>
  Comunidade Conectada
</h1>

<p align="center">
  <strong>Sistema Full-Stack para Gestão Integrada de Organizações Eclesiásticas</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<hr>

## 📖 Sobre o Projeto

O **Comunidade Conectada** é uma plataforma web desenvolvida como projeto principal do meu **Estágio II em Engenharia de Computação na SETREM**. O objetivo é centralizar e automatizar a gestão da **Igreja do Evangelho Quadrangular (Horizontina/RS)**, substituindo processos manuais por uma interface moderna, segura e eficiente.

O sistema foca em três pilares: **Pessoas (Membros)**, **Eventos (Comunicação)** e **Patrimônio (Financeiro)**.

## ✨ Funcionalidades Principais

- **👥 Gestão de Membros:** Cadastro completo, histórico de funções e filtros inteligentes.
- **💰 Controle Financeiro:** Dashboard dinâmico com gráficos de rosca para Origem das Entradas e Destino das Saídas (Dízimos, Ofertas e Manutenções).
- **📅 Escalas de Ministério:** Organização de voluntários por data e função, evitando conflitos de agenda.
- **🖼️ Mural de Eventos (Hero UI):** Seção visual de alto impacto para divulgação de cultos e retiros com upload de banners.
- **📈 Dashboard de Resumo:** Visualização rápida de aniversariantes do mês e saldo geral acumulado.

## 🛠️ Tecnologias e Arquitetura

O projeto utiliza a **Stack PERN** com arquitetura **Cliente-Servidor**:

- **Frontend:** React.js (Vite), Tailwind CSS, Lucide React e Chart.js.
- **Backend:** Node.js, Express e PostgreSQL.
- **Segurança:** Variáveis de ambiente (`.env`), GitIgnore rigoroso e Transações ACID no Banco de Dados.
- **Tooling:** Git/GitHub para versionamento e VS Code como IDE principal.

## 🚀 Como Executar o Projeto

Para rodar o projeto localmente, você precisará de dois terminais abertos (um para o servidor e outro para a interface).

### 1. Clonar o Repositório
```bash
git clone https://github.com/dev-tec-samuel/Comunidade-Conectada.git
cd Comunidade-Conectada
```

### 2. Configurar a API (Backend)
Abra o primeiro terminal e execute:
```bash
cd backend
npm install
```
Crie um arquivo chamado `.env` dentro da pasta `backend` e adicione suas credenciais do PostgreSQL:
```env
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
DB_HOST=localhost
DB_PORT=5432
PORT=3001
```
Inicie o servidor:
```bash
node server.js
```

### 3. Configurar a Interface (Frontend)
Abra o segundo terminal e execute:
```bash
cd frontend
npm install
npm run dev
```

---

## 👨‍💻 Autor

Desenvolvido por **Samuel Filipe Drumm da Rosa**
import { Activity, Edit, Eye, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';

export default function Membros() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMembro, setSelectedMembro] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loadingMov, setLoadingMov] = useState(false);
  
  const [ministerios, setMinisterios] = useState([]);
  const [funcoes, setFuncoes] = useState([]); // NOVO ESTADO

  const initialFormState = {
    nome: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    data_batismo: '',
    id_ministerio_principal: '',
    id_funcao_principal: '' // NOVO CAMPO
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchDados = () => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:3001/api/membros').then(res => res.ok ? res.json() : []),
      fetch('http://localhost:3001/api/ministerios').then(res => res.ok ? res.json() : []),
      fetch('http://localhost:3001/api/funcoes').then(res => res.ok ? res.json() : []) // BUSCA AS FUNÇÕES
    ]).then(([dadosMembros, dadosMinisterios, dadosFuncoes]) => {
      setMembros(Array.isArray(dadosMembros) ? dadosMembros : []);
      setMinisterios(Array.isArray(dadosMinisterios) ? dadosMinisterios : []);
      setFuncoes(Array.isArray(dadosFuncoes) ? dadosFuncoes : []);
      setLoading(false);
    }).catch(err => {
      console.error("Erro ao buscar dados:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const openModal = (type, membro = null) => {
    setModalType(type);
    setSelectedMembro(membro);

    if (type === 'add') {
      setFormData(initialFormState);
    } else if (type === 'edit' || type === 'view') {
      const formatDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
      setFormData({
        nome: membro.nome || '',
        telefone: membro.telefone || '',
        email: membro.email || '',
        data_nascimento: formatDate(membro.data_nascimento),
        data_batismo: formatDate(membro.data_batismo),
        id_ministerio_principal: membro.id_ministerio_principal || '',
        id_funcao_principal: membro.id_funcao_principal || '' // PREENCHE NA EDIÇÃO
      });
    } else if (type === 'movimentacoes') {
      fetchMovimentacoes(membro.id);
    }
    
    setModalOpen(true);
  };

  const fetchMovimentacoes = (idMembro) => {
    setLoadingMov(true);
    fetch(`http://localhost:3001/api/membros/${idMembro}/financeiro`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setMovimentacoes(Array.isArray(data) ? data : []);
        setLoadingMov(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingMov(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const url = modalType === 'add' 
      ? 'http://localhost:3001/api/membros' 
      : `http://localhost:3001/api/membros/${selectedMembro.id}`;
      
    const method = modalType === 'add' ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => {
      if (!res.ok) throw new Error("Erro na requisição");
      return res.json();
    })
    .then(() => {
      alert(`Membro ${modalType === 'add' ? 'cadastrado' : 'atualizado'} com sucesso!`);
      setModalOpen(false);
      fetchDados();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao salvar os dados.");
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <input type="text" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="Buscar membro..." />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button onClick={() => openModal('add')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-5 rounded-xl flex items-center shadow-lg shadow-orange-200 transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Membro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500">Carregando dados do banco...</div>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nome', 'Telefone', 'Ministério/Função', 'Ações'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(membros || []).map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{m.nome}</td>
                  <td className="px-6 py-4 text-gray-500">{m.telefone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 font-medium">{m.ministerio || 'Nenhum'}</span>
                    <span className="text-gray-400 text-xs block">{m.funcao_nome || 'Sem função'}</span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => openModal('view', m)} title="Visualizar" className="text-blue-500 hover:text-blue-700 p-1"><Eye className="w-5 h-5" /></button>
                    <button onClick={() => openModal('edit', m)} title="Editar" className="text-green-500 hover:text-green-700 p-1"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => openModal('movimentacoes', m)} title="Ver Movimentações" className="text-purple-500 hover:text-purple-700 p-1"><Activity className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalType === 'add' ? 'Cadastrar Novo Membro' : modalType === 'edit' ? 'Editar Membro' : modalType === 'movimentacoes' ? `Movimentações` : 'Visualizar Membro'} maxWidth="max-w-2xl">
        {modalType === 'movimentacoes' ? (
          <div>
            {loadingMov ? <p className="text-center py-6">Carregando...</p> : movimentacoes.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead><tr className="border-b"><th className="py-2">Data</th><th className="py-2">Tipo</th><th className="py-2">Categoria</th><th className="py-2 text-right">Valor</th></tr></thead>
                <tbody className="divide-y">
                  {movimentacoes.map(mov => (
                    <tr key={mov.id}>
                      <td className="py-3">{new Date(mov.data_lancamento).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${mov.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{mov.tipo}</span></td>
                      <td className="py-3">{mov.categoria}</td>
                      <td className={`py-3 text-right font-bold ${mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>R$ {parseFloat(mov.valor).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-center py-6 text-gray-500">Nenhuma movimentação.</p>}
            <div className="flex justify-end mt-4 pt-4 border-t"><button onClick={() => setModalOpen(false)} className="bg-gray-200 font-bold py-2 px-6 rounded-lg">Fechar</button></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Informações Pessoais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label><input type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" disabled={modalType === 'view'} required/></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Data de Nascimento</label><input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none" disabled={modalType === 'view'} /></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label><input type="text" name="telefone" value={formData.telefone} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none" disabled={modalType === 'view'}/></div>
                <div><label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none" disabled={modalType === 'view'}/></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 pt-4 border-t">Informações Ministeriais</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-600 mb-1">Data de Batismo</label><input type="date" name="data_batismo" value={formData.data_batismo} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none" disabled={modalType === 'view'}/></div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ministério Principal</label>
                  <select name="id_ministerio_principal" value={formData.id_ministerio_principal} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" disabled={modalType === 'view'}>
                    <option value="">Nenhum</option>
                    {ministerios.map(min => <option key={min.id} value={min.id}>{min.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Função Específica</label>
                  <select name="id_funcao_principal" value={formData.id_funcao_principal} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" disabled={modalType === 'view'}>
                    <option value="">Geral / Nenhuma</option>
                    {funcoes
                      .filter(f => !formData.id_ministerio_principal || f.id_ministerio?.toString() === formData.id_ministerio_principal.toString())
                      .map(func => <option key={func.id} value={func.id}>{func.nome}</option>)
                    }
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              {modalType === 'view' ? (
                <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-200 font-bold py-2 px-6 rounded-lg">Fechar</button>
              ) : (
                <>
                  <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-100 font-bold py-2 px-6 rounded-lg">Cancelar</button>
                  <button type="submit" className="bg-orange-500 text-white font-bold py-2 px-6 rounded-lg">Salvar</button>
                </>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
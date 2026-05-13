import { Calendar, Edit, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';

export default function Eventos() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState(null);

  const [capaFile, setCapaFile] = useState(null);

  const initialFormState = {
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    local: '',
    id_categoria: '',
    id_responsavel: '',
    imagem_capa_url: '',
    destaque_mural: false
  };
  const [formData, setFormData] = useState(initialFormState);

  const carregarDados = () => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:3001/api/eventos').then(res => res.ok ? res.json() : []),
      fetch('http://localhost:3001/api/categorias-eventos').then(res => res.ok ? res.json() : []),
      fetch('http://localhost:3001/api/membros').then(res => res.ok ? res.json() : [])
    ])
    .then(([dadosEventos, dadosCategorias, dadosMembros]) => {
      setEventos(Array.isArray(dadosEventos) ? dadosEventos : []);
      setCategorias(Array.isArray(dadosCategorias) ? dadosCategorias : []);
      setMembros(Array.isArray(dadosMembros) ? dadosMembros : []);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar dados de eventos:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const openModal = (type, evento = null) => {
    setModalType(type);
    setSelectedEvento(evento);
    setCapaFile(null);

    if (type === 'add') {
      setFormData(initialFormState);
    } else if ((type === 'edit' || type === 'view') && evento) {
      const dataObj = new Date(evento.data_inicio);
      const dataFormatada = dataObj.toISOString().split('T')[0];
      const horaFormatada = dataObj.toTimeString().substring(0, 5);

      setFormData({
        titulo: evento.titulo || '',
        descricao: evento.descricao || '',
        data: dataFormatada,
        hora: horaFormatada,
        local: evento.local || '',
        id_categoria: evento.id_categoria || '',
        id_responsavel: evento.id_responsavel || '',
        imagem_capa_url: evento.imagem_capa_url || '',
        destaque_mural: evento.destaque_mural || false
      });
    }
    
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCapaFile(e.target.files[0]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const data_inicio = `${formData.data}T${formData.hora}:00`;

    const payload = new FormData();
    payload.append('titulo', formData.titulo);
    payload.append('descricao', formData.descricao);
    payload.append('data_inicio', data_inicio);
    payload.append('local', formData.local);
    payload.append('id_categoria', formData.id_categoria);
    payload.append('id_responsavel', formData.id_responsavel);
    payload.append('destaque_mural', formData.destaque_mural);
    
    if (capaFile) {
      payload.append('capa', capaFile);
    }

    const url = modalType === 'add' 
      ? 'http://localhost:3001/api/eventos' 
      : `http://localhost:3001/api/eventos/${selectedEvento.id}`;
      
    const method = modalType === 'add' ? 'POST' : 'PUT';

    fetch(url, {
      method: method,
      body: payload
    })
    .then(res => {
      if (!res.ok) throw new Error("Erro na requisição");
      return res.json();
    })
    .then(() => {
      alert(`Sucesso ao ${modalType === 'add' ? 'criar' : 'atualizar'}!`);
      setModalOpen(false);
      carregarDados();
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao salvar o evento.");
    });
  };

  const handleDelete = (id) => {
    if(window.confirm("Deseja excluir este evento?")) {
      fetch(`http://localhost:3001/api/eventos/${id}`, { method: 'DELETE' })
      .then(res => {
        if(res.ok) carregarDados();
        else alert("Erro ao excluir.");
      })
      .catch(console.error);
    }
  };

  const getFallbackImage = (title) => `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(title || 'Evento')}`;

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse font-medium">Carregando mural...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mural de Eventos</h2>
          <p className="text-sm text-gray-500">Apenas eventos marcados como especiais aparecem aqui.</p>
        </div>
        <button onClick={() => openModal('add')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-5 rounded-xl flex items-center shadow-lg shadow-orange-100 transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Evento
        </button>
      </div>

      {eventos.filter(ev => ev.destaque_mural === true).length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhum destaque no mural</h3>
          <p className="text-gray-400">Crie um novo evento e marque a opção "Destaque no Mural".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {eventos.filter(ev => ev.destaque_mural === true).map(ev => {
            const dataObj = new Date(ev.data_inicio);
            return (
              <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className="relative h-56 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => openModal('view', ev)}>
                  <img 
                    src={ev.imagem_capa_url || getFallbackImage(ev.titulo)} 
                    alt={ev.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    onError={(e) => { e.target.src = getFallbackImage(ev.titulo) }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                    {ev.categoria_nome || 'Geral'}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2 cursor-pointer hover:text-orange-500" onClick={() => openModal('view', ev)}>
                    {ev.titulo}
                  </h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-semibold text-gray-800 mr-2">{dataObj.toLocaleDateString('pt-BR')}</span> às {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="truncate">{ev.local || 'Local não definido'}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <button onClick={() => openModal('view', ev)} className="text-sm font-bold text-blue-600 hover:text-blue-800">Ver detalhes</button>
                    <div className="flex space-x-1">
                      <button onClick={() => openModal('edit', ev)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(ev.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalType === 'add' ? 'Novo Evento' : modalType === 'edit' ? 'Editar Evento' : 'Detalhes'}
        maxWidth={modalType === 'view' ? 'max-w-4xl' : 'max-w-3xl'}
      >
        {modalType === 'view' && selectedEvento ? (
          <div>
            <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden mb-8 relative shadow-sm">
              <img 
                src={selectedEvento.imagem_capa_url || getFallbackImage(selectedEvento.titulo)} 
                alt={selectedEvento.titulo} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = getFallbackImage(selectedEvento.titulo) }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-md">{selectedEvento.categoria_nome || 'Geral'}</span>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">{selectedEvento.titulo}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-2">
              <div className="lg:col-span-2">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Sobre o Evento</h4>
                <div className="text-gray-600 leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100 min-h-[150px] whitespace-pre-wrap">
                  {selectedEvento.descricao || "Sem descrição detalhada."}
                </div>
              </div>

              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-fit space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-50 p-3 rounded-xl text-orange-500"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Quando</p>
                    <p className="font-bold text-gray-800">{new Date(selectedEvento.data_inicio).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-gray-500">às {new Date(selectedEvento.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><MapPin className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Onde</p>
                    <p className="font-bold text-gray-800 leading-tight">{selectedEvento.local || 'Local a definir'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-purple-50 p-3 rounded-xl text-purple-500"><Users className="w-6 h-6" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Responsável</p>
                    <p className="font-bold text-gray-800 leading-tight">{selectedEvento.responsavel_nome || 'Liderança Geral'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-200">Fechar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Evento</label>
              <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input required type="date" name="data" value={formData.data} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input required type="time" name="hora" value={formData.hora} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select name="id_categoria" value={formData.id_categoria} onChange={handleInputChange} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Selecione...</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Líder Responsável</label>
                <select name="id_responsavel" value={formData.id_responsavel} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Liderança Geral</option>
                  {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <input type="text" name="local" value={formData.local} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <input 
                type="checkbox" 
                id="destaque"
                name="destaque_mural" 
                checked={formData.destaque_mural} 
                onChange={handleInputChange} 
                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
              />
              <div>
                <label htmlFor="destaque" className="block text-sm font-bold text-orange-800 cursor-pointer">Evento Especial (Destacar no Mural)</label>
                <p className="text-xs text-orange-600">Se desmarcado, aparecerá apenas nas escalas.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Capa (Upload)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer" />
              {modalType === 'edit' && formData.imagem_capa_url && !capaFile && <p className="text-xs text-gray-500 mt-1">Mantendo imagem atual.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea name="descricao" value={formData.descricao} onChange={handleInputChange} rows="3" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t">
              <button type="button" onClick={() => setModalOpen(false)} className="bg-gray-100 font-bold py-3 px-6 rounded-xl">Cancelar</button>
              <button type="submit" className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-100">
                {modalType === 'add' ? 'Salvar Novo' : 'Atualizar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function Escalas() {
  const [events, setEvents] = useState([]); 
  const [members, setMembers] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [newScaleEvent, setNewScaleEvent] = useState('');
  const [newScaleMember, setNewScaleMember] = useState('');
  const [newScaleItems, setNewScaleItems] = useState([]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resEscalas, resMembros, resEventos] = await Promise.all([
        fetch('http://localhost:3001/api/escalas').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/membros').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/eventos').catch(() => ({ ok: false }))
      ]);

      let fetchedMembers = [];
      if (resMembros.ok) {
        fetchedMembers = await resMembros.json();
        setMembers(fetchedMembers);
      }

      let eventosBase = {};
      if (resEventos && resEventos.ok) {
        const dadosEventos = await resEventos.json();
        dadosEventos.forEach(ev => {
            const safeDateString = typeof ev.data_inicio === 'string' ? ev.data_inicio.replace(' ', 'T') : ev.data_inicio;
            const dateObj = new Date(safeDateString);
            eventosBase[ev.id] = {
              id: ev.id,
              date: dateObj,
              time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              title: ev.titulo,
              categoryName: ev.categoria_nome || 'Evento',
              scales: []
            };
        });
      }

      if (resEscalas.ok) {
        const dadosEscalas = await resEscalas.json();
        dadosEscalas.forEach(esc => {
          const idEvento = esc.id_evento;
          if (!eventosBase[idEvento]) return;

          if (esc.membro_nome) {
            eventosBase[idEvento].scales.push({
              id_escala: esc.id_escala,
              memberId: esc.id_membro,
              ministryId: esc.id_ministerio?.toString(),
              ministryName: esc.ministerio_nome || 'Sem Ministério',
              personName: esc.membro_nome,
              roleId: esc.id_funcao,
              roleName: esc.funcao_nome || 'Geral', 
              colorHex: esc.cor_ministerio || '#94a3b8'
            });
          }
        });
      }
      setEvents(Object.values(eventosBase));
    } catch (error) {
      console.error("Erro na API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleOpenNewScale = () => {
    setNewScaleEvent('');
    setNewScaleMember('');
    setNewScaleItems([]);
    setIsNewModalOpen(true);
  };

  const handleEditScale = () => {
    if (!selectedEvent) return;
    setNewScaleEvent(selectedEvent.id.toString());
    setNewScaleItems(selectedEvent.scales.map(s => ({
      memberId: s.memberId,
      memberName: s.personName,
      ministryId: s.ministryId,
      ministryName: s.ministryName,
      roleId: s.roleId,
      roleName: s.roleName
    })));
    setSelectedEvent(null);
    setIsNewModalOpen(true);
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setNewScaleEvent(eventId);
    if (eventId) {
      const eventInfo = events.find(ev => ev.id.toString() === eventId);
      setNewScaleItems(eventInfo && eventInfo.scales ? eventInfo.scales.map(s => ({
        memberId: s.memberId, memberName: s.personName, ministryId: s.ministryId, ministryName: s.ministryName, roleId: s.roleId, roleName: s.roleName
      })) : []);
    } else {
      setNewScaleItems([]);
    }
  };

  const handleAddScaleItem = () => {
    if (!newScaleMember) return;
    
    const member = members.find(m => m.id.toString() === newScaleMember);

    if (member) {
      if (newScaleItems.some(item => item.memberId === member.id)) {
        alert("Este membro já está na escala.");
        return;
      }

      setNewScaleItems([...newScaleItems, {
        memberId: member.id,
        memberName: member.nome,
        ministryId: member.id_ministerio_principal,
        ministryName: member.ministerio || 'Sem Ministério',
        roleId: member.id_funcao_principal,
        roleName: member.funcao_nome || 'Geral'
      }]);
      
      setNewScaleMember('');
    }
  };

  const handleRemoveScaleItem = (memberId) => {
    setNewScaleItems(newScaleItems.filter(item => item.memberId !== memberId));
  };

  const handleSaveScale = async () => {
    if (!newScaleEvent || newScaleItems.length === 0) return alert("Selecione um evento e adicione membros.");

    try {
      const payload = {
        id_evento: newScaleEvent,
        escalas: newScaleItems.map(item => ({
          id_membro: item.memberId,
          id_ministerio: item.ministryId,
          id_funcao: item.roleId
        }))
      };

      const response = await fetch('http://localhost:3001/api/escalas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await carregarDados();
        setIsNewModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      alert("Erro ao salvar.");
    }
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    let startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); 
    for (let i = 0; i < 42; i++) { 
      days.push(new Date(startDate)); 
      startDate.setDate(startDate.getDate() + 1); 
    }
    return days;
  }, [baseDate]);

  return (
    <div className="text-slate-800 font-sans flex flex-col h-[calc(100vh-13rem)] w-full">
      
      {/* Cabeçalho do Calendário */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold capitalize text-slate-800 min-w-[200px]">
            {baseDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
             <button 
               onClick={() => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1))} 
               className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
               title="Mês Anterior"
             >
               <ChevronLeft size={20} />
             </button>
             <button 
               onClick={() => setBaseDate(new Date())} 
               className="px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
             >
               Hoje
             </button>
             <button 
               onClick={() => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1))} 
               className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
               title="Próximo Mês"
             >
               <ChevronRight size={20} />
             </button>
          </div>
        </div>

        <button 
          onClick={handleOpenNewScale} 
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus size={20} /> Criar Nova Escala
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
          {/* Dias da Semana */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 grid-rows-6 bg-slate-200 gap-px flex-1 overflow-hidden">
            {calendarDays.map((date, idx) => {
              const dayEvents = events.filter(ev => ev.date.getFullYear() === date.getFullYear() && ev.date.getMonth() === date.getMonth() && ev.date.getDate() === date.getDate());
              
              const isCurrentMonth = date.getMonth() === baseDate.getMonth();
              const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();

              return (
                <div key={idx} className={`bg-white p-1.5 flex flex-col transition-colors overflow-hidden h-full ${!isCurrentMonth ? 'bg-slate-50 opacity-75' : 'hover:bg-slate-50'}`}>
                  {/* Número do Dia */}
                  <div className="flex justify-between items-start mb-1 shrink-0 px-1">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white shadow-sm' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* LÓGICA ATUALIZADA: Estilo "Pill" (Etiqueta de linha única, sem bordas pesadas) */}
                  <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-0.5 custom-scrollbar mt-1">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        onClick={() => setSelectedEvent(ev)} 
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors text-left w-full overflow-hidden ${
                          ev.scales.length === 0 
                            ? 'bg-slate-50 border border-dashed border-slate-300 text-slate-500 hover:bg-white hover:border-orange-400 hover:text-orange-600' 
                            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        }`}
                        title={`${ev.time} - ${ev.title}`} // Ao passar o rato por cima, mostra o nome completo caso corte
                      >
                        <span className={`text-[10px] font-bold shrink-0 ${ev.scales.length === 0 ? 'text-slate-400' : 'text-orange-600'}`}>
                          {ev.time}
                        </span>
                        <span className="text-[11px] font-bold truncate leading-tight w-full">
                          {ev.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR ESCALA */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><CalendarIcon className="text-orange-500"/> Detalhes do Evento</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h4 className="font-black text-2xl text-slate-800 mb-2">{selectedEvent.title}</h4>
              <p className="text-sm font-medium text-slate-500 mb-6">{selectedEvent.date.toLocaleDateString('pt-BR')} às {selectedEvent.time}</p>
              
              <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">Equipe Escalada ({selectedEvent.scales.length})</h5>
              <div className="space-y-3">
                {selectedEvent.scales.map((scale, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 shadow-sm bg-white" style={{ borderLeftWidth: '4px', borderLeftColor: scale.colorHex }}>
                    <div>
                      <div className="font-bold text-slate-800">{scale.personName}</div>
                      {scale.roleName && scale.roleName !== 'Geral' && (
                        <div className="text-sm text-slate-500 italic">{scale.roleName}</div>
                      )}
                    </div>
                    <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${scale.colorHex}15`, color: scale.colorHex }}>{scale.ministryName}</div>
                  </div>
                ))}
                
                {selectedEvent.scales.length === 0 && (
                  <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum membro escalado para este evento.
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
               <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">Fechar</button>
               <button onClick={handleEditScale} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-200 transition-colors">Editar Escala</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR NOVA ESCALA */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-orange-500 text-white flex justify-between shrink-0 rounded-t-2xl">
               <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={20}/> {newScaleEvent ? 'Editar Escala' : 'Nova Escala'}</h3>
               <button onClick={() => setIsNewModalOpen(false)} className="hover:bg-orange-600 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-600 mb-2">Selecione o Culto/Evento</label>
              <select className="w-full border border-slate-200 rounded-xl p-3 mb-6 outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50" value={newScaleEvent} onChange={handleEventChange}>
                 <option value="">Selecione na lista...</option>
                 {events.map(ev => <option key={ev.id} value={ev.id}>{ev.date.toLocaleDateString('pt-BR')} - {ev.title} ({ev.time})</option>)}
              </select>

              <div className="border border-slate-200 p-5 rounded-2xl bg-white shadow-sm">
                 <h4 className="font-bold text-slate-800 mb-4">Adicionar Voluntário</h4>
                 <div className="flex gap-3">
                    <select className="flex-1 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50" value={newScaleMember} onChange={(e) => setNewScaleMember(e.target.value)}>
                      <option value="">Buscar membro...</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.nome} {m.funcao_nome ? `(${m.funcao_nome})` : ''}</option>)}
                    </select>
                    <button type="button" onClick={handleAddScaleItem} disabled={!newScaleMember} className="bg-slate-800 hover:bg-slate-700 text-white px-5 rounded-xl disabled:opacity-50 font-bold transition-colors">Adicionar</button>
                 </div>

                 <div className="bg-slate-50 border border-slate-200 rounded-xl mt-5 p-3 min-h-[120px] max-h-56 overflow-y-auto custom-scrollbar">
                    {newScaleItems.length === 0 ? (
                      <div className="text-sm text-center text-slate-400 mt-10">Nenhum membro selecionado.</div>
                    ) : (
                      newScaleItems.map(item => (
                        <div key={item.memberId} className="flex justify-between items-center bg-white p-3 mb-2 rounded-lg border border-slate-100 shadow-sm">
                          <div>
                            <span className="text-sm font-bold text-slate-800">{item.memberName}</span>
                            <span className="text-xs font-medium text-slate-500 block mt-0.5">
                              {item.ministryName} 
                              {item.roleName && item.roleName !== 'Geral' ? ` • ${item.roleName}` : ''}
                            </span>
                          </div>
                          <button onClick={() => handleRemoveScaleItem(item.memberId)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
               <button onClick={() => setIsNewModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
               <button onClick={handleSaveScale} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md shadow-green-200 transition-colors">Salvar Escala</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
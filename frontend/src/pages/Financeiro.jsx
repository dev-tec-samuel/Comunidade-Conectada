import { DollarSign, List, Plus, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`bg-white w-full ${maxWidth} rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Financeiro() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMovimentacoesOpen, setModalMovimentacoesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [resumo, setResumo] = useState({ mes: {}, saldo_geral: 0 });
  const [registros, setRegistros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [membros, setMembros] = useState([]);
  
  const [graficoEntradas, setGraficoEntradas] = useState([]);
  const [graficoSaidas, setGraficoSaidas] = useState([]);

  const initialForm = {
    tipo: 'Entrada',
    id_categoria: '',
    valor: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    id_membro: '',
    descricao: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resResumo, resRegistros, resCategorias, resMembros, resGrafEntradas, resGrafSaidas] = await Promise.all([
        fetch('http://localhost:3001/api/financeiro/resumo').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/financeiro/registros').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/categorias-financeiro').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/membros').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/financeiro/grafico/entradas').catch(() => ({ ok: false })),
        fetch('http://localhost:3001/api/financeiro/grafico/saidas').catch(() => ({ ok: false }))
      ]);

      if (resResumo.ok) setResumo(await resResumo.json());
      if (resRegistros.ok) setRegistros(await resRegistros.json());
      if (resCategorias.ok) setCategorias(await resCategorias.json());
      if (resMembros.ok) setMembros(await resMembros.json());
      if (resGrafEntradas.ok) setGraficoEntradas(await resGrafEntradas.json());
      if (resGrafSaidas.ok) setGraficoSaidas(await resGrafSaidas.json());

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.valor || !formData.id_categoria || !formData.data_lancamento) {
      alert("Preencha o valor, a categoria e a data.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: formData.valor,
          data_lancamento: formData.data_lancamento,
          id_categoria: formData.id_categoria,
          descricao: formData.descricao,
          id_membro: formData.id_membro || null
        })
      });

      if (response.ok) {
        setModalOpen(false);
        setFormData(initialForm);
        carregarDados(); 
      } else {
        const err = await response.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const formatarMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  }

  const categoriasFiltradas = categorias.filter(c => c.tipo === formData.tipo);

  const dataEntradas = {
    labels: graficoEntradas.map(g => g.categoria),
    datasets: [{
      data: graficoEntradas.map(g => g.total),
      backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'],
      borderWidth: 4, 
      borderColor: '#ffffff',
      hoverOffset: 8,
      borderRadius: 6
    }]
  };

  const dataSaidas = {
    labels: graficoSaidas.map(g => g.categoria),
    datasets: [{
      data: graficoSaidas.map(g => g.total),
      backgroundColor: ['#ef4444', '#f97316', '#f43f5e', '#eab308', '#d946ef'],
      borderWidth: 4,
      borderColor: '#ffffff',
      hoverOffset: 8,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    cutout: '80%',
    layout: {
      padding: 10
    },
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { 
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
          color: '#64748b',
          font: { family: "'Inter', sans-serif", size: 12, weight: '600' }
        } 
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) { label += ': '; }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="animate-in fade-in duration-500 font-sans text-slate-800">
      
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800"></h2>
          <p className="text-slate-500 text-sm">Acompanhe as entradas, saídas e o saldo da igreja.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setModalMovimentacoesOpen(true)} className="flex-1 md:flex-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-5 rounded-xl flex items-center justify-center transition-colors">
            <List className="w-5 h-5 mr-2" /> Ver Movimentações
          </button>
          <button onClick={() => setModalOpen(true)} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 transition-all active:scale-95">
            <Plus className="w-5 h-5 mr-2" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Wallet size={100} className="text-white" />
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">Saldo Geral Acumulado</h3>
            <p className={`text-3xl font-black ${resumo.saldo_geral >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatarMoeda(resumo.saldo_geral)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={16} /></div>
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Entradas do Mês</h3>
          </div>
          <p className="text-2xl font-black text-slate-800">{formatarMoeda(resumo.mes.total_entradas)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={16} /></div>
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Saídas do Mês</h3>
          </div>
          <p className="text-2xl font-black text-slate-800">{formatarMoeda(resumo.mes.total_saidas)}</p>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${Number(resumo.mes.saldo_atual) >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-lg ${Number(resumo.mes.saldo_atual) >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}><DollarSign size={16} /></div>
            <h3 className={`font-bold uppercase tracking-wider text-[10px] ${Number(resumo.mes.saldo_atual) >= 0 ? 'text-green-700' : 'text-red-700'}`}>Resultado do Mês</h3>
          </div>
          <p className={`text-2xl font-black ${Number(resumo.mes.saldo_atual) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatarMoeda(resumo.mes.saldo_atual)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Origem das Entradas (Mês)</h3>
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            {graficoEntradas.length > 0 ? (
              <div className="relative w-full h-72 flex items-center justify-center">
                <Doughnut data={dataEntradas} options={chartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-slate-800">{formatarMoeda(resumo.mes.total_entradas)}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 font-medium">Nenhuma entrada registada no mês.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Destino das Saídas (Mês)</h3>
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            {graficoSaidas.length > 0 ? (
              <div className="relative w-full h-72 flex items-center justify-center">
                <Doughnut data={dataSaidas} options={chartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-slate-800">{formatarMoeda(resumo.mes.total_saidas)}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 font-medium">Nenhuma saída registada no mês.</p>
            )}
          </div>
        </div>

      </div>

      <Modal isOpen={modalMovimentacoesOpen} onClose={() => setModalMovimentacoesOpen(false)} title="Movimentações do Mês" maxWidth="max-w-4xl">
        <div className="overflow-x-auto rounded-xl border border-slate-100 mb-4">
           <table className="w-full table-auto text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição / Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Membro</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-medium">Nenhum lançamento registado neste mês.</td>
                  </tr>
                ) : (
                  registros.map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {new Date(reg.data_lancamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${reg.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {reg.tipo}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{reg.categoria}</p>
                            {reg.descricao && <p className="text-xs text-slate-500">{reg.descricao}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {reg.membro_nome || <span className="italic text-slate-400">Não identificado</span>}
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${reg.tipo === 'Entrada' ? 'text-green-600' : 'text-red-500'}`}>
                        {reg.tipo === 'Entrada' ? '+ ' : '- '}
                        {formatarMoeda(reg.valor)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={() => setModalMovimentacoesOpen(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Fechar</button>
        </div>
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Lançamento" maxWidth="max-w-lg">
        <form id="financeForm" onSubmit={handleSave} className="space-y-5">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-4">
            <button type="button" onClick={() => setFormData({...formData, tipo: 'Entrada', id_categoria: ''})} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.tipo === 'Entrada' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
              Receita (Entrada)
            </button>
            <button type="button" onClick={() => setFormData({...formData, tipo: 'Saida', id_categoria: ''})} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.tipo === 'Saida' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>
              Despesa (Saída)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Data</label>
              <input type="date" name="data_lancamento" value={formData.data_lancamento} onChange={handleInputChange} required className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" name="valor" value={formData.valor} onChange={handleInputChange} required placeholder="0.00" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 font-bold" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Categoria</label>
            <select name="id_categoria" value={formData.id_categoria} onChange={handleInputChange} required className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Selecione uma categoria...</option>
              {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {formData.tipo === 'Entrada' && (
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Dizimista/Ofertante (Opcional)</label>
              <select name="id_membro" value={formData.id_membro} onChange={handleInputChange} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Anônimo / Não aplicável</option>
                {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Descrição / Observação</label>
            <input type="text" name="descricao" value={formData.descricao} onChange={handleInputChange} placeholder="Ex: Referente ao mês de Outubro" className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancelar</button>
            <button type="submit" form="financeForm" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-200 transition-colors">Confirmar Lançamento</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
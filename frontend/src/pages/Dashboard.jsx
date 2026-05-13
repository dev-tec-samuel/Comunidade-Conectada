import { Calendar, Church, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard({ setCurrentScreen }) {
  const [dadosDashboard, setDadosDashboard] = useState({
    totalMembros: 0,
    financeiro: { total_entradas: 0 }
  });
  const [aniversariantes, setAniversariantes] = useState([]);

  // Busca os dados assim que a tela abre
  useEffect(() => {
    // Busca Totais
    fetch('http://localhost:3001/api/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.financeiro) setDadosDashboard(data);
      })
      .catch(err => console.error("Erro ao buscar dados do dashboard:", err));

    // Busca Aniversariantes do Mês (Simulando a chamada da sua View VW_ANIVERSARIANTES_MES)
    fetch('http://localhost:3001/api/aniversariantes')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setAniversariantes(data);
      })
      .catch(err => console.error("Erro ao buscar aniversariantes:", err));
  }, []);

  const cards = [
    { id: 'membros', title: 'Gerenciar Membros', val: dadosDashboard?.totalMembros || 0, icon: Users, color: 'text-blue-600' },
    { id: 'escalas', title: 'Montar Escalas', val: 'Visualizar', icon: Calendar, color: 'text-green-600' },
    { id: 'financeiro', title: 'Registrar Finanças', val: `R$ ${dadosDashboard?.financeiro?.total_entradas || 0}`, icon: Wallet, color: 'text-yellow-600' },
    { id: 'eventos', title: 'Próximos Eventos', val: 'Visualizar', icon: Church, color: 'text-purple-600' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div 
              key={card.id}
              onClick={() => setCurrentScreen(card.id)}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group"
            >
              <Icon className={`w-10 h-10 mb-4 ${card.color} group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-semibold text-gray-700">{card.title}</h3>
              <p className="text-gray-900 font-bold text-2xl mt-1">{card.val}</p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Aniversariantes do Mês</h3>
        <ul className="space-y-3">
          {aniversariantes.length > 0 ? aniversariantes.map((pessoa, index) => (
            <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">{pessoa.nome}</span>
              <span className="text-gray-500 text-sm font-semibold">{new Date(pessoa.data_nascimento).toLocaleDateString('pt-BR')}</span>
            </li>
          )) : (
            <li className="p-3 bg-gray-50 rounded-lg text-gray-500">Nenhum aniversariante encontrado para o mês atual.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

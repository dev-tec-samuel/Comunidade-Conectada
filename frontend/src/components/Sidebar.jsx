import { Calendar, Church, Home, LogOut, Users, Wallet } from 'lucide-react';

export default function Sidebar({ currentScreen, setCurrentScreen }) {
  const menuItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'membros', label: 'Membros', icon: Users },
    { id: 'escalas', label: 'Escalas', icon: Calendar },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'eventos', label: 'Eventos', icon: Church },
  ];

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col fixed h-full z-20">
      <div className="px-6 py-6 text-2xl font-bold text-center border-b border-blue-800">
        Comunidade Conectada
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentScreen(item.id)}
                  className={`w-full flex items-center px-6 py-4 transition-colors text-left ${
                    isActive ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-6 py-4 border-t border-blue-800">
        <button className="flex items-center text-gray-300 hover:text-white w-full text-left">
          <LogOut className="w-6 h-6 mr-3" />
          Sair
        </button>
      </div>
    </aside>
  );
}
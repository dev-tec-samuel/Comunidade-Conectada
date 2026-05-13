import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Escalas from './pages/Escalas';
import Eventos from './pages/Eventos';
import Financeiro from './pages/Financeiro';
import Membros from './pages/Membros';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('inicio');

  const getTitle = () => {
    switch(currentScreen) {
      case 'inicio': return 'Início';
      case 'membros': return 'Gestão de Membros';
      case 'escalas': return 'Gestão de Escalas';
      case 'financeiro': return 'Gestão Financeira';
      case 'eventos': return 'Próximos Eventos';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto custom-scrollbar">
        <Header title={getTitle()} />
        
        <div className="max-w-7xl mx-auto">
          {currentScreen === 'inicio' && <Dashboard setCurrentScreen={setCurrentScreen} />}
          {currentScreen === 'membros' && <Membros />}
          {currentScreen === 'financeiro' && <Financeiro />}
          {currentScreen === 'escalas' && <Escalas />}
          {currentScreen === 'eventos' && <Eventos />}
        </div>
      </main>
    </div>
  );
}

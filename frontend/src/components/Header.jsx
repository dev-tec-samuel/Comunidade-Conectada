import { Bell } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-blue-600 transition-colors relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-3 bg-white p-1 pr-4 rounded-full shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">PC</div>
          <span className="font-semibold text-gray-700">Olá, Pastor Carlos</span>
        </div>
      </div>
    </header>
  );
}
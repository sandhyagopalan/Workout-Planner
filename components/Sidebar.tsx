
import React from 'react';
import { LayoutDashboard, Users, Dumbbell, Activity, Calendar, ClipboardList, Settings, Smartphone } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onSimulateClient?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onSimulateClient }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'exercises', label: 'Exercise Library', icon: Dumbbell },
    { id: 'workouts', label: 'Workouts', icon: Activity },
    { id: 'programs', label: 'Programs', icon: Calendar },
    { id: 'questionnaires', label: 'Questionnaires', icon: ClipboardList },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 hidden md:flex border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          FitPro AI
        </h1>
        <p className="text-xs text-slate-400 mt-1">Trainer Command Center</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {onSimulateClient && (
            <button 
                onClick={onSimulateClient}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 px-4 rounded-xl border border-white/10 hover:border-white/30 transition-all shadow-lg shadow-indigo-900/50 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Smartphone size={18} className="relative z-10 group-hover:scale-110 transition-transform animate-pulse"/>
                <span className="relative z-10 text-xs font-bold uppercase tracking-wide">Simulate Client App</span>
            </button>
        )}

        <div>
            <button className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white w-full hover:bg-slate-800 rounded-lg transition-colors text-sm">
            <Settings size={18} />
            <span>Settings</span>
            </button>
            <div className="mt-3 flex items-center gap-3 px-4 pt-3 border-t border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                JD
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">John Doe</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Head Trainer</span>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

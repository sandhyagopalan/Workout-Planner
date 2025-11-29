
import React, { useState } from 'react';
import { Plus, Trash2, Target, Save, CheckCircle } from 'lucide-react';

interface SettingsProps {
  goals: string[];
  setGoals: React.Dispatch<React.SetStateAction<string[]>>;
}

const Settings: React.FC<SettingsProps> = ({ goals, setGoals }) => {
  const [newGoal, setNewGoal] = useState('');

  const handleAddGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    if (window.confirm(`Are you sure you want to remove "${goalToRemove}"? Clients with this goal will preserve it, but it won't be selectable for new ones.`)) {
      setGoals(goals.filter(g => g !== goalToRemove));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings & Configuration</h2>
        <p className="text-slate-500">Manage global definitions for your business.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target size={20} className="text-indigo-600" />
            Client Goals / Objectives
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Define the list of goals available during Client Intake and AI Workout Generation.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors"
              placeholder="Add a new goal category (e.g. 'Post-Partum', 'Marathon Prep')"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
            />
            <button 
              onClick={handleAddGoal}
              disabled={!newGoal.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-indigo-100 transition-all">
                <span className="font-medium text-slate-700">{goal}</span>
                <button 
                  onClick={() => handleRemoveGoal(goal)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

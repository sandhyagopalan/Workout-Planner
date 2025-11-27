
import React, { useState } from 'react';
import { Client } from '../../types';
import { User, Settings, ChevronRight, Scale, Ruler, Activity, Calendar, History, Trophy, Edit2, Save, Target, ImageIcon } from 'lucide-react';

interface Props {
  client: Client;
  onUpdate: (data: Partial<Client>) => void;
}

const ClientProfile: React.FC<Props> = ({ client, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState(client.weight || 70);
  const [height, setHeight] = useState(client.height || 170);

  const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
  const completedWorkouts = client.workoutLogs?.length || 0;

  const handleSave = () => {
    onUpdate({ weight, height });
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-50 min-h-full pb-32 font-sans animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="bg-white pt-16 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl font-black text-indigo-600">
              {client.name.charAt(0)}
            </div>
          </div>
          <button className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
            <Settings size={24} />
          </button>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-1">{client.name}</h1>
        <p className="text-slate-500 font-medium flex items-center gap-2">
          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Member</span>
          since 2023
        </p>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900">{completedWorkouts}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workouts</div>
          </div>
          <div className="text-center border-l border-slate-100">
            <div className="text-2xl font-black text-slate-900">12</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Streak</div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {/* Goals Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Target size={20} className="text-indigo-500"/> My Goals</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-500">Primary Focus</span>
                    <span className="text-sm font-black text-indigo-900">{client.goal}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-500">Commitment</span>
                    <span className="text-sm font-black text-slate-800">{client.trainingDaysPerWeek} Days/Week</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-500">Level</span>
                    <span className="text-sm font-black text-slate-800">{client.experienceLevel}</span>
                </div>
            </div>
        </div>

        {/* Transformation Gallery */}
        <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 px-1 flex items-center gap-2"><ImageIcon size={20} className="text-purple-500"/> Transformation</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-slate-200 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Start</span>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Day 1</div>
                </div>
                <div className="aspect-[3/4] bg-slate-100 rounded-2xl relative overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                    <PlusCircleIcon />
                    <span className="text-xs font-bold uppercase tracking-wider">Add Current</span>
                </div>
            </div>
        </div>

        {/* Biometrics Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-emerald-500" /> Vitals
            </h3>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {isEditing ? 'Save Changes' : 'Edit Stats'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Scale size={14} /> Weight
              </div>
              <div className="flex items-end gap-1">
                {isEditing ? (
                  <input 
                    type="number" 
                    className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-2xl font-black text-slate-900 outline-none focus:border-indigo-500"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-900">{weight}</span>
                )}
                <span className="text-sm font-bold text-slate-400 mb-1">kg</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Ruler size={14} /> Height
              </div>
              <div className="flex items-end gap-1">
                {isEditing ? (
                  <input 
                    type="number" 
                    className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-2xl font-black text-slate-900 outline-none focus:border-indigo-500"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value))}
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-900">{height}</span>
                )}
                <span className="text-sm font-bold text-slate-400 mb-1">cm</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
            <span className="text-sm font-medium text-slate-300">BMI Score</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black">{bmi}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase">Healthy</span>
            </div>
          </div>
        </div>

        {/* History List */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 px-1 flex items-center gap-2">
            <History size={20} className="text-orange-500" /> Recent History
          </h3>
          
          <div className="space-y-3">
            {client.workoutLogs && client.workoutLogs.length > 0 ? (
              [...client.workoutLogs].reverse().slice(0, 5).map((log, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Workout Completed</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <p>No workouts completed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon
const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
)

export default ClientProfile;

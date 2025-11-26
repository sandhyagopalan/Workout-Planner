
import React from 'react';
import { Client, Workout } from '../../types';
import { Calendar, Trophy, Activity, PlayCircle, TrendingUp, Dumbbell, Zap, Flame, Clock, ArrowRight, MoreHorizontal, ChevronRight } from 'lucide-react';

interface Props {
  client: Client;
  todayWorkout?: Workout;
  onStartWorkout: () => void;
}

const ClientDashboard: React.FC<Props> = ({ client, todayWorkout, onStartWorkout }) => {
  return (
    <div className="bg-slate-50 min-h-full pb-32 font-sans">
      {/* Header Section with Greeting */}
      <div className="pt-16 px-6 pb-6 bg-white rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-inner">
                          {client.name.charAt(0)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Welcome Back</p>
                      <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{client.name.split(' ')[0]}</h1>
                  </div>
              </div>
              <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
                  <MoreHorizontal size={20} />
              </button>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                          <Flame size={16} fill="currentColor" />
                      </div>
                      <span className="text-xs font-bold text-orange-400 bg-white/50 px-2 py-0.5 rounded-full">+1</span>
                  </div>
                  <div>
                      <span className="text-3xl font-black text-slate-900 block tracking-tighter">3</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Day Streak</span>
                  </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <Zap size={16} fill="currentColor" />
                      </div>
                  </div>
                  <div>
                      <span className="text-3xl font-black text-slate-900 block tracking-tighter">12</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Workouts</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="px-6 mt-6">
          {/* Featured Workout Card (Hero) */}
          <div className="flex justify-between items-end mb-4 px-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Plan</h3>
              {todayWorkout && <span className="text-xs font-bold text-slate-400">{todayWorkout.durationMinutes} min</span>}
          </div>

          <div 
            className="relative mb-8 group cursor-pointer active:scale-[0.98] transition-transform shadow-xl shadow-indigo-200/50 rounded-[2rem]"
            onClick={todayWorkout ? onStartWorkout : undefined}
          >
              <div className="absolute inset-0 bg-indigo-600 rounded-[2rem] -rotate-1 opacity-50 translate-y-2 blur-sm group-hover:rotate-0 transition-all"></div>
              <div className="relative bg-slate-900 rounded-[2rem] p-6 overflow-hidden min-h-[240px] flex flex-col justify-between">
                  {/* Background Image / Gradient */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                  
                  {/* Top Badge */}
                  <div className="relative z-10 flex justify-between items-start">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                          {todayWorkout ? "Priority Session" : "Rest & Recover"}
                      </span>
                  </div>

                  {/* Bottom Content */}
                  <div className="relative z-10">
                      <h2 className="text-3xl font-black text-white mb-3 leading-[0.9] tracking-tight">
                          {todayWorkout ? todayWorkout.title : "Active Recovery"}
                      </h2>
                      {todayWorkout ? (
                          <div className="space-y-4">
                              <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                                  <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg"><Clock size={14} className="text-indigo-400"/> {todayWorkout.durationMinutes}m</span>
                                  <span className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg"><Dumbbell size={14} className="text-indigo-400"/> {todayWorkout.exercises.length} Moves</span>
                              </div>
                              <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
                                  <PlayCircle size={18} fill="currentColor" className="text-indigo-600"/>
                                  Start Workout
                              </button>
                          </div>
                      ) : (
                          <p className="text-slate-300 text-sm font-medium">No workout assigned for today. Take a walk or stretch.</p>
                      )}
                  </div>
              </div>
          </div>

          {/* Progress Section */}
          <div className="mb-8">
              <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Progress</h3>
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <ChevronRight size={20} />
                  </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-[2rem] p-3 shadow-sm flex items-center gap-4 active:scale-[0.99] transition-transform">
                  <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <TrendingUp size={24} />
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Weight</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">-2.4%</span>
                      </div>
                      <div className="text-xl font-black text-slate-900">{client.weight} <span className="text-sm text-slate-400 font-bold">kg</span></div>
                  </div>
                  <div className="pr-2">
                      <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300">
                          <ArrowRight size={14} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Upcoming Schedule */}
          <div>
              <h3 className="text-lg font-black text-slate-900 mb-4 px-1 tracking-tight">This Week</h3>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                      const active = i === 1; // Demo active state
                      return (
                          <div key={i} className={`flex-shrink-0 w-14 h-20 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : 'bg-white border border-slate-100 text-slate-400'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{day}</span>
                              <span className={`text-lg font-black ${active ? 'text-white' : 'text-slate-800'}`}>{12 + i}</span>
                              {active && <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1"></div>}
                          </div>
                      )
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ClientDashboard;


import React, { useState, useMemo } from 'react';
import { Client, Workout, Program, Exercise } from '../../types';
import Onboarding from './Onboarding';
import ClientDashboard from './ClientDashboard';
import WorkoutPlayer from './WorkoutPlayer';
import ClientProfile from './ClientProfile';
import { Home, Calendar, MessageSquare, User, LogOut } from 'lucide-react';

interface ClientAppProps {
  client: Client;
  workouts: Workout[];
  programs: Program[];
  exercises: Exercise[];
  onUpdateClient: (updatedData: Partial<Client>) => void;
  onExit: () => void;
}

const ClientApp: React.FC<ClientAppProps> = ({ client, workouts, programs, exercises, onUpdateClient, onExit }) => {
  const [showOnboarding, setShowOnboarding] = useState(!client.onboardingComplete);
  const [activeTab, setActiveTab] = useState('home');
  const [view, setView] = useState<'dashboard' | 'player' | 'profile'>('dashboard');

  // Determine Today's Workout Logic
  const todayWorkout = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 1. Check assigned custom workouts (PRIORITY)
      if (client.assignedWorkouts) {
          const custom = client.assignedWorkouts.find(cw => cw.assignedDate === todayStr);
          if (custom) return custom; 
      }

      // 2. Check program
      if (client.assignedProgramId && client.programStartDate) {
          const program = programs.find(p => p.id === client.assignedProgramId);
          if (program) {
              const start = new Date(client.programStartDate);
              const current = new Date();
              start.setHours(0,0,0,0);
              current.setHours(0,0,0,0);
              
              const diffTime = current.getTime() - start.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays >= 0) {
                  const weekNum = Math.floor(diffDays / 7) + 1;
                  const dayIndex = diffDays % 7;
                  const weekWorkouts = program.schedule[weekNum] || [];
                  
                  let workoutId = null;
                  if (weekWorkouts.length > dayIndex && weekWorkouts[dayIndex]) {
                      workoutId = weekWorkouts[dayIndex];
                  } else {
                      if (dayIndex === 0) workoutId = weekWorkouts[0];
                      if (dayIndex === 2) workoutId = weekWorkouts[1];
                      if (dayIndex === 4) workoutId = weekWorkouts[2];
                  }

                  if (workoutId) {
                      return workouts.find(w => w.id === workoutId);
                  }
              }
          }
      }
      
      // 3. FALLBACK FOR DEMO
      if (workouts.length > 0) {
          return { ...workouts[0], title: "Demo: " + workouts[0].title };
      }

      return null;
  }, [client, workouts, programs]);

  const handleOnboardingComplete = (data: Partial<Client>) => {
    onUpdateClient({ ...data, onboardingComplete: true });
    setShowOnboarding(false);
  };

  const handleCompleteWorkout = (results: any) => {
      console.log("B2C Handshake Complete:", results);
      
      onUpdateClient({ 
          lastActive: new Date().toISOString().split('T')[0],
          workoutLogs: [results] 
      });
      
      setView('dashboard');
  };

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      if (tab === 'home') setView('dashboard');
      if (tab === 'profile') setView('profile');
  };

  if (showOnboarding) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
            <div className="w-full max-w-[400px] h-[850px] bg-white rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-slate-800 relative ring-4 ring-slate-900/50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-slate-800 rounded-b-xl z-50"></div>
                <Onboarding client={client} onComplete={handleOnboardingComplete} />
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4 animate-in fade-in duration-500">
        <div className="w-full max-w-[400px] h-[850px] bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-slate-800 relative ring-4 ring-slate-900/50 flex flex-col transform transition-all duration-300">
            
            {/* Notch & Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/90 to-transparent z-50 flex items-center justify-between px-6 pt-2 pointer-events-none">
                <span className="text-xs font-bold text-slate-900">9:41</span>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-slate-800 rounded-b-xl pointer-events-auto"></div>
                <div className="flex gap-1.5">
                    <div className="w-4 h-2.5 bg-slate-900 rounded-[1px]"></div>
                    <div className="w-0.5 h-2.5 bg-slate-900/30 rounded-[1px]"></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-white relative">
                {view === 'dashboard' && (
                    <div className="h-full overflow-y-auto scrollbar-hide pb-24 animate-in slide-in-from-left-4 duration-300">
                        <ClientDashboard 
                            client={client} 
                            todayWorkout={todayWorkout as any} 
                            onStartWorkout={() => setView('player')} 
                        />
                    </div>
                )}
                
                {view === 'profile' && (
                    <div className="h-full overflow-y-auto scrollbar-hide pb-24">
                        <ClientProfile client={client} onUpdate={onUpdateClient} />
                    </div>
                )}

                {view === 'player' && (
                    todayWorkout ? (
                        <div className="h-full animate-in slide-in-from-right-4 duration-300 bg-white">
                            <WorkoutPlayer 
                                workout={todayWorkout as any} 
                                exercises={exercises} 
                                onBack={() => setView('dashboard')}
                                onComplete={handleCompleteWorkout}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <p>Workout data not found.</p>
                            <button onClick={() => setView('dashboard')} className="mt-4 text-indigo-600 font-bold">Back Home</button>
                        </div>
                    )
                )}
            </div>
            
            {/* Floating Bottom Navigation (Only on Dashboard/Profile) */}
            {(view === 'dashboard' || view === 'profile') && (
                <div className="absolute bottom-6 left-6 right-6 z-40">
                    <div className="bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-[2rem] flex justify-between items-center shadow-2xl border border-white/10">
                        <button 
                            onClick={() => handleTabChange('home')}
                            className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('calendar')}
                            className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeTab === 'calendar' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Calendar size={22} />
                        </button>

                        {/* Main Action - Start Workout (Dynamic) */}
                        <div className="relative -top-6">
                            <button 
                                onClick={() => todayWorkout && setView('player')}
                                className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 border-4 border-slate-50 active:scale-95 transition-transform"
                            >
                                <div className="w-6 h-6 bg-white rounded-[4px]"></div>
                            </button>
                        </div>

                        <button className="h-12 w-12 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors">
                            <MessageSquare size={22} />
                        </button>
                        
                        <button 
                            onClick={() => handleTabChange('profile')}
                            className={`h-12 w-12 flex items-center justify-center rounded-full transition-all duration-300 ${activeTab === 'profile' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Exit Button (Debug) */}
            <button onClick={onExit} className="absolute top-12 right-6 z-[60] p-2 bg-black/10 hover:bg-black/20 rounded-full text-slate-900 transition-colors">
                <LogOut size={16} />
            </button>
            
            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-300 rounded-full mb-2 z-50 pointer-events-none"></div>
        </div>
    </div>
  );
};

export default ClientApp;

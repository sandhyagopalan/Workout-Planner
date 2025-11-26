
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Exercises from './components/Exercises';
import Workouts from './components/Workouts';
import Programs from './components/Programs';
import Questionnaires from './components/Questionnaires';
import ClientApp from './components/client/ClientApp';
import { ViewState, Client, Exercise, Workout, Program, AppMode } from './types';
import { MOCK_CLIENTS, MOCK_EXERCISES, MOCK_PROGRAMS, MOCK_WORKOUTS } from './constants';
import { Menu } from 'lucide-react';
import { fetchFreeExerciseDb } from './services/exerciseDb';

// Helper to normalize names for fuzzy matching
const normalizeName = (name: string) => {
    return name.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('admin');
  const [activeClientId, setActiveClientId] = useState<string>('cl-1'); 
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Centralized State "Database"
  // Initialize with forced data injection for demo purposes
  const [clients, setClients] = useState<Client[]>(() => {
      return MOCK_CLIENTS.map(c => {
          if (c.id === 'cl-1') {
              const today = new Date().toISOString().split('T')[0];
              // Force Inject "Upper Body Power" (wk-upper-power) which has Supersets
              const upperPower = MOCK_WORKOUTS.find(w => w.id === 'wk-upper-power');
              
              const existingWorkouts = c.assignedWorkouts || [];
              // Avoid duplicates if reloading
              if (!existingWorkouts.some(w => w.assignedDate === today && w.workoutId === 'wk-upper-power')) {
                  if (upperPower) {
                      return {
                          ...c,
                          onboardingComplete: true,
                          assignedWorkouts: [
                              ...existingWorkouts,
                              {
                                  id: `cw-init-${Date.now()}`,
                                  workoutId: upperPower.id,
                                  title: upperPower.title,
                                  assignedDate: today,
                                  completed: false,
                                  exercises: upperPower.exercises,
                                  notes: 'Superset Demo Session'
                              }
                          ]
                      };
                  }
              }
              return { ...c, onboardingComplete: true };
          }
          return c;
      });
  });

  const [exercises, setExercises] = useState<Exercise[]>(MOCK_EXERCISES);
  const [workouts, setWorkouts] = useState<Workout[]>(MOCK_WORKOUTS);
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Load external exercises on boot
  useEffect(() => {
    const loadExercises = async () => {
      setIsLoadingExercises(true);
      try {
        console.log("Fetching external exercise database...");
        const externalExercises = await fetchFreeExerciseDb();
        
        setExercises(prevExercises => {
          const externalMap = new Map<string, Exercise>();
          externalExercises.forEach(e => {
              externalMap.set(normalizeName(e.name), e);
          });

          const updatedExercises = prevExercises.map(e => ({...e}));

          updatedExercises.forEach(localEx => {
              if (!localEx.videoUrl || localEx.videoUrl === '') {
                  const normName = normalizeName(localEx.name);
                  let match = externalMap.get(normName);
                  
                  if (!match) {
                       for (const [extName, extEx] of externalMap.entries()) {
                           if (extName.includes(normName) || normName.includes(extName)) {
                               match = extEx;
                               break;
                           }
                       }
                  }

                  if (match && match.videoUrl) {
                      localEx.videoUrl = match.videoUrl;
                  }
              }
          });

          const existingNames = new Set(updatedExercises.map(e => normalizeName(e.name)));
          externalExercises.forEach(ext => {
              if (!existingNames.has(normalizeName(ext.name))) {
                  updatedExercises.push(ext);
              }
          });

          return updatedExercises.sort((a, b) => a.name.localeCompare(b.name));
        });
      } catch (error) {
        console.error("Failed to load external exercises", error);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    loadExercises();
  }, []);

  // --- Handlers for Client App Handshake ---
  const handleClientUpdate = (updatedData: Partial<Client>) => {
      setClients(prev => prev.map(c => {
          if (c.id === activeClientId) {
              // Merge workout logs if present
              if (updatedData.workoutLogs) {
                  return {
                      ...c,
                      ...updatedData,
                      workoutLogs: [...(c.workoutLogs || []), ...updatedData.workoutLogs]
                  };
              }
              return { ...c, ...updatedData };
          }
          return c;
      }));
  };

  // --- Render Logic ---

  if (appMode === 'client') {
      const activeClient = clients.find(c => c.id === activeClientId);
      if (!activeClient) return <div>Client not found</div>;
      
      return (
          <ClientApp 
            client={activeClient} 
            workouts={workouts}
            programs={programs}
            exercises={exercises}
            onUpdateClient={handleClientUpdate}
            onExit={() => setAppMode('admin')}
          />
      );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard clients={clients} workouts={workouts} />;
      case 'clients':
        return (
          <Clients 
            clients={clients} 
            setClients={setClients}
            programs={programs} 
            workouts={workouts}
            exercises={exercises}
          />
        );
      case 'exercises':
        return <Exercises exercises={exercises} setExercises={setExercises} isLoading={isLoadingExercises} />;
      case 'workouts':
        return (
          <Workouts 
            workouts={workouts} 
            setWorkouts={setWorkouts} 
            exercises={exercises}
            setExercises={setExercises}
            clients={clients}
            programs={programs}
          />
        );
      case 'programs':
        return (
          <Programs 
            programs={programs} 
            setPrograms={setPrograms} 
            workouts={workouts} 
            setWorkouts={setWorkouts}
            exercises={exercises}
          />
        );
      case 'questionnaires':
        return <Questionnaires questionnaires={[]} />;
      default:
        return <Dashboard clients={clients} workouts={workouts} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar Container - Hidden on mobile unless open */}
      <div className={`fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="relative h-full shadow-2xl md:shadow-none">
            <Sidebar 
                currentView={currentView} 
                onChangeView={(view) => {
                    setCurrentView(view);
                    setIsMobileMenuOpen(false);
                }}
                onSimulateClient={() => {
                    setAppMode('client');
                    setIsMobileMenuOpen(false);
                }}
            />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
           <div className="font-bold text-lg text-indigo-600">FitPro AI</div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
             <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Exercises from './components/Exercises';
import Workouts from './components/Workouts';
import Programs from './components/Programs';
import Questionnaires from './components/Questionnaires';
import { ViewState, Client, Exercise, Workout, Program } from './types';
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
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Centralized State "Database"
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
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
        
        // Load persisted AI images from LocalStorage
        let savedImages: Record<string, string> = {};
        try {
            savedImages = JSON.parse(localStorage.getItem('fitpro_ai_images') || '{}');
        } catch (e) {
            console.error("Failed to load saved images from storage", e);
        }

        setExercises(prevExercises => {
          // 1. Create a lookup map for external exercises using normalized names
          const externalMap = new Map<string, Exercise>();
          externalExercises.forEach(e => {
              externalMap.set(normalizeName(e.name), e);
          });

          // 2. Clone current exercises to avoid mutation
          const updatedExercises = prevExercises.map(e => ({...e}));

          // 3. Iterate through LOCAL exercises and match with External OR Saved Images
          updatedExercises.forEach(localEx => {
              // PRIORITY 1: Saved AI Image (User Generated)
              if (savedImages[localEx.id]) {
                  localEx.videoUrl = savedImages[localEx.id];
              } 
              // PRIORITY 2: External DB Match (if no local image exists)
              else if (!localEx.videoUrl || localEx.videoUrl === '') {
                  const normName = normalizeName(localEx.name);
                  
                  // Try exact match first
                  let match = externalMap.get(normName);
                  
                  // Try partial match if exact fails
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

          // 4. Add NEW exercises from external that don't exist locally
          const existingNames = new Set(updatedExercises.map(e => normalizeName(e.name)));
          
          externalExercises.forEach(ext => {
              if (!existingNames.has(normalizeName(ext.name))) {
                  // Check if we have a saved image for this external exercise ID (unlikely but possible if ID stable)
                  if (savedImages[ext.id]) {
                      ext.videoUrl = savedImages[ext.id];
                  }
                  updatedExercises.push(ext);
              }
          });

          // 5. Sort Alphabetically
          return updatedExercises.sort((a, b) => a.name.localeCompare(b.name));
        });
        
        console.log("Exercises loaded and merged successfully");
      } catch (error) {
        console.error("Failed to load external exercises", error);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    loadExercises();
  }, []);

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar Container - Hidden on mobile unless open */}
      <div className={`fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <Sidebar currentView={currentView} onChangeView={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
           <div className="font-bold text-lg text-indigo-600">FitPro AI</div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
             <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { Client, Program, Workout, Exercise, ClientExercise, WorkoutExercise, ClientWorkout } from '../types';
import { Mail, MoreHorizontal, Search, UserPlus, ShieldCheck, ArrowLeft, Calendar, Clock, Trophy, CheckCircle2, PlusCircle, X, Dumbbell, ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, Info, Timer, Edit2, Save, Sparkles, Loader2, FileText, User, Activity, CalendarCheck, AlertCircle, HeartPulse, Brain, Gauge, Scale } from 'lucide-react';
import { recommendProgram } from '../services/geminiService';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  programs: Program[];
  workouts: Workout[];
  exercises: Exercise[];
}

type TabState = 'overview' | 'schedule';
type CalendarViewMode = 'month' | 'week';

// Helper type for calendar items
type CalendarItem = 
  | { type: 'program_workout'; data: Workout; programTitle: string }
  | { type: 'client_workout'; data: ClientWorkout }
  | { type: 'exercise'; data: Exercise; meta: ClientExercise };

const Clients: React.FC<ClientsProps> = ({ clients, setClients, programs, workouts, exercises }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [assignType, setAssignType] = useState<'exercise' | 'workout'>('exercise');
  
  // AI Recommendation State
  const [isRecommending, setIsRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ id: string, reason: string } | null>(null);

  // Viewing & Editing States
  const [viewingItem, setViewingItem] = useState<{ item: CalendarItem, date: string } | null>(null);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editedExercises, setEditedExercises] = useState<WorkoutExercise[]>([]);
  const [editedNotes, setEditedNotes] = useState('');
  
  // Calendar States
  const [activeTab, setActiveTab] = useState<TabState>('overview');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date()); // Cursor for calendar navigation
  const [selectedDateForAssignment, setSelectedDateForAssignment] = useState<string>('');
  const [programStartDateInput, setProgramStartDateInput] = useState<string>('');

  // Assignment Form States
  const [selectedId, setSelectedId] = useState(''); // ID of exercise or workout to assign
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignmentSets, setAssignmentSets] = useState('3');
  const [assignmentReps, setAssignmentReps] = useState('10');

  // Profile Edit Form
  const [editProfileData, setEditProfileData] = useState<Partial<Client>>({});

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  useEffect(() => {
    setProgramStartDateInput(new Date().toISOString().split('T')[0]);
  }, []);

  // --- Helpers ---

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const getExerciseName = (id: string) => {
    return exercises.find(e => e.id === id)?.name || 'Unknown Exercise';
  };

  const calculateBMI = (height?: number, weight?: number) => {
      if (!height || !weight) return null;
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
  };

  const getCalendarDays = () => {
    const days = [];
    if (calendarViewMode === 'week') {
      const start = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      for (let i = startPadding; i > 0; i--) {
        const d = new Date(year, month, 1 - i);
        days.push(d);
      }
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push(d);
      }
    }
    return days;
  };

  // Resolve what items are on a specific date
  const getItemsForDate = (dateStr: string): CalendarItem[] => {
    if (!selectedClient) return [];
    const items: CalendarItem[] = [];

    // 1. Ad-hoc Workouts (ClientWorkouts)
    if (selectedClient.assignedWorkouts) {
      selectedClient.assignedWorkouts.forEach(cw => {
        if (cw.assignedDate === dateStr) {
          items.push({ type: 'client_workout', data: cw });
        }
      });
    }

    // 2. Program Workouts
    if (selectedClient.assignedProgramId && selectedClient.programStartDate) {
      const program = programs.find(p => p.id === selectedClient.assignedProgramId);
      if (program) {
        const start = new Date(selectedClient.programStartDate);
        const current = new Date(dateStr);
        // Reset times for accurate day diff
        start.setHours(0,0,0,0);
        current.setHours(0,0,0,0);
        
        const diffTime = current.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays >= 0) {
          const weekNum = Math.floor(diffDays / 7) + 1;
          const dayIndex = diffDays % 7; 
          
          const weekWorkouts = program.schedule[weekNum] || [];
          
          let workoutId = null;
          if (weekWorkouts.length > 0) {
              // Simple distribution logic: Mon (0), Wed (2), Fri (4) get workouts if available
              if (dayIndex === 0 && weekWorkouts[0]) workoutId = weekWorkouts[0];
              else if (dayIndex === 2 && weekWorkouts[1]) workoutId = weekWorkouts[1];
              else if (dayIndex === 4 && weekWorkouts[2]) workoutId = weekWorkouts[2];
              // Fallback fill for heavy programs
              else if (weekWorkouts.length > 3 && dayIndex % 2 !== 0 && weekWorkouts[3]) workoutId = weekWorkouts[3]; 
          }

          if (workoutId) {
            const w = workouts.find(wk => wk.id === workoutId);
            if (w) items.push({ type: 'program_workout', data: w, programTitle: program.title });
          }
        }
      }
    }

    // 3. Ad-hoc Exercises
    if (selectedClient.assignedExercises) {
      selectedClient.assignedExercises.forEach(ex => {
        if (ex.assignedDate === dateStr) {
          const exerciseDef = exercises.find(e => e.id === ex.exerciseId);
          if (exerciseDef) items.push({ type: 'exercise', data: exerciseDef, meta: ex });
        }
      });
    }

    return items;
  };

  // --- Actions ---

  const handleOpenAssignProgram = () => {
      if (!programStartDateInput) {
          setProgramStartDateInput(new Date().toISOString().split('T')[0]);
      }
      setAiRecommendation(null);
      setShowAssignProgramModal(true);
  }

  const handleGetAiRecommendation = async () => {
      if (!selectedClient) return;
      setIsRecommending(true);
      try {
          const rec = await recommendProgram(selectedClient, programs);
          setAiRecommendation({ id: rec.recommendedProgramId, reason: rec.reasoning });
      } catch (e) {
          alert("Could not generate recommendation");
      } finally {
          setIsRecommending(false);
      }
  };

  const handleAssignProgram = (programId: string) => {
    if (!selectedClientId) return;
    const startDate = programStartDateInput || new Date().toISOString().split('T')[0];
    setClients(prev => prev.map(c => 
      c.id === selectedClientId ? { ...c, assignedProgramId: programId, programStartDate: startDate } : c
    ));
    setShowAssignProgramModal(false);
    setAiRecommendation(null); // Clear recommendation after assignment
  };

  const handleOpenAssignModal = (dateStr: string, type: 'exercise' | 'workout') => {
    setSelectedDateForAssignment(dateStr);
    setAssignType(type);
    setShowAssignModal(true);
    setSelectedId('');
    setAssignmentNote('');
    setAssignmentSets('3');
    setAssignmentReps('10');
  };

  const handleConfirmAssignment = () => {
    if (!selectedClientId || !selectedId) return;

    if (assignType === 'exercise') {
        const newAssignment: ClientExercise = {
            id: `ce-${Date.now()}`,
            exerciseId: selectedId,
            assignedDate: selectedDateForAssignment,
            notes: assignmentNote,
            sets: parseInt(assignmentSets) || 3,
            reps: assignmentReps,
            completed: false
        };
        setClients(prev => prev.map(c => 
            c.id === selectedClientId ? { 
              ...c, 
              assignedExercises: [...(c.assignedExercises || []), newAssignment] 
            } : c
        ));
    } else {
        // Assigning a workout
        const workoutTemplate = workouts.find(w => w.id === selectedId);
        if (workoutTemplate) {
            const newClientWorkout: ClientWorkout = {
                id: `cw-${Date.now()}`,
                workoutId: workoutTemplate.id,
                title: workoutTemplate.title,
                assignedDate: selectedDateForAssignment,
                completed: false,
                notes: assignmentNote,
                // Create a snapshot of exercises
                exercises: workoutTemplate.exercises.map(e => ({...e})) 
            };

            setClients(prev => prev.map(c => 
                c.id === selectedClientId ? { 
                  ...c, 
                  assignedWorkouts: [...(c.assignedWorkouts || []), newClientWorkout] 
                } : c
            ));
        }
    }

    setShowAssignModal(false);
  };

  const handleOpenEditProfile = () => {
      if (!selectedClient) return;
      setEditProfileData({ ...selectedClient });
      setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
      if (!selectedClientId) return;
      setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, ...editProfileData } : c));
      setShowEditProfileModal(false);
  };

  const handleOpenViewItem = (item: CalendarItem, date: string) => {
      setViewingItem({ item, date });
      setIsEditingWorkout(false);
      
      // Pre-load edit state
      if (item.type === 'program_workout') {
          setEditedExercises(item.data.exercises.map(e => ({...e})));
          setEditedNotes('');
      } else if (item.type === 'client_workout') {
          setEditedExercises(item.data.exercises.map(e => ({...e})));
          setEditedNotes(item.data.notes || '');
      }
  };

  const handleSaveWorkoutChanges = () => {
      if (!viewingItem || !selectedClientId) return;
      const { item, date } = viewingItem;
      if (item.type === 'program_workout') {
          const newClientWorkout: ClientWorkout = {
              id: `cw-${Date.now()}`,
              workoutId: item.data.id,
              title: `${item.data.title} (Edited)`,
              assignedDate: date,
              completed: false,
              notes: editedNotes,
              exercises: editedExercises
          };
          setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, assignedWorkouts: [...(c.assignedWorkouts || []), newClientWorkout] } : c));
      } 
      else if (item.type === 'client_workout') {
          setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, assignedWorkouts: (c.assignedWorkouts || []).map(cw => cw.id === item.data.id ? { ...cw, exercises: editedExercises, notes: editedNotes } : cw) } : c));
      }
      setViewingItem(null);
      setIsEditingWorkout(false);
  };
  const updateEditedExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
      const updated = [...editedExercises];
      updated[index] = { ...updated[index], [field]: value };
      setEditedExercises(updated);
  };
  const removeEditedExercise = (index: number) => {
      const updated = [...editedExercises];
      updated.splice(index, 1);
      setEditedExercises(updated);
  }
  const addExerciseToEdit = () => {
      if (exercises.length > 0) {
        setEditedExercises([...editedExercises, { exerciseId: exercises[0].id, sets: 3, reps: '10', restSeconds: 60, notes: '' }]);
      }
  }

  // --- Render ---
  if (selectedClient) {
    const activeProgram = programs.find(p => p.id === selectedClient.assignedProgramId);
    const bmi = calculateBMI(selectedClient.height, selectedClient.weight);
    
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        {/* ... Existing Header & Tabs Code ... */}
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedClientId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <span className={selectedClient.status === 'Active' ? 'text-green-600' : 'text-slate-500'}>{selectedClient.status}</span>
               <span>•</span>
               <span>{activeProgram ? activeProgram.title : 'No Program Assigned'}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 flex gap-8">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Overview</button>
            <button onClick={() => setActiveTab('schedule')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'schedule' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Schedule & Calendar</button>
        </div>

        {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Goal</div><div className="flex items-center gap-2 text-indigo-600"><Trophy size={16} /><span className="font-semibold">{selectedClient.goal}</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Program Status</div><div className="flex items-center gap-2 text-emerald-600"><ShieldCheck size={16} /><span className="font-semibold truncate">{activeProgram ? `Week 2 of ${activeProgram.durationWeeks}` : 'None'}</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Compliance</div><div className="flex items-center gap-2 text-slate-700"><CheckCircle2 size={16} /><span className="font-semibold">92%</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Last Active</div><div className="flex items-center gap-2 text-slate-700"><Clock size={16} /><span className="font-semibold">{selectedClient.lastActive || 'Never'}</span></div></div>
                </div>

                {/* RICH PROFILE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Core & Bio */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={18} className="text-slate-400"/> Fitness Profile</h3>
                                <button onClick={handleOpenEditProfile} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">Edit</button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div><div className="text-slate-400 text-xs">Primary Goal</div><div className="font-medium text-indigo-600">{selectedClient.goal}</div></div>
                                <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50">
                                    <div><div className="text-slate-400 text-xs">Age</div><div className="font-medium">{selectedClient.age || '-'}</div></div>
                                    <div><div className="text-slate-400 text-xs">Gender</div><div className="font-medium">{selectedClient.gender || '-'}</div></div>
                                    <div><div className="text-slate-400 text-xs">Height</div><div className="font-medium">{selectedClient.height ? `${selectedClient.height}cm` : '-'}</div></div>
                                    <div><div className="text-slate-400 text-xs">Weight</div><div className="font-medium">{selectedClient.weight ? `${selectedClient.weight}kg` : '-'}</div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50 bg-slate-50/50 rounded p-2">
                                    <div><div className="text-slate-400 text-xs">BMI</div><div className="font-medium">{bmi || '-'}</div></div>
                                    <div><div className="text-slate-400 text-xs">Body Fat</div><div className="font-medium">{selectedClient.bodyFat ? `${selectedClient.bodyFat}%` : '-'}</div></div>
                                </div>
                                <div><div className="text-slate-400 text-xs">Experience Level</div><div className="font-medium">{selectedClient.experienceLevel || 'Beginner'}</div></div>
                                <div><div className="text-slate-400 text-xs">Availability</div><div className="font-medium">{selectedClient.trainingDaysPerWeek || 3} Days / Week</div></div>
                                <div>
                                    <div className="text-slate-400 text-xs mb-1">Equipment Access</div>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedClient.equipmentAccess?.length ? selectedClient.equipmentAccess.map(e => <span key={e} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">{e}</span>) : <span className="text-slate-400 italic">Not specified</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Brain size={18} className="text-purple-400"/> Behavioral & Lifestyle</h3>
                            <div className="space-y-3 text-sm">
                                <div><div className="text-slate-400 text-xs">Stress Level</div><div className={`font-medium ${selectedClient.stressLevel === 'High' ? 'text-red-500' : 'text-slate-700'}`}>{selectedClient.stressLevel || '-'}</div></div>
                                <div><div className="text-slate-400 text-xs">Sleep Quality</div><div className="font-medium">{selectedClient.sleepQuality || '-'}</div></div>
                                <div><div className="text-slate-400 text-xs mb-1">Preferred Style</div><div className="text-slate-700">{selectedClient.trainingStylePreference?.join(', ') || 'Any'}</div></div>
                                <div><div className="text-slate-400 text-xs">Environment</div><div className="font-medium">{selectedClient.environmentPreference || 'Any'}</div></div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Health & AI */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><HeartPulse size={18} className="text-red-400"/> Health & Safety Check</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Injuries & Orthopedic</span>
                                    {selectedClient.injuries?.length || selectedClient.orthopedicIssues?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClient.injuries?.map(i => <span key={i} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-medium flex items-center gap-1"><AlertCircle size={10}/> {i}</span>)}
                                            {selectedClient.orthopedicIssues?.map(i => <span key={i} className="px-2 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded text-xs font-medium">{i}</span>)}
                                        </div>
                                    ) : <span className="text-sm text-slate-400 italic">No reported issues</span>}
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Medical Conditions</span>
                                    {selectedClient.medicalConditions?.length ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClient.medicalConditions.map(c => <span key={c} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-medium">{c}</span>)}
                                        </div>
                                    ) : <span className="text-sm text-slate-400 italic">None reported</span>}
                                </div>
                            </div>
                            {(selectedClient.surgeries || selectedClient.medications) && (
                                <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {selectedClient.surgeries && <div><span className="text-slate-400 text-xs block">Surgeries</span><span className="text-slate-700">{selectedClient.surgeries}</span></div>}
                                    {selectedClient.medications && <div><span className="text-slate-400 text-xs block">Medications</span><span className="text-slate-700">{selectedClient.medications}</span></div>}
                                </div>
                            )}
                        </div>

                        {/* AI Matchmaker */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                        <Sparkles size={20} className="text-indigo-600"/>
                                        AI Program Matchmaker
                                    </h3>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        Analyzes <strong>Goals, Health Risks, and Lifestyle</strong> to find the safest fit.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleGetAiRecommendation}
                                    disabled={isRecommending}
                                    className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 disabled:opacity-70 flex items-center gap-2 transition-colors"
                                >
                                    {isRecommending ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                    Run Analysis
                                </button>
                            </div>

                            {aiRecommendation ? (
                                <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 bg-slate-100 rounded-lg shrink-0 overflow-hidden hidden sm:block relative">
                                            {programs.find(p => p.id === aiRecommendation.id)?.image ? (
                                                <img src={programs.find(p => p.id === aiRecommendation.id)?.image} className="w-full h-full object-cover" alt="Program Cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><ShieldCheck size={32} /></div>
                                            )}
                                            <div className="absolute inset-0 bg-indigo-900/10"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-800 text-lg">{programs.find(p => p.id === aiRecommendation.id)?.title || 'Unknown Program'}</h4>
                                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Best Match</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {programs.find(p => p.id === aiRecommendation.id)?.durationWeeks} Weeks • {programs.find(p => p.id === aiRecommendation.id)?.tags?.join(', ') || 'General'}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => handleAssignProgram(aiRecommendation.id)}
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all whitespace-nowrap"
                                                >
                                                    Assign Program
                                                </button>
                                            </div>
                                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800 italic flex gap-2 items-start">
                                                <Sparkles size={14} className="mt-0.5 shrink-0 opacity-70" />
                                                <span className="leading-relaxed">{aiRecommendation.reason}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-center text-indigo-300 border-2 border-dashed border-indigo-100 rounded-xl bg-white/50">
                                    <Gauge size={24} className="mb-2 opacity-50"/>
                                    <span className="text-sm font-medium">Ready to analyze client profile</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'schedule' && (
             <div className="animate-fade-in flex flex-col h-[800px]">
                 {/* ... Existing Calendar Header ... */}
                 <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <button onClick={() => setCalendarViewMode('month')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${calendarViewMode === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}><CalendarDays size={16} /> Month</button>
                        <button onClick={() => setCalendarViewMode('week')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${calendarViewMode === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}><LayoutGrid size={16} /> Week</button>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                             <button onClick={() => { const newDate = new Date(currentDate); if (calendarViewMode === 'week') newDate.setDate(newDate.getDate() - 7); else newDate.setMonth(newDate.getMonth() - 1); setCurrentDate(newDate); }} className="p-2 hover:bg-slate-50"><ChevronLeft size={18} /></button>
                             <span className="px-4 text-sm font-semibold text-slate-800 min-w-[140px] text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                             <button onClick={() => { const newDate = new Date(currentDate); if (calendarViewMode === 'week') newDate.setDate(newDate.getDate() + 7); else newDate.setMonth(newDate.getMonth() + 1); setCurrentDate(newDate); }} className="p-2 hover:bg-slate-50"><ChevronRight size={18} /></button>
                         </div>
                         <button onClick={handleOpenAssignProgram} className="text-sm text-indigo-600 font-medium hover:underline">{activeProgram ? 'Change Program' : 'Assign Program'}</button>
                    </div>
                </div>

                {/* Calendar Body - Reuse Existing Logic */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    <div className={`grid grid-cols-7 flex-1 ${calendarViewMode === 'week' ? '' : 'grid-rows-6'}`}>
                        {getCalendarDays().map((day, idx) => {
                            const dateStr = formatDate(day);
                            const isToday = dateStr === formatDate(new Date());
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const items = getItemsForDate(dateStr);
                            return (
                                <div key={idx} className={`border-b border-r border-slate-100 p-2 min-h-[100px] relative group hover:bg-slate-50/50 transition-colors ${!isCurrentMonth && calendarViewMode === 'month' ? 'bg-slate-50/30 text-slate-400' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{day.getDate()}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={() => handleOpenAssignModal(dateStr, 'workout')} title="Add Workout" className="w-6 h-6 rounded hover:bg-indigo-100 text-indigo-600 flex items-center justify-center"><PlusCircle size={12} /></button>
                                            <button onClick={() => handleOpenAssignModal(dateStr, 'exercise')} title="Add Exercise" className="w-6 h-6 rounded hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"><Dumbbell size={12} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        {items.map((item, i) => (
                                            <div key={i}>
                                                {(item.type === 'program_workout' || item.type === 'client_workout') && (
                                                    <div onClick={() => handleOpenViewItem(item, dateStr)} className={`border rounded p-1.5 cursor-pointer transition-colors group/item ${item.type === 'client_workout' ? 'bg-purple-50 border-purple-100 hover:bg-purple-100' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'}`}>
                                                        <div className="flex items-center justify-between mb-0.5"><div className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${item.type === 'client_workout' ? 'bg-purple-500' : 'bg-indigo-500'}`}></span><span className={`text-[10px] font-bold uppercase tracking-tight ${item.type === 'client_workout' ? 'text-purple-700' : 'text-indigo-700'}`}>{item.type === 'client_workout' ? 'Custom' : 'Program'}</span></div></div>
                                                        <p className="text-xs font-semibold text-slate-800 truncate">{item.data.title}</p>
                                                    </div>
                                                )}
                                                {item.type === 'exercise' && (
                                                    <div className="bg-emerald-50 border border-emerald-100 rounded p-1.5 hover:bg-emerald-100 cursor-pointer"><div className="flex items-center gap-1 mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Extra</span></div><p className="text-xs font-semibold text-slate-800 truncate">{item.data.name}</p></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             </div>
        )}

        {/* MODALS (View/Edit, Assign Modal, etc.) - Reusing existing code structure */}
        {viewingItem && (viewingItem.item.type === 'program_workout' || viewingItem.item.type === 'client_workout') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    {/* ... View/Edit Modal Content ... */}
                     <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50"><div><div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${viewingItem.item.type === 'client_workout' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{(viewingItem.item.data as Workout | ClientWorkout).id.startsWith('cw-') ? 'Custom Session' : 'Template Session'}</span><span className="text-slate-400">•</span><span className="text-xs font-medium text-slate-500">{viewingItem.date}</span></div><h3 className="text-2xl font-bold text-slate-900">{isEditingWorkout && viewingItem.item.type === 'program_workout' ? `Editing: ${viewingItem.item.data.title}` : viewingItem.item.data.title}</h3></div><div className="flex gap-2">{!isEditingWorkout && (<button onClick={() => setIsEditingWorkout(true)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2"><Edit2 size={16} /> <span className="text-sm font-medium">Edit</span></button>)}<button onClick={() => setViewingItem(null)} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={20} /></button></div></div>
                     <div className="p-0 overflow-y-auto flex-1 bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10"><tr><th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Exercise</th><th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-20">Sets</th><th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24">Reps</th><th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24">Rest</th><th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Notes</th>{isEditingWorkout && <th className="px-6 py-3 border-b border-slate-200 w-10"></th>}</tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {(isEditingWorkout ? editedExercises : viewingItem.item.data.exercises).map((ex, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">{isEditingWorkout ? (<select className="w-full p-1 border rounded text-sm" value={ex.exerciseId} onChange={(e) => updateEditedExercise(idx, 'exerciseId', e.target.value)}>{exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>) : (<div className="font-medium text-slate-900">{getExerciseName(ex.exerciseId)}</div>)}</td>
                                        <td className="px-6 py-4">{isEditingWorkout ? (<input type="number" className="w-16 p-1 border rounded text-sm" value={ex.sets} onChange={(e) => updateEditedExercise(idx, 'sets', parseInt(e.target.value))} />) : <span className="text-slate-600 font-medium">{ex.sets}</span>}</td>
                                        <td className="px-6 py-4">{isEditingWorkout ? (<input type="text" className="w-20 p-1 border rounded text-sm" value={ex.reps} onChange={(e) => updateEditedExercise(idx, 'reps', e.target.value)} />) : <span className="text-slate-600 font-medium">{ex.reps}</span>}</td>
                                        <td className="px-6 py-4">{isEditingWorkout ? (<input type="number" className="w-16 p-1 border rounded text-sm" value={ex.restSeconds} onChange={(e) => updateEditedExercise(idx, 'restSeconds', parseInt(e.target.value))} />) : (<div className="flex items-center gap-1 text-slate-500 text-sm"><Timer size={14} /> {ex.restSeconds}s</div>)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 italic">{isEditingWorkout ? (<input type="text" className="w-full p-1 border rounded text-sm" value={ex.notes || ''} onChange={(e) => updateEditedExercise(idx, 'notes', e.target.value)} />) : (ex.notes || '-')}</td>
                                        {isEditingWorkout && (<td className="px-6 py-4"><button onClick={() => removeEditedExercise(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button></td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {isEditingWorkout && <div className="p-4"><button onClick={addExerciseToEdit} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all font-medium text-sm flex items-center justify-center gap-2"><PlusCircle size={16} /> Add Exercise</button></div>}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">{isEditingWorkout ? (<><button onClick={() => setIsEditingWorkout(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button><button onClick={handleSaveWorkoutChanges} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"><Save size={18} /> Save Changes</button></>) : (<button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">Close</button>)}</div>
                </div>
            </div>
        )}

        {/* RICH EDIT PROFILE MODAL */}
        {showEditProfileModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Edit Client Profile</h3>
                            <p className="text-xs text-slate-500">Detailed info helps AI make safer recommendations.</p>
                        </div>
                        <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <div className="space-y-8">
                            {/* Section 1: Core */}
                            <div>
                                <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><User size={16}/> Core Metrics</h4>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Primary Goal</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.goal || ''} onChange={e => setEditProfileData({...editProfileData, goal: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Age</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.age || ''} onChange={e => setEditProfileData({...editProfileData, age: parseInt(e.target.value)})} /></div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={editProfileData.gender || ''} onChange={e => setEditProfileData({...editProfileData, gender: e.target.value})}>
                                            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Height (cm)</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.height || ''} onChange={e => setEditProfileData({...editProfileData, height: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.weight || ''} onChange={e => setEditProfileData({...editProfileData, weight: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Body Fat (%)</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.bodyFat || ''} onChange={e => setEditProfileData({...editProfileData, bodyFat: parseInt(e.target.value)})} /></div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Experience Level</label>
                                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={editProfileData.experienceLevel || 'Beginner'} onChange={e => setEditProfileData({...editProfileData, experienceLevel: e.target.value as any})}>
                                            <option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Health & Safety */}
                            <div>
                                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><HeartPulse size={16}/> Health & Safety</h4>
                                <div className="space-y-4">
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Injuries (Comma separated)</label><input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Rotator cuff, ACL tear" value={editProfileData.injuries ? editProfileData.injuries.join(', ') : ''} onChange={e => setEditProfileData({...editProfileData, injuries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} /></div>
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Orthopedic Issues (e.g. Back Pain, Knee Pain)</label><input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Lower back stiffness, Knee crepitus" value={editProfileData.orthopedicIssues ? editProfileData.orthopedicIssues.join(', ') : ''} onChange={e => setEditProfileData({...editProfileData, orthopedicIssues: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} /></div>
                                    <div><label className="block text-xs font-medium text-slate-700 mb-1">Medical Conditions</label><input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Diabetes, Asthma, High BP" value={editProfileData.medicalConditions ? editProfileData.medicalConditions.join(', ') : ''} onChange={e => setEditProfileData({...editProfileData, medicalConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-medium text-slate-700 mb-1">Surgeries</label><input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="Year and type..." value={editProfileData.surgeries || ''} onChange={e => setEditProfileData({...editProfileData, surgeries: e.target.value})} /></div>
                                        <div><label className="block text-xs font-medium text-slate-700 mb-1">Medications</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.medications || ''} onChange={e => setEditProfileData({...editProfileData, medications: e.target.value})} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Lifestyle & Behavior */}
                            <div>
                                <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><Brain size={16}/> Lifestyle & Behavior</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Stress Level</label>
                                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={editProfileData.stressLevel || 'Medium'} onChange={e => setEditProfileData({...editProfileData, stressLevel: e.target.value as any})}>
                                            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Sleep Quality</label>
                                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={editProfileData.sleepQuality || 'Fair'} onChange={e => setEditProfileData({...editProfileData, sleepQuality: e.target.value as any})}>
                                            <option value="Poor">Poor</option><option value="Fair">Fair</option><option value="Good">Good</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Environment Pref</label>
                                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={editProfileData.environmentPreference || 'Gym'} onChange={e => setEditProfileData({...editProfileData, environmentPreference: e.target.value as any})}>
                                            <option value="Gym">Gym</option><option value="Home">Home</option><option value="Outdoor">Outdoor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Training Frequency</label>
                                        <input type="number" min="1" max="7" className="w-full p-2 border rounded-lg text-sm" value={editProfileData.trainingDaysPerWeek || 3} onChange={e => setEditProfileData({...editProfileData, trainingDaysPerWeek: parseInt(e.target.value)})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Training Styles (Comma separated)</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. HIIT, Bodyweight, Yoga" value={editProfileData.trainingStylePreference ? editProfileData.trainingStylePreference.join(', ') : ''} onChange={e => setEditProfileData({...editProfileData, trainingStylePreference: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Equipment Access</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Gym, Dumbbells, Bands" value={editProfileData.equipmentAccess ? editProfileData.equipmentAccess.join(', ') : ''} onChange={e => setEditProfileData({...editProfileData, equipmentAccess: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setShowEditProfileModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                        <button onClick={handleSaveProfile} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Save Profile</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: Assign Program (WITH AI) */}
        {showAssignProgramModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">Assign Core Program</h3>
                        <button onClick={() => setShowAssignProgramModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                            <input 
                                type="date" 
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={programStartDateInput}
                                onChange={(e) => setProgramStartDateInput(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {programs.map(prog => {
                                return (
                                    <button 
                                        key={prog.id}
                                        onClick={() => handleAssignProgram(prog.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${selectedClient.assignedProgramId === prog.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${selectedClient.assignedProgramId === prog.id ? 'text-indigo-700' : 'text-slate-800'}`}>{prog.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{prog.durationWeeks} Weeks • {prog.description}</p>
                                        </div>
                                        {selectedClient.assignedProgramId === prog.id && <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded font-medium">Current</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Assign Exercise Modal (reuse existing) */}
        {showAssignModal && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"><div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"><div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div><h3 className="text-lg font-bold text-slate-800">Add {assignType === 'exercise' ? 'Exercise' : 'Workout'}</h3><p className="text-xs text-slate-500">Assign specifically for {selectedDateForAssignment}.</p></div><button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button></div><div className="p-6 space-y-5"><div><label className="block text-sm font-medium text-slate-700 mb-1">Select {assignType === 'exercise' ? 'Exercise' : 'Workout Template'}</label><select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">-- Select --</option>{assignType === 'exercise' ? exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>) : workouts.map(wk => <option key={wk.id} value={wk.id}>{wk.title}</option>)}</select></div>{assignType === 'exercise' && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Sets</label><input type="number" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={assignmentSets} onChange={(e) => setAssignmentSets(e.target.value)} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Reps</label><input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={assignmentReps} onChange={(e) => setAssignmentReps(e.target.value)} /></div></div>)}<div><label className="block text-sm font-medium text-slate-700 mb-1">Coach Notes</label><textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 text-sm" placeholder="Instructions for this specific day..." value={assignmentNote} onChange={(e) => setAssignmentNote(e.target.value)}/></div></div><div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100"><button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-slate-200 rounded-lg">Cancel</button><button onClick={handleConfirmAssignment} disabled={!selectedId} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm">Add to Schedule</button></div></div></div>
        )}
      </div>
    );
  }

  return (
    // List View Render (Unchanged)
    <div className="space-y-6 animate-fade-in">
      {/* ... List View Code ... */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-800">Client Management</h2><p className="text-slate-500">Monitor progress and assign programs.</p></div><button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200"><UserPlus size={18} /><span>Add Client</span></button></div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search clients..." className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Current Goal</th><th className="px-6 py-4">Assigned Program</th><th className="px-6 py-4">Last Active</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => setSelectedClientId(client.id)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{client.name.charAt(0)}</div><div><p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{client.name}</p><p className="text-slate-500 text-xs">{client.email}</p></div></div></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-green-100 text-green-700' : client.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-green-500' : client.status === 'Pending' ? 'bg-orange-500' : 'bg-slate-500'}`}></span>{client.status}</span></td>
                  <td className="px-6 py-4 text-slate-600">{client.goal}</td>
                  <td className="px-6 py-4">{client.assignedProgramId ? (<div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-lg w-fit"><ShieldCheck size={14} />{programs.find(p => p.id === client.assignedProgramId)?.title || 'Unknown Program'}</div>) : <span className="text-slate-400 italic">None</span>}</td>
                  <td className="px-6 py-4 text-slate-500">{client.lastActive}</td>
                  <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); }}><Mail size={18} /></button><button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreHorizontal size={18} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;

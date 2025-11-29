
import React, { useState, useEffect } from 'react';
import { Client, Program, Workout, Exercise, ClientExercise, WorkoutExercise, ClientWorkout, Questionnaire, BodyMeasurements } from '../types';
import { Mail, MoreHorizontal, Search, UserPlus, ShieldCheck, ArrowLeft, Calendar, Clock, Trophy, CheckCircle2, PlusCircle, X, Dumbbell, ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, Info, Timer, Edit2, Save, Sparkles, Loader2, FileText, User, Activity, CalendarCheck, AlertCircle, HeartPulse, Brain, Gauge, Scale, Target, Trash2, Plus, ClipboardList, Ruler, ArrowRight, Send, Table, ChevronDown, ChevronUp, Link2, Unlink, Repeat, CheckSquare, Square, GripVertical } from 'lucide-react';
import { recommendProgram } from '../services/geminiService';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  programs: Program[];
  workouts: Workout[];
  exercises: Exercise[];
  questionnaires: Questionnaire[];
  goals: string[];
}

type TabState = 'overview' | 'assessment' | 'schedule';
type CalendarViewMode = 'month' | 'week';

// Helper type for calendar items
type CalendarItem = 
  | { type: 'program_workout'; data: Workout; programTitle: string }
  | { type: 'client_workout'; data: ClientWorkout }
  | { type: 'exercise'; data: Exercise; meta: ClientExercise };

const Clients: React.FC<ClientsProps> = ({ clients, setClients, programs, workouts, exercises, questionnaires, goals }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false); 
  const [assignType, setAssignType] = useState<'exercise' | 'workout'>('exercise');
  
  // AI Recommendation State
  const [isRecommending, setIsRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ id: string, reason: string } | null>(null);

  // Viewing & Editing States (Calendar)
  const [viewingItem, setViewingItem] = useState<{ item: CalendarItem, date: string } | null>(null);
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editedExercises, setEditedExercises] = useState<WorkoutExercise[]>([]);
  const [editedNotes, setEditedNotes] = useState('');
  
  // Calendar States
  const [activeTab, setActiveTab] = useState<TabState>('overview');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDateForAssignment, setSelectedDateForAssignment] = useState<string>('');
  const [programStartDateInput, setProgramStartDateInput] = useState<string>('');

  // Assignment Form States
  const [selectedId, setSelectedId] = useState(''); 
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignmentSets, setAssignmentSets] = useState('3');
  const [assignmentReps, setAssignmentReps] = useState('10');

  // Assessment / Consultation Form State
  const [isAssessmentEditing, setIsAssessmentEditing] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Partial<Client>>({});
  const [showIntakeDetails, setShowIntakeDetails] = useState(false);
  
  // Measurement Editing State
  const [editingMeasurementIndex, setEditingMeasurementIndex] = useState<number | null>(null);
  const [measurementEditData, setMeasurementEditData] = useState<Partial<BodyMeasurements>>({});
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);
  const [newMeasurementData, setNewMeasurementData] = useState<Partial<BodyMeasurements>>({
      date: new Date().toISOString().split('T')[0]
  });
  
  // Flexible Questionnaire Assessment State
  const [selectedIntakeFormId, setSelectedIntakeFormId] = useState('q-intake-default'); // Default to comprehensive
  const [tempAssessmentAnswers, setTempAssessmentAnswers] = useState<Record<string, any>>({});

  // New Client Form State
  const [newClientData, setNewClientData] = useState<Partial<Client>>({
    name: '',
    email: '',
    status: 'Active', 
    goal: goals[0], 
    experienceLevel: 'Beginner',
    trainingDaysPerWeek: 3
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  useEffect(() => {
    setProgramStartDateInput(new Date().toISOString().split('T')[0]);
  }, []);

  // Sync assessment data when client changes or tab opens
  useEffect(() => {
      if (selectedClient) {
          setAssessmentData({ ...selectedClient });
          setSelectedIntakeFormId(selectedClient.intakeFormId || 'q-intake-default');
          setTempAssessmentAnswers(selectedClient.assessmentAnswers || {});
          setEditingMeasurementIndex(null);
      }
  }, [selectedClient, activeTab]);

  const getStartOfWeek = (date: Date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); };
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const getExerciseName = (id: string) => { return exercises.find(e => e.id === id)?.name || 'Unknown Exercise'; };
  const getWorkoutName = (id: string) => { return workouts.find(w => w.id === id)?.title || 'Unknown Workout'; };
  
  const getCalendarDays = () => { const days = []; if (calendarViewMode === 'week') { const start = getStartOfWeek(currentDate); for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); } } else { const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0); const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; for (let i = startPadding; i > 0; i--) { const d = new Date(year, month, 1 - i); days.push(d); } for (let i = 1; i <= lastDay.getDate(); i++) { days.push(new Date(year, month, i)); } const remaining = 42 - days.length; for (let i = 1; i <= remaining; i++) { const d = new Date(year, month + 1, i); days.push(d); } } return days; };
  
  const getItemsForDate = (dateStr: string): CalendarItem[] => {
    if (!selectedClient) return [];
    const items: CalendarItem[] = [];
    if (selectedClient.assignedWorkouts) { selectedClient.assignedWorkouts.forEach(cw => { if (cw.assignedDate === dateStr) { items.push({ type: 'client_workout', data: cw }); } }); }
    if (selectedClient.assignedProgramId && selectedClient.programStartDate) { const program = programs.find(p => p.id === selectedClient.assignedProgramId); if (program) { const start = new Date(selectedClient.programStartDate); const current = new Date(dateStr); start.setHours(0,0,0,0); current.setHours(0,0,0,0); const diffTime = current.getTime() - start.getTime(); const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); if (diffDays >= 0) { const weekNum = Math.floor(diffDays / 7) + 1; const dayIndex = diffDays % 7; const weekWorkouts = program.schedule[weekNum] || []; let workoutId = null; if (weekWorkouts.length > 0) { if (dayIndex === 0 && weekWorkouts[0]) workoutId = weekWorkouts[0]; else if (dayIndex === 2 && weekWorkouts[1]) workoutId = weekWorkouts[1]; else if (dayIndex === 4 && weekWorkouts[2]) workoutId = weekWorkouts[2]; else if (weekWorkouts.length > 3 && dayIndex % 2 !== 0 && weekWorkouts[3]) workoutId = weekWorkouts[3]; } if (workoutId) { const w = workouts.find(wk => wk.id === workoutId); if (w) items.push({ type: 'program_workout', data: w, programTitle: program.title }); } } } }
    if (selectedClient.assignedExercises) { selectedClient.assignedExercises.forEach(ex => { if (ex.assignedDate === dateStr) { const exerciseDef = exercises.find(e => e.id === ex.exerciseId); if (exerciseDef) items.push({ type: 'exercise', data: exerciseDef, meta: ex }); } }); }
    return items;
  };

  const handleOpenAssignProgram = () => { 
      if (!programStartDateInput) { 
          setProgramStartDateInput(new Date().toISOString().split('T')[0]); 
      } 
      setAiRecommendation(null); 
      setShowAssignProgramModal(true); 
  };

  const handleOpenAddMeasurement = () => {
      setNewMeasurementData({ date: new Date().toISOString().split('T')[0] });
      setShowAddMeasurementModal(true);
  };

  const handleGetAiRecommendation = async () => { if (!selectedClient) return; setIsRecommending(true); try { const rec = await recommendProgram(selectedClient, programs); setAiRecommendation({ id: rec.recommendedProgramId, reason: rec.reasoning }); } catch (e) { alert("Could not generate recommendation"); } finally { setIsRecommending(false); } };
  const handleAssignProgram = (programId: string) => { if (!selectedClientId) return; const startDate = programStartDateInput || new Date().toISOString().split('T')[0]; setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, assignedProgramId: programId, programStartDate: startDate } : c)); setShowAssignProgramModal(false); setAiRecommendation(null); };
  const handleOpenAssignModal = (dateStr: string, type: 'exercise' | 'workout') => { setSelectedDateForAssignment(dateStr); setAssignType(type); setShowAssignModal(true); setSelectedId(''); setAssignmentNote(''); setAssignmentSets('3'); setAssignmentReps('10'); };
  const handleConfirmAssignment = () => { if (!selectedClientId || !selectedId) return; if (assignType === 'exercise') { const newAssignment: ClientExercise = { id: `ce-${Date.now()}`, exerciseId: selectedId, assignedDate: selectedDateForAssignment, notes: assignmentNote, sets: parseInt(assignmentSets) || 3, reps: assignmentReps, completed: false }; setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, assignedExercises: [...(c.assignedExercises || []), newAssignment] } : c)); } else { const workoutTemplate = workouts.find(w => w.id === selectedId); if (workoutTemplate) { const newClientWorkout: ClientWorkout = { id: `cw-${Date.now()}`, workoutId: workoutTemplate.id, title: workoutTemplate.title, assignedDate: selectedDateForAssignment, completed: false, notes: assignmentNote, exercises: workoutTemplate.exercises.map(e => ({...e})) }; setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, assignedWorkouts: [...(c.assignedWorkouts || []), newClientWorkout] } : c)); } } setShowAssignModal(false); };
  
  const handleSaveAssessment = () => { 
      if (!selectedClientId) return; 
      setClients(prev => prev.map(c => {
          if (c.id === selectedClientId) {
              return { 
                  ...c, 
                  ...assessmentData, 
                  intakeFormId: selectedIntakeFormId, 
                  assessmentAnswers: tempAssessmentAnswers,
              };
          }
          return c;
      })); 
      setIsAssessmentEditing(false); 
  };

  const handleToggleDay = (day: string) => {
      const currentDays = assessmentData.preferredDays || [];
      const newDays = currentDays.includes(day) 
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day];
      setAssessmentData({ ...assessmentData, preferredDays: newDays });
  };

  // Measurements Handlers
  const handleEditMeasurement = (index: number, data: BodyMeasurements) => {
      setEditingMeasurementIndex(index);
      setMeasurementEditData({...data});
  };

  const handleSaveMeasurementEdit = () => {
      if (editingMeasurementIndex === null || !selectedClient) return;
      const realIndex = (selectedClient.measurementHistory || []).length - 1 - editingMeasurementIndex;
      const newHistory = [...(selectedClient.measurementHistory || [])];
      newHistory[realIndex] = { ...newHistory[realIndex], ...measurementEditData };
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, measurementHistory: newHistory } : c));
      setEditingMeasurementIndex(null);
      setMeasurementEditData({});
  };

  const handleAddMeasurement = () => {
      if (!selectedClient) return;
      const entry: BodyMeasurements = {
          date: newMeasurementData.date || new Date().toISOString().split('T')[0],
          ...newMeasurementData
      };
      const newHistory = [...(selectedClient.measurementHistory || []), entry];
      newHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, measurementHistory: newHistory } : c));
      setShowAddMeasurementModal(false);
      setNewMeasurementData({ date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteMeasurement = (visualIndex: number) => {
      if (!selectedClient) return;
      if (!window.confirm("Are you sure you want to delete this entry?")) return;
      const realIndex = (selectedClient.measurementHistory || []).length - 1 - visualIndex;
      const newHistory = [...(selectedClient.measurementHistory || [])];
      newHistory.splice(realIndex, 1);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, measurementHistory: newHistory } : c));
  };
  
  const handleOpenViewItem = (item: CalendarItem, date: string) => { 
      setViewingItem({ item, date }); 
      setIsEditingWorkout(false); 
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
      } else if (item.type === 'client_workout') { 
          setClients(prev => prev.map(c => c.id === selectedClientId ? { 
              ...c, 
              assignedWorkouts: (c.assignedWorkouts || []).map(cw => cw.id === item.data.id ? { ...cw, exercises: editedExercises, notes: editedNotes } : cw) 
          } : c)); 
      } 
      setViewingItem(null); 
      setIsEditingWorkout(false); 
  };
  
  const handleAddNewClient = () => { if (!newClientData.name || !newClientData.email) { alert("Name and email are required"); return; } const newClient: Client = { id: `cl-${Date.now()}`, name: newClientData.name || 'New Client', email: newClientData.email || '', status: 'Active', goal: newClientData.goal || 'Not Set', lastActive: 'Never', assignedExercises: [], assignedWorkouts: [], experienceLevel: 'Beginner', trainingDaysPerWeek: 3, injuries: [], medicalConditions: [], orthopedicIssues: [], equipmentAccess: [], measurementHistory: [] }; setClients(prev => [...prev, newClient]); setShowAddClientModal(false); setNewClientData({ name: '', email: '', status: 'Active' }); };

  const handleSendAssessment = () => {
      alert(`Intake form "${questionnaires.find(q=>q.id===selectedIntakeFormId)?.title}" sent to ${selectedClient?.name}!`);
      if (selectedClient && selectedIntakeFormId) {
          setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, intakeFormId: selectedIntakeFormId } : c));
      }
  }

  // Calculate Lean Mass
  const currentWeight = selectedClient?.weight || 0;
  const currentFat = selectedClient?.bodyFat || 0;
  const currentLeanMass = currentWeight * (1 - (currentFat/100));
  const currentBMI = (currentWeight / Math.pow((selectedClient?.height || 170)/100, 2)).toFixed(1);

  // --- Render Helpers ---

  const renderListView = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Clients</h2>
                <p className="text-slate-500">Manage your athletes and their progress.</p>
            </div>
            <button onClick={() => setShowAddClientModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                <UserPlus size={18} /> New Client
            </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search clients by name or email..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
                <div 
                    key={client.id} 
                    onClick={() => setSelectedClientId(client.id)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                {client.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-indigo-700">{client.name}</h3>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {client.status}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-slate-400"/>
                            <span>{client.goal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-slate-400"/>
                             <span>{client.assignedProgramId ? programs.find(p => p.id === client.assignedProgramId)?.title : 'No Program'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Clock size={14} className="text-slate-400"/>
                             <span>Last active: {client.lastActive}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderDetailView = () => {
    if (!selectedClient) return null;
    const activeProgram = programs.find(p => p.id === selectedClient.assignedProgramId);

    return (
      <div className="space-y-6 pb-10 animate-fade-in">
        {/* Header */}
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
            <button onClick={() => setActiveTab('assessment')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'assessment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Assessment & Intake</button>
            <button onClick={() => setActiveTab('schedule')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'schedule' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Schedule & Calendar</button>
        </div>

        {/* Overview Content */}
        {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Primary Objective</div><div className="flex items-center gap-2 text-indigo-600"><Trophy size={16} /><span className="font-semibold">{selectedClient.goal || 'Pending Assessment'}</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Target</div><div className="flex items-center gap-2 text-slate-700"><Target size={16} /><span className="font-semibold">{selectedClient.targetWeight ? `${selectedClient.targetWeight} kg` : 'Not Set'}</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Health Flags</div><div className="flex items-center gap-2 text-red-600"><AlertCircle size={16} /><span className="font-semibold">{selectedClient.injuries?.length || 0} Reported</span></div></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Last Active</div><div className="flex items-center gap-2 text-slate-700"><Clock size={16} /><span className="font-semibold">{selectedClient.lastActive || 'Never'}</span></div></div>
                </div>
                {/* AI Matchmaker Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2"><Sparkles size={20} className="text-indigo-600"/> AI Program Matchmaker</h3>
                            <p className="text-sm text-indigo-700 mt-1">Analyzes the <strong>Goals and Health Risks</strong> from the Assessment to find the safest fit.</p>
                        </div>
                        <button onClick={handleGetAiRecommendation} disabled={isRecommending} className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 disabled:opacity-70 flex items-center gap-2 transition-colors">
                            {isRecommending ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Run Analysis
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
                                        <button onClick={() => handleAssignProgram(aiRecommendation.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all whitespace-nowrap">Assign Program</button>
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
        )}

        {/* Assessment Content */}
        {activeTab === 'assessment' && (
            <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={24} className="text-indigo-600"/> Assessment & Intake</h3>
                        <p className="text-sm text-slate-500">Manage biometrics and view intake responses.</p>
                    </div>
                    {isAssessmentEditing ? (
                        <div className="flex gap-3">
                            <button onClick={() => setIsAssessmentEditing(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveAssessment} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md"><Save size={18}/> Save Changes</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsAssessmentEditing(true)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm"><Edit2 size={18}/> Edit Bio-Metrics</button>
                    )}
                </div>

                {/* 1. Bio-Metrics & Physics (Top Row) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2"><Scale size={18} className="text-cyan-500"/> Bio-Metrics & Physics</h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Height (cm)</label>
                                {isAssessmentEditing ? <input type="number" className="w-full p-2 border rounded bg-slate-50 text-lg font-bold" value={assessmentData.height || ''} onChange={e => setAssessmentData({...assessmentData, height: parseInt(e.target.value)})} /> : <div className="text-2xl font-black text-slate-800">{selectedClient.height}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current Weight (kg)</label>
                                {isAssessmentEditing ? <input type="number" className="w-full p-2 border rounded bg-slate-50 text-lg font-bold" value={assessmentData.weight || ''} onChange={e => setAssessmentData({...assessmentData, weight: parseFloat(e.target.value)})} /> : <div className="text-2xl font-black text-slate-800">{selectedClient.weight}</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Body Fat %</label>
                                {isAssessmentEditing ? <input type="number" className="w-full p-2 border rounded bg-slate-50 text-lg font-bold" value={assessmentData.bodyFat || ''} onChange={e => setAssessmentData({...assessmentData, bodyFat: parseFloat(e.target.value)})} /> : <div className="text-2xl font-black text-slate-800">{selectedClient.bodyFat || '-'}%</div>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Weight (kg)</label>
                                {isAssessmentEditing ? <input type="number" className="w-full p-2 border rounded bg-slate-50 text-lg font-bold" value={assessmentData.targetWeight || ''} onChange={e => setAssessmentData({...assessmentData, targetWeight: parseFloat(e.target.value)})} /> : <div className="text-2xl font-black text-indigo-600">{selectedClient.targetWeight || '-'}</div>}
                            </div>
                        </div>

                        {/* Calculations */}
                        <div className="mt-6 pt-6 border-t border-slate-100 flex gap-8">
                            <div>
                                <span className="text-xs text-slate-400 font-bold uppercase">BMI</span>
                                <div className="text-xl font-bold text-slate-700">{currentBMI}</div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Lean Mass</span>
                                <div className="text-xl font-bold text-slate-700">{currentLeanMass.toFixed(1)} kg</div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Fat Mass</span>
                                <div className="text-xl font-bold text-slate-700">{(currentWeight - currentLeanMass).toFixed(1)} kg</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-indigo-900 rounded-xl p-6 text-white flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="text-indigo-300 text-xs font-bold uppercase mb-2">Primary Goal</div>
                            <div className="text-xl font-bold">{selectedClient.goal}</div>
                        </div>
                        <div>
                            <div className="text-indigo-300 text-xs font-bold uppercase mb-2">Training Age</div>
                            <div className="text-xl font-bold">{selectedClient.experienceLevel}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Logistics & Schedule Card (NEW) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-500"/> Logistics & Availability
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Frequency</label>
                            {isAssessmentEditing ? (
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range" min="1" max="7" 
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        value={assessmentData.trainingDaysPerWeek || 3}
                                        onChange={e => setAssessmentData({...assessmentData, trainingDaysPerWeek: parseInt(e.target.value)})}
                                    />
                                    <span className="font-bold text-slate-800 w-12 text-center">{assessmentData.trainingDaysPerWeek} Days</span>
                                </div>
                            ) : (
                                <div className="text-xl font-bold text-slate-800">{selectedClient.trainingDaysPerWeek} Days / Week</div>
                            )}
                        </div>
                        <div className="flex-[2]">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Preferred Days</label>
                            <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                    const isSelected = isAssessmentEditing 
                                        ? (assessmentData.preferredDays || []).includes(day)
                                        : (selectedClient.preferredDays || []).includes(day);
                                    
                                    return (
                                        <button
                                            key={day}
                                            disabled={!isAssessmentEditing}
                                            onClick={() => handleToggleDay(day)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Measurements History Table */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Table size={18} className="text-orange-500"/> Measurements History</h4>
                        <button 
                            type="button" 
                            onClick={handleOpenAddMeasurement} 
                            className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer select-none"
                        >
                            <Plus size={14}/> Log Manual Entry
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Weight (kg)</th>
                                    <th className="px-4 py-3">Body Fat (%)</th>
                                    <th className="px-4 py-3">Chest (cm)</th>
                                    <th className="px-4 py-3">Waist (cm)</th>
                                    <th className="px-4 py-3">Hips (cm)</th>
                                    <th className="px-4 py-3">L Thigh (cm)</th>
                                    <th className="px-4 py-3">R Thigh (cm)</th>
                                    <th className="px-4 py-3">L Arm (cm)</th>
                                    <th className="px-4 py-3">R Arm (cm)</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedClient.measurementHistory && selectedClient.measurementHistory.length > 0 ? (
                                    [...selectedClient.measurementHistory].reverse().map((m, i) => {
                                        const isEditing = editingMeasurementIndex === i;
                                        return (
                                            <tr key={i} className={`border-b border-slate-100 transition-colors ${isEditing ? 'bg-orange-50' : 'hover:bg-slate-50'}`}>
                                                <td className="px-4 py-3 font-medium text-slate-900">{m.date}</td>
                                                {isEditing ? (
                                                    <>
                                                        <td className="px-2 py-3"><input type="number" className="w-16 p-1 border rounded bg-white" value={measurementEditData.weight ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, weight: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-16 p-1 border rounded bg-white" value={measurementEditData.bodyFat ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, bodyFat: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.chest ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, chest: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.waist ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, waist: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.hips ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, hips: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.thighLeft ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, thighLeft: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.thighRight ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, thighRight: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.armLeft ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, armLeft: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-2 py-3"><input type="number" className="w-12 p-1 border rounded bg-white" value={measurementEditData.armRight ?? ''} onChange={e=>setMeasurementEditData({...measurementEditData, armRight: parseFloat(e.target.value) || 0})} /></td>
                                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                            <button onClick={handleSaveMeasurementEdit} className="text-green-600 hover:text-green-800 bg-green-50 p-1 rounded"><CheckCircle2 size={16}/></button>
                                                            <button onClick={() => setEditingMeasurementIndex(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded"><X size={16}/></button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3">{m.weight}</td>
                                                        <td className="px-4 py-3">{m.bodyFat}%</td>
                                                        <td className="px-4 py-3">{m.chest || '-'}</td>
                                                        <td className="px-4 py-3">{m.waist || '-'}</td>
                                                        <td className="px-4 py-3">{m.hips || '-'}</td>
                                                        <td className="px-4 py-3">{m.thighLeft || '-'}</td>
                                                        <td className="px-4 py-3">{m.thighRight || '-'}</td>
                                                        <td className="px-4 py-3">{m.armLeft || '-'}</td>
                                                        <td className="px-4 py-3">{m.armRight || '-'}</td>
                                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                            <button onClick={() => handleEditMeasurement(i, m)} className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded hover:bg-indigo-50"><Edit2 size={16}/></button>
                                                            <button onClick={() => handleDeleteMeasurement(i)} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={16}/></button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={11} className="px-4 py-4 text-center text-slate-400 italic">No measurement history recorded yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Intake Form Responses (Collapsible) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><FileText size={18} className="text-violet-500"/> Intake Form Responses</h4>
                        <div className="flex items-center gap-3">
                            {isAssessmentEditing && (
                                <select className="text-xs p-2 border rounded bg-slate-50 outline-none w-48" value={selectedIntakeFormId} onChange={(e) => setSelectedIntakeFormId(e.target.value)}>
                                    {questionnaires.map(q => (<option key={q.id} value={q.id}>{q.title}</option>))}
                                </select>
                            )}
                            <button 
                                onClick={() => setShowIntakeDetails(!showIntakeDetails)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
                            >
                                {showIntakeDetails ? 'Hide Responses' : 'Show Responses'}
                                {showIntakeDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>
                    
                    {/* Collapsible Content */}
                    {showIntakeDetails && (
                        <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {(() => {
                                    const activeFormId = isAssessmentEditing ? selectedIntakeFormId : selectedClient.intakeFormId;
                                    const activeForm = questionnaires.find(q => q.id === activeFormId);
                                    if (!activeForm) return <div className="text-sm text-slate-400 italic col-span-2">No questionnaire attached.</div>;
                                    
                                    return activeForm.questions.map((q) => (
                                        <div key={q.id} className="border-b border-slate-50 pb-3 last:border-0">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">{q.text}</p>
                                            {isAssessmentEditing ? (
                                                q.type === 'textarea' ? (
                                                    <textarea className="w-full p-2 border rounded text-sm bg-slate-50" rows={2} value={tempAssessmentAnswers[q.id] || ''} onChange={(e) => setTempAssessmentAnswers({...tempAssessmentAnswers, [q.id]: e.target.value})} />
                                                ) : q.type === 'multiselect' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {q.options?.map(opt => (
                                                            <button 
                                                                key={opt}
                                                                onClick={() => {
                                                                    const current = (tempAssessmentAnswers[q.id] || '').split(', ').filter(Boolean);
                                                                    const exists = current.includes(opt);
                                                                    const newValue = exists ? current.filter((c:string) => c !== opt) : [...current, opt];
                                                                    setTempAssessmentAnswers({...tempAssessmentAnswers, [q.id]: newValue.join(', ')});
                                                                }}
                                                                className={`px-2 py-1 text-xs border rounded ${((tempAssessmentAnswers[q.id] || '').includes(opt)) ? 'bg-violet-100 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : q.type === 'select' ? (
                                                    <select className="w-full p-2 border rounded text-sm bg-slate-50" value={tempAssessmentAnswers[q.id] || ''} onChange={(e) => setTempAssessmentAnswers({...tempAssessmentAnswers, [q.id]: e.target.value})}>
                                                        {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input type="text" className="w-full p-2 border rounded text-sm bg-slate-50" value={tempAssessmentAnswers[q.id] || ''} onChange={(e) => setTempAssessmentAnswers({...tempAssessmentAnswers, [q.id]: e.target.value})} />
                                                )
                                            ) : (
                                                <p className="text-sm font-medium text-slate-800">{tempAssessmentAnswers[q.id] || assessmentData.assessmentAnswers?.[q.id] || '-'}</p>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={handleSendAssessment} 
                                    className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-violet-200 transition-colors"
                                >
                                    <Send size={14} /> Send Form to Client App
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Schedule Content */}
        {activeTab === 'schedule' && (
            <div className="animate-fade-in space-y-6 relative z-0">
                 {/* Calendar Controls */}
                 <div className="flex justify-between items-center mb-4 relative z-10">
                     <div className="flex gap-2">
                         <button onClick={() => setCalendarViewMode('week')} className={`px-3 py-1 rounded-lg text-sm font-medium ${calendarViewMode === 'week' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>Week</button>
                         <button onClick={() => setCalendarViewMode('month')} className={`px-3 py-1 rounded-lg text-sm font-medium ${calendarViewMode === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>Month</button>
                     </div>
                     
                     <div className="flex items-center gap-4">
                         {/* ASSIGN PROGRAM BUTTON */}
                         <button 
                            type="button" 
                            onClick={handleOpenAssignProgram} 
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-colors active:scale-95 cursor-pointer select-none"
                         >
                             <CalendarCheck size={16} /> Assign Program
                         </button>
                         
                         <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                             <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - (calendarViewMode === 'week' ? 7 : 30))))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20}/></button>
                             <span className="font-bold text-slate-800 w-32 text-center">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + (calendarViewMode === 'week' ? 7 : 30))))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20}/></button>
                         </div>
                     </div>
                 </div>

                 {/* Calendar Grid */}
                 <div className="grid grid-cols-7 gap-4 relative z-0">
                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                         <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
                     ))}
                     {getCalendarDays().map((day, i) => {
                         const dateStr = formatDate(day);
                         const isToday = dateStr === new Date().toISOString().split('T')[0];
                         const items = getItemsForDate(dateStr);
                         return (
                             <div key={i} className={`min-h-[100px] border border-slate-100 rounded-xl p-2 bg-white hover:border-indigo-200 transition-colors relative group ${day.getMonth() !== currentDate.getMonth() ? 'opacity-50' : ''}`}>
                                 <div className={`text-xs font-bold mb-2 ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-500'}`}>{day.getDate()}</div>
                                 <div className="space-y-1">
                                     {items.map((item, idx) => (
                                         <button 
                                            key={idx}
                                            onClick={() => handleOpenViewItem(item, dateStr)}
                                            className={`w-full text-left text-[10px] px-1.5 py-1 rounded border truncate ${
                                                item.type === 'program_workout' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                                item.type === 'client_workout' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                         >
                                             {item.type === 'exercise' ? getExerciseName(item.meta.exerciseId) : item.data.title}
                                         </button>
                                     ))}
                                 </div>
                                 <button 
                                    onClick={() => handleOpenAssignModal(dateStr, 'workout')}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded"
                                 >
                                     <Plus size={14} />
                                 </button>
                             </div>
                         );
                     })}
                 </div>
            </div>
        )}

      </div>
    );
  };

  return (
      <>
          {selectedClientId ? renderDetailView() : renderListView()}

          {/* Add Client Modal */}
          {showAddClientModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={() => setShowAddClientModal(false)}>
                  <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Add New Client</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Identity</h4>
                              <div><label className="block text-sm font-bold text-slate-700 mb-1">Name</label><input type="text" className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} /></div>
                              <div><label className="block text-sm font-bold text-slate-700 mb-1">Email</label><input type="email" className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} /></div>
                          </div>
                          <div className="space-y-4">
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Physical Profile</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Age</label><input type="number" className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.age || ''} onChange={e => setNewClientData({...newClientData, age: parseInt(e.target.value)})} /></div>
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Gender</label><select className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.gender || ''} onChange={e => setNewClientData({...newClientData, gender: e.target.value})}><option value="">Select...</option><option>Male</option><option>Female</option></select></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Height (cm)</label><input type="number" className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.height || ''} onChange={e => setNewClientData({...newClientData, height: parseInt(e.target.value)})} /></div>
                                  <div><label className="block text-sm font-bold text-slate-700 mb-1">Weight (kg)</label><input type="number" className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.weight || ''} onChange={e => setNewClientData({...newClientData, weight: parseInt(e.target.value)})} /></div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Initial Assessment</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Primary Goal</label>
                                  <select className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.goal} onChange={e => setNewClientData({...newClientData, goal: e.target.value})}>
                                      {goals.map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Experience Level</label>
                                  <select className="w-full p-3 border rounded-lg bg-slate-50" value={newClientData.experienceLevel} onChange={e => setNewClientData({...newClientData, experienceLevel: e.target.value as any})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Known Injuries</label>
                                  <input type="text" className="w-full p-3 border rounded-lg bg-slate-50" placeholder="e.g. Lower back pain, left knee..." value={newClientData.injuries ? newClientData.injuries.join(', ') : ''} onChange={e => setNewClientData({...newClientData, injuries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                          <button onClick={() => setShowAddClientModal(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button onClick={handleAddNewClient} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md">Create Client Profile</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Add Measurement Modal */}
          {showAddMeasurementModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={() => setShowAddMeasurementModal(false)}>
                  <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-slate-800">Log New Measurement</h3>
                          <button onClick={() => setShowAddMeasurementModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                              <input type="date" className="w-full p-2 border rounded-lg bg-slate-50" value={newMeasurementData.date} onChange={e => setNewMeasurementData({...newMeasurementData, date: e.target.value})} />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-sm font-bold text-slate-700 mb-1">Weight (kg)</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.weight || ''} onChange={e => setNewMeasurementData({...newMeasurementData, weight: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-sm font-bold text-slate-700 mb-1">Body Fat (%)</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.bodyFat || ''} onChange={e => setNewMeasurementData({...newMeasurementData, bodyFat: parseFloat(e.target.value)})} /></div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Tape Measurements (cm)</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Chest</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.chest || ''} onChange={e => setNewMeasurementData({...newMeasurementData, chest: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Waist</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.waist || ''} onChange={e => setNewMeasurementData({...newMeasurementData, waist: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Hips</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.hips || ''} onChange={e => setNewMeasurementData({...newMeasurementData, hips: parseFloat(e.target.value)})} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Left Arm</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.armLeft || ''} onChange={e => setNewMeasurementData({...newMeasurementData, armLeft: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Right Arm</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.armRight || ''} onChange={e => setNewMeasurementData({...newMeasurementData, armRight: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Left Thigh</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.thighLeft || ''} onChange={e => setNewMeasurementData({...newMeasurementData, thighLeft: parseFloat(e.target.value)})} /></div>
                              <div><label className="block text-xs font-medium text-slate-600 mb-1">Right Thigh</label><input type="number" className="w-full p-2 border rounded-lg" value={newMeasurementData.thighRight || ''} onChange={e => setNewMeasurementData({...newMeasurementData, thighRight: parseFloat(e.target.value)})} /></div>
                          </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                          <button onClick={() => setShowAddMeasurementModal(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button onClick={handleAddMeasurement} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold shadow-md">Add Entry</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Assign Program Modal */}
          {showAssignProgramModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={() => setShowAssignProgramModal(false)}>
                  <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-slate-800">Assign Program</h3>
                          <button onClick={() => setShowAssignProgramModal(false)}><X size={24} className="text-slate-400"/></button>
                      </div>
                      <div className="mb-4">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                          <input type="date" className="w-full p-2 border rounded-lg" value={programStartDateInput} onChange={e => setProgramStartDateInput(e.target.value)} />
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3">
                          {programs.map(p => (
                              <div key={p.id} onClick={() => handleAssignProgram(p.id)} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all">
                                  <div className="flex justify-between items-center">
                                      <h4 className="font-bold text-slate-800">{p.title}</h4>
                                      <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">{p.durationWeeks} Weeks</span>
                                  </div>
                                  <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* Assign Workout/Exercise Modal */}
          {showAssignModal && (
               <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={() => setShowAssignModal(false)}>
                  <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-slate-800">Assign to {selectedDateForAssignment}</h3>
                          <button onClick={() => setShowAssignModal(false)}><X size={24} className="text-slate-400"/></button>
                      </div>
                      <div className="flex border-b border-slate-100 mb-4">
                          <button onClick={() => setAssignType('workout')} className={`flex-1 py-2 text-sm font-bold border-b-2 ${assignType === 'workout' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Workout</button>
                          <button onClick={() => setAssignType('exercise')} className={`flex-1 py-2 text-sm font-bold border-b-2 ${assignType === 'exercise' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Single Exercise</button>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                          <label className="block text-sm font-bold text-slate-700">Select Item</label>
                          <select className="w-full p-2 border rounded-lg" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                              <option value="">-- Select --</option>
                              {assignType === 'workout' ? workouts.map(w => <option key={w.id} value={w.id}>{w.title}</option>) : exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                          
                          {assignType === 'exercise' && (
                              <div className="grid grid-cols-2 gap-4">
                                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sets</label><input type="number" className="w-full p-2 border rounded-lg" value={assignmentSets} onChange={e => setAssignmentSets(e.target.value)}/></div>
                                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reps</label><input type="text" className="w-full p-2 border rounded-lg" value={assignmentReps} onChange={e => setAssignmentReps(e.target.value)}/></div>
                              </div>
                          )}
                          
                          <div><label className="block text-sm font-bold text-slate-700 mb-1">Notes</label><textarea className="w-full p-2 border rounded-lg h-20 resize-none" value={assignmentNote} onChange={e => setAssignmentNote(e.target.value)}></textarea></div>
                      </div>

                      <button onClick={handleConfirmAssignment} disabled={!selectedId} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Confirm Assignment</button>
                  </div>
               </div>
          )}

          {/* VIEW/EDIT WORKOUT MODAL (For Calendar Items) */}
          {viewingItem && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in" onClick={() => setViewingItem(null)}>
                {(() => {
                    const { item, date } = viewingItem;
                    const activeItem = item; 
                    
                    return (
                        <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {activeItem.type === 'exercise' ? getExerciseName(activeItem.meta.exerciseId) : activeItem.data.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">{date}</p>
                                </div>
                                <button onClick={() => setViewingItem(null)}><X size={24} className="text-slate-400"/></button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto mb-6">
                                {isEditingWorkout ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            className="w-full p-3 border rounded-lg bg-slate-50"
                                            placeholder="Session notes..."
                                            value={editedNotes}
                                            onChange={(e) => setEditedNotes(e.target.value)}
                                        />
                                        <div className="space-y-3">
                                            {editedExercises.map((ex, i) => (
                                                <div key={i} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center">
                                                    <span className="font-bold text-sm">{getExerciseName(ex.exerciseId)}</span>
                                                    <div className="flex gap-2">
                                                        <input type="number" className="w-12 p-1 border rounded text-center text-xs" value={ex.sets} onChange={(e) => {
                                                            const newExs = [...editedExercises];
                                                            newExs[i].sets = parseInt(e.target.value);
                                                            setEditedExercises(newExs);
                                                        }}/>
                                                        <span className="text-xs py-1">sets</span>
                                                        <input type="text" className="w-12 p-1 border rounded text-center text-xs" value={ex.reps} onChange={(e) => {
                                                            const newExs = [...editedExercises];
                                                            newExs[i].reps = e.target.value;
                                                            setEditedExercises(newExs);
                                                        }}/>
                                                        <span className="text-xs py-1">reps</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeItem.type === 'client_workout' && activeItem.data.notes && (
                                            <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg italic">
                                                "{activeItem.data.notes}"
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            {(activeItem.type === 'program_workout' || activeItem.type === 'client_workout') ? (
                                                (isEditingWorkout ? editedExercises : activeItem.data.exercises).map((ex, i) => (
                                                    <div key={i} className="flex justify-between p-3 border-b border-slate-50 last:border-0">
                                                        <span className="font-medium text-slate-700">{getExerciseName(ex.exerciseId)}</span>
                                                        <span className="text-slate-500 text-sm">{ex.sets} x {ex.reps}</span>
                                                    </div>
                                                ))
                                            ) : activeItem.type === 'exercise' ? (
                                                <div className="p-4 bg-slate-50 rounded-lg">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="font-bold text-slate-700">Sets</span>
                                                        <span>{activeItem.meta.sets}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-slate-700">Reps</span>
                                                        <span>{activeItem.meta.reps}</span>
                                                    </div>
                                                    {activeItem.meta.notes && <div className="mt-2 text-sm italic text-slate-500">"{activeItem.meta.notes}"</div>}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                {isEditingWorkout ? (
                                    <>
                                        <button onClick={() => setIsEditingWorkout(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                        <button onClick={handleSaveWorkoutChanges} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditingWorkout(true)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                                        <Edit2 size={16} /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
          )}
      </>
  );
};

export default Clients;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, Exercise, Difficulty, WorkoutExercise, Client, Program, MuscleGroup } from '../types';
import { Sparkles, Plus, Clock, BarChart2, Trash2, Save, Loader2, AlertCircle, ShieldCheck, Search, ArrowLeft, Dumbbell, GripVertical, X, Info, Filter, LayoutTemplate, Copy, Link2, Unlink, CheckSquare, Square, Repeat, Eye, Edit2, ChevronDown, ChevronUp, PlayCircle, BookOpen, Wand2 } from 'lucide-react';
import { generateNewWorkout, analyzeWorkoutPlan } from '../services/geminiService';
import { WORKOUT_TEMPLATES } from '../constants';

interface WorkoutsProps {
  workouts: Workout[];
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
  exercises: Exercise[];
  setExercises?: React.Dispatch<React.SetStateAction<Exercise[]>>; // Added optional for AI gen
  clients: Client[];
  programs: Program[];
}

const GOAL_OPTIONS = [
  "Hypertrophy (Muscle Growth)",
  "Strength (Max Force)",
  "Power (Explosive)",
  "Endurance (Stamina)",
  "Fat Loss (Metabolic)",
  "Mobility & Flexibility",
  "Athletic Performance",
  "Rehabilitation / Recovery",
  "Functional Fitness",
  "CrossFit / Metcon"
];

const EQUIPMENT_OPTIONS = [
  "Full Commercial Gym",
  "Home Gym (Barbell, Rack, DBs)",
  "Dumbbells Only",
  "Kettlebells Only",
  "Bodyweight Only (No Equipment)",
  "Resistance Bands",
  "Machine Only",
  "Garage Gym Basics"
];

const Workouts: React.FC<WorkoutsProps> = ({ workouts, setWorkouts, exercises, setExercises, clients, programs }) => {
  const [view, setView] = useState<'list' | 'builder' | 'templates' | 'detail'>('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<any | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');

  // Builder State
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderType, setBuilderType] = useState('Strength');
  const [builderExercises, setBuilderExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  
  // Builder Selection State (for Supersets)
  const [selectedBuilderIndices, setSelectedBuilderIndices] = useState<Set<number>>(new Set());

  // AI Audit State
  const [showAudit, setShowAudit] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{score: number, pros: string[], cons: string[], suggestions: string[]} | null>(null);

  // Detail View State
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());

  // AI Prompt States
  const [aiGoal, setAiGoal] = useState(GOAL_OPTIONS[0]);
  const [aiDiff, setAiDiff] = useState('Intermediate');
  const [aiEquip, setAiEquip] = useState(EQUIPMENT_OPTIONS[0]);
  const [aiContext, setAiContext] = useState(''); // Added custom context

  // DnD Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Related Exercises Logic for Builder
  const suggestedExercises = useMemo(() => {
      if (builderExercises.length === 0) return [];
      
      // Get the last added exercise to contextualize suggestions
      const lastEx = exercises.find(e => e.id === builderExercises[builderExercises.length - 1].exerciseId);
      if (!lastEx) return [];

      // Find unselected exercises with same muscle group
      const addedIds = new Set(builderExercises.map(be => be.exerciseId));
      
      return exercises
        .filter(e => e.muscleGroup === lastEx.muscleGroup && !addedIds.has(e.id))
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 4); // Top 4
  }, [builderExercises, exercises]);

  // ... (Duration Estimation Logic remains same) ...
  const estimatedDuration = useMemo(() => {
    if (builderExercises.length === 0) return 0;
    let totalSeconds = 0;
    let secondsPerRep = 4; 
    if (builderType === 'Strength') secondsPerRep = 6;
    if (builderType === 'HIIT' || builderType === 'Endurance') secondsPerRep = 2.5;
    if (builderType === 'Mobility') secondsPerRep = 5;

    builderExercises.forEach(ex => {
      let avgReps = 10; 
      const repString = ex.reps.toString().toLowerCase();
      if (repString.includes('-')) {
        const parts = repString.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) avgReps = (parts[0] + parts[1]) / 2;
      } else if (!isNaN(parseInt(repString))) {
        avgReps = parseInt(repString);
      } else if (repString.includes('fail') || repString.includes('amrap')) avgReps = 12; 
      else if (repString.includes('sec') || repString.includes('min')) {
          const timeMatch = repString.match(/(\d+)s/);
          if (timeMatch) { avgReps = 1; secondsPerRep = parseInt(timeMatch[1]); }
      }
      const timePerSet = avgReps * secondsPerRep; 
      const restTime = ex.restSeconds;
      const exerciseTotal = (ex.sets * timePerSet) + (ex.sets * restTime);
      totalSeconds += exerciseTotal;
    });
    let transitions = 0;
    for(let i=0; i<builderExercises.length-1; i++) {
        if (builderExercises[i].supersetId && builderExercises[i].supersetId === builderExercises[i+1].supersetId) transitions += 15;
        else transitions += 90;
    }
    totalSeconds += transitions;
    totalSeconds += 300;
    return Math.round(totalSeconds / 60);
  }, [builderExercises, builderType]);

  const handleCreateNew = () => {
      setEditingWorkoutId(null);
      setBuilderTitle('');
      setBuilderDesc('');
      setBuilderType('Strength');
      setBuilderExercises([]);
      setSelectedBuilderIndices(new Set());
      setAuditResult(null);
      setShowAudit(false);
      setView('builder');
  };

  const handleEditWorkout = (e: React.MouseEvent, workout: Workout) => {
      e.stopPropagation();
      setEditingWorkoutId(workout.id);
      setBuilderTitle(workout.title);
      setBuilderDesc(workout.description);
      setBuilderType(workout.type);
      setBuilderExercises(JSON.parse(JSON.stringify(workout.exercises)));
      setSelectedBuilderIndices(new Set());
      setAuditResult(null);
      setShowAudit(false);
      setView('builder');
      setViewingWorkout(null);
  };

  const handleUseTemplate = (template: any) => { setEditingWorkoutId(null); setBuilderTitle(template.title); setBuilderDesc(template.description); setBuilderType(template.type); setBuilderExercises(JSON.parse(JSON.stringify(template.exercises))); setSelectedBuilderIndices(new Set()); setViewingTemplate(null); setView('builder'); }
  const handleAddExerciseToBuilder = (exercise: Exercise) => { const newEx: WorkoutExercise = { exerciseId: exercise.id, sets: 3, reps: '10', restSeconds: 60, notes: '' }; setBuilderExercises([...builderExercises, newEx]); };
  const removeBuilderExercise = (index: number) => { const newList = [...builderExercises]; newList.splice(index, 1); setBuilderExercises(newList); if (selectedBuilderIndices.has(index)) { const newSet = new Set(selectedBuilderIndices); newSet.delete(index); setSelectedBuilderIndices(newSet); } };
  const updateBuilderExercise = (index: number, field: keyof WorkoutExercise, value: any) => { const newList = [...builderExercises]; newList[index] = { ...newList[index], [field]: value }; setBuilderExercises(newList); };
  const updateSupersetFields = (supersetId: string, field: 'sets' | 'restSeconds', value: number) => { const newExercises = [...builderExercises]; const groupIndices = newExercises.map((ex, i) => ex.supersetId === supersetId ? i : -1).filter(i => i !== -1); groupIndices.forEach((idx, i) => { if (field === 'sets') newExercises[idx].sets = value; else if (field === 'restSeconds') { const isLast = i === groupIndices.length - 1; newExercises[idx].restSeconds = isLast ? value : 0; } }); setBuilderExercises(newExercises); };
  const handleSort = () => { if (dragItem.current === null || dragOverItem.current === null) return; const _builderExercises = [...builderExercises]; const draggedItemContent = _builderExercises.splice(dragItem.current, 1)[0]; _builderExercises.splice(dragOverItem.current, 0, draggedItemContent); setBuilderExercises(_builderExercises); dragItem.current = null; dragOverItem.current = null; };
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { dragItem.current = index; e.currentTarget.style.opacity = '0.4'; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { e.currentTarget.style.opacity = '1'; handleSort(); };
  const toggleSelection = (index: number) => { const newSet = new Set(selectedBuilderIndices); if (newSet.has(index)) newSet.delete(index); else newSet.add(index); setSelectedBuilderIndices(newSet); };
  const handleGroupSuperset = () => { if (selectedBuilderIndices.size < 2) return; const indices = (Array.from(selectedBuilderIndices) as number[]).sort((a, b) => a - b); const supersetId = `ss-${Date.now()}`; const newExercises = [...builderExercises]; const selectedItems = indices.map(i => ({ ...newExercises[i], supersetId, restSeconds: 0 })); selectedItems[selectedItems.length - 1].restSeconds = 90; for (let i = indices.length - 1; i >= 0; i--) { newExercises.splice(indices[i], 1); } newExercises.splice(indices[0], 0, ...selectedItems); setBuilderExercises(newExercises); setSelectedBuilderIndices(new Set()); };
  const handleUngroupSuperset = () => { const newExercises = [...builderExercises]; selectedBuilderIndices.forEach(idx => { if (newExercises[idx]) { newExercises[idx] = { ...newExercises[idx], supersetId: undefined, restSeconds: 60 }; } }); setBuilderExercises(newExercises); setSelectedBuilderIndices(new Set()); };

  const handleSaveBuilder = () => {
      if (!builderTitle) { alert("Please enter a workout title"); return; }
      if (builderExercises.length === 0) { alert("Please add at least one exercise"); return; }
      if (editingWorkoutId) { setWorkouts(prev => prev.map(w => w.id === editingWorkoutId ? { ...w, title: builderTitle, description: builderDesc, type: builderType, durationMinutes: estimatedDuration, exercises: builderExercises } : w)); } 
      else { const newWorkout: Workout = { id: `wk-${Date.now()}`, title: builderTitle, description: builderDesc || 'Custom created workout', type: builderType, durationMinutes: estimatedDuration, difficulty: Difficulty.INTERMEDIATE, exercises: builderExercises }; setWorkouts(prev => [newWorkout, ...prev]); }
      setView('list'); setEditingWorkoutId(null);
  };

  const isWorkoutInUse = (workoutId: string) => {
    const inPrograms = programs.some(p => Object.values(p.schedule).some((weekIds: string[]) => weekIds.includes(workoutId)));
    if (inPrograms) return { used: true, reason: 'Used in a Program' };
    const inClients = clients.some(c => c.assignedWorkouts?.some(cw => cw.workoutId === workoutId));
    if (inClients) return { used: true, reason: 'Assigned to a Client' };
    return { used: false, reason: '' };
  };
  const handleDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); const check = isWorkoutInUse(id); if (check.used) { alert(`Cannot delete workout: It is currently ${check.reason}.`); return; } if (window.confirm("Are you sure?")) { setWorkouts(prev => prev.filter(w => w.id !== id)); } };

  // --- AI Handlers ---

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      // 1. Smart Filter
      let contextExercises = exercises;
      const equipKey = aiEquip.toLowerCase();
      
      if (equipKey.includes('dumbbell')) {
          contextExercises = exercises.filter(e => e.equipment.some(eq => eq.toLowerCase().includes('dumbbell')));
      } else if (equipKey.includes('kettlebell')) {
          contextExercises = exercises.filter(e => e.equipment.some(eq => eq.toLowerCase().includes('kettlebell')));
      } else if (equipKey.includes('bodyweight')) {
          contextExercises = exercises.filter(e => e.equipment.some(eq => eq.toLowerCase().includes('bodyweight') || eq.toLowerCase().includes('none')));
      } else if (equipKey.includes('band')) {
          contextExercises = exercises.filter(e => e.equipment.some(eq => eq.toLowerCase().includes('band')));
      } else if (equipKey.includes('machine')) {
          contextExercises = exercises.filter(e => e.equipment.some(eq => eq.toLowerCase().includes('machine')));
      }

      // 2. Shuffle array
      contextExercises = contextExercises.sort(() => 0.5 - Math.random());

      // 3. Limit to max 50 items (prevent token overflow/latency)
      // Fallback: If filter is too strict (<5 items), use a random sample of full library
      if (contextExercises.length < 5) {
          contextExercises = exercises.sort(() => 0.5 - Math.random()).slice(0, 50);
      } else {
          contextExercises = contextExercises.slice(0, 50);
      }
      
      const availableExerciseNames = contextExercises.map(e => e.name);
      
      const generated = await generateNewWorkout(aiGoal, aiDiff, aiEquip, availableExerciseNames, aiContext);
      
      const suggestedList = generated.suggestedExercises || [];
      if (suggestedList.length === 0) {
          setBuilderTitle(generated.title || "AI Generated Workout");
          setBuilderDesc(generated.description || "No exercises generated. Try broadening criteria.");
          setBuilderType(generated.type || "Strength");
          setBuilderExercises([]);
      } else {
          // Fuzzy Matching & Auto-Creation
          const newLocalExercises: Exercise[] = [];
          
          const mappedExercises: WorkoutExercise[] = suggestedList.map((sug: any, idx: number) => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetName = normalize(sug.name || 'Unknown');

            // 1. Check existing library (full list, not just filtered context)
            let match = exercises.find(e => normalize(e.name) === targetName);

            // 2. Check newly created in this batch
            if (!match) match = newLocalExercises.find(e => normalize(e.name) === targetName);

            // 3. Create if missing
            if (!match && setExercises) {
                match = {
                    id: `ex-ai-${Date.now()}-${idx}`,
                    name: sug.name || 'Unknown Exercise',
                    description: `AI Generated for ${generated.title}. Notes: ${sug.notes || ''}`,
                    muscleGroup: MuscleGroup.FULL_BODY,
                    difficulty: Difficulty.INTERMEDIATE,
                    equipment: [aiEquip],
                    videoUrl: ''
                };
                newLocalExercises.push(match);
            }

            const finalId = match ? match.id : `temp-${idx}`;

            return {
                exerciseId: finalId,
                sets: sug.sets || 3,
                reps: String(sug.reps || '10'),
                restSeconds: sug.restSeconds || 60,
                notes: sug.notes || ''
            };
          });

          if (newLocalExercises.length > 0 && setExercises) {
              setExercises(prev => [...prev, ...newLocalExercises]);
          }

          setBuilderTitle(generated.title || "AI Workout");
          setBuilderDesc(generated.description || "Generated by AI");
          setBuilderType(generated.type || "Strength");
          setBuilderExercises(mappedExercises);
      }
      
      setAiContext(''); // Clear context
      setView('builder'); // Go to builder to review
    } catch (e) {
      console.error(e);
      alert("Failed to generate workout. Try reducing constraints.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunAuditForView = async () => {
      if (!viewingWorkout) return;
      setIsAuditing(true);
      setShowAudit(true);
      try {
          const exerciseNames = viewingWorkout.exercises.map(ex => {
              const def = exercises.find(e => e.id === ex.exerciseId);
              return { name: def?.name || 'Unknown', sets: ex.sets, reps: ex.reps };
          });
          const result = await analyzeWorkoutPlan(viewingWorkout.title, exerciseNames);
          setAuditResult(result);
      } catch (e) {
          alert("Failed to audit workout");
      } finally {
          setIsAuditing(false);
      }
  };

  const handleRunAudit = async () => {
      if (builderExercises.length === 0) return;
      setIsAuditing(true);
      setShowAudit(true);
      try {
          // Map internal IDs to Names for the AI
          const exerciseNames = builderExercises.map(ex => {
              const def = exercises.find(e => e.id === ex.exerciseId);
              return { name: def?.name || 'Unknown', sets: ex.sets, reps: ex.reps };
          });
          
          const result = await analyzeWorkoutPlan(builderTitle, exerciseNames);
          setAuditResult(result);
      } catch (e) {
          alert("Failed to audit workout");
      } finally {
          setIsAuditing(false);
      }
  };

  const filteredWorkouts = useMemo(() => {
      return workouts.filter(w => {
          const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) || w.description.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesType = typeFilter === 'All' || w.type === typeFilter;
          const matchesDiff = diffFilter === 'All' || w.difficulty === diffFilter;
          return matchesSearch && matchesType && matchesDiff;
      });
  }, [workouts, searchTerm, typeFilter, diffFilter]);

  const uniqueTypes = Array.from(new Set(workouts.map(w => w.type)));
  
  // Toggle Instructions State Helper
  const toggleInstruction = (indexStr: string) => { 
      const newSet = new Set(expandedInstructions); 
      if (newSet.has(indexStr)) newSet.delete(indexStr); 
      else newSet.add(indexStr); 
      setExpandedInstructions(newSet); 
  }
  
  // Reusable Audit Panel Component
  const renderAuditPanel = () => {
      if (!showAudit) return null;
      return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 mb-6 text-white shadow-xl animate-in fade-in slide-in-from-top-4 w-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><Sparkles size={24} className="text-yellow-400" /></div>
                    <div><h3 className="font-bold text-lg">AI Workout Auditor</h3><p className="text-slate-400 text-sm">Analyzing balance and intensity...</p></div>
                </div>
                <button onClick={() => setShowAudit(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>

            {isAuditing ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-300">
                    <Loader2 size={32} className="animate-spin mb-2 text-indigo-400" />
                    <p>Reviewing exercise selection...</p>
                </div>
            ) : auditResult ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-4xl font-bold text-emerald-400 mb-1">{auditResult.score}</div>
                        <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Quality Score</div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-emerald-300 uppercase mb-2 flex items-center gap-2"><CheckSquare size={14}/> Strengths</h4>
                        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">{auditResult.pros.map((p,i)=><li key={i}>{p}</li>)}</ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-orange-300 uppercase mb-2 flex items-center gap-2"><AlertCircle size={14}/> Potential Issues</h4>
                        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">{auditResult.cons.map((c,i)=><li key={i}>{c}</li>)}</ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-300 uppercase mb-2 flex items-center gap-2"><Wand2 size={14}/> Suggestions</h4>
                        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">{auditResult.suggestions.map((s,i)=><li key={i}>{s}</li>)}</ul>
                    </div>
                </div>
            ) : null}
        </div>
      );
  };

  const renderDetailView = () => {
      if (!viewingWorkout) return null;
      return (
        <div className="space-y-6 animate-fade-in pb-10 w-full">
             {renderAuditPanel()}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><div className="flex items-center gap-4"><button onClick={() => { setViewingWorkout(null); setView('list'); setShowAudit(false); }} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><div><div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">{viewingWorkout.type}</span><span className="text-slate-300">•</span><span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> {viewingWorkout.durationMinutes} mins</span></div><h2 className="text-3xl font-bold text-slate-800 leading-tight">{viewingWorkout.title}</h2><p className="text-slate-500 mt-1">{viewingWorkout.description}</p></div></div><div className="flex items-center gap-3"><button onClick={handleRunAuditForView} className="flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-bold hover:bg-purple-100 transition-colors border border-purple-100"><Sparkles size={18}/> AI Audit</button><button onClick={(e) => handleEditWorkout(e, viewingWorkout)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg shadow-indigo-200"><Edit2 size={18} /> Edit Plan</button></div></div>
             <div className="space-y-4">
                {viewingWorkout.exercises.map((ex, i) => {
                    const def = exercises.find(e => e.id === ex.exerciseId);
                    const isSuperset = !!ex.supersetId;
                    const isSupersetStart = isSuperset && (i === 0 || viewingWorkout.exercises[i-1].supersetId !== ex.supersetId);
                    const isExpanded = expandedInstructions.has(i.toString());

                    return (
                        <React.Fragment key={i}>
                            {isSupersetStart && (
                                <div className="mt-6 mb-2 flex items-center gap-2 text-orange-600 font-bold uppercase text-sm tracking-wider px-2">
                                    <Repeat size={16} /> Circuit / Superset
                                </div>
                            )}
                            <div className={`bg-white rounded-2xl border p-6 flex gap-6 shadow-sm ${isSuperset ? 'border-orange-200 bg-orange-50/10' : 'border-slate-200'}`}>
                                <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {def?.videoUrl ? <img src={def.videoUrl} className="w-full h-full object-cover" alt={def.name} referrerPolicy="no-referrer" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}/> : <Dumbbell size={32} className="text-slate-400"/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-slate-800">{def?.name}</h3>
                                        <button 
                                            onClick={() => toggleInstruction(i.toString())}
                                            className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                                        >
                                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                            {isExpanded ? 'Hide Info' : 'How To'}
                                        </button>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
                                        <span className="bg-slate-100 px-2 py-1 rounded">Sets: <strong className="text-slate-700">{ex.sets}</strong></span>
                                        <span className="bg-slate-100 px-2 py-1 rounded">Reps: <strong className="text-slate-700">{ex.reps}</strong></span>
                                        <span className="bg-slate-100 px-2 py-1 rounded">Rest: <strong className="text-slate-700">{ex.restSeconds}s</strong></span>
                                    </div>
                                    {ex.notes && <p className="mt-3 text-sm text-slate-600 italic bg-yellow-50 border border-yellow-100 p-2 rounded-lg flex items-start gap-2"><Info size={14} className="mt-0.5 text-yellow-600 flex-shrink-0"/> {ex.notes}</p>}
                                    
                                    {isExpanded && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                                <BookOpen size={14} /> Instructions
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                                {def?.description || "No specific instructions available for this exercise."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    )
                })}
             </div>
        </div>
      )
  };

  if (view === 'detail') {
      return renderDetailView() || <div />; 
  }
  if (view === 'templates') return (
    <div className="space-y-6 animate-fade-in pb-10 w-full">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('list')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
            <h2 className="text-2xl font-bold text-slate-800">Workout Templates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {WORKOUT_TEMPLATES.map((t, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="h-40 bg-slate-200 relative">
                        <img src={t.image} className="w-full h-full object-cover" alt={t.title}/>
                        <div className="absolute top-3 left-3"><span className="px-2 py-1 bg-white/90 text-indigo-600 text-xs font-bold rounded">{t.type}</span></div>
                    </div>
                    <div className="p-6">
                        <h3 className="font-bold text-slate-800 text-lg">{t.title}</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-4">{t.description}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setViewingTemplate(t)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Preview</button>
                            <button onClick={() => handleUseTemplate(t)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Use Template</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Template Preview Modal */}
        {viewingTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <h3 className="text-xl font-bold text-slate-800">{viewingTemplate.title}</h3>
                        <button onClick={() => setViewingTemplate(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <p className="text-slate-600 mb-6">{viewingTemplate.description}</p>
                        <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Plan Preview</h4>
                        <div className="space-y-3">
                            {viewingTemplate.exercises.map((ex: any, idx: number) => {
                                const def = exercises.find(e => e.id === ex.exerciseId);
                                return (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="font-medium text-slate-800">{def?.name || 'Unknown Exercise'}</div>
                                        <div className="text-sm text-slate-500">{ex.sets} x {ex.reps}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setViewingTemplate(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Close</button>
                        <button onClick={() => handleUseTemplate(viewingTemplate)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Use This Template</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  if (view === 'builder') {
    return (
        <div className="h-full flex flex-col animate-fade-in flex-1">
            {/* Builder Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setView('list'); setEditingWorkoutId(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                    <div><h2 className="text-xl font-bold text-slate-800">{editingWorkoutId ? 'Edit Workout' : 'Workout Builder'}</h2></div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleRunAudit}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-bold rounded-lg hover:bg-purple-100 transition-colors border border-purple-100"
                    >
                        <Sparkles size={16} /> AI Audit
                    </button>
                    <button onClick={handleSaveBuilder} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"><Save size={18} /> Save</button>
                </div>
            </div>

            {/* AI Audit Panel (Collapsible) */}
            {renderAuditPanel()}

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Left: Library */}
                <div className="w-1/3 min-w-[300px] bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex-shrink-0"><input type="text" placeholder="Search exercises..." className="w-full p-2 border rounded" value={exerciseSearch} onChange={e=>setExerciseSearch(e.target.value)}/></div>
                    
                    {/* NEW: Smart Suggestions Panel */}
                    {suggestedExercises.length > 0 && !exerciseSearch && (
                        <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
                            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Sparkles size={12} /> Suggested for you
                            </div>
                            <div className="space-y-1">
                                {suggestedExercises.map(ex => (
                                    <button key={ex.id} onClick={() => handleAddExerciseToBuilder(ex)} className="w-full text-left p-2 hover:bg-white rounded border border-transparent hover:border-indigo-200 flex justify-between group transition-all text-xs">
                                        <span className="font-medium text-indigo-900">{ex.name}</span>
                                        <Plus size={14} className="text-indigo-400 group-hover:text-indigo-600"/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">{exercises.filter(e=>e.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => (<button key={ex.id} onClick={() => handleAddExerciseToBuilder(ex)} className="w-full text-left p-3 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-100 flex justify-between group"><span className="font-medium text-slate-700 group-hover:text-indigo-700">{ex.name}</span><Plus size={16} className="text-slate-300 group-hover:text-indigo-600"/></button>))}</div>
                </div>

                {/* Right: Builder */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 space-y-4 flex-shrink-0">
                         <div className="flex gap-4"><div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Title</label><input type="text" className="w-full p-2 border rounded font-bold" value={builderTitle} onChange={e=>setBuilderTitle(e.target.value)} /></div><div className="w-40"><label className="text-xs font-bold text-slate-500 uppercase">Type</label><select className="w-full p-2 border rounded bg-white" value={builderType} onChange={e=>setBuilderType(e.target.value)}><option>Strength</option><option>Hypertrophy</option></select></div></div>
                         <div><label className="text-xs font-bold text-slate-500 uppercase">Description</label><input type="text" className="w-full p-2 border rounded" value={builderDesc} onChange={e=>setBuilderDesc(e.target.value)} /></div>
                    </div>
                    
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200 flex-shrink-0">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exercise Order</h4>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleUngroupSuperset}
                                disabled={selectedBuilderIndices.size === 0}
                                className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Unlink size={12} /> Ungroup
                            </button>
                            <button 
                                onClick={handleGroupSuperset}
                                disabled={selectedBuilderIndices.size < 2}
                                className="px-2 py-1 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Link2 size={12} /> Group Superset
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-3">
                        {builderExercises.length === 0 ? <div className="text-center text-slate-400 mt-10">Add exercises...</div> : builderExercises.map((item, idx) => {
                             const def = exercises.find(e => e.id === item.exerciseId);
                             const isSelected = selectedBuilderIndices.has(idx);
                             const isSuperset = !!item.supersetId;
                             const isSupersetStart = isSuperset && (idx === 0 || builderExercises[idx-1].supersetId !== item.supersetId);

                             return (
                                 <React.Fragment key={idx}>
                                    {isSupersetStart && (
                                        <div className="mb-1 mt-4 first:mt-0 flex items-center justify-between bg-orange-100 border border-orange-200 rounded-t-lg p-2 px-3">
                                            <div className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1"><Repeat size={14} /> Superset Group</div>
                                            <div className="flex gap-4 items-center">
                                                <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-orange-600 uppercase">Sets</span><input type="number" className="w-10 text-center text-xs font-bold bg-white rounded border border-orange-200 outline-none p-0.5" value={item.sets} onChange={(e) => updateSupersetFields(item.supersetId!, 'sets', parseInt(e.target.value))} /></div>
                                                <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-orange-600 uppercase">Cycle Rest</span><input type="number" className="w-10 text-center text-xs font-bold bg-white rounded border border-orange-200 outline-none p-0.5" value={builderExercises.find((ex, i) => i >= idx && ex.supersetId === item.supersetId && (i === builderExercises.length - 1 || builderExercises[i+1].supersetId !== item.supersetId))?.restSeconds || 90} onChange={(e) => updateSupersetFields(item.supersetId!, 'restSeconds', parseInt(e.target.value))} /><span className="text-[10px] text-orange-600">s</span></div>
                                            </div>
                                        </div>
                                    )}
                                     <div 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragEnter={(e) => (dragOverItem.current = idx)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => e.preventDefault()}
                                        className={`
                                            relative p-4 border shadow-sm group transition-all cursor-default flex items-start gap-3
                                            ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-slate-200'}
                                            ${isSuperset ? 'border-l-4 border-l-orange-400 bg-orange-50/10 rounded-none first:rounded-t-none last:rounded-b-xl border-t-0 -mt-3 pt-6' : 'rounded-xl'}
                                            ${isSuperset ? 'opacity-90' : ''}
                                        `}
                                     >
                                         <div onClick={() => toggleSelection(idx)} className="mt-1 cursor-pointer text-slate-300 hover:text-indigo-500">{isSelected ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}</div>
                                         <div className="flex-1">
                                             <div className="flex justify-between items-start mb-3">
                                                 <div className="flex items-center gap-3">
                                                     <div className="cursor-move text-slate-300 hover:text-slate-500 p-1 hover:bg-slate-50 rounded"><GripVertical size={20}/></div>
                                                     <div><h4 className="font-bold text-slate-800">{def?.name || 'Unknown'}</h4><span className="text-xs text-slate-500 uppercase">{def?.muscleGroup}</span></div>
                                                 </div>
                                                 <button onClick={() => removeBuilderExercise(idx)} className="text-slate-300 hover:text-red-500"><X size={20}/></button>
                                             </div>
                                             
                                             <div className="grid grid-cols-3 gap-4 pl-8">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sets</label>
                                                    {isSuperset ? 
                                                        <div className="w-full p-1.5 border border-slate-100 bg-slate-50 rounded text-sm font-bold text-center text-slate-400 cursor-not-allowed">{item.sets}</div> 
                                                        : 
                                                        <input type="number" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.sets} onChange={(e) => updateBuilderExercise(idx, 'sets', parseInt(e.target.value))} />
                                                    }
                                                </div>
                                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reps</label><input type="text" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.reps} onChange={(e) => updateBuilderExercise(idx, 'reps', e.target.value)} /></div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSuperset ? 'Inner Rest' : 'Rest (s)'}</label>
                                                    {isSuperset ? 
                                                        <div className="w-full p-1.5 border border-slate-100 bg-slate-50 rounded text-sm font-bold text-center text-slate-400 cursor-not-allowed">{item.restSeconds}s</div> 
                                                        : 
                                                        <input type="number" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.restSeconds} onChange={(e) => updateBuilderExercise(idx, 'restSeconds', parseInt(e.target.value))} />
                                                    }
                                                </div>
                                             </div>
                                             <div className="mt-2 pl-8 pr-4">
                                                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1 focus-within:border-indigo-500 transition-colors">
                                                      <Info size={14} className="text-slate-400"/>
                                                      <input type="text" className="w-full text-xs text-slate-600 bg-transparent outline-none placeholder:text-slate-300 placeholder:italic" placeholder="Add notes..." value={item.notes || ''} onChange={(e) => updateBuilderExercise(idx, 'notes', e.target.value)} />
                                                  </div>
                                              </div>
                                         </div>
                                     </div>
                                 </React.Fragment>
                             );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // List View (Default)
  return (
    <div className="space-y-6 animate-fade-in pb-10 w-full">
        {/* ... Header ... */}
        <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-slate-800">Workouts</h2></div><div className="flex gap-3"><button onClick={handleCreateNew} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2"><Plus size={18}/> Create New</button></div></div>

        {/* AI Generator with Context */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm"><Sparkles size={24} className="text-yellow-300" /></div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Generate with AI</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select value={aiGoal} onChange={e => setAiGoal(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-lg p-2 text-sm outline-none [&>option]:text-slate-900">
                    {GOAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={aiDiff} onChange={e => setAiDiff(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-lg p-2 text-sm outline-none [&>option]:text-slate-900">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Elite</option>
                </select>
                <select value={aiEquip} onChange={e => setAiEquip(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-lg p-2 text-sm outline-none [&>option]:text-slate-900">
                    {EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              {/* New Context Input */}
              <div className="mb-4">
                  <textarea 
                    className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-3 text-sm placeholder:text-indigo-200 focus:ring-2 focus:ring-white/30 outline-none resize-none h-20"
                    placeholder="Context / Constraints (e.g. 'Client has lower back pain, avoid deadlifts' or 'Focus on upper chest')..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                  />
              </div>

              <button onClick={handleGenerateWorkout} disabled={isGenerating} className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />} Generate Workout</button>
            </div>
          </div>
        </div>

        {/* View Options */}
        <div className="flex gap-4 border-b border-slate-200">
            <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 font-bold text-sm">Library</button>
            <button onClick={() => setView('templates')} className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">Templates</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWorkouts.map(w => (
                <div key={w.id} onClick={() => { setViewingWorkout(w); setView('detail'); }} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md cursor-pointer overflow-hidden">
                    <div className="h-40 bg-slate-200 relative"><img src={w.image} className="w-full h-full object-cover" alt={w.title}/><div className="absolute top-3 left-3"><span className="px-2 py-1 bg-white/90 text-indigo-600 text-xs font-bold rounded">{w.type}</span></div></div>
                    <div className="p-4"><h3 className="font-bold text-slate-800">{w.title}</h3><p className="text-sm text-slate-500 line-clamp-2 mt-1">{w.description}</p></div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Workouts;

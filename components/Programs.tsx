
import React, { useState, useRef } from 'react';
import { Program, Workout, Exercise, WorkoutExercise } from '../types';
import { PROGRAM_TAGS } from '../constants';
import { ChevronDown, ChevronUp, ChevronRight, Copy, Plus, Calendar, Settings, Edit, ArrowRight, X, Repeat, Timer, Link2, Unlink, Save, CheckSquare, Square, Trash2, Clock, Search, GripVertical, Info, Dumbbell, ArrowLeft, Eye, LayoutGrid } from 'lucide-react';

interface Props {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  workouts: Workout[];
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
  exercises: Exercise[];
}

interface EditingSlot {
    weekNum: number;
    dayIndex: number;
    currentWorkoutId: string;
}

interface AddDayContext {
    weekNum: number;
}

type ViewState = 'list' | 'detail' | 'builder';

const Programs: React.FC<Props> = ({ programs, setPrograms, workouts, setWorkouts, exercises }) => {
  const [view, setView] = useState<ViewState>('list');
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  
  // Builder State
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderDuration, setBuilderDuration] = useState(4);
  const [builderTags, setBuilderTags] = useState<string[]>([]);
  const [builderSchedule, setBuilderSchedule] = useState<Record<number, string[]>>({});
  const [customTagInput, setCustomTagInput] = useState('');

  // Navigation State
  const [currentWeek, setCurrentWeek] = useState(1);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false); // Day Editor
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  
  const [addDayContext, setAddDayContext] = useState<AddDayContext | null>(null); // Add Workout Picker
  const [workoutSearchTerm, setWorkoutSearchTerm] = useState('');
  
  const [viewingWorkoutId, setViewingWorkoutId] = useState<string | null>(null); // Read-only modal in Detail view

  // Local editing state inside "Edit Day" modal
  const [editedExercises, setEditedExercises] = useState<WorkoutExercise[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [exerciseSearch, setExerciseSearch] = useState('');

  // DnD Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Actions ---

  const handleDuplicate = (e: React.MouseEvent, program: Program) => {
    e.stopPropagation();
    const uniqueSuffix = Math.random().toString(36).substr(2, 9);
    const newProgram: Program = {
      ...program,
      id: `pg-${Date.now()}-${uniqueSuffix}`,
      title: `${program.title} (Copy)`,
      schedule: JSON.parse(JSON.stringify(program.schedule))
    };
    setPrograms(prev => [newProgram, ...prev]);
  };

  const handleCreateNew = () => {
    setBuilderId(null);
    setBuilderTitle('');
    setBuilderDesc('');
    setBuilderDuration(4);
    setBuilderTags([]);
    setBuilderSchedule({});
    setCustomTagInput('');
    setCurrentWeek(1);
    setView('builder');
  };

  const handleEditProgram = (p: Program) => {
    setBuilderId(p.id);
    setBuilderTitle(p.title);
    setBuilderDesc(p.description);
    setBuilderDuration(p.durationWeeks);
    setBuilderTags(p.tags || []);
    setBuilderSchedule(JSON.parse(JSON.stringify(p.schedule)));
    setCurrentWeek(1);
    setView('builder');
  };

  const handleSaveProgram = () => {
      if (!builderTitle) {
          alert("Please enter a program title");
          return;
      }

      const newProgram: Program = {
          id: builderId || `pg-${Date.now()}`,
          title: builderTitle,
          description: builderDesc,
          durationWeeks: builderDuration,
          tags: builderTags,
          schedule: builderSchedule,
          image: viewingProgram?.image // Preserve image if editing, new ones don't have image upload in this UI yet
      };

      if (builderId) {
          setPrograms(prev => prev.map(p => p.id === builderId ? { ...newProgram, image: p.image } : p));
      } else {
          setPrograms(prev => [newProgram, ...prev]);
      }

      setView('list');
      setViewingProgram(null);
  };

  const getWorkoutById = (id: string) => workouts.find(w => w.id === id);
  const getExerciseById = (id: string) => exercises.find(e => e.id === id);

  // --- Schedule Manipulation (Builder) ---

  const openEditDayModal = (weekNum: number, dayIndex: number, workoutId: string) => {
      setEditingSlot({ weekNum, dayIndex, currentWorkoutId: workoutId });
      const workout = getWorkoutById(workoutId);
      if (workout) {
          setEditedExercises(JSON.parse(JSON.stringify(workout.exercises)));
          setSessionTitle(workout.title);
      } else {
          setEditedExercises([]);
          setSessionTitle('New Session');
      }
      setSelectedIndices(new Set());
      setExerciseSearch('');
      setShowEditModal(true);
  };

  const openAddDayModal = (weekNum: number) => {
      setAddDayContext({ weekNum });
      setWorkoutSearchTerm('');
  };

  const handleConfirmAddDay = (workoutId: string) => {
      if (!addDayContext) return;
      const { weekNum } = addDayContext;
      const currentDays = builderSchedule[weekNum] || [];
      
      setBuilderSchedule({
          ...builderSchedule,
          [weekNum]: [...currentDays, workoutId]
      });
      setAddDayContext(null);
  };

  const handleRemoveDay = () => {
      if (!editingSlot) return;
      const { weekNum, dayIndex } = editingSlot;
      const currentDays = [...(builderSchedule[weekNum] || [])];
      currentDays.splice(dayIndex, 1);
      
      setBuilderSchedule({
          ...builderSchedule,
          [weekNum]: currentDays
      });
      setShowEditModal(false);
      setEditingSlot(null);
  };

  const handleReplaceWorkoutInSlot = (newWorkoutId: string) => {
      if (!editingSlot) return;
      setEditingSlot({ ...editingSlot, currentWorkoutId: newWorkoutId });
      const newWorkout = getWorkoutById(newWorkoutId);
      if (newWorkout) {
          setEditedExercises(JSON.parse(JSON.stringify(newWorkout.exercises)));
          setSessionTitle(newWorkout.title);
          setSelectedIndices(new Set());
      }
  };

  // --- Day Editor Logic (Supersets, etc) ---

  const handleAddExerciseToDay = (exercise: Exercise) => {
      const newEx: WorkoutExercise = {
          exerciseId: exercise.id,
          sets: 3,
          reps: '10',
          restSeconds: 60,
          notes: ''
      };
      setEditedExercises([...editedExercises, newEx]);
  };

  const removeExerciseFromDay = (index: number) => {
      const newList = [...editedExercises];
      newList.splice(index, 1);
      setEditedExercises(newList);
      if (selectedIndices.has(index)) {
          const newSet = new Set(selectedIndices);
          newSet.delete(index);
          setSelectedIndices(newSet);
      }
  };

  const handleToggleSelection = (index: number) => {
      const newSet = new Set(selectedIndices);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setSelectedIndices(newSet);
  };

  const handleGroupSuperset = () => {
      if (selectedIndices.size < 2) return;
      const indices = (Array.from(selectedIndices) as number[]).sort((a, b) => a - b);
      const supersetId = `ss-${Date.now()}`;
      const newExercises = [...editedExercises];
      
      // Extract items and set internal rest to 0
      const selectedItems = indices.map(i => ({ 
          ...newExercises[i], 
          supersetId, 
          restSeconds: 0 
      }));
      
      // Set cycle rest for the last item
      selectedItems[selectedItems.length - 1].restSeconds = 90;
      
      for (let i = indices.length - 1; i >= 0; i--) {
          newExercises.splice(indices[i], 1);
      }
      newExercises.splice(indices[0], 0, ...selectedItems);
      
      setEditedExercises(newExercises);
      setSelectedIndices(new Set());
  };

  const handleUngroup = () => {
      const newExercises = [...editedExercises];
      selectedIndices.forEach(idx => {
          if (newExercises[idx]) {
              newExercises[idx] = { ...newExercises[idx], supersetId: undefined, restSeconds: 60 };
          }
      });
      setEditedExercises(newExercises);
      setSelectedIndices(new Set());
  };

  const updateExerciseField = (index: number, field: keyof WorkoutExercise, value: any) => {
      const newExercises = [...editedExercises];
      newExercises[index] = { ...newExercises[index], [field]: value };
      setEditedExercises(newExercises);
  };
  
  const updateSupersetFields = (supersetId: string, field: 'sets' | 'restSeconds', value: number) => {
      const newExercises = [...editedExercises];
      const groupIndices = newExercises.map((ex, i) => ex.supersetId === supersetId ? i : -1).filter(i => i !== -1);
      groupIndices.forEach((idx, i) => {
          if (field === 'sets') newExercises[idx].sets = value;
          else if (field === 'restSeconds') {
              const isLast = i === groupIndices.length - 1;
              newExercises[idx].restSeconds = isLast ? value : 0;
          }
      });
      setEditedExercises(newExercises);
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _exercises = [...editedExercises];
    const draggedItemContent = _exercises.splice(dragItem.current, 1)[0];
    _exercises.splice(dragOverItem.current, 0, draggedItemContent);
    setEditedExercises(_exercises);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItem.current = index;
      e.currentTarget.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.opacity = '1';
      handleSort();
  };

  // --- Save Logic for Day Editor ---

  const handleSaveDayChanges = () => {
      if (!editingSlot) return;

      const originalWorkout = getWorkoutById(editingSlot.currentWorkoutId);
      const exercisesChanged = JSON.stringify(originalWorkout?.exercises) !== JSON.stringify(editedExercises);
      const titleChanged = originalWorkout?.title !== sessionTitle;
      
      let finalWorkoutId = editingSlot.currentWorkoutId;

      if ((exercisesChanged || titleChanged) && originalWorkout) {
          // Create a custom version
          const newWorkoutId = `wk-custom-${Date.now()}`;
          const newWorkout: Workout = {
              ...originalWorkout,
              id: newWorkoutId,
              title: sessionTitle || `${originalWorkout.title} (Custom)`,
              exercises: editedExercises
          };
          setWorkouts(prev => [newWorkout, ...prev]);
          finalWorkoutId = newWorkoutId;
      }

      // Update Local Builder Schedule
      const currentDays = [...(builderSchedule[editingSlot.weekNum] || [])];
      currentDays[editingSlot.dayIndex] = finalWorkoutId;
      
      setBuilderSchedule({
          ...builderSchedule,
          [editingSlot.weekNum]: currentDays
      });

      setShowEditModal(false);
  };

  // --- Tags ---
  const toggleTag = (tag: string) => {
    setBuilderTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const addCustomTag = () => {
    if (customTagInput.trim() && !builderTags.includes(customTagInput.trim())) {
        setBuilderTags(prev => [...prev, customTagInput.trim()]);
    }
    setCustomTagInput('');
  };

  // --- Renderers ---

  const renderDetailView = () => {
      if (!viewingProgram) return null;
      const weeklySchedule = viewingProgram.schedule[currentWeek] || [];

      return (
          <div className="space-y-6 animate-fade-in pb-10">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="h-48 relative">
                      {viewingProgram.image ? (
                          <img src={viewingProgram.image} className="w-full h-full object-cover" alt={viewingProgram.title} />
                      ) : (
                          <div className="w-full h-full bg-slate-800"></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 p-8 flex flex-col justify-end text-white">
                          <div className="flex justify-between items-end">
                              <div>
                                  <div className="flex gap-2 mb-2">
                                      {viewingProgram.tags?.map(tag => (
                                          <span key={tag} className="px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-xs font-bold border border-white/10">{tag}</span>
                                      ))}
                                  </div>
                                  <h2 className="text-3xl font-bold mb-2">{viewingProgram.title}</h2>
                                  <p className="text-slate-200">{viewingProgram.description}</p>
                              </div>
                              <button 
                                onClick={() => handleEditProgram(viewingProgram)}
                                className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                              >
                                  <Edit className="inline-block mr-2" size={18} /> Edit Program
                              </button>
                          </div>
                      </div>
                      <button 
                        onClick={() => { setView('list'); setViewingProgram(null); }}
                        className="absolute top-4 left-4 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                      >
                          <ArrowLeft size={24} />
                      </button>
                  </div>
              </div>

              {/* Navigator */}
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
                  <button 
                    onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
                    disabled={currentWeek === 1}
                    className="p-3 hover:bg-slate-50 rounded-lg disabled:opacity-30"
                  >
                      <ChevronDown className="rotate-90" size={24} />
                  </button>
                  <div className="text-center">
                      <span className="block font-bold text-slate-800 text-lg">Week {currentWeek}</span>
                      <span className="text-xs text-slate-500">{viewingProgram.durationWeeks} Weeks Total</span>
                  </div>
                  <button 
                    onClick={() => setCurrentWeek(prev => Math.min(viewingProgram.durationWeeks, prev + 1))}
                    disabled={currentWeek === viewingProgram.durationWeeks}
                    className="p-3 hover:bg-slate-50 rounded-lg disabled:opacity-30"
                  >
                      <ChevronRight size={24} />
                  </button>
              </div>

              {/* Schedule */}
              <div className="space-y-4 max-w-4xl mx-auto">
                  {weeklySchedule.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No workouts scheduled for this week.</p>
                      </div>
                  ) : (
                      weeklySchedule.map((workoutId, index) => {
                          const workout = getWorkoutById(workoutId);
                          return (
                              <div 
                                key={index} 
                                onClick={() => workout && setViewingWorkoutId(workout.id)}
                                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex gap-6 items-center group"
                              >
                                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                      {index + 1}
                                  </div>
                                  <div className="flex-1">
                                      <h3 className="font-bold text-lg text-slate-800 mb-1">{workout?.title || 'Unknown Workout'}</h3>
                                      <div className="flex items-center gap-4 text-sm text-slate-500">
                                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">{workout?.type}</span>
                                          <span className="flex items-center gap-1"><Clock size={14}/> {workout?.durationMinutes}m</span>
                                          <span className="flex items-center gap-1"><Dumbbell size={14}/> {workout?.exercises.length} Exercises</span>
                                      </div>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                      <Eye size={20} />
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  const renderBuilderView = () => {
      const currentDays = builderSchedule[currentWeek] || [];

      return (
          <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                      <button 
                          onClick={() => { setView('list'); }} 
                          className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                      >
                          <ArrowLeft size={20} />
                      </button>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">
                              {builderId ? 'Edit Program' : 'Program Builder'}
                          </h2>
                          <p className="text-xs text-slate-500">
                              {builderId ? 'Updating existing plan' : 'Design a new periodized plan'}
                          </p>
                      </div>
                  </div>
                  <button 
                      onClick={handleSaveProgram}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                      <Save size={18} /> Save Program
                  </button>
              </div>

              <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* LEFT: Metadata */}
                  <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-y-auto">
                      <div className="p-6 space-y-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Program Title</label>
                              <input 
                                  type="text" 
                                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. 12 Week Hypertrophy"
                                  value={builderTitle}
                                  onChange={(e) => setBuilderTitle(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                              <textarea 
                                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                  placeholder="Brief overview..."
                                  value={builderDesc}
                                  onChange={(e) => setBuilderDesc(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                              <select 
                                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                  value={builderDuration}
                                  onChange={(e) => setBuilderDuration(parseInt(e.target.value))}
                              >
                                  {[4,6,8,10,12,16].map(w => <option key={w} value={w}>{w} Weeks</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Tags</label>
                              <div className="flex flex-wrap gap-2 mb-3">
                                  {PROGRAM_TAGS.map(tag => (
                                      <button 
                                          key={tag}
                                          onClick={() => toggleTag(tag)}
                                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${builderTags.includes(tag) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                      >
                                          {tag}
                                      </button>
                                  ))}
                              </div>
                              <div className="flex gap-2">
                                  <input 
                                      type="text"
                                      value={customTagInput}
                                      onChange={(e) => setCustomTagInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                                      placeholder="Add custom tag..."
                                      className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                  />
                                  <button onClick={addCustomTag} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600"><Plus size={18}/></button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {builderTags.filter(t => !PROGRAM_TAGS.includes(t)).map(tag => (
                                      <span key={tag} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium border border-indigo-200 flex items-center gap-1">
                                          {tag}
                                          <button onClick={() => toggleTag(tag)} className="hover:text-indigo-900"><X size={12}/></button>
                                      </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* RIGHT: Schedule Builder */}
                  <div className="flex-1 bg-slate-50/50 rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                      <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center">
                          <button 
                            onClick={() => setCurrentWeek(prev => Math.max(1, prev - 1))}
                            disabled={currentWeek === 1}
                            className="p-2 hover:bg-slate-50 rounded disabled:opacity-30"
                          >
                              <ChevronDown className="rotate-90" size={24}/>
                          </button>
                          <div className="text-center">
                              <h3 className="font-bold text-lg text-slate-800">Week {currentWeek}</h3>
                              <p className="text-xs text-slate-500">Manage daily workouts</p>
                          </div>
                          <button 
                            onClick={() => setCurrentWeek(prev => Math.min(builderDuration, prev + 1))}
                            disabled={currentWeek === builderDuration}
                            className="p-2 hover:bg-slate-50 rounded disabled:opacity-30"
                          >
                              <ChevronRight size={24}/>
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {currentDays.map((workoutId, index) => {
                              const workout = getWorkoutById(workoutId);
                              return (
                                  <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
                                      <div className="flex items-center gap-4">
                                          <div className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded text-sm">Day {index + 1}</div>
                                          <div>
                                              <h4 className="font-bold text-slate-800">{workout?.title || 'Unknown'}</h4>
                                              <p className="text-xs text-slate-500">{workout?.type} • {workout?.durationMinutes} mins</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => openEditDayModal(currentWeek, index, workoutId)}
                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                                          >
                                              <Edit size={16} />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                          
                          <button 
                            onClick={() => openAddDayModal(currentWeek)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-medium"
                          >
                              <Plus size={20} /> Add Workout Day
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  // --- List View ---
  const renderListView = () => (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Training Programs</h2>
          <p className="text-slate-500">Manage periodization templates.</p>
        </div>
        <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} /> New Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(program => (
              <div 
                key={program.id} 
                onClick={() => { setViewingProgram(program); setCurrentWeek(1); setView('detail'); }}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col"
              >
                  <div className="h-48 relative overflow-hidden bg-slate-800">
                      {program.image ? (
                          <img src={program.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={program.title} />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                          <h3 className="text-xl font-bold text-white mb-1">{program.title}</h3>
                          <div className="flex gap-2">
                              {program.tags?.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">{tag}</span>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{program.description}</p>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-t border-slate-100 pt-3">
                          <span className="flex items-center gap-1"><Calendar size={14}/> {program.durationWeeks} Weeks</span>
                          <button 
                            onClick={(e) => handleDuplicate(e, program)}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                          >
                              <Copy size={14} /> Duplicate
                          </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );

  return (
    <>
      {view === 'list' && renderListView()}
      {view === 'detail' && renderDetailView()}
      {view === 'builder' && renderBuilderView()}

      {/* --- MODALS --- */}

      {/* READ ONLY WORKOUT MODAL */}
      {viewingWorkoutId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-slate-800">{getWorkoutById(viewingWorkoutId)?.title}</h3>
                      <button onClick={() => setViewingWorkoutId(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50">
                              <tr>
                                  <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Exercise</th>
                                  <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Sets</th>
                                  <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Reps</th>
                                  <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Notes</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {getWorkoutById(viewingWorkoutId)?.exercises.map((ex, i) => (
                                  <tr key={i}>
                                      <td className="px-4 py-3 font-medium text-slate-800">{getExerciseById(ex.exerciseId)?.name}</td>
                                      <td className="px-4 py-3 text-slate-600">{ex.sets}</td>
                                      <td className="px-4 py-3 text-slate-600">{ex.reps}</td>
                                      <td className="px-4 py-3 text-sm text-slate-500 italic">{ex.notes || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* ADD DAY MODAL */}
      {addDayContext && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">Select Workout</h3>
                      <button onClick={() => setAddDayContext(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="text" 
                              placeholder="Search library..." 
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={workoutSearchTerm}
                              onChange={(e) => setWorkoutSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {workouts.filter(w => w.title.toLowerCase().includes(workoutSearchTerm.toLowerCase())).map(w => (
                          <button key={w.id} onClick={() => handleConfirmAddDay(w.id)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center group">
                              <div>
                                  <h4 className="font-bold text-slate-800 group-hover:text-indigo-700">{w.title}</h4>
                                  <p className="text-xs text-slate-500">{w.type} • {w.durationMinutes}m</p>
                              </div>
                              <Plus size={18} className="text-slate-300 group-hover:text-indigo-600"/>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* EDIT DAY MODAL */}
      {showEditModal && editingSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <div className="flex items-center gap-4">
                          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">
                              Week {editingSlot.weekNum} • Day {editingSlot.dayIndex + 1}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">Edit Session Plan</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleRemoveDay} className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center gap-2">
                            <Trash2 size={16} /> <span className="text-sm font-medium">Delete Day</span>
                        </button>
                        <button onClick={() => setShowEditModal(false)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                            <X size={20} />
                        </button>
                      </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      {/* Exercise Picker */}
                      <div className="w-1/3 border-r border-slate-100 bg-white flex flex-col">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                             <h3 className="font-bold text-slate-800 mb-3">Exercise Library</h3>
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search exercises..." 
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    value={exerciseSearch}
                                    onChange={(e) => setExerciseSearch(e.target.value)}
                                />
                             </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-2">
                             {exercises.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => (
                                <button key={ex.id} onClick={() => handleAddExerciseToDay(ex)} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-700 text-sm group-hover:text-indigo-700">{ex.name}</span>
                                        <div className="p-1 bg-white rounded-full text-slate-300 group-hover:text-indigo-600 shadow-sm">
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase inline-block">{ex.muscleGroup}</span>
                                    </div>
                                </button>
                             ))}
                          </div>
                      </div>

                      {/* Workout Builder Side */}
                      <div className="flex-1 flex flex-col bg-white">
                          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
                              <div className="flex gap-4">
                                  <div className="w-1/3">
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base Template</label>
                                      <select 
                                          className="w-full p-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none bg-white"
                                          value={editingSlot.currentWorkoutId}
                                          onChange={(e) => handleReplaceWorkoutInSlot(e.target.value)}
                                      >
                                          {workouts.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                                      </select>
                                  </div>
                                  <div className="flex-1">
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Session Title</label>
                                      <input 
                                          type="text" 
                                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm bg-white"
                                          value={sessionTitle}
                                          onChange={(e) => setSessionTitle(e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exercise Order</h4>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={handleUngroup}
                                    disabled={selectedIndices.size === 0}
                                    className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1"
                                  >
                                      <Unlink size={12} /> Ungroup
                                  </button>
                                  <button 
                                    onClick={handleGroupSuperset}
                                    disabled={selectedIndices.size < 2}
                                    className="px-2 py-1 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
                                  >
                                      <Link2 size={12} /> Group Superset
                                  </button>
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-3">
                              {editedExercises.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                      <Dumbbell size={48} className="mb-4 opacity-20" />
                                      <p className="font-medium">No exercises added yet</p>
                                  </div>
                              ) : (
                                  editedExercises.map((item, idx) => {
                                      const def = getExerciseById(item.exerciseId);
                                      const isSelected = selectedIndices.has(idx);
                                      const isSuperset = !!item.supersetId;
                                      const isSupersetStart = isSuperset && (idx === 0 || editedExercises[idx-1].supersetId !== item.supersetId);

                                      return (
                                          <React.Fragment key={idx}>
                                              {isSupersetStart && (
                                                  <div className="mb-1 mt-4 first:mt-0 flex items-center justify-between bg-orange-100 border border-orange-200 rounded-t-lg p-2 px-3">
                                                      <div className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1"><Repeat size={14} /> Superset Group</div>
                                                      <div className="flex gap-4 items-center">
                                                          <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-orange-600 uppercase">Sets</span><input type="number" className="w-10 text-center text-xs font-bold bg-white rounded border border-orange-200 outline-none p-0.5" value={item.sets} onChange={(e) => updateSupersetFields(item.supersetId!, 'sets', parseInt(e.target.value))} /></div>
                                                          <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-orange-600 uppercase">Cycle Rest</span><input type="number" className="w-10 text-center text-xs font-bold bg-white rounded border border-orange-200 outline-none p-0.5" value={editedExercises.find((ex, i) => i >= idx && ex.supersetId === item.supersetId && (i === editedExercises.length - 1 || editedExercises[i+1].supersetId !== item.supersetId))?.restSeconds || 90} onChange={(e) => updateSupersetFields(item.supersetId!, 'restSeconds', parseInt(e.target.value))} /><span className="text-[10px] text-orange-600">s</span></div>
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
                                                  <div onClick={() => handleToggleSelection(idx)} className="mt-1 cursor-pointer text-slate-300 hover:text-indigo-500">{isSelected ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}</div>
                                                  <div className="flex-1">
                                                      <div className="flex justify-between items-start mb-3">
                                                          <div className="flex items-center gap-3">
                                                              <div className="cursor-move text-slate-300 hover:text-slate-500 p-1 hover:bg-slate-50 rounded"><GripVertical size={20}/></div>
                                                              <div><h4 className="font-bold text-slate-800">{def?.name || 'Unknown'}</h4><span className="text-xs text-slate-500 uppercase">{def?.muscleGroup}</span></div>
                                                          </div>
                                                          <button onClick={() => removeExerciseFromDay(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
                                                      </div>
                                                      <div className="grid grid-cols-3 gap-4 pl-8">
                                                          <div>
                                                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sets</label>
                                                              {isSuperset ? 
                                                                <div className="w-full p-1.5 border border-slate-100 bg-slate-50 rounded text-sm font-bold text-center text-slate-400 cursor-not-allowed">{item.sets}</div> 
                                                                : 
                                                                <input type="number" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.sets} onChange={(e) => updateExerciseField(idx, 'sets', parseInt(e.target.value))} />
                                                              }
                                                          </div>
                                                          <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reps</label><input type="text" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.reps} onChange={(e) => updateExerciseField(idx, 'reps', e.target.value)} /></div>
                                                          <div>
                                                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{isSuperset ? 'Inner Rest' : 'Rest (s)'}</label>
                                                              {isSuperset ? 
                                                                <div className="w-full p-1.5 border border-slate-100 bg-slate-50 rounded text-sm font-bold text-center text-slate-400 cursor-not-allowed">{item.restSeconds}s</div> 
                                                                : 
                                                                <input type="number" className="w-full p-1.5 border border-slate-200 rounded text-sm font-bold text-center focus:border-indigo-500 outline-none bg-white" value={item.restSeconds} onChange={(e) => updateExerciseField(idx, 'restSeconds', parseInt(e.target.value))} />
                                                              }
                                                          </div>
                                                      </div>
                                                      <div className="mt-2 pl-8 pr-4">
                                                          <div className="flex items-center gap-2 border-b border-slate-200 pb-1 focus-within:border-indigo-500 transition-colors">
                                                              <Info size={14} className="text-slate-400"/>
                                                              <input type="text" className="w-full text-xs text-slate-600 bg-transparent outline-none placeholder:text-slate-300 placeholder:italic" placeholder="Add notes..." value={item.notes || ''} onChange={(e) => updateExerciseField(idx, 'notes', e.target.value)} />
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </React.Fragment>
                                      );
                                  })
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                      <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                      <button onClick={handleSaveDayChanges} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Save size={18}/> Save Changes</button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default Programs;

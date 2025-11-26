
import React, { useState, useMemo } from 'react';
import { Plus, Search, Sparkles, Loader2, X, Image as ImageIcon, Filter, ChevronLeft, ChevronRight, Maximize2, Info, RefreshCw, Video, Dumbbell } from 'lucide-react';
import { Exercise, MuscleGroup, Difficulty } from '../types';
import { generateNewExercise, generateExerciseImage, generateExerciseVideo } from '../services/geminiService';

interface ExercisesProps {
  exercises: Exercise[];
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 24;

const Exercises: React.FC<ExercisesProps> = ({ exercises, setExercises, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Manual Add / Import State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'import'>('manual');
  
  // View Detail State
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  
  // Manual Form State
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
      name: '',
      description: '',
      muscleGroup: MuscleGroup.CHEST,
      difficulty: Difficulty.BEGINNER,
      equipment: [],
      videoUrl: ''
  });
  const [manualEquipmentInput, setManualEquipmentInput] = useState('');

  // Import State
  const [importJson, setImportJson] = useState('');

  // --- HELPERS FOR PLACEHOLDERS ---
  const getMuscleColor = (muscle: MuscleGroup) => {
      switch(muscle) {
          case MuscleGroup.CHEST: return 'bg-blue-100 text-blue-400';
          case MuscleGroup.BACK: return 'bg-slate-200 text-slate-400';
          case MuscleGroup.LEGS: return 'bg-indigo-100 text-indigo-400';
          case MuscleGroup.ARMS: return 'bg-pink-100 text-pink-400';
          case MuscleGroup.SHOULDERS: return 'bg-orange-100 text-orange-400';
          case MuscleGroup.CORE: return 'bg-emerald-100 text-emerald-400';
          case MuscleGroup.CARDIO: return 'bg-red-100 text-red-400';
          default: return 'bg-gray-100 text-gray-400';
      }
  };

  // --- HANDLERS ---

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newEx = await generateNewExercise(aiPrompt);
      const fullExercise: Exercise = {
        id: `ex-ai-${Date.now()}`,
        name: newEx.name || 'New Exercise',
        description: newEx.description || '',
        muscleGroup: (newEx.muscleGroup as MuscleGroup) || MuscleGroup.FULL_BODY,
        difficulty: (newEx.difficulty as Difficulty) || Difficulty.BEGINNER,
        equipment: newEx.equipment || [],
        videoUrl: '',
      };
      setExercises(prev => [fullExercise, ...prev]);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate exercise: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImageForExercise = async (ex: Exercise) => {
      if (isGeneratingImage || isGeneratingVideo) return;
      setIsGeneratingImage(true);
      try {
          const imageBase64 = await generateExerciseImage(ex.name, ex.description, ex.muscleGroup);
          if (imageBase64) {
              // Update main list
              setExercises(prev => prev.map(e => e.id === ex.id ? { ...e, videoUrl: imageBase64 } : e));
              
              // Update modal view if open
              if (viewingExercise?.id === ex.id) {
                  setViewingExercise(prev => prev ? { ...prev, videoUrl: imageBase64 } : null);
              }
          } else {
              alert("AI completed but returned no image data. Try again later.");
          }
      } catch (e: any) {
          console.error(e);
          alert(`Failed to generate image. Error: ${e.message}. \n\nCommon reasons: \n1. Invalid API Key\n2. Quota Exceeded\n3. Model 'gemini-2.5-flash-image' not enabled.`);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleGenerateVideoForExercise = async (ex: Exercise) => {
      if (isGeneratingVideo || isGeneratingImage) return;
      setIsGeneratingVideo(true);
      try {
          const videoBlobUrl = await generateExerciseVideo(ex.name, ex.description);
          if (videoBlobUrl) {
               setExercises(prev => prev.map(e => e.id === ex.id ? { ...e, videoUrl: videoBlobUrl } : e));
               if (viewingExercise?.id === ex.id) {
                  setViewingExercise(prev => prev ? { ...prev, videoUrl: videoBlobUrl } : null);
               }
          }
      } catch (e: any) {
          console.error(e);
          if (e.message === "API_KEY_SELECTION_REQUIRED") {
              // Trigger key selection if available in environment
              // @ts-ignore
              if (window.aistudio && window.aistudio.openSelectKey) {
                  alert("Veo requires a paid project. Please select a billed API key in the next dialog.");
                  // @ts-ignore
                  await window.aistudio.openSelectKey();
                  return; // User needs to retry after selecting key
              }
          }
          alert(`Failed to generate video: ${e.message}. Veo models require a paid API key.`);
      } finally {
          setIsGeneratingVideo(false);
      }
  };

  const handleManualSubmit = () => {
      if (!newExercise.name || !newExercise.description) {
          alert("Name and description are required");
          return;
      }

      const fullExercise: Exercise = {
          id: `ex-man-${Date.now()}`,
          name: newExercise.name!,
          description: newExercise.description!,
          muscleGroup: newExercise.muscleGroup as MuscleGroup,
          difficulty: newExercise.difficulty as Difficulty,
          equipment: manualEquipmentInput ? manualEquipmentInput.split(',').map(s => s.trim()) : (newExercise.equipment || []),
          videoUrl: newExercise.videoUrl || ''
      };

      setExercises(prev => [fullExercise, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewExercise({
          name: '', description: '', muscleGroup: MuscleGroup.CHEST, difficulty: Difficulty.BEGINNER, equipment: [], videoUrl: ''
      });
      setManualEquipmentInput('');
  };

  const handleImportSubmit = () => {
      try {
          const parsed = JSON.parse(importJson);
          if (!Array.isArray(parsed)) throw new Error("Input must be an array of exercises");
          
          // Basic validation and ID generation
          const validExercises: Exercise[] = parsed.map((e: any, i: number) => ({
              id: e.id || `ex-imp-${Date.now()}-${i}`,
              name: e.name || 'Unknown',
              description: e.description || '',
              muscleGroup: e.muscleGroup || 'Full Body',
              difficulty: e.difficulty || 'Beginner',
              equipment: e.equipment || [],
              videoUrl: e.videoUrl || ''
          }));

          setExercises(prev => [...validExercises, ...prev]);
          setShowAddModal(false);
          setImportJson('');
          alert(`Imported ${validExercises.length} exercises.`);
      } catch (e) {
          alert("Invalid JSON format");
      }
  };

  const filteredExercises = useMemo(() => {
    const filtered = exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
      const matchesDiff = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
      return matchesSearch && matchesMuscle && matchesDiff;
    });
    
    // Explicitly sort alphabetically by Name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, searchTerm, selectedMuscle, selectedDifficulty]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const paginatedExercises = filteredExercises.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
      // Scroll to top of grid
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to check if url is video
  const isVideo = (url?: string) => {
      if (!url) return false;
      return url.includes('blob:') || url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('googlevideo');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Exercise Library</h2>
          <p className="text-slate-500">Manage your database of movements.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
                <Sparkles size={18} />
                <span>AI Generate</span>
            </button>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
                <Plus size={18} />
                <span>Add Exercise</span>
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search exercises..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page on search
              }}
            />
          </div>
          <div className="flex gap-4">
              <div className="relative min-w-[160px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                    value={selectedMuscle}
                    onChange={(e) => {
                        setSelectedMuscle(e.target.value);
                        setCurrentPage(1);
                    }}
                  >
                      <option value="All">All Muscles</option>
                      {Object.values(MuscleGroup).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
              </div>
              <div className="relative min-w-[160px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                    value={selectedDifficulty}
                    onChange={(e) => {
                        setSelectedDifficulty(e.target.value);
                        setCurrentPage(1);
                    }}
                  >
                      <option value="All">All Levels</option>
                      {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {/* Results Stats & Pagination Header */}
      <div className="flex items-center justify-between px-1">
          <div className="text-sm text-slate-500 flex items-center gap-2">
              {isLoading && <Loader2 size={14} className="animate-spin text-indigo-500" />}
              <span>
                 {isLoading ? 'Syncing library from cloud...' : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredExercises.length)} of ${filteredExercises.length} exercises`}
              </span>
          </div>
          
          {totalPages > 1 && (
              <div className="flex gap-2">
                  <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                      <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-slate-700 px-2 flex items-center">
                      Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                      <ChevronRight size={16} />
                  </button>
              </div>
          )}
      </div>

      {/* Grid */}
      {filteredExercises.length === 0 && !isLoading ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500">No exercises found matching your filters.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedExercises.map((ex) => (
            <div 
                key={ex.id} 
                onClick={() => setViewingExercise(ex)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden group flex flex-col h-full cursor-pointer relative"
            >
                <div className={`relative h-48 flex items-center justify-center overflow-hidden border-b border-slate-50 ${getMuscleColor(ex.muscleGroup)}`}>
                    {/* IMAGE OR FALLBACK OR VIDEO PREVIEW */}
                    {ex.videoUrl ? (
                        isVideo(ex.videoUrl) ? (
                             <video src={ex.videoUrl} className="w-full h-full object-cover bg-black" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                        ) : (
                             <img 
                                src={ex.videoUrl} 
                                alt={ex.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover bg-white transition-transform duration-500 group-hover:scale-105" 
                                loading="lazy"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        )
                    ) : null}
                    
                    {/* Fallback Icon / Placeholder */}
                    <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-opacity-10 w-full h-full" 
                        style={{ display: ex.videoUrl ? 'none' : 'flex' }}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/40 flex items-center justify-center mb-2">
                            <ImageIcon size={32} className="opacity-50" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{ex.muscleGroup}</span>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm border border-slate-100 z-10">
                        {ex.difficulty}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 pointer-events-none">
                        <div className="bg-white/90 p-2 rounded-full shadow-lg">
                            <Maximize2 size={20} className="text-slate-700" />
                        </div>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-3 flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">{ex.muscleGroup}</span>
                        {/* Visual Indicator if image/video exists */}
                        {ex.videoUrl && (
                            <span className="text-[10px] text-slate-400" title="Has visual">
                                {isVideo(ex.videoUrl) ? '🎥' : '📸'}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{ex.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{ex.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-auto">
                        {ex.equipment.slice(0, 2).map((eq, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                {eq}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            ))}
          </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
          <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                  <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                      Previous
                  </button>
                  <button 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                      Next
                  </button>
              </div>
          </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewingExercise && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                  {/* Image Section */}
                  <div className={`md:w-1/2 flex items-center justify-center p-4 md:p-8 relative border-r border-slate-100 ${getMuscleColor(viewingExercise.muscleGroup)} bg-opacity-30`}>
                       {viewingExercise.videoUrl ? (
                           <div className="relative w-full h-full flex items-center justify-center group">
                               {isVideo(viewingExercise.videoUrl) ? (
                                   <video 
                                      src={viewingExercise.videoUrl} 
                                      controls 
                                      className="max-w-full max-h-[60vh] shadow-lg rounded-lg bg-black"
                                   />
                               ) : (
                                   <img 
                                       src={viewingExercise.videoUrl} 
                                       alt={viewingExercise.name}
                                       referrerPolicy="no-referrer"
                                       className="max-w-full max-h-[60vh] object-contain shadow-lg rounded-lg bg-white"
                                       onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const fallback = (e.target as HTMLImageElement).parentElement?.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                       }}
                                   />
                               )}
                               {!isVideo(viewingExercise.videoUrl) && (
                                 <div className="absolute bottom-2 right-2 flex gap-2">
                                    <button 
                                            onClick={() => handleGenerateImageForExercise(viewingExercise)}
                                            className="bg-white/90 p-2 rounded-full shadow text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Regenerate Image"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                 </div>
                               )}
                           </div>
                       ) : null}
                       
                       <div 
                            className="flex flex-col items-center text-center text-slate-400 p-10 w-full"
                            style={{ display: viewingExercise.videoUrl ? 'none' : 'flex' }}
                       >
                           <div className="bg-white/50 p-6 rounded-full mb-4">
                               <ImageIcon size={64} className="opacity-50" />
                           </div>
                           <p className="font-bold uppercase tracking-widest text-sm opacity-50 mb-6">No Visual Available</p>
                           <button 
                                onClick={() => handleGenerateImageForExercise(viewingExercise)}
                                className="px-4 py-2 bg-white rounded-lg text-slate-600 font-medium hover:text-indigo-600 shadow-sm"
                           >
                               Retry Image Load
                           </button>
                       </div>

                       {/* Generator Buttons Overlay */}
                       <div className={`absolute bottom-4 flex gap-3 ${viewingExercise.videoUrl && isVideo(viewingExercise.videoUrl) ? 'hidden' : ''}`}>
                           <button 
                                onClick={() => handleGenerateImageForExercise(viewingExercise)}
                                disabled={isGeneratingImage || isGeneratingVideo}
                                className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-lg text-indigo-600 font-bold hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isGeneratingImage ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                                <span>{isGeneratingImage ? 'Generating...' : 'AI Image'}</span>
                            </button>
                            <button 
                                onClick={() => handleGenerateVideoForExercise(viewingExercise)}
                                disabled={isGeneratingVideo || isGeneratingImage}
                                className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl shadow-lg text-white font-bold hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isGeneratingVideo ? <Loader2 className="animate-spin" size={16}/> : <Video size={16} />}
                                <span>{isGeneratingVideo ? 'Generating Video...' : 'Generate AI Video'}</span>
                            </button>
                       </div>

                       <button 
                        onClick={() => setViewingExercise(null)} 
                        className="absolute top-4 right-4 md:hidden p-2 bg-white/80 rounded-full shadow-md"
                       >
                           <X size={24} />
                       </button>
                  </div>

                  {/* Content Section */}
                  <div className="md:w-1/2 flex flex-col bg-white">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                          <div>
                              <div className="flex gap-2 mb-2">
                                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase">{viewingExercise.muscleGroup}</span>
                                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{viewingExercise.difficulty}</span>
                              </div>
                              <h2 className="text-3xl font-bold text-slate-800">{viewingExercise.name}</h2>
                          </div>
                          <button onClick={() => setViewingExercise(null)} className="hidden md:block text-slate-400 hover:text-slate-600">
                              <X size={24} />
                          </button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                          <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Equipment</h4>
                              <div className="flex flex-wrap gap-2">
                                  {viewingExercise.equipment.map(eq => (
                                      <span key={eq} className="px-3 py-1 rounded-full border border-slate-200 text-slate-600 text-sm">
                                          {eq}
                                      </span>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Instructions</h4>
                              <div className="text-slate-600 leading-relaxed space-y-2 text-sm md:text-base">
                                  {viewingExercise.description}
                              </div>
                          </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button 
                            onClick={() => setViewingExercise(null)}
                            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                          >
                              Close
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles size={20} />
                    <h3 className="text-lg font-bold">Generate Exercise</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500">Describe the movement you want to add. The AI will categorize it and provide details.</p>
                <textarea 
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                    placeholder="e.g., A rotational core exercise using a landmine attachment..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                    Generate
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Add Manual/Import Modal */}
      {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800">Add New Exercise</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  
                  <div className="flex border-b border-slate-100">
                      <button 
                        onClick={() => setAddMode('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${addMode === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          Manual Entry
                      </button>
                      <button 
                        onClick={() => setAddMode('import')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${addMode === 'import' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          Import JSON
                      </button>
                  </div>

                  <div className="p-6 overflow-y-auto">
                      {addMode === 'manual' ? (
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Exercise Name</label>
                                  <input type="text" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExercise.name} onChange={(e) => setNewExercise({...newExercise, name: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                  <textarea className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" value={newExercise.description} onChange={(e) => setNewExercise({...newExercise, description: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Muscle Group</label>
                                      <select className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white" value={newExercise.muscleGroup} onChange={(e) => setNewExercise({...newExercise, muscleGroup: e.target.value as MuscleGroup})}>
                                          {Object.values(MuscleGroup).map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                                      <select className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white" value={newExercise.difficulty} onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value as Difficulty})}>
                                          {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipment (comma separated)</label>
                                  <input type="text" placeholder="e.g. Dumbbell, Bench" className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={manualEquipmentInput} onChange={(e) => setManualEquipmentInput(e.target.value)} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Image/GIF URL</label>
                                  <input type="text" placeholder="https://..." className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newExercise.videoUrl} onChange={(e) => setNewExercise({...newExercise, videoUrl: e.target.value})} />
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-start gap-2">
                                  <InfoIcon size={16} className="mt-0.5 flex-shrink-0" />
                                  <p>Paste a JSON array of exercise objects. Required fields: name, description, muscleGroup.</p>
                              </div>
                              <textarea 
                                  className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-64 font-mono text-xs"
                                  placeholder='[{"name": "Squat", ...}]'
                                  value={importJson}
                                  onChange={(e) => setImportJson(e.target.value)}
                              />
                          </div>
                      )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancel</button>
                      <button 
                          onClick={addMode === 'manual' ? handleManualSubmit : handleImportSubmit}
                          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md"
                      >
                          {addMode === 'manual' ? 'Add Exercise' : 'Import Exercises'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper icon since it wasn't imported
const InfoIcon = ({size, className}: {size:number, className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

export default Exercises;

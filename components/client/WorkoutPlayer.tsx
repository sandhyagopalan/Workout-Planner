
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, Exercise } from '../../types';
import { ArrowLeft, Check, Trophy, Dumbbell, Repeat, SkipForward, Clock, Info, BookOpen, ChevronDown, ChevronUp, List, X, Mic, MicOff, Loader2, Zap, Plus, FastForward } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onBack: () => void;
  onComplete: (results: any) => void;
}

interface SetLog {
    weight: string;
    reps: string;
    completed: boolean;
}

interface PlaybackStep {
    exerciseIndex: number;
    setIndex: number;
    isSuperset: boolean;
    roundIndex?: number;
    totalRounds?: number;
}

const WorkoutPlayer: React.FC<Props> = ({ workout, exercises, onBack, onComplete }) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, SetLog[]>>({});
  const [timer, setTimer] = useState({ active: false, timeLeft: 0, totalTime: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  // Voice State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'inactive' | 'connecting' | 'active' | 'error'>('inactive');
  const [lastVoiceAction, setLastVoiceAction] = useState<string | null>(null); // Feedback toast
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  
  // Refs for Voice Logic (Avoid Stale Closures)
  const activeStepRef = useRef(activeStepIndex);
  const workoutLogsRef = useRef(workoutLogs);
  const playbackSequenceRef = useRef<PlaybackStep[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // 1. Generate Sequence (Circuit Logic)
  const playbackSequence = useMemo(() => {
      const sequence: PlaybackStep[] = [];
      let i = 0;
      while (i < workout.exercises.length) {
          const currentEx = workout.exercises[i];
          if (currentEx.supersetId) {
              const groupIndices = [i];
              let j = i + 1;
              while (j < workout.exercises.length && workout.exercises[j].supersetId === currentEx.supersetId) {
                  groupIndices.push(j);
                  j++;
              }
              const maxSets = Math.max(...groupIndices.map(idx => workout.exercises[idx].sets));
              for (let round = 0; round < maxSets; round++) {
                  groupIndices.forEach(exIdx => {
                      if (round < workout.exercises[exIdx].sets) {
                          sequence.push({
                              exerciseIndex: exIdx,
                              setIndex: round,
                              isSuperset: true,
                              roundIndex: round + 1,
                              totalRounds: maxSets
                          });
                      }
                  });
              }
              i = j;
          } else {
              for (let s = 0; s < currentEx.sets; s++) {
                  sequence.push({ exerciseIndex: i, setIndex: s, isSuperset: false });
              }
              i++;
          }
      }
      return sequence;
  }, [workout.exercises]);
  
  // Sync Refs
  useEffect(() => { activeStepRef.current = activeStepIndex; }, [activeStepIndex]);
  useEffect(() => { workoutLogsRef.current = workoutLogs; }, [workoutLogs]);
  useEffect(() => { playbackSequenceRef.current = playbackSequence; }, [playbackSequence]);

  // Clear toast after 3s
  useEffect(() => {
      if (lastVoiceAction) {
          const t = setTimeout(() => setLastVoiceAction(null), 3000);
          return () => clearTimeout(t);
      }
  }, [lastVoiceAction]);

  useEffect(() => {
      const initialLogs: Record<string, SetLog[]> = {};
      workout.exercises.forEach((ex, idx) => {
          initialLogs[idx] = Array(ex.sets).fill(null).map(() => ({
              weight: '', 
              reps: '', 
              completed: false
          }));
      });
      setWorkoutLogs(initialLogs);
  }, [workout.exercises]);

  useEffect(() => {
      let interval: any;
      if (timer.active && timer.timeLeft > 0) {
          interval = setInterval(() => setTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })), 1000);
      } else if (timer.timeLeft === 0 && timer.active) {
          setTimer(prev => ({ ...prev, active: false }));
      }
      return () => clearInterval(interval);
  }, [timer]);

  // Cleanup Voice on Unmount
  useEffect(() => {
      return () => {
          disconnectVoice();
      }
  }, []);

  // Reset description visibility when exercise changes
  useEffect(() => {
      setShowDescription(false);
  }, [activeStepIndex]);

  const currentStep = playbackSequence[activeStepIndex];
  
  const activeExerciseIndex = currentStep?.exerciseIndex ?? 0;
  const activeSetIndex = currentStep?.setIndex ?? 0;

  const currentExerciseData = workout.exercises[activeExerciseIndex];
  const currentExerciseDef = exercises.find(e => e.id === currentExerciseData?.exerciseId);
  const currentLogs = workoutLogs[activeExerciseIndex] || [];

  // Next Step Logic
  const nextStep = playbackSequence[activeStepIndex + 1];
  const nextExerciseData = nextStep ? workout.exercises[nextStep.exerciseIndex] : null;
  const nextExerciseDef = nextExerciseData ? exercises.find(e => e.id === nextExerciseData.exerciseId) : null;
  const isChangingExerciseNext = nextStep && nextStep.exerciseIndex !== activeExerciseIndex;

  const hasMedia = currentExerciseDef?.videoUrl && (currentExerciseDef.videoUrl.length > 5);

  const handleSetUpdate = (setIndex: number, field: 'weight' | 'reps', value: string) => {
      const newLogs = [...currentLogs];
      newLogs[setIndex] = { ...newLogs[setIndex], [field]: value };
      setWorkoutLogs(prev => ({ ...prev, [activeExerciseIndex]: newLogs }));
  };

  const toggleSetComplete = (setIndex: number, autoValues?: { weight: number, reps: number }) => {
      const latestLogs = workoutLogsRef.current[activeExerciseIndex] || [];
      const newLogs = [...latestLogs];
      
      const isCompleting = autoValues ? true : !newLogs[setIndex].completed;
      
      if (isCompleting) {
          if (autoValues) {
              newLogs[setIndex].weight = autoValues.weight.toString();
              newLogs[setIndex].reps = autoValues.reps.toString();
          } else {
              // Defaults if empty
              if (!newLogs[setIndex].reps) newLogs[setIndex].reps = currentExerciseData.reps.replace(/[^0-9]/g, '');
              if (!newLogs[setIndex].weight) newLogs[setIndex].weight = '0'; 
          }
      }

      newLogs[setIndex].completed = isCompleting;
      setWorkoutLogs(prev => ({ ...prev, [activeExerciseIndex]: newLogs }));

      if (isCompleting && setIndex === activeSetIndex) {
          if (currentExerciseData.restSeconds > 0) {
              setTimer({ active: true, timeLeft: currentExerciseData.restSeconds, totalTime: currentExerciseData.restSeconds });
          }
          setTimeout(() => {
              if (activeStepIndex < playbackSequence.length - 1) {
                  setActiveStepIndex(prev => prev + 1);
              } else {
                  setIsFinished(true);
              }
          }, 500);
      }
  };

  const handleSkipSet = () => {
      if (activeStepIndex < playbackSequence.length - 1) {
          setActiveStepIndex(prev => prev + 1);
          setTimer(prev => ({...prev, active: false}));
      } else {
          setIsFinished(true);
      }
  }

  const handleJumpToExercise = (exIndex: number) => {
      const stepIndex = playbackSequence.findIndex(step => step.exerciseIndex === exIndex);
      if (stepIndex !== -1) {
          setActiveStepIndex(stepIndex);
          setShowOverview(false);
      }
  };

  const handleFinish = () => {
      disconnectVoice();
      onComplete({
          date: new Date().toISOString(),
          workoutId: workout.id,
          logs: workoutLogs
      });
  };

  // --- VOICE LOGIC (Keep existing voice logic intact) ---
  // (For brevity, copying the existing logic block from previous response)
  const disconnectVoice = () => {
      if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      if (inputAudioContextRef.current) { inputAudioContextRef.current.close(); inputAudioContextRef.current = null; }
      setVoiceStatus('inactive'); setIsVoiceActive(false); setIsVoiceProcessing(false);
  };

  const toggleVoiceSession = async () => {
      if (isVoiceActive) { disconnectVoice(); return; }
      setVoiceStatus('connecting'); setIsVoiceActive(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = audioContext;
          await audioContext.resume();
          const outputNode = audioContext.createGain();
          outputNode.connect(audioContext.destination);
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const actualSampleRate = inputContext.sampleRate;
          inputAudioContextRef.current = inputContext;
          await inputContext.resume();
          const tools = [{
            functionDeclarations: [
                { name: "logSet", description: "Log weight and reps for the current set.", parameters: { type: Type.OBJECT, properties: { weight: { type: Type.NUMBER, description: "Weight used in kg" }, reps: { type: Type.NUMBER, description: "Number of repetitions" }, }, required: ["weight", "reps"] } },
                { name: "stopSession", description: "Ends the voice logging session immediately.", parameters: { type: Type.OBJECT, properties: {}, } }
            ]
          }];
          const sessionPromise = ai.live.connect({ model: 'gemini-2.5-flash-native-audio-preview-09-2025', config: { tools: tools, systemInstruction: "You are a silent gym logger. Listen for numbers (weight/reps). Call 'logSet' if you hear them. Call 'stopSession' if user says 'stop', 'cancel', 'end', or 'done'. Do not chat.", responseModalities: [Modality.AUDIO], inputAudioTranscription: {} }, callbacks: { onopen: () => { setVoiceStatus('active'); const source = inputContext.createMediaStreamSource(stream); const processor = inputContext.createScriptProcessor(4096, 1, 1); processor.onaudioprocess = (e) => { const inputData = e.inputBuffer.getChannelData(0); const pcmBlob = createBlob(inputData, actualSampleRate); sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob })); }; source.connect(processor); processor.connect(inputContext.destination); sourceRef.current = source; processorRef.current = processor; }, onmessage: async (msg: LiveServerMessage) => { if (msg.toolCall) { setIsVoiceProcessing(true); const functionResponses = []; for (const fc of msg.toolCall.functionCalls) { if (fc.name === 'logSet') { const args = fc.args as any; if (args && typeof args.weight === 'number' && typeof args.reps === 'number') { const currentStepIdx = activeStepRef.current; const sequence = playbackSequenceRef.current; const step = sequence[currentStepIdx]; if (step) { const targetExIndex = step.exerciseIndex; const targetSetIndex = step.setIndex; setWorkoutLogs(prev => { const exerciseLogs = [...(prev[targetExIndex] || [])]; if (exerciseLogs[targetSetIndex]) { exerciseLogs[targetSetIndex] = { ...exerciseLogs[targetSetIndex], weight: args.weight.toString(), reps: args.reps.toString(), completed: true }; } return { ...prev, [targetExIndex]: exerciseLogs }; }); setLastVoiceAction(`Logged: ${args.weight}kg x ${args.reps}`); setTimeout(() => { if (activeStepRef.current < sequence.length - 1) { setActiveStepIndex(prev => prev + 1); } else { setIsFinished(true); } }, 1500); } } functionResponses.push({ name: fc.name, id: fc.id, response: { result: "ok" } }); } else if (fc.name === 'stopSession') { disconnectVoice(); setLastVoiceAction("Voice Session Ended"); functionResponses.push({ name: fc.name, id: fc.id, response: { result: "stopped" } }); } } if (functionResponses.length > 0) { sessionPromise.then(session => session.sendToolResponse({ functionResponses })); } setIsVoiceProcessing(false); } if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) { const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data; const audioBuffer = await decodeAudioData(decode(base64), audioContext, 24000, 1); const source = audioContext.createBufferSource(); source.buffer = audioBuffer; source.connect(outputNode); const now = audioContext.currentTime; nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now); source.start(nextStartTimeRef.current); nextStartTimeRef.current += audioBuffer.duration; } }, onclose: () => { setVoiceStatus('inactive'); setIsVoiceActive(false); }, onerror: (err) => { console.error("Voice Session Error:", err); setVoiceStatus('error'); } } }); sessionRef.current = await sessionPromise; } catch (e) { console.error("Voice Connect Error", e); setVoiceStatus('error'); setIsVoiceActive(false); }
  };
  // ... Audio Helpers ...
  function createBlob(data: Float32Array, sampleRate: number): any { const l = data.length; const int16 = new Int16Array(l); for (let i = 0; i < l; i++) int16[i] = data[i] * 32768; const uint8 = new Uint8Array(int16.buffer); return { data: encode(uint8), mimeType: `audio/pcm;rate=${sampleRate}` }; }
  function encode(bytes: Uint8Array) { let binary = ''; const len = bytes.byteLength; for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]); return btoa(binary); }
  function decode(base64: string) { const binaryString = atob(base64); const len = binaryString.length; const bytes = new Uint8Array(len); for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i); return bytes; }
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> { const dataInt16 = new Int16Array(data.buffer); const frameCount = dataInt16.length / numChannels; const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate); for (let channel = 0; channel < numChannels; channel++) { const channelData = buffer.getChannelData(channel); for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; } } return buffer; }

  // --- RENDER ---

  if (!currentStep && !isFinished) return null;

  const progress = ((activeStepIndex) / playbackSequence.length) * 100;

  if (isFinished) {
      return (
          <div className="flex flex-col items-center justify-center h-full bg-white p-8 text-center animate-in fade-in zoom-in duration-300 font-sans">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mb-6 shadow-lg">
                  <Trophy size={48} fill="currentColor" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Workout Complete!</h1>
              <div className="w-full space-y-4 mt-8">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-bold">Total Sets</span>
                      <span className="text-slate-900 font-black">{Object.values(workoutLogs).flat().filter((l: SetLog) => l.completed).length}</span>
                  </div>
              </div>
              <button onClick={handleFinish} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg mt-auto shadow-xl hover:bg-black transition-colors">Finish & Save</button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-white font-sans relative overflow-hidden">
        {/* Top Bar */}
        <div className="px-4 pt-16 pb-3 flex items-center justify-between bg-white/95 backdrop-blur-sm z-30 border-b border-slate-100 sticky top-0">
            <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full"><ArrowLeft size={20} /></button>
            <button 
                onClick={() => setShowOverview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
            >
                <List size={16} />
                <span>View Full List</span>
            </button>
        </div>
        
        <div className="h-1 w-full bg-slate-100 relative z-20"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>

        {/* Toast Notification */}
        {lastVoiceAction && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl z-50 animate-in slide-in-from-top-4 fade-in font-bold text-sm flex items-center gap-2">
                <Check size={16} /> {lastVoiceAction}
            </div>
        )}

        <div className="flex-1 overflow-y-auto pb-40 scrollbar-hide">
            {/* Media Section */}
            {hasMedia && (
                <div className="h-56 bg-slate-50 relative flex items-center justify-center">
                   {currentExerciseDef.videoUrl?.includes('mp4') || currentExerciseDef.videoUrl?.includes('blob:') ? (
                      <video src={currentExerciseDef.videoUrl} className="max-h-full w-auto object-contain mix-blend-multiply" autoPlay muted loop playsInline />
                   ) : (
                      <img src={currentExerciseDef.videoUrl} className="max-h-full w-auto object-contain mix-blend-multiply" alt={currentExerciseDef?.name} />
                   )}
                </div>
            )}

            {/* Exercise Info */}
            <div className={`px-6 pt-6 mb-4 ${currentStep.isSuperset ? 'bg-gradient-to-b from-orange-50 to-white border-b border-orange-100 pb-6' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    {currentStep.isSuperset ? (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                            <Zap size={12} fill="currentColor" />
                            <span className="font-bold text-[10px] uppercase tracking-wider">Exercise {currentStep.roundIndex} of {currentStep.totalRounds}</span>
                        </div>
                    ) : (
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Set {activeSetIndex + 1} of {currentExerciseData.sets}</span>
                    )}
                    
                    {currentExerciseData.restSeconds > 0 && (
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                            <Clock size={12} /> {currentExerciseData.restSeconds}s Rest
                        </span>
                    )}
                </div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-1">{currentExerciseDef?.name}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded border border-slate-200 uppercase tracking-wider">
                        {currentExerciseDef?.muscleGroup}
                    </span>
                </div>
            </div>

            {/* GUIDANCE */}
            <div className="px-6 mb-6 space-y-3">
                <div className={`p-4 rounded-2xl border ${currentExerciseData.notes ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Info size={14} className={currentExerciseData.notes ? 'text-amber-600' : 'text-slate-400'} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${currentExerciseData.notes ? 'text-amber-700' : 'text-slate-400'}`}>Trainer Notes</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${currentExerciseData.notes ? 'text-amber-900 font-medium' : 'text-slate-400 italic'}`}>
                        {currentExerciseData.notes || "No specific notes added by trainer."}
                    </p>
                </div>

                {currentExerciseDef?.description && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <button 
                            onClick={() => setShowDescription(!showDescription)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-slate-700">
                                <BookOpen size={16} className="text-indigo-600"/>
                                <span className="text-sm font-bold">Instruction Guide</span>
                            </div>
                            {showDescription ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                        </button>
                        {showDescription && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in">
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                    {currentExerciseDef.description}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sets Logger - CLEANER DESIGN */}
            <div className="px-4 space-y-3">
                {/* Table Header */}
                <div className="flex px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <div className="w-12 text-center">Set</div>
                    <div className="flex-1 text-center">Previous</div>
                    <div className="w-20 text-center">Weight</div>
                    <div className="w-20 text-center ml-2">Reps</div>
                    <div className="w-14 ml-2"></div>
                </div>

                {currentLogs.map((log, i) => {
                    const isCurrentSet = i === activeSetIndex;
                    const isCompleted = log.completed;
                    
                    return (
                        <div 
                            key={i} 
                            className={`
                                flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border
                                ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' : isCurrentSet ? 'bg-white border-indigo-500 shadow-lg shadow-indigo-100 scale-[1.02] z-10' : 'bg-white border-slate-100'}
                            `}
                        >
                            {/* Set Badge */}
                            <div className="w-12 flex flex-col items-center justify-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isCurrentSet ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                    {i + 1}
                                </div>
                            </div>

                            {/* Target/Prev */}
                            <div className="flex-1 text-center">
                                <span className="text-xs font-medium text-slate-400 block">-</span>
                            </div>

                            {/* Inputs */}
                            <div className="flex items-center">
                                <input 
                                    type="number" 
                                    placeholder={currentExerciseData.reps.includes('10') ? '0' : '-'}
                                    className={`w-20 h-12 rounded-xl text-center font-bold text-lg outline-none transition-all ${isCurrentSet ? 'bg-slate-50 text-indigo-900 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200' : 'bg-transparent text-slate-400'}`}
                                    value={log.weight}
                                    onChange={(e) => handleSetUpdate(i, 'weight', e.target.value)}
                                    disabled={!isCurrentSet && !isCompleted}
                                />
                                <div className="w-2"></div>
                                <input 
                                    type="number" 
                                    placeholder={currentExerciseData.reps.replace(/[^0-9]/g,'')}
                                    className={`w-20 h-12 rounded-xl text-center font-bold text-lg outline-none transition-all ${isCurrentSet ? 'bg-slate-50 text-indigo-900 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-200' : 'bg-transparent text-slate-400'}`}
                                    value={log.reps}
                                    onChange={(e) => handleSetUpdate(i, 'reps', e.target.value)}
                                    disabled={!isCurrentSet && !isCompleted}
                                />
                            </div>

                            {/* Check Button */}
                            <button 
                                onClick={() => toggleSetComplete(i)}
                                className={`w-14 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ml-2 ${isCompleted ? 'bg-emerald-500 text-white scale-95' : isCurrentSet ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-100 text-slate-300'}`}
                            >
                                <Check size={22} strokeWidth={3} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Up Next Preview */}
        {isChangingExerciseNext && nextExerciseDef && !timer.active && (
            <div className="absolute bottom-24 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-30 animate-in slide-in-from-bottom-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-300 shrink-0">
                    <SkipForward size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Up Next</p>
                    <p className="font-bold text-white truncate text-base">{nextExerciseDef.name}</p>
                </div>
                <button onClick={handleSkipSet} className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200">Skip</button>
            </div>
        )}

        {/* VOICE BUTTON */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-center gap-2">
            {voiceStatus === 'active' && (
                <span className="bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full animate-fade-in">Listening...</span>
            )}
            <button 
                onClick={toggleVoiceSession}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 border-4 border-white ${
                    voiceStatus === 'active' ? 'bg-red-500 text-white animate-pulse' : 
                    voiceStatus === 'connecting' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
                }`}
            >
                {voiceStatus === 'connecting' ? <Loader2 size={28} className="animate-spin" /> : 
                voiceStatus === 'active' ? <Mic size={28} /> : <MicOff size={28} />}
            </button>
        </div>

        {/* Rest Timer - COMPACT FLOATING PILL */}
        {timer.active && (
            <div className="absolute bottom-28 left-4 right-20 z-40 animate-in slide-in-from-bottom-10">
                <div className="relative h-16 rounded-full overflow-hidden shadow-2xl bg-slate-900 border border-slate-700 flex items-center pl-6 pr-2 justify-between">
                    {/* Progress Background */}
                    <div 
                        className="absolute inset-0 bg-slate-800 origin-left transition-transform duration-1000 ease-linear z-0" 
                        style={{ transform: `scaleX(${timer.timeLeft / timer.totalTime})` }} 
                    />
                    
                    {/* Time Display */}
                    <div className="relative z-10 flex items-center gap-3">
                        <Clock size={20} className="text-indigo-400 animate-pulse" />
                        <div>
                            <span className="text-2xl font-black text-white tabular-nums">{timer.timeLeft}</span>
                            <span className="text-xs text-slate-400 font-bold ml-1">s</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="relative z-10 flex gap-1">
                        <button 
                            onClick={() => setTimer(prev => ({ ...prev, timeLeft: prev.timeLeft + 30, totalTime: prev.totalTime + 30 }))}
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                        >
                            <Plus size={16} />
                        </button>
                        <button 
                            onClick={() => setTimer({ ...timer, active: false })}
                            className="px-4 h-10 bg-white text-slate-900 rounded-full text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                        >
                            Skip <FastForward size={12}/>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* OVERVIEW MODAL */}
        {showOverview && (
            <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-10">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Session Glance</h2>
                        <p className="text-xs text-slate-500">{workout.exercises.length} Exercises</p>
                    </div>
                    <button onClick={() => setShowOverview(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {workout.exercises.map((ex, i) => {
                        const def = exercises.find(e => e.id === ex.exerciseId);
                        const logs = workoutLogs[i] || [];
                        const completedSets = logs.filter(l => l.completed).length;
                        const isCurrent = i === activeExerciseIndex;
                        
                        return (
                            <div 
                                key={i}
                                onClick={() => handleJumpToExercise(i)}
                                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${isCurrent ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-sm ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>{def?.name}</h3>
                                    <div className="flex items-center gap-2 text-xs mt-1">
                                        <span className={`px-2 py-0.5 rounded font-medium ${completedSets === ex.sets ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {completedSets} / {ex.sets} Sets
                                        </span>
                                        {ex.supersetId && <span className="text-orange-600 font-bold flex items-center gap-1"><Zap size={10}/> Circuit</span>}
                                    </div>
                                </div>
                                {completedSets === ex.sets && <Check size={20} className="text-green-500" />}
                            </div>
                        )
                    })}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => setIsFinished(true)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg">Finish Workout</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default WorkoutPlayer;


import React, { useState } from 'react';
import { Client } from '../../types';
import { ArrowRight, Check, ChevronLeft, Activity, Heart, User, Brain, Dumbbell } from 'lucide-react';

interface OnboardingProps {
  client: Client;
  onComplete: (data: Partial<Client>) => void;
}

const GOALS = ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "General Health"];
const EXPERIENCE = ["Beginner", "Intermediate", "Advanced"];
const STRESS_LEVELS = ["Low", "Medium", "High"];
const SLEEP_QUALITY = ["Poor", "Fair", "Good"];

const Onboarding: React.FC<OnboardingProps> = ({ client, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Client>>({
    goal: client.goal || GOALS[0],
    age: client.age,
    gender: client.gender,
    height: client.height,
    weight: client.weight,
    experienceLevel: client.experienceLevel,
    injuries: client.injuries || [],
    stressLevel: client.stressLevel,
    sleepQuality: client.sleepQuality,
    trainingDaysPerWeek: client.trainingDaysPerWeek || 3
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete(formData);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (field: keyof Client, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1: // GOALS
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-2 pt-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">What's your <br/><span className="text-indigo-600">main focus?</span></h2>
              <p className="text-slate-500 font-medium">Select your primary training objective.</p>
            </div>
            
            <div className="space-y-3">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => updateField('goal', g)}
                  className={`w-full p-5 rounded-2xl text-left transition-all duration-300 flex items-center justify-between group ${
                    formData.goal === g 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-lg">{g}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${formData.goal === g ? 'border-white bg-white text-indigo-600' : 'border-slate-300'}`}>
                    {formData.goal === g && <Check size={14} strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Current Level</label>
               <div className="grid grid-cols-3 gap-3">
                 {EXPERIENCE.map(ex => (
                   <button
                    key={ex}
                    onClick={() => updateField('experienceLevel', ex)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.experienceLevel === ex 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-200'
                    }`}
                   >
                     {ex}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );
      case 2: // METRICS
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="space-y-2 pt-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Let's get to <br/><span className="text-blue-500">know you.</span></h2>
              <p className="text-slate-500 font-medium">We use these stats to calibrate your plan.</p>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Age</label>
                        <input 
                            type="number" 
                            className="w-full bg-transparent text-2xl font-black text-slate-800 outline-none placeholder:text-slate-300" 
                            placeholder="0"
                            value={formData.age || ''} 
                            onChange={e => updateField('age', parseInt(e.target.value))} 
                        />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                        <select 
                            className="w-full bg-transparent text-xl font-bold text-slate-800 outline-none"
                            value={formData.gender || ''} 
                            onChange={e => updateField('gender', e.target.value)}
                        >
                            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Height</label>
                            <span className="text-sm font-bold text-blue-600">{formData.height} cm</span>
                        </div>
                        <input 
                            type="range" min="120" max="220" 
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={formData.height || 170}
                            onChange={e => updateField('height', parseInt(e.target.value))}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Weight</label>
                            <span className="text-sm font-bold text-blue-600">{formData.weight} kg</span>
                        </div>
                        <input 
                            type="range" min="40" max="150" 
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={formData.weight || 70}
                            onChange={e => updateField('weight', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                {(formData.height && formData.weight) && (
                    <div className="p-5 bg-blue-600 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-blue-200">
                        <div>
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">BMI Score</span>
                            <div className="text-3xl font-black">{(formData.weight / ((formData.height/100) * (formData.height/100))).toFixed(1)}</div>
                        </div>
                        <div className="text-right">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Healthy Range</span>
                        </div>
                    </div>
                )}
            </div>
          </div>
        );
      case 3: // HEALTH
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="space-y-2 pt-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Safety <br/><span className="text-red-500">First.</span></h2>
              <p className="text-slate-500 font-medium">Do you have any existing conditions?</p>
            </div>
            
            <div>
                <div className="relative">
                    <div className="absolute top-4 left-4 text-slate-400">
                        <Heart size={24} />
                    </div>
                    <textarea 
                        className="w-full p-4 pl-12 border-2 border-slate-100 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all text-lg font-medium text-slate-700 placeholder:text-slate-300 h-40 resize-none" 
                        placeholder="Type injuries here (e.g. Lower back pain, recent surgery)..."
                        value={formData.injuries ? formData.injuries.join(', ') : ''}
                        onChange={e => updateField('injuries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    />
                </div>
                
                <div className="mt-4 flex gap-2">
                    {['No Injuries', 'Lower Back', 'Knee Pain', 'Shoulder'].map(tag => (
                        <button 
                            key={tag}
                            onClick={() => {
                                const current = formData.injuries || [];
                                const exists = current.includes(tag);
                                updateField('injuries', exists ? current.filter(t => t !== tag) : [...current, tag]);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                (formData.injuries || []).includes(tag)
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-5 bg-red-50 rounded-2xl border border-red-100 flex gap-4 items-start">
                <Activity className="text-red-500 shrink-0 mt-1" size={20} />
                <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">Medical Clearance</h4>
                    <p className="text-xs text-red-700 leading-relaxed opacity-80">
                        Ensure you have consulted with a physician before starting any new high-intensity training program.
                    </p>
                </div>
            </div>
          </div>
        );
      case 4: // LIFESTYLE
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="space-y-2 pt-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your <br/><span className="text-purple-500">Lifestyle.</span></h2>
              <p className="text-slate-500 font-medium">Tailoring intensity to your daily load.</p>
            </div>
            
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-slate-700">Daily Stress</label>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">{formData.stressLevel || 'Medium'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {STRESS_LEVELS.map(s => (
                            <button key={s} onClick={() => updateField('stressLevel', s)} className={`py-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.stressLevel === s ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 bg-white text-slate-400 hover:border-purple-200'}`}>{s}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-slate-700">Sleep Quality</label>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">{formData.sleepQuality || 'Fair'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {SLEEP_QUALITY.map(s => (
                            <button key={s} onClick={() => updateField('sleepQuality', s)} className={`py-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.sleepQuality === s ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-100 bg-white text-slate-400 hover:border-purple-200'}`}>{s}</button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl">
                    <div className="flex justify-between mb-4">
                        <label className="text-sm font-bold text-slate-700">Weekly Commitment</label>
                        <span className="text-lg font-black text-slate-900">{formData.trainingDaysPerWeek} Days</span>
                    </div>
                    <input 
                        type="range" min="1" max="7" step="1" 
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                        value={formData.trainingDaysPerWeek}
                        onChange={e => updateField('trainingDaysPerWeek', parseInt(e.target.value))}
                    />
                    <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 uppercase">
                        <span>Casual</span>
                        <span>Athlete</span>
                    </div>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans overflow-hidden relative">
      {/* Decorative Blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute top-40 -left-20 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      {/* Header */}
      <div className="p-6 pt-12 flex items-center relative z-10">
        {step > 1 ? (
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 shadow-sm rounded-full text-slate-600 hover:text-slate-900 transition-colors">
                <ChevronLeft size={20} />
            </button>
        ) : (
            <div className="w-10 h-10"></div> // spacer
        )}
        <div className="flex-1 flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 === step ? 'w-8 bg-slate-900' : i + 1 < step ? 'w-2 bg-slate-900' : 'w-2 bg-slate-200'}`} />
            ))}
        </div>
        <div className="w-10 text-right font-bold text-xs text-slate-400">{step}/{totalSteps}</div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 overflow-y-auto scrollbar-hide relative z-10">
        {renderStep()}
      </div>

      {/* Floating Action Button */}
      <div className="p-6 relative z-10 bg-gradient-to-t from-white via-white to-transparent pt-10">
        <button 
            onClick={handleNext}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
        >
            <span>{step === totalSteps ? 'Create My Plan' : 'Continue'}</span>
            {step !== totalSteps && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;


import React, { useState } from 'react';
import { Client, BodyMeasurements } from '../../types';
import { User, Settings, ChevronRight, Scale, Ruler, Activity, Calendar, History, Trophy, Edit2, Save, Target, ImageIcon, Plus, Trash2, CheckCircle2, ClipboardList } from 'lucide-react';

interface Props {
  client: Client;
  onUpdate: (data: Partial<Client>) => void;
}

const ClientProfile: React.FC<Props> = ({ client, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Biometrics State
  const [weight, setWeight] = useState(client.weight || 70);
  const [bodyFat, setBodyFat] = useState(client.bodyFat || 0);
  
  // New Measurement Log State
  const [showLogMeasurement, setShowLogMeasurement] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurements>>({
      weight: client.weight,
      bodyFat: client.bodyFat
  });

  const bmi = client.weight && client.height ? (client.weight / ((client.height / 100) * (client.height / 100))).toFixed(1) : '-';
  const completedWorkouts = client.workoutLogs?.length || 0;

  const handleSaveBiometrics = () => {
    onUpdate({ 
        weight, 
        bodyFat,
    });
    setIsEditing(false);
  };

  const handleLogMeasurement = () => {
      const entry: BodyMeasurements = {
          date: new Date().toISOString().split('T')[0],
          ...newMeasurement
      };
      
      const newHistory = [...(client.measurementHistory || []), entry];
      
      onUpdate({
          measurementHistory: newHistory,
          // Update current snapshot as well
          weight: newMeasurement.weight || client.weight,
          bodyFat: newMeasurement.bodyFat || client.bodyFat
      });
      
      setShowLogMeasurement(false);
      setNewMeasurement({ weight: client.weight, bodyFat: client.bodyFat }); // Reset
  };

  // Calculate Progress Logic (Mock start for now)
  const startWeight = 75; 
  const targetWeight = client.targetWeight || 65;
  const totalLossNeeded = Math.abs(startWeight - targetWeight);
  const currentLoss = Math.abs(startWeight - weight);
  const progressPercent = Math.min(100, Math.max(0, (currentLoss / totalLossNeeded) * 100));

  return (
    <div className="bg-slate-50 min-h-full pb-32 font-sans animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="bg-white pt-16 pb-8 px-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl font-black text-indigo-600">
              {client.name.charAt(0)}
            </div>
          </div>
          <button 
            onClick={() => isEditing ? handleSaveBiometrics() : setIsEditing(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 ${isEditing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            {isEditing ? <Save size={16}/> : <Edit2 size={16}/>}
            {isEditing ? 'Save Bio' : 'Edit Bio'}
          </button>
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-1">{client.name}</h1>
        <p className="text-slate-500 font-medium flex items-center gap-2">
          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Member</span>
          since 2023
        </p>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900">{completedWorkouts}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workouts</div>
          </div>
          <div className="text-center border-l border-slate-100">
            <div className="text-2xl font-black text-slate-900">12</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Streak</div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        
        {/* Vitals Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
            <Activity size={20} className="text-emerald-500" /> Bio-Metrics
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Scale size={14} /> Weight
              </div>
              <div className="flex items-end gap-1">
                {isEditing ? (
                  <input 
                    type="number" 
                    className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xl font-black text-slate-900 outline-none focus:border-indigo-500"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-900">{client.weight}</span>
                )}
                <span className="text-sm font-bold text-slate-400 mb-1">kg</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                <Activity size={14} /> Body Fat
              </div>
              <div className="flex items-end gap-1">
                {isEditing ? (
                  <input 
                    type="number" 
                    className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xl font-black text-slate-900 outline-none focus:border-indigo-500"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(parseFloat(e.target.value))}
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-900">{client.bodyFat || '-'}</span>
                )}
                <span className="text-sm font-bold text-slate-400 mb-1">%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl text-white flex justify-between items-center">
            <span className="text-sm font-medium text-slate-300">BMI Score</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black">{bmi}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase">Healthy</span>
            </div>
          </div>
        </div>

        {/* Measurements & Progress */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Ruler size={20} className="text-cyan-500"/> Progress</h3>
                <button onClick={() => setShowLogMeasurement(!showLogMeasurement)} className="text-indigo-600 text-xs font-bold uppercase flex items-center gap-1 hover:text-indigo-700">
                    <Plus size={16}/> Log Entry
                </button>
            </div>

            {showLogMeasurement && (
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">New Measurement Entry (cm)</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="number" placeholder="Weight (kg)" className="p-2 rounded border text-sm" value={newMeasurement.weight || ''} onChange={e => setNewMeasurement({...newMeasurement, weight: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Body Fat %" className="p-2 rounded border text-sm" value={newMeasurement.bodyFat || ''} onChange={e => setNewMeasurement({...newMeasurement, bodyFat: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Chest" className="p-2 rounded border text-sm" value={newMeasurement.chest || ''} onChange={e => setNewMeasurement({...newMeasurement, chest: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Waist" className="p-2 rounded border text-sm" value={newMeasurement.waist || ''} onChange={e => setNewMeasurement({...newMeasurement, waist: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Hips" className="p-2 rounded border text-sm col-span-2" value={newMeasurement.hips || ''} onChange={e => setNewMeasurement({...newMeasurement, hips: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Left Arm" className="p-2 rounded border text-sm" value={newMeasurement.armLeft || ''} onChange={e => setNewMeasurement({...newMeasurement, armLeft: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Right Arm" className="p-2 rounded border text-sm" value={newMeasurement.armRight || ''} onChange={e => setNewMeasurement({...newMeasurement, armRight: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Left Thigh" className="p-2 rounded border text-sm" value={newMeasurement.thighLeft || ''} onChange={e => setNewMeasurement({...newMeasurement, thighLeft: parseFloat(e.target.value)})} />
                        <input type="number" placeholder="Right Thigh" className="p-2 rounded border text-sm" value={newMeasurement.thighRight || ''} onChange={e => setNewMeasurement({...newMeasurement, thighRight: parseFloat(e.target.value)})} />
                    </div>
                    <button onClick={handleLogMeasurement} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm">Save Entry</button>
                </div>
            )}

            <div className="space-y-3">
                {client.measurementHistory && client.measurementHistory.length > 0 ? (
                    [...client.measurementHistory].reverse().slice(0, 3).map((m, i) => (
                        <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-500">{m.date}</span>
                                <span className="text-sm font-black text-slate-800">{m.weight}kg</span>
                            </div>
                            <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
                                {m.armRight && <span>Arms: {m.armLeft}/{m.armRight}</span>}
                                {m.thighRight && <span>Thighs: {m.thighLeft}/{m.thighRight}</span>}
                                {m.waist && <span>Waist: {m.waist}</span>}
                            </div>
                        </div>
                    ))
                ) : <p className="text-center text-slate-400 text-sm py-4">No measurements recorded.</p>}
            </div>
        </div>

        {/* Goals Summary (Simplified) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Target size={20} className="text-indigo-500"/> Objective</h3>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl mb-2">
                <span className="text-sm font-bold text-slate-500">Primary Focus</span>
                <span className="text-sm font-black text-indigo-900">{client.goal}</span>
            </div>
            {/* Link to Questionnaire */}
            <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full flex justify-between items-center text-sm font-bold text-slate-600 group">
                    <span className="flex items-center gap-2"><ClipboardList size={16}/> View Intake Form</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600"/>
                </button>
            </div>
        </div>

        {/* Transformation Gallery */}
        <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 px-1 flex items-center gap-2"><ImageIcon size={20} className="text-purple-500"/> Transformation</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-slate-200 rounded-2xl relative overflow-hidden flex items-center justify-center group">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Start</span>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Day 1</div>
                </div>
                <div className="aspect-[3/4] bg-slate-100 rounded-2xl relative overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Plus size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">Add Current</span>
                </div>
            </div>
        </div>

        {/* History List */}
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-4 px-1 flex items-center gap-2">
            <History size={20} className="text-orange-500" /> Workout History
          </h3>
          
          <div className="space-y-3">
            {client.workoutLogs && client.workoutLogs.length > 0 ? (
              [...client.workoutLogs].reverse().slice(0, 5).map((log, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Workout Completed</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <p>No workouts completed yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

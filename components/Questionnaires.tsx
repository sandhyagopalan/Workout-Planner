import React, { useState } from 'react';
import { Questionnaire } from '../types';
import { Plus, FileText, Sparkles, Loader2, Copy, Send } from 'lucide-react';
import { generateQuestionnaire } from '../services/geminiService';

interface Props {
  questionnaires: Questionnaire[]; // In a real app, this would be state passed down
}

const Questionnaires: React.FC<Props> = () => {
  // Local state for demo
  const [forms, setForms] = useState<Questionnaire[]>([
    {
      id: 'q-1',
      title: 'New Client Intake',
      questions: [
        { id: '1', text: 'Any medical conditions?', type: 'text' },
        { id: '2', text: 'Current activity level?', type: 'select', options: ['Sedentary', 'Active', 'Athlete'] }
      ]
    }
  ]);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const result = await generateQuestionnaire(topic);
      if (result.questions) {
        const newForm: Questionnaire = {
          id: `q-${Date.now()}`,
          title: result.title || topic,
          questions: result.questions as any
        };
        setForms(prev => [newForm, ...prev]);
        setTopic('');
      }
    } catch (e) {
      alert('Failed to generate questionnaire');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="max-w-2xl mx-auto text-center space-y-4">
         <h2 className="text-3xl font-bold text-slate-800">Client Questionnaires</h2>
         <p className="text-slate-500">Create intake forms and check-ins instantly with AI.</p>
         
         <div className="relative flex items-center max-w-lg mx-auto mt-6">
            <input 
              type="text"
              placeholder="e.g., 'Weekly check-in for weight loss client'..."
              className="w-full pl-4 pr-32 py-4 rounded-full border border-slate-200 shadow-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Create
            </button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
         {forms.map(form => (
           <div key={form.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                   <FileText size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800">{form.title}</h3>
                    <span className="text-xs text-slate-500">{form.questions.length} questions</span>
                 </div>
               </div>
             </div>

             <div className="space-y-3 mb-6">
               {form.questions.slice(0, 3).map((q, i) => (
                 <div key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-slate-100">
                   {q.text}
                 </div>
               ))}
               {form.questions.length > 3 && <div className="text-xs text-slate-400 italic pl-4">...and more</div>}
             </div>

             <div className="flex gap-3 border-t border-slate-50 pt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <Copy size={16} /> Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                  <Send size={16} /> Send to Client
                </button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default Questionnaires;

import React, { useState, useRef } from 'react';
import { Questionnaire, Question } from '../types';
import { Plus, FileText, Sparkles, Loader2, Copy, Send, GripVertical, Trash2, Save, ArrowLeft, Type, List, CheckSquare, Hash, X, Edit2, Calendar, AlignLeft, CheckCircle2 } from 'lucide-react';
import { generateQuestionnaire } from '../services/geminiService';

interface Props {
  questionnaires: Questionnaire[];
  setQuestionnaires: React.Dispatch<React.SetStateAction<Questionnaire[]>>;
}

type BuilderMode = 'create' | 'edit';

const Questionnaires: React.FC<Props> = ({ questionnaires, setQuestionnaires }) => {
  const [view, setView] = useState<'list' | 'builder'>('list');
  
  // --- Builder State ---
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // DnD Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Actions ---

  const handleCreateNew = () => {
    setBuilderId(null);
    setBuilderTitle('Untitled Questionnaire');
    setBuilderQuestions([]);
    setView('builder');
  };

  const handleEdit = (form: Questionnaire) => {
    setBuilderId(form.id);
    setBuilderTitle(form.title);
    setBuilderQuestions(JSON.parse(JSON.stringify(form.questions))); // Deep copy
    setView('builder');
  };

  const handleSave = () => {
    if (!builderTitle.trim()) {
        alert("Please enter a title");
        return;
    }
    if (builderQuestions.length === 0) {
        alert("Please add at least one question");
        return;
    }

    const newForm: Questionnaire = {
        id: builderId || `q-${Date.now()}`,
        title: builderTitle,
        questions: builderQuestions
    };

    if (builderId) {
        setQuestionnaires(prev => prev.map(f => f.id === builderId ? newForm : f));
    } else {
        setQuestionnaires(prev => [newForm, ...prev]);
    }
    setView('list');
  };

  const handleDeleteForm = (id: string) => {
      if (window.confirm("Delete this questionnaire?")) {
          setQuestionnaires(prev => prev.filter(f => f.id !== id));
      }
  };

  // --- Builder Logic ---

  const addQuestion = (type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'multiselect' | 'textarea') => {
      const newQ: Question = {
          id: `qk-${Date.now()}`,
          text: '',
          type,
          options: (type === 'select' || type === 'multiselect') ? ['Option 1', 'Option 2'] : undefined
      };
      setBuilderQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
      const updated = [...builderQuestions];
      updated[index] = { ...updated[index], [field]: value };
      setBuilderQuestions(updated);
  };

  const removeQuestion = (index: number) => {
      const updated = [...builderQuestions];
      updated.splice(index, 1);
      setBuilderQuestions(updated);
  };

  // Option Handling for Select inputs
  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
      const updated = [...builderQuestions];
      if (updated[qIndex].options) {
          updated[qIndex].options![optIndex] = value;
          setBuilderQuestions(updated);
      }
  };

  const addOption = (qIndex: number) => {
      const updated = [...builderQuestions];
      if (updated[qIndex].options) {
          updated[qIndex].options!.push(`Option ${updated[qIndex].options!.length + 1}`);
          setBuilderQuestions(updated);
      }
  };

  const removeOption = (qIndex: number, optIndex: number) => {
      const updated = [...builderQuestions];
      if (updated[qIndex].options && updated[qIndex].options!.length > 1) {
          updated[qIndex].options!.splice(optIndex, 1);
          setBuilderQuestions(updated);
      }
  };

  // DnD Logic
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _questions = [...builderQuestions];
    const draggedItemContent = _questions.splice(dragItem.current, 1)[0];
    _questions.splice(dragOverItem.current, 0, draggedItemContent);
    setBuilderQuestions(_questions);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleGenerateAI = async () => {
      if (!aiTopic) return;
      setIsGenerating(true);
      try {
          const res = await generateQuestionnaire(aiTopic);
          if (res.title) setBuilderTitle(res.title);
          if (res.questions) {
              const mappedQuestions = res.questions.map((q: any) => ({
                  ...q,
                  id: q.id || `ai-${Math.random()}`,
                  type: ['text', 'number', 'boolean', 'select', 'date'].includes(q.type) ? q.type : 'text'
              }));
              setBuilderQuestions(prev => [...prev, ...mappedQuestions]);
          }
          setAiTopic('');
      } catch (e) {
          alert("AI Generation failed. Try a simpler topic.");
      } finally {
          setIsGenerating(false);
      }
  };

  // --- Renderers ---

  if (view === 'builder') {
      return (
          <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                      <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Form Title</label>
                          <input 
                            type="text" 
                            className="text-xl font-bold text-slate-800 outline-none border-b border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent w-full transition-colors"
                            value={builderTitle}
                            onChange={(e) => setBuilderTitle(e.target.value)}
                            placeholder="Untitled Questionnaire"
                          />
                      </div>
                  </div>
                  <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2">
                      <Save size={18} /> Save Form
                  </button>
              </div>

              <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Canvas */}
                  <div className="flex-1 overflow-y-auto pr-2 pb-20">
                      
                      {/* AI Helper Block */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 mb-6 flex gap-4 items-center">
                          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Sparkles size={20}/></div>
                          <div className="flex-1">
                              <h4 className="text-sm font-bold text-indigo-900">AI Assistant</h4>
                              <input 
                                type="text" 
                                placeholder="Describe questions to add (e.g. 'Post-workout recovery check-in')..." 
                                className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-indigo-200 outline-none"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                              />
                          </div>
                          <button onClick={handleGenerateAI} disabled={isGenerating || !aiTopic} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
                              {isGenerating ? <Loader2 className="animate-spin" size={16}/> : 'Generate'}
                          </button>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-4">
                          {builderQuestions.length === 0 ? (
                              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                                  <FileText className="mx-auto text-slate-300 mb-2" size={48} />
                                  <p className="text-slate-400 font-medium">Form is empty. Add questions below.</p>
                              </div>
                          ) : (
                              builderQuestions.map((q, idx) => (
                                  <div 
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => { dragItem.current = idx; e.currentTarget.style.opacity = '0.5'; }}
                                    onDragEnter={(e) => (dragOverItem.current = idx)}
                                    onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; handleSort(); }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative"
                                  >
                                      {/* Header: Grip & Delete */}
                                      <div className="flex items-start gap-3 mb-3">
                                          <div className="cursor-move text-slate-300 hover:text-slate-600 p-1 mt-1"><GripVertical size={20} /></div>
                                          <div className="flex-1">
                                              <input 
                                                type="text" 
                                                className="w-full font-medium text-slate-800 outline-none placeholder:text-slate-300 bg-transparent"
                                                placeholder="Enter question here..."
                                                value={q.text}
                                                onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                              />
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <div className="relative">
                                                  <select 
                                                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg py-1 pl-3 pr-8 text-xs font-bold text-slate-600 uppercase tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100"
                                                    value={q.type}
                                                    onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                                                  >
                                                      <option value="text">Text Answer</option>
                                                      <option value="textarea">Long Text</option>
                                                      <option value="number">Number</option>
                                                      <option value="boolean">Yes / No</option>
                                                      <option value="select">Multiple Choice</option>
                                                      <option value="multiselect">Checkboxes (Multi)</option>
                                                      <option value="date">Date</option>
                                                  </select>
                                                  <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                              </div>
                                              <button onClick={() => removeQuestion(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><X size={18}/></button>
                                          </div>
                                      </div>

                                      {/* Body: Type Specific Preview */}
                                      <div className="pl-9 pr-2">
                                          {q.type === 'text' && (
                                              <div className="w-full p-2 bg-slate-50 border border-slate-100 rounded text-slate-400 text-sm italic cursor-not-allowed">Client will type answer here...</div>
                                          )}
                                          {q.type === 'textarea' && (
                                              <div className="w-full h-20 p-2 bg-slate-50 border border-slate-100 rounded text-slate-400 text-sm italic cursor-not-allowed">Client will type long answer here...</div>
                                          )}
                                          {q.type === 'number' && (
                                              <div className="w-32 p-2 bg-slate-50 border border-slate-100 rounded text-slate-400 text-sm italic flex justify-between items-center cursor-not-allowed">
                                                  <span>0</span>
                                                  <Hash size={14}/>
                                              </div>
                                          )}
                                          {q.type === 'date' && (
                                              <div className="w-48 p-2 bg-slate-50 border border-slate-100 rounded text-slate-400 text-sm italic flex justify-between items-center cursor-not-allowed">
                                                  <span>YYYY-MM-DD</span>
                                                  <Calendar size={14}/>
                                              </div>
                                          )}
                                          {q.type === 'boolean' && (
                                              <div className="flex gap-4">
                                                  <div className="flex items-center gap-2 opacity-50"><div className="w-4 h-4 rounded-full border border-slate-300"></div> <span className="text-sm text-slate-500">Yes</span></div>
                                                  <div className="flex items-center gap-2 opacity-50"><div className="w-4 h-4 rounded-full border border-slate-300"></div> <span className="text-sm text-slate-500">No</span></div>
                                              </div>
                                          )}
                                          {(q.type === 'select' || q.type === 'multiselect') && (
                                              <div className="space-y-2">
                                                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{q.type === 'multiselect' ? 'Checkboxes' : 'Dropdown / Radio'}</div>
                                                  {q.options?.map((opt, oIdx) => (
                                                      <div key={oIdx} className="flex items-center gap-2">
                                                          <div className={`w-4 h-4 border border-slate-300 shrink-0 ${q.type === 'multiselect' ? 'rounded-sm' : 'rounded-full'}`}></div>
                                                          <input 
                                                            type="text" 
                                                            className="flex-1 text-sm text-slate-600 bg-slate-50 border-b border-transparent focus:border-indigo-300 outline-none px-2 py-1 rounded hover:bg-white transition-colors"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                                                          />
                                                          {q.options!.length > 1 && (
                                                              <button onClick={() => removeOption(idx, oIdx)} className="text-slate-300 hover:text-red-400"><X size={14}/></button>
                                                          )}
                                                      </div>
                                                  ))}
                                                  <button onClick={() => addOption(idx)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 px-1">
                                                      <Plus size={12}/> Add Option
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Right: Toolbox */}
                  <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-4 h-fit sticky top-0">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Types</h3>
                      <button onClick={() => addQuestion('text')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <Type size={18} className="text-slate-400 group-hover:text-indigo-500"/> Text Answer
                      </button>
                      <button onClick={() => addQuestion('textarea')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <AlignLeft size={18} className="text-slate-400 group-hover:text-indigo-500"/> Long Text
                      </button>
                      <button onClick={() => addQuestion('number')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <Hash size={18} className="text-slate-400 group-hover:text-indigo-500"/> Number Input
                      </button>
                      <button onClick={() => addQuestion('select')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <List size={18} className="text-slate-400 group-hover:text-indigo-500"/> Single Choice
                      </button>
                      <button onClick={() => addQuestion('multiselect')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <CheckCircle2 size={18} className="text-slate-400 group-hover:text-indigo-500"/> Multiple Choice
                      </button>
                      <button onClick={() => addQuestion('boolean')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <CheckSquare size={18} className="text-slate-400 group-hover:text-indigo-500"/> Yes / No
                      </button>
                      <button onClick={() => addQuestion('date')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-slate-700 hover:text-indigo-700 transition-all text-sm font-medium group">
                          <Calendar size={18} className="text-slate-400 group-hover:text-indigo-500"/> Date
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // List view...
  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-bold text-slate-800">Questionnaires</h2>
            <p className="text-slate-500">Create intake forms and check-ins.</p>
         </div>
         <button onClick={handleCreateNew} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
             <Plus size={18} /> New Form
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
         {questionnaires.map(form => (
           <div key={form.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative" onClick={() => handleEdit(form)}>
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                   <FileText size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{form.title}</h3>
                    <span className="text-xs text-slate-500">{form.questions.length} questions</span>
                 </div>
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => {e.stopPropagation(); handleDeleteForm(form.id)}} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
               </div>
             </div>

             <div className="space-y-2 mb-6">
               {form.questions.slice(0, 3).map((q, i) => (
                 <div key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-slate-100 truncate">
                   {q.text}
                 </div>
               ))}
               {form.questions.length > 3 && <div className="text-[10px] text-slate-400 italic pl-3">+ {form.questions.length - 3} more</div>}
             </div>

             <div className="flex gap-3 border-t border-slate-50 pt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                    onClick={(e) => {e.stopPropagation(); alert("Link copied to clipboard!")}}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Send size={14} /> Send
                </button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

const ChevronDownIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
)

export default Questionnaires;

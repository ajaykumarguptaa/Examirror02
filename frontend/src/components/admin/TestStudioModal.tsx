import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Check,
  Eye,
  Edit3,
  Languages,
  Smartphone,
  Monitor,
  ImageIcon,
  Upload,
  Plus,
  Trash2,
  Clock,
  Award,
  Layers,
  ChevronRight,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import axios from 'axios';

export interface QuestionData {
  id?: number | string;
  test_id: number | string;
  question_text: string;
  section_name: string;
  question_type: string;
  explanation: string;
  marks: number;
  negative_marks: number;
  image_url?: string;
  options: {
    option_key: string;
    option_text: string;
    image_url?: string;
    is_correct: boolean;
  }[];
  metadata?: any;
  // Bilingual extensions
  question_text_hi?: string;
  explanation_hi?: string;
  options_hi?: { option_key: string; option_text: string }[];
  difficulty?: 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
  target_time_seconds?: number;
  bloom_level?: string;
  hint?: string;
  columnA?: string[];
  columnB?: string[];
  itemsToOrder?: string[];
  imageUrls?: string[];
  numerical_range?: { min: number; max: number };
}

interface TestStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTest: any;
  editingQuestion: any | null;
  onSaveSuccess: () => void;
  showToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const TestStudioModal: React.FC<TestStudioModalProps> = ({
  isOpen,
  onClose,
  activeTest,
  editingQuestion,
  onSaveSuccess,
  showToast
}) => {
  // Mode selection: 'EDITOR' | 'BILINGUAL' | 'SIMULATOR'
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'BILINGUAL' | 'SIMULATOR'>('EDITOR');
  const [simulatorDevice, setSimulatorDevice] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [simulatorLang, setSimulatorLang] = useState<'EN' | 'HI'>('EN');
  const [simulatorSelectedOption, setSimulatorSelectedOption] = useState<string | null>(null);

  // Active focused input tracking for math toolbar insertion
  const [activeInputRef, setActiveInputRef] = useState<{
    field: string;
    index?: number;
  }>({ field: 'question_text' });

  // State initialization
  const [form, setForm] = useState<QuestionData>(() => {
    if (editingQuestion) {
      let meta: any = {};
      try {
        meta = typeof editingQuestion.metadata === 'string'
          ? JSON.parse(editingQuestion.metadata || '{}')
          : (editingQuestion.metadata || {});
      } catch (_) {
        meta = {};
      }

      const qImages: string[] = Array.isArray(meta?.imageUrls)
        ? meta.imageUrls
        : (editingQuestion.image_url ? [editingQuestion.image_url] : []);

      let opts = [
        { option_key: 'A', option_text: '', image_url: '', is_correct: true },
        { option_key: 'B', option_text: '', image_url: '', is_correct: false },
        { option_key: 'C', option_text: '', image_url: '', is_correct: false },
        { option_key: 'D', option_text: '', image_url: '', is_correct: false }
      ];

      if (Array.isArray(editingQuestion.options) && editingQuestion.options.length > 0) {
        opts = editingQuestion.options.map((o: any) => ({
          option_key: o.option_key || 'A',
          option_text: o.option_text || '',
          image_url: o.image_url || '',
          is_correct: o.is_correct === 1 || o.is_correct === true
        }));
      }

      const colA = Array.isArray(meta?.columnA) && meta.columnA.length > 0 ? [...meta.columnA] : ['', '', '', ''];
      while (colA.length < 4) colA.push('');
      const colB = Array.isArray(meta?.columnB) && meta.columnB.length > 0 ? [...meta.columnB] : ['', '', '', ''];
      while (colB.length < 4) colB.push('');
      const items = Array.isArray(meta?.itemsToOrder) && meta.itemsToOrder.length > 0 ? [...meta.itemsToOrder] : ['', '', '', ''];
      while (items.length < 4) items.push('');

      return {
        id: editingQuestion.id,
        test_id: activeTest?.id,
        question_text: editingQuestion.question_text || '',
        section_name: editingQuestion.section_name || 'General Assessment',
        question_type: editingQuestion.question_type || 'SINGLE_CHOICE',
        explanation: editingQuestion.explanation || '',
        marks: Number(editingQuestion.marks) || 2.0,
        negative_marks: Number(editingQuestion.negative_marks) || 0.5,
        image_url: editingQuestion.image_url || '',
        options: opts,
        metadata: meta,
        question_text_hi: meta?.question_text_hi || '',
        explanation_hi: meta?.explanation_hi || '',
        difficulty: meta?.difficulty || 'MODERATE',
        target_time_seconds: meta?.target_time_seconds || 60,
        bloom_level: meta?.bloom_level || 'Conceptual Understanding',
        hint: meta?.hint || '',
        columnA: colA,
        columnB: colB,
        itemsToOrder: items,
        imageUrls: qImages,
        numerical_range: meta?.numerical_range || { min: 0, max: 0 }
      };
    }

    return {
      test_id: activeTest?.id,
      question_text: '',
      section_name: 'General Assessment',
      question_type: 'SINGLE_CHOICE',
      explanation: '',
      marks: 2.0,
      negative_marks: 0.5,
      image_url: '',
      options: [
        { option_key: 'A', option_text: '', image_url: '', is_correct: true },
        { option_key: 'B', option_text: '', image_url: '', is_correct: false },
        { option_key: 'C', option_text: '', image_url: '', is_correct: false },
        { option_key: 'D', option_text: '', image_url: '', is_correct: false }
      ],
      question_text_hi: '',
      explanation_hi: '',
      difficulty: 'MODERATE',
      target_time_seconds: 60,
      bloom_level: 'Conceptual Understanding',
      hint: '',
      columnA: ['', '', '', ''],
      columnB: ['', '', '', ''],
      itemsToOrder: ['', '', '', ''],
      imageUrls: [],
      numerical_range: { min: 0, max: 0 }
    };
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingOptionKey, setUploadingOptionKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Math / Science formula snippets
  const mathToolSnippets = [
    { label: 'Fraction (a/b)', formula: '$\\frac{a}{b}$' },
    { label: 'Square Root', formula: '$\\sqrt{x}$' },
    { label: 'Power (x²)', formula: '$x^{2}$' },
    { label: 'Subscript (xₙ)', formula: '$x_{n}$' },
    { label: 'Degree (°)', formula: '$30^\\circ$' },
    { label: 'Plus-Minus', formula: '$\\pm$' },
    { label: 'Infinity', formula: '$\\infty$' },
    { label: 'Integral', formula: '$\\int_{a}^{b} f(x)\\,dx$' },
    { label: 'Summation', formula: '$\\sum_{i=1}^{n} x_i$' },
    { label: 'Limit', formula: '$\\lim_{x \\to 0}$' },
    { label: 'Greek π', formula: '$\\pi$' },
    { label: 'Greek θ', formula: '$\\theta$' },
    { label: 'Greek α', formula: '$\\alpha$' },
    { label: 'Greek β', formula: '$\\beta$' },
    { label: 'Delta Δ', formula: '$\\Delta$' },
    { label: 'Reaction →', formula: '$\\rightarrow$' },
    { label: 'Equilibrium ⇌', formula: '$\\rightleftharpoons$' },
    { label: 'Water H₂O', formula: '$\\text{H}_2\\text{O}$' },
    { label: 'Bold', formula: '**Text**' },
    { label: 'Code', formula: '`code`' }
  ];

  // Helper to insert formula into the currently focused field
  const insertFormula = (snippet: string) => {
    if (activeInputRef.field === 'question_text') {
      setForm((prev) => ({
        ...prev,
        question_text: (prev.question_text || '') + (prev.question_text ? ' ' : '') + snippet
      }));
    } else if (activeInputRef.field === 'question_text_hi') {
      setForm((prev) => ({
        ...prev,
        question_text_hi: (prev.question_text_hi || '') + (prev.question_text_hi ? ' ' : '') + snippet
      }));
    } else if (activeInputRef.field === 'explanation') {
      setForm((prev) => ({
        ...prev,
        explanation: (prev.explanation || '') + (prev.explanation ? ' ' : '') + snippet
      }));
    } else if (activeInputRef.field === 'explanation_hi') {
      setForm((prev) => ({
        ...prev,
        explanation_hi: (prev.explanation_hi || '') + (prev.explanation_hi ? ' ' : '') + snippet
      }));
    } else if (activeInputRef.field === 'hint') {
      setForm((prev) => ({
        ...prev,
        hint: (prev.hint || '') + (prev.hint ? ' ' : '') + snippet
      }));
    } else if (activeInputRef.field === 'option' && activeInputRef.index !== undefined) {
      setForm((prev) => {
        const updated = [...prev.options];
        if (updated[activeInputRef.index!]) {
          updated[activeInputRef.index!].option_text =
            (updated[activeInputRef.index!].option_text || '') +
            (updated[activeInputRef.index!].option_text ? ' ' : '') +
            snippet;
        }
        return { ...prev, options: updated };
      });
    }
  };

  // Upload Question Figure
  const handleUploadQuestionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/admin/questions/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setForm((prev) => ({
          ...prev,
          image_url: res.data.url,
          imageUrls: prev.imageUrls?.length ? [...prev.imageUrls, res.data.url] : [res.data.url]
        }));
        showToast('success', 'Question diagram uploaded');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Upload Option Diagram
  const handleUploadOptionImage = async (optKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingOptionKey(optKey);
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/admin/questions/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setForm((prev) => ({
          ...prev,
          options: prev.options.map((opt) =>
            opt.option_key === optKey ? { ...opt, image_url: res.data.url } : opt
          )
        }));
        showToast('success', `Option ${optKey} diagram uploaded`);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingOptionKey(null);
      e.target.value = '';
    }
  };

  // Add / Remove Option
  const handleAddOption = () => {
    if (form.options.length >= 6) {
      showToast('info', 'Maximum 6 options supported');
      return;
    }
    const nextKey = String.fromCharCode(65 + form.options.length);
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { option_key: nextKey, option_text: '', image_url: '', is_correct: false }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    if (form.options.length <= 2) {
      showToast('error', 'Minimum 2 options required');
      return;
    }
    const updated = form.options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      option_key: String.fromCharCode(65 + i)
    }));
    setForm((prev) => ({ ...prev, options: updated }));
  };

  // Save / Update Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTest?.id) return;

    if (!form.question_text.trim()) {
      showToast('error', 'Question statement is required');
      return;
    }

    // Validation for question types
    if (form.question_type === 'SINGLE_CHOICE' || form.question_type === 'IMAGE_MCQ' || form.question_type === 'ASSERTION_REASON') {
      const hasCorrect = form.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        showToast('error', 'Please mark at least one correct option');
        return;
      }
    }

    try {
      setIsSaving(true);
      const isMatch = form.question_type === 'MATCH_FOLLOWING';
      const isSequence = form.question_type === 'SEQUENCE_ORDER' || form.question_type === 'ARRANGE_ORDER';

      const metadataPayload: any = {
        difficulty: form.difficulty,
        target_time_seconds: form.target_time_seconds,
        bloom_level: form.bloom_level,
        hint: form.hint,
        question_text_hi: form.question_text_hi,
        explanation_hi: form.explanation_hi,
        numerical_range: form.numerical_range
      };

      if (form.imageUrls && form.imageUrls.length > 0) {
        metadataPayload.imageUrls = form.imageUrls;
      }
      if (isMatch) {
        metadataPayload.columnA = form.columnA?.filter((x) => x && x.trim()) || [];
        metadataPayload.columnB = form.columnB?.filter((x) => x && x.trim()) || [];
      }
      if (isSequence) {
        metadataPayload.itemsToOrder = form.itemsToOrder?.filter((x) => x && x.trim()) || [];
      }

      const payload = {
        ...form,
        test_id: activeTest.id,
        metadata: metadataPayload
      };

      if (form.id) {
        await axios.put(`/api/admin/questions/${form.id}`, payload);
        showToast('success', 'Question updated in TestStudio');
      } else {
        await axios.post('/api/admin/questions', payload);
        showToast('success', 'Question created in TestStudio');
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* ============================================================ */}
        {/* TESTSTUDIO HEADER BAR */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  TestStudio Pro
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase">
                  KaTeX Live v2.5
                </span>
                {form.id ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    Editing ID #{form.id}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    New Question
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                Test: <span className="text-white font-medium">{activeTest?.title || 'Active Test'}</span>
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveTab('EDITOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'EDITOR'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Edit3 size={13} />
              <span>Studio Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BILINGUAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BILINGUAL'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Languages size={13} />
              <span>Bilingual (हिंदी)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SIMULATOR'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Eye size={13} />
              <span>Candidate Simulator</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ============================================================ */}
        {/* KATEX & FORMULA QUICK INSERT TOOLBAR */}
        {/* ============================================================ */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles size={11} className="text-indigo-600" /> Math Snippets:
          </span>
          {mathToolSnippets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => insertFormula(item.formula)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 font-medium text-[11px] shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs"
              title={`Insert ${item.formula}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY AREA */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'EDITOR' && (
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Row 1: Question Type, Subject Section, Difficulty, Target Time */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Question Type</label>
                  <select
                    value={form.question_type}
                    onChange={(e) => setForm({ ...form, question_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-xs outline-none focus:border-indigo-600"
                  >
                    <option value="SINGLE_CHOICE">Single Choice MCQ</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Multi-Select)</option>
                    <option value="IMAGE_MCQ">Image / Diagram MCQ</option>
                    <option value="NUMERICAL_NAT">Numerical / Integer (NAT)</option>
                    <option value="ASSERTION_REASON">Assertion & Reason</option>
                    <option value="MATCH_FOLLOWING">Match The Following</option>
                    <option value="SEQUENCE_ORDER">Sequence / Ordering</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Section / Subject</label>
                  <input
                    type="text"
                    value={form.section_name}
                    onChange={(e) => setForm({ ...form, section_name: e.target.value })}
                    placeholder="e.g. Physics, Quantitative Aptitude"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1 flex items-center justify-between">
                    <span>Difficulty</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">{form.difficulty}</span>
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e: any) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold outline-none focus:border-indigo-600"
                  >
                    <option value="EASY">🟢 Easy</option>
                    <option value="MODERATE">🟡 Moderate</option>
                    <option value="HARD">🟠 Hard</option>
                    <option value="EXPERT">🔴 Expert (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">Marks (+ / -)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.25"
                      value={form.marks}
                      onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl text-center font-bold text-emerald-600 text-xs outline-none focus:border-indigo-600"
                      placeholder="+Marks"
                    />
                    <input
                      type="number"
                      step="0.25"
                      value={form.negative_marks}
                      onChange={(e) => setForm({ ...form, negative_marks: Number(e.target.value) })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl text-center font-bold text-rose-500 text-xs outline-none focus:border-indigo-600"
                      placeholder="-Neg"
                    />
                  </div>
                </div>
              </div>

              {/* Question Statement Canvas with Live KaTeX Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Question Statement (Supports Markdown & KaTeX formulas like <code className="text-indigo-600">{'$x^2$'}</code> or <code className="text-indigo-600">{'$$\\frac{a}{b}$$'}</code>) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Click snippet above to insert formulas</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <textarea
                      rows={4}
                      required
                      value={form.question_text}
                      onFocus={() => setActiveInputRef({ field: 'question_text' })}
                      onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                      placeholder="Write complete question prompt here... e.g. What is the value of $\int_0^\pi \sin(x)\,dx$?"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-2xl outline-none focus:border-indigo-600 text-xs font-mono leading-relaxed bg-slate-50/50"
                    />
                  </div>

                  {/* Live Rendered Statement Preview */}
                  <div className="p-3 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 rounded-2xl border border-indigo-100 min-h-[96px] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase mb-1 block">
                      Live Statement Preview:
                    </span>
                    <div className="text-xs text-slate-900 font-medium leading-relaxed">
                      {form.question_text ? (
                        <MathRenderer content={form.question_text} />
                      ) : (
                        <span className="text-slate-400 italic">Rendered math equations will appear here instantly...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagram / Supporting Figure Attachment */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-600" />
                    <span>Question Diagram / Experimental Setup (Optional)</span>
                  </span>
                  <label className="px-3 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95">
                    <Upload size={13} />
                    <span>{isUploadingImage ? 'Uploading...' : 'Upload Diagram'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={handleUploadQuestionImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="Or enter direct image URL (/uploads/... or https://...)"
                    className="flex-grow px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-indigo-600"
                  />
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2.5 py-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {form.image_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-24 h-18 rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs">
                      <img src={form.image_url} alt="Figure preview" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[11px] text-slate-500">Figure will be displayed above options to students.</span>
                  </div>
                )}
              </div>

              {/* Numerical Value NAT (If type is NUMERICAL_NAT) */}
              {form.question_type === 'NUMERICAL_NAT' && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <Award size={14} className="text-emerald-700" />
                    <span>Numerical Answer Type (NAT) Accepted Range / Value:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Candidate will enter a numerical value using on-screen virtual keypad. Any value between Min and Max will be marked correct.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Minimum Accepted Value</label>
                      <input
                        type="number"
                        step="any"
                        value={form.numerical_range?.min || 0}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            numerical_range: {
                              min: Number(e.target.value),
                              max: form.numerical_range?.max ?? Number(e.target.value)
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Maximum Accepted Value</label>
                      <input
                        type="number"
                        step="any"
                        value={form.numerical_range?.max || 0}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            numerical_range: {
                              min: form.numerical_range?.min ?? Number(e.target.value),
                              max: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Options Management Canvas (For MCQs) */}
              {form.question_type !== 'NUMERICAL_NAT' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Answer Options ({form.question_type === 'MULTIPLE_CHOICE' ? 'Multi-select' : 'Select Radio for Correct Answer'}):
                    </span>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus size={13} />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.options.map((opt, idx) => {
                      const isMulti = form.question_type === 'MULTIPLE_CHOICE';

                      return (
                        <div
                          key={opt.option_key}
                          className={`p-3 rounded-2xl border transition-all ${
                            opt.is_correct
                              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isMulti ? (
                              <input
                                type="checkbox"
                                checked={opt.is_correct}
                                onChange={(e) => {
                                  const updated = [...form.options];
                                  updated[idx].is_correct = e.target.checked;
                                  setForm({ ...form, options: updated });
                                }}
                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                              />
                            ) : (
                              <input
                                type="radio"
                                name="correct_option_radio"
                                checked={opt.is_correct}
                                onChange={() => {
                                  const updated = form.options.map((o, i) => ({
                                    ...o,
                                    is_correct: i === idx
                                  }));
                                  setForm({ ...form, options: updated });
                                }}
                                className="w-4 h-4 text-emerald-600 cursor-pointer accent-emerald-600"
                              />
                            )}

                            <span
                              className={`w-6 text-center font-extrabold text-xs ${
                                opt.is_correct ? 'text-emerald-700 font-mono' : 'text-slate-700'
                              }`}
                            >
                              {opt.option_key}.
                            </span>

                            <input
                              type="text"
                              value={opt.option_text}
                              onFocus={() => setActiveInputRef({ field: 'option', index: idx })}
                              onChange={(e) => {
                                const updated = [...form.options];
                                updated[idx].option_text = e.target.value;
                                setForm({ ...form, options: updated });
                              }}
                              placeholder={`Option ${opt.option_key} statement (Supports LaTeX $...$)`}
                              className="flex-grow px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-indigo-600 font-medium"
                            />

                            {/* Option Diagram Upload */}
                            <label
                              className="p-1.5 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors shrink-0"
                              title="Attach Diagram to Option"
                            >
                              <ImageIcon size={14} />
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingOptionKey === opt.option_key}
                                onChange={(e) => handleUploadOptionImage(opt.option_key, e)}
                                className="hidden"
                              />
                            </label>

                            {/* Remove Option Button */}
                            {form.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx)}
                                className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Option"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {/* Live Math Preview inside Option (if option contains math) */}
                          {opt.option_text && (opt.option_text.includes('$') || opt.image_url) && (
                            <div className="mt-2 ml-8 pl-1 flex items-center justify-between text-xs text-slate-800 bg-white/70 p-2 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-600">Preview:</span>
                                <MathRenderer content={opt.option_text} inline />
                              </div>

                              {opt.image_url && (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-9 rounded border border-slate-300 overflow-hidden bg-white">
                                    <img src={opt.image_url} alt="Option" className="w-full h-full object-contain" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...form.options];
                                      updated[idx].image_url = '';
                                      setForm({ ...form, options: updated });
                                    }}
                                    className="text-rose-500 text-[10px] font-bold hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Solution & Explanation */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-800 text-xs">
                  Detailed Answer Solution & Derivation (Supports KaTeX formulas)
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <textarea
                    rows={3}
                    value={form.explanation}
                    onFocus={() => setActiveInputRef({ field: 'explanation' })}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Provide step-by-step formula derivation, explanation or reasoning..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-2xl outline-none focus:border-indigo-600 text-xs font-mono bg-slate-50/50"
                  />
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[72px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Rendered Solution:
                    </span>
                    <div className="text-xs text-slate-800">
                      {form.explanation ? (
                        <MathRenderer content={form.explanation} />
                      ) : (
                        <span className="text-slate-400 italic">Solution preview will display here...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Check size={14} />
                  <span>{isSaving ? 'Saving...' : form.id ? 'Update in TestStudio' : 'Save Question'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: BILINGUAL DUAL LANGUAGE (HINDI) */}
          {/* ============================================================ */}
          {activeTab === 'BILINGUAL' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <Languages size={15} className="text-purple-600" />
                    <span>Dual-Language (Bilingual) Authoring</span>
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    Provide Hindi (हिंदी) version of the question. Candidates can toggle between English and Hindi during the actual exam.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* English Reference Column */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">English Version (Primary):</span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 min-h-[90px]">
                    <MathRenderer content={form.question_text || '(Empty Question)'} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 block pt-1">English Solution:</span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                    <MathRenderer content={form.explanation || '(Empty Solution)'} />
                  </div>
                </div>

                {/* Hindi Input Column */}
                <div className="p-4 bg-white rounded-2xl border border-purple-200 space-y-3 shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      प्रश्न का हिंदी अनुवाद (Hindi Question Text) *
                    </label>
                    <textarea
                      rows={4}
                      value={form.question_text_hi}
                      onFocus={() => setActiveInputRef({ field: 'question_text_hi' })}
                      onChange={(e) => setForm({ ...form, question_text_hi: e.target.value })}
                      placeholder="यहाँ हिंदी में प्रश्न लिखें... e.g. निम्नलिखित में से कौन सा सत्य है?"
                      className="w-full px-3 py-2 border border-purple-200 rounded-xl text-xs outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      हिंदी समाधान (Hindi Solution Explanation)
                    </label>
                    <textarea
                      rows={3}
                      value={form.explanation_hi}
                      onFocus={() => setActiveInputRef({ field: 'explanation_hi' })}
                      onChange={(e) => setForm({ ...form, explanation_hi: e.target.value })}
                      placeholder="विस्तृत हिंदी व्याख्या..."
                      className="w-full px-3 py-2 border border-purple-200 rounded-xl text-xs outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('EDITOR')}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-indigo-700"
                >
                  Return to Studio Editor
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: REAL-TIME CANDIDATE SIMULATOR */}
          {/* ============================================================ */}
          {activeTab === 'SIMULATOR' && (
            <div className="space-y-4">
              {/* Simulator Controls */}
              <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Interactive Candidate View:
                  </span>
                  <span className="text-[11px] text-slate-400">Test how questions render on candidate screens</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Switch */}
                  <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSimulatorLang('EN')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        simulatorLang === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorLang('HI')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        simulatorLang === 'HI' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>

                  {/* Device Switch */}
                  <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSimulatorDevice('DESKTOP')}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        simulatorDevice === 'DESKTOP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Desktop View"
                    >
                      <Monitor size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorDevice('MOBILE')}
                      className={`p-1.5 rounded-lg text-xs transition-all ${
                        simulatorDevice === 'MOBILE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendered Container */}
              <div className="flex justify-center p-3 bg-slate-100 rounded-3xl min-h-[420px]">
                <div
                  className={`bg-white rounded-3xl shadow-xl border border-slate-200 transition-all ${
                    simulatorDevice === 'MOBILE'
                      ? 'w-[360px] p-4 border-8 border-slate-800 rounded-[38px] shadow-2xl'
                      : 'w-full p-6'
                  }`}
                >
                  {/* Candidate Screen Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-indigo-700">Q1.</span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                        {form.section_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="text-emerald-600">+{form.marks}</span>
                      <span>/</span>
                      <span className="text-rose-500">-{form.negative_marks}</span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="py-4 space-y-3">
                    <div className="text-slate-900 font-semibold text-sm leading-relaxed">
                      <MathRenderer
                        content={
                          simulatorLang === 'HI' && form.question_text_hi
                            ? form.question_text_hi
                            : form.question_text || 'No question statement provided yet.'
                        }
                      />
                    </div>

                    {form.image_url && (
                      <div className="my-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex justify-center">
                        <img src={form.image_url} alt="Question Diagram" className="max-h-56 object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {form.options.map((opt) => {
                      const isSelected = simulatorSelectedOption === opt.option_key;

                      return (
                        <div
                          key={opt.option_key}
                          onClick={() => setSimulatorSelectedOption(opt.option_key)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {opt.option_key}
                            </div>
                            <span className="text-xs text-slate-800 font-medium">
                              <MathRenderer content={opt.option_text || '(Empty option)'} inline />
                            </span>
                          </div>

                          {opt.image_url && (
                            <img src={opt.image_url} alt="Option" className="w-12 h-9 object-contain rounded" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Simulator Controls & Answer Reveal */}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSimulatorSelectedOption(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <span className="text-[11px] text-slate-400">Candidate Test Simulation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestStudioModal;

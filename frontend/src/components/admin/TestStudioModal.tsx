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
  Maximize2,
  BookOpen,
  ListOrdered,
  AlertCircle,
  FileText,
  Zap,
  AlignLeft
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
  // Advanced competitive exam structures
  assertion?: string;
  reason?: string;
  statement1?: string;
  statement2?: string;
  passage?: string;
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
        numerical_range: meta?.numerical_range || { min: 0, max: 0 },
        assertion: meta?.assertion || '',
        reason: meta?.reason || '',
        statement1: meta?.statement1 || '',
        statement2: meta?.statement2 || '',
        passage: meta?.passage || ''
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
      numerical_range: { min: 0, max: 0 },
      assertion: '',
      reason: '',
      statement1: '',
      statement2: '',
      passage: ''
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

  // Quick Presets for Competitive Exam Patterns (NEET, JEE, UPSC, SSC, Banking)
  const applyAssertionReasonPreset = (correctKey: 'A' | 'B' | 'C' | 'D') => {
    setForm((prev) => ({
      ...prev,
      question_type: 'ASSERTION_REASON',
      question_text:
        prev.question_text ||
        'Given below are two statements: one is labelled as Assertion (A) and the other is labelled as Reason (R). In light of the above statements, choose the most appropriate answer from the options given below:',
      options: [
        {
          option_key: 'A',
          option_text: 'Both (A) and (R) are true and (R) is the correct explanation of (A)',
          image_url: '',
          is_correct: correctKey === 'A'
        },
        {
          option_key: 'B',
          option_text: 'Both (A) and (R) are true but (R) is NOT the correct explanation of (A)',
          image_url: '',
          is_correct: correctKey === 'B'
        },
        {
          option_key: 'C',
          option_text: '(A) is true but (R) is false',
          image_url: '',
          is_correct: correctKey === 'C'
        },
        {
          option_key: 'D',
          option_text: '(A) is false but (R) is true',
          image_url: '',
          is_correct: correctKey === 'D'
        }
      ]
    }));
    showToast('info', `Loaded standard Assertion-Reason options with (${correctKey}) marked correct`);
  };

  const applyStatementPreset = (correctKey: 'A' | 'B' | 'C' | 'D') => {
    setForm((prev) => ({
      ...prev,
      question_type: 'STATEMENT_ANALYSIS',
      question_text:
        prev.question_text ||
        'Given below are two statements: Statement I and Statement II. In light of the above statements, choose the correct answer from the options given below:',
      options: [
        {
          option_key: 'A',
          option_text: 'Both Statement I and Statement II are correct',
          image_url: '',
          is_correct: correctKey === 'A'
        },
        {
          option_key: 'B',
          option_text: 'Both Statement I and Statement II are incorrect',
          image_url: '',
          is_correct: correctKey === 'B'
        },
        {
          option_key: 'C',
          option_text: 'Statement I is correct but Statement II is incorrect',
          image_url: '',
          is_correct: correctKey === 'C'
        },
        {
          option_key: 'D',
          option_text: 'Statement I is incorrect but Statement II is correct',
          image_url: '',
          is_correct: correctKey === 'D'
        }
      ]
    }));
    showToast('info', `Loaded Statement I & II options with (${correctKey}) marked correct`);
  };

  const applyMatchCodesPreset = () => {
    setForm((prev) => ({
      ...prev,
      question_type: 'MATCH_FOLLOWING',
      question_text:
        prev.question_text ||
        'Match List-I with List-II and select the correct answer using the codes given below the lists:',
      options: [
        { option_key: 'A', option_text: 'A-(i), B-(ii), C-(iii), D-(iv)', image_url: '', is_correct: true },
        { option_key: 'B', option_text: 'A-(ii), B-(i), C-(iv), D-(iii)', image_url: '', is_correct: false },
        { option_key: 'C', option_text: 'A-(iii), B-(iv), C-(i), D-(ii)', image_url: '', is_correct: false },
        { option_key: 'D', option_text: 'A-(iv), B-(iii), C-(ii), D-(i)', image_url: '', is_correct: false }
      ]
    }));
    showToast('info', 'Loaded standard matching code options template');
  };

  const applyTrueFalsePreset = (isTrue: boolean) => {
    setForm((prev) => ({
      ...prev,
      question_type: 'TRUE_FALSE',
      options: [
        { option_key: 'A', option_text: 'True', image_url: '', is_correct: isTrue },
        { option_key: 'B', option_text: 'False', image_url: '', is_correct: !isTrue }
      ]
    }));
    showToast('info', `Applied True/False with (${isTrue ? 'True' : 'False'}) marked correct`);
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
    if (
      form.question_type === 'SINGLE_CHOICE' ||
      form.question_type === 'IMAGE_MCQ' ||
      form.question_type === 'ASSERTION_REASON' ||
      form.question_type === 'STATEMENT_ANALYSIS' ||
      form.question_type === 'MATCH_FOLLOWING' ||
      form.question_type === 'SEQUENCE_ORDER' ||
      form.question_type === 'TRUE_FALSE'
    ) {
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

      if (form.assertion) metadataPayload.assertion = form.assertion;
      if (form.reason) metadataPayload.reason = form.reason;
      if (form.statement1) metadataPayload.statement1 = form.statement1;
      if (form.statement2) metadataPayload.statement2 = form.statement2;
      if (form.passage) metadataPayload.passage = form.passage;

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
                    <option value="ASSERTION_REASON">Assertion & Reason (A & R)</option>
                    <option value="STATEMENT_ANALYSIS">Statement I & II Analysis</option>
                    <option value="MATCH_FOLLOWING">Match The Following (Column I & II)</option>
                    <option value="SEQUENCE_ORDER">Sequence / Chronological Order</option>
                    <option value="CASE_STUDY">Case Study / Reading Comprehension</option>
                    <option value="NUMERICAL_NAT">Numerical / Integer (NAT)</option>
                    <option value="IMAGE_MCQ">Image / Diagram MCQ</option>
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

              {/* ============================================================ */}
              {/* SPECIALIZED COMPETITIVE EXAM CANVAS: ASSERTION & REASON */}
              {/* ============================================================ */}
              {form.question_type === 'ASSERTION_REASON' && (
                <div className="p-4 bg-gradient-to-br from-amber-50/70 via-white to-indigo-50/40 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        A/R
                      </span>
                      <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wide">
                        Assertion & Reason Builder Canvas (NEET / JEE / UPSC Format)
                      </span>
                    </div>

                    {/* Presets Bar */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Zap size={11} className="text-amber-500" /> Presets:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyAssertionReasonPreset('A')}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="Both (A) & (R) true, (R) is correct explanation"
                      >
                        (A) True + Correct Expl.
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAssertionReasonPreset('B')}
                        className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="Both (A) & (R) true, (R) NOT correct explanation"
                      >
                        (B) True + Not Expl.
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAssertionReasonPreset('C')}
                        className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="(A) is true, (R) is false"
                      >
                        (C) A True, R False
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAssertionReasonPreset('D')}
                        className="px-2 py-0.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="(A) is false, (R) is true"
                      >
                        (D) A False, R True
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Assertion (A) */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded font-black">A</span>
                          <span>Assertion (A) Statement *</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Supports KaTeX ($...$)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={form.assertion || ''}
                        onFocus={() => setActiveInputRef({ field: 'assertion' })}
                        onChange={(e) => setForm({ ...form, assertion: e.target.value })}
                        placeholder="e.g. A body moving with uniform velocity has zero acceleration."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-amber-500 font-mono bg-amber-50/20"
                      />
                      {form.assertion && (
                        <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-100 text-xs text-slate-800">
                          <span className="text-[10px] font-bold text-amber-700 block mb-0.5">Preview:</span>
                          <MathRenderer content={form.assertion} />
                        </div>
                      )}
                    </div>

                    {/* Reason (R) */}
                    <div className="p-3 bg-white rounded-xl border border-indigo-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded font-black">R</span>
                          <span>Reason (R) Statement *</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Supports KaTeX ($...$)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={form.reason || ''}
                        onFocus={() => setActiveInputRef({ field: 'reason' })}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        placeholder="e.g. Acceleration is the time rate of change of velocity ($a = \frac{dv}{dt}$)."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono bg-indigo-50/20"
                      />
                      {form.reason && (
                        <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-slate-800">
                          <span className="text-[10px] font-bold text-indigo-700 block mb-0.5">Preview:</span>
                          <MathRenderer content={form.reason} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SPECIALIZED COMPETITIVE EXAM CANVAS: STATEMENT I & II */}
              {/* ============================================================ */}
              {form.question_type === 'STATEMENT_ANALYSIS' && (
                <div className="p-4 bg-gradient-to-br from-purple-50/70 via-white to-teal-50/40 rounded-2xl border-2 border-purple-300 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        S1/2
                      </span>
                      <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wide">
                        Statement I & Statement II Analysis Canvas
                      </span>
                    </div>

                    {/* Presets Bar */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Zap size={11} className="text-purple-600" /> Presets:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyStatementPreset('A')}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        (A) Both S1 & S2 Correct
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatementPreset('B')}
                        className="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        (B) Both Incorrect
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatementPreset('C')}
                        className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        (C) S1 Correct, S2 Incorrect
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatementPreset('D')}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-300 rounded-md text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        (D) S1 Incorrect, S2 Correct
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Statement I */}
                    <div className="p-3 bg-white rounded-xl border border-purple-200/90 shadow-2xs space-y-2">
                      <label className="text-[11px] font-extrabold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-black">S1</span>
                        <span>Statement I *</span>
                      </label>
                      <textarea
                        rows={3}
                        value={form.statement1 || ''}
                        onFocus={() => setActiveInputRef({ field: 'statement1' })}
                        onChange={(e) => setForm({ ...form, statement1: e.target.value })}
                        placeholder="e.g. Electric potential inside a hollow charged spherical conductor is constant."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-purple-500 font-mono bg-purple-50/20"
                      />
                      {form.statement1 && (
                        <div className="p-2 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-slate-800">
                          <span className="text-[10px] font-bold text-purple-700 block mb-0.5">Preview:</span>
                          <MathRenderer content={form.statement1} />
                        </div>
                      )}
                    </div>

                    {/* Statement II */}
                    <div className="p-3 bg-white rounded-xl border border-teal-200/90 shadow-2xs space-y-2">
                      <label className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px] rounded font-black">S2</span>
                        <span>Statement II *</span>
                      </label>
                      <textarea
                        rows={3}
                        value={form.statement2 || ''}
                        onFocus={() => setActiveInputRef({ field: 'statement2' })}
                        onChange={(e) => setForm({ ...form, statement2: e.target.value })}
                        placeholder="e.g. The electric field inside a charged conductor is always zero."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-teal-500 font-mono bg-teal-50/20"
                      />
                      {form.statement2 && (
                        <div className="p-2 bg-teal-50/50 rounded-lg border border-teal-100 text-xs text-slate-800">
                          <span className="text-[10px] font-bold text-teal-700 block mb-0.5">Preview:</span>
                          <MathRenderer content={form.statement2} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SPECIALIZED COMPETITIVE EXAM CANVAS: MATCH THE FOLLOWING */}
              {/* ============================================================ */}
              {form.question_type === 'MATCH_FOLLOWING' && (
                <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-2xl border-2 border-indigo-300 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" />
                      <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wide">
                        Match List-I with List-II Authoring Canvas
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={applyMatchCodesPreset}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1"
                    >
                      <Zap size={11} />
                      <span>⚡ Load Standard Matching Code Options</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* List I / Column A */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-indigo-200">
                      <span className="text-xs font-extrabold text-indigo-900 uppercase block tracking-wider">
                        List I (Column A)
                      </span>
                      {['A', 'B', 'C', 'D'].map((lbl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {lbl}
                          </span>
                          <input
                            type="text"
                            value={form.columnA?.[idx] || ''}
                            onChange={(e) => {
                              const updated = [...(form.columnA || ['', '', '', ''])];
                              updated[idx] = e.target.value;
                              setForm({ ...form, columnA: updated });
                            }}
                            placeholder={`Item (${lbl}) statement or formula...`}
                            className="flex-grow px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-600 font-medium"
                          />
                        </div>
                      ))}
                    </div>

                    {/* List II / Column B */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-indigo-200">
                      <span className="text-xs font-extrabold text-indigo-900 uppercase block tracking-wider">
                        List II (Column B)
                      </span>
                      {['(i)', '(ii)', '(iii)', '(iv)'].map((lbl, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-7 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {lbl}
                          </span>
                          <input
                            type="text"
                            value={form.columnB?.[idx] || ''}
                            onChange={(e) => {
                              const updated = [...(form.columnB || ['', '', '', ''])];
                              updated[idx] = e.target.value;
                              setForm({ ...form, columnB: updated });
                            }}
                            placeholder={`Match ${lbl} description or value...`}
                            className="flex-grow px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-600 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SPECIALIZED COMPETITIVE EXAM CANVAS: SEQUENCE / ORDERING */}
              {/* ============================================================ */}
              {form.question_type === 'SEQUENCE_ORDER' && (
                <div className="p-4 bg-gradient-to-br from-sky-50/70 via-white to-slate-50 rounded-2xl border-2 border-sky-300 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-sky-200/80 pb-2">
                    <ListOrdered size={16} className="text-sky-600" />
                    <span className="font-extrabold text-xs text-sky-950 uppercase tracking-wide">
                      Sequence / Step Arrangement Canvas
                    </span>
                  </div>
                  <div className="space-y-2">
                    {['Step 1 / Event I', 'Step 2 / Event II', 'Step 3 / Event III', 'Step 4 / Event IV'].map((lbl, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-8 h-6 rounded-md bg-sky-100 text-sky-900 font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={form.itemsToOrder?.[idx] || ''}
                          onChange={(e) => {
                            const updated = [...(form.itemsToOrder || ['', '', '', ''])];
                            updated[idx] = e.target.value;
                            setForm({ ...form, itemsToOrder: updated });
                          }}
                          placeholder={`${lbl} description...`}
                          className="flex-grow px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-sky-600 font-medium bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* SPECIALIZED COMPETITIVE EXAM CANVAS: CASE STUDY / PASSAGE */}
              {/* ============================================================ */}
              {form.question_type === 'CASE_STUDY' && (
                <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2">
                    <BookOpen size={16} className="text-emerald-700" />
                    <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                      Reading Comprehension & Case Study Passage Canvas
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Common Background Case Study / Research Passage / Context (Shared with candidates):
                    </label>
                    <textarea
                      rows={5}
                      value={form.passage || ''}
                      onFocus={() => setActiveInputRef({ field: 'passage' })}
                      onChange={(e) => setForm({ ...form, passage: e.target.value })}
                      placeholder="Paste the complete case study text, paragraph, or experiment observations here..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600 font-mono bg-white"
                    />
                    {form.passage && (
                      <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800 font-serif leading-relaxed max-h-40 overflow-y-auto">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Passage Preview:</span>
                        <MathRenderer content={form.passage} />
                      </div>
                    )}
                  </div>
                </div>
              )}

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

                    {/* Case Study / Reading Passage */}
                    {form.passage && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                          <BookOpen size={12} /> Case Study Passage:
                        </span>
                        <div className="text-xs text-slate-800 font-serif leading-relaxed max-h-48 overflow-y-auto">
                          <MathRenderer content={form.passage} />
                        </div>
                      </div>
                    )}

                    {/* Assertion & Reason in Simulator */}
                    {(form.assertion || form.reason) && (
                      <div className="space-y-2">
                        {form.assertion && (
                          <div className="p-2.5 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1">
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded uppercase">
                              Assertion (A)
                            </span>
                            <div className="text-xs text-slate-900 font-medium pl-1">
                              <MathRenderer content={form.assertion} />
                            </div>
                          </div>
                        )}
                        {form.reason && (
                          <div className="p-2.5 bg-indigo-50/80 border border-indigo-300 rounded-xl space-y-1">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded uppercase">
                              Reason (R)
                            </span>
                            <div className="text-xs text-slate-900 font-medium pl-1">
                              <MathRenderer content={form.reason} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Statement I & II in Simulator */}
                    {(form.statement1 || form.statement2) && (
                      <div className="space-y-2">
                        {form.statement1 && (
                          <div className="p-2.5 bg-purple-50/80 border border-purple-300 rounded-xl space-y-1">
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded uppercase">
                              Statement I
                            </span>
                            <div className="text-xs text-slate-900 font-medium pl-1">
                              <MathRenderer content={form.statement1} />
                            </div>
                          </div>
                        )}
                        {form.statement2 && (
                          <div className="p-2.5 bg-teal-50/80 border border-teal-300 rounded-xl space-y-1">
                            <span className="px-2 py-0.5 bg-teal-600 text-white text-[10px] font-black rounded uppercase">
                              Statement II
                            </span>
                            <div className="text-xs text-slate-900 font-medium pl-1">
                              <MathRenderer content={form.statement2} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Match The Following in Simulator */}
                    {form.question_type === 'MATCH_FOLLOWING' && (
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="space-y-1 border-r border-slate-200 pr-2">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block">List I</span>
                          {form.columnA?.filter(Boolean).map((item, i) => (
                            <div key={i} className="p-1.5 bg-white rounded border border-slate-200 text-[11px] flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <MathRenderer content={item} inline />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1 pl-1">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase block">List II</span>
                          {form.columnB?.filter(Boolean).map((item, i) => (
                            <div key={i} className="p-1.5 bg-white rounded border border-slate-200 text-[11px] flex items-center gap-1.5">
                              <span className="w-5 h-4 rounded bg-slate-100 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                {['(i)', '(ii)', '(iii)', '(iv)'][i] || i + 1}
                              </span>
                              <MathRenderer content={item} inline />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sequence Order in Simulator */}
                    {form.question_type === 'SEQUENCE_ORDER' && (
                      <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-sky-800 uppercase flex items-center gap-1">
                          <ListOrdered size={12} /> Steps to Arrange:
                        </span>
                        {form.itemsToOrder?.filter(Boolean).map((item, i) => (
                          <div key={i} className="p-1.5 bg-white rounded border border-sky-100 text-[11px] flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 font-bold text-[9px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <MathRenderer content={item} inline />
                          </div>
                        ))}
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

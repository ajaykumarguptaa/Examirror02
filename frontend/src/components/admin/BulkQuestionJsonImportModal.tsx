import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Sparkles, Copy, Check, AlertCircle, FileCode, CheckCircle2,
  X, ArrowRight, Layers, HelpCircle, Code2, RefreshCw, BookOpen,
  Upload, Image as ImageIcon, CheckCircle, XCircle, Link2, ExternalLink,
  Download, FileSpreadsheet, Archive, Search, Filter, Trash2, Edit3,
  Eye, EyeOff, AlertTriangle, ShieldCheck, CheckSquare, Square,
  ArrowUp, ArrowDown, ListOrdered, Shuffle, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

interface BulkQuestionJsonImportModalProps {
  testId: number;
  testTitle: string;
  customApiEndpoint?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_SIMPLE_JSON = `[
  {
    "question": "Which component is known as the brain of the computer?",
    "optionA": "RAM",
    "optionB": "CPU (Central Processing Unit)",
    "optionC": "Hard Disk Drive",
    "optionD": "Power Supply Unit",
    "correctOption": "B",
    "section": "Computer Basics",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "The CPU performs all instructions and processing operations of a computer system."
  },
  {
    "question": "What is the shortcut key to paste copied content in MS Windows?",
    "optionA": "Ctrl + C",
    "optionB": "Ctrl + X",
    "optionC": "Ctrl + V",
    "optionD": "Ctrl + Z",
    "correctOption": "C",
    "section": "MS Office Shortcuts",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "Ctrl + V is the universal keyboard shortcut for pasting clipboard content."
  }
]`;

const SAMPLE_IMAGE_MCQ_JSON = `[
  {
    "question": "Which cellular organelle is depicted in the biological diagram below?",
    "imageUrl": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80",
    "questionType": "IMAGE_MCQ",
    "section": "Cell Biology",
    "marks": 2,
    "negativeMarks": 0.5,
    "options": [
      {
        "key": "A",
        "text": "Mitochondria",
        "imageUrl": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=300&q=80",
        "isCorrect": true
      },
      {
        "key": "B",
        "text": "Golgi Apparatus",
        "imageUrl": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=300&q=80",
        "isCorrect": false
      },
      {
        "key": "C",
        "text": "Endoplasmic Reticulum",
        "imageUrl": "https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=300&q=80",
        "isCorrect": false
      },
      {
        "key": "D",
        "text": "Lysosome",
        "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80",
        "isCorrect": false
      }
    ],
    "explanation": "The cristae and inner membrane foldings shown in the image are distinct characteristics of mitochondria."
  }
]`;

const SAMPLE_MULTI_IMAGE_SELECT_JSON = `[
  {
    "question": "Examine both supporting biological figures below and select ALL images representing eukaryotic plant cell structures:",
    "questionType": "MULTI_IMAGE_SELECT",
    "section": "Cytology & Plant Biology",
    "marks": 4,
    "negativeMarks": 1.0,
    "imageUrls": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=500&q=80"
    ],
    "options": [
      {
        "key": "A",
        "text": "Chloroplast Organelle Structure",
        "imageUrl": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=300&q=80",
        "isCorrect": true
      },
      {
        "key": "B",
        "text": "Bacterial Capsule (Prokaryote)",
        "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80",
        "isCorrect": false
      },
      {
        "key": "C",
        "text": "Cellulose Cell Wall & Large Central Vacuole",
        "imageUrl": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=300&q=80",
        "isCorrect": true
      },
      {
        "key": "D",
        "text": "Viral Capsid Coat",
        "imageUrl": "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=300&q=80",
        "isCorrect": false
      }
    ],
    "explanation": "Plant eukaryotic cells possess both chloroplasts and a cellulosic rigid cell wall with a central vacuole."
  }
]`;

const SAMPLE_TRUE_FALSE_JSON = `[
  {
    "question": "RAM is a non-volatile memory type that retains data even after computer power is turned off.",
    "questionType": "TRUE_FALSE",
    "correctOption": "False",
    "section": "Hardware Architecture",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "RAM is volatile memory; data is lost when electrical power is disconnected. ROM or SSD is non-volatile."
  },
  {
    "question": "Python is an interpreted, high-level, general-purpose programming language.",
    "questionType": "TRUE_FALSE",
    "correctOption": "True",
    "section": "Programming Languages",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "Python executes code line-by-line via the Python bytecode interpreter."
  }
]`;

const SAMPLE_MATCH_FOLLOWING_JSON = `[
  {
    "question": "Match the networking protocol in Column A with its standard port number in Column B:",
    "questionType": "MATCH_FOLLOWING",
    "section": "Networking Protocols",
    "marks": 4,
    "negativeMarks": 1.0,
    "columnA": ["1. HTTP", "2. HTTPS", "3. SSH", "4. DNS"],
    "columnB": ["A. Port 22", "B. Port 53", "C. Port 80", "D. Port 443"],
    "correctMatches": "1->C, 2->D, 3->A, 4->B",
    "options": [
      { "key": "A", "text": "1-C, 2-D, 3-A, 4-B", "isCorrect": true },
      { "key": "B", "text": "1-A, 2-B, 3-C, 4-D", "isCorrect": false },
      { "key": "C", "text": "1-D, 2-C, 3-B, 4-A", "isCorrect": false },
      { "key": "D", "text": "1-C, 2-A, 3-D, 4-B", "isCorrect": false }
    ],
    "explanation": "Standard defaults: HTTP (Port 80), HTTPS (Port 443), SSH (Port 22), DNS (Port 53)."
  }
]`;

const SAMPLE_SEQUENCE_ORDER_JSON = `[
  {
    "question": "Arrange the following stages of the Software Development Life Cycle (SDLC) in the correct chronological order:",
    "questionType": "SEQUENCE_ORDER",
    "section": "Software Engineering",
    "marks": 2,
    "negativeMarks": 0.5,
    "itemsToOrder": [
      "1. Requirements Gathering & Analysis",
      "2. System Design & Architectural Planning",
      "3. Implementation & Source Coding",
      "4. Quality Assurance & System Testing",
      "5. Production Deployment & Maintenance"
    ],
    "correctOrder": "1 -> 2 -> 3 -> 4 -> 5",
    "options": [
      { "key": "A", "text": "1 -> 2 -> 3 -> 4 -> 5", "isCorrect": true },
      { "key": "B", "text": "2 -> 1 -> 3 -> 5 -> 4", "isCorrect": false },
      { "key": "C", "text": "1 -> 3 -> 2 -> 4 -> 5", "isCorrect": false },
      { "key": "D", "text": "3 -> 1 -> 2 -> 5 -> 4", "isCorrect": false }
    ],
    "explanation": "SDLC strictly begins with Requirements Gathering, followed by Design, Coding, Testing, and Deployment."
  }
]`;

export const BulkQuestionJsonImportModal: React.FC<BulkQuestionJsonImportModalProps> = ({
  testId,
  testTitle,
  customApiEndpoint,
  onClose,
  onSuccess
}) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValidatingFile, setIsValidatingFile] = useState<boolean>(false);

  // Search & Filters in Preview
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showAnswerKeys, setShowAnswerKeys] = useState<boolean>(true);
  const [excludedTempIds, setExcludedTempIds] = useState<Set<string>>(new Set());

  // Skip Preview & Error Policy Settings
  const [skipPreview, setSkipPreview] = useState<boolean>(false);
  const [errorPolicy, setErrorPolicy] = useState<'FAIL_ON_ERROR' | 'SKIP_ERRORS'>('FAIL_ON_ERROR');

  // Multi-Image Upload & Asset Tray State
  const [uploadedAssets, setUploadedAssets] = useState<{ url: string; filename: string; originalname: string }[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
  const [copiedAssetUrl, setCopiedAssetUrl] = useState<string | null>(null);
  const multiImageInputRef = useRef<HTMLInputElement>(null);
  const universalFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Zoom Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Parse & Normalize questions for live preview
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedQuestions([]);
      setParseError(null);
      return;
    }

    try {
      let cleaned = jsonInput.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

      if (!Array.isArray(list) || list.length === 0) {
        setParsedQuestions([]);
        setParseError('JSON must be an array of question objects.');
        return;
      }

      const normalized = list.map((q: any, idx: number) => {
        const tempId = q.temp_id || q.id || `q_preview_${idx + 1}`;
        const questionText = q.question || q.question_text || q.title || `Question ${idx + 1}`;
        const section = q.section || q.section_name || 'General Assessment';
        const marks = q.marks !== undefined ? Number(q.marks) : 2;
        const negativeMarks = q.negativeMarks !== undefined ? Number(q.negativeMarks) : (q.negative_marks !== undefined ? Number(q.negative_marks) : 0.5);
        const explanation = q.explanation || q.desc || '';
        
        // Multi-image resolving on question
        const rawImgs = Array.isArray(q.imageUrls || q.images || q.figures) ? (q.imageUrls || q.images || q.figures) : (q.imageUrl || q.image_url ? [q.imageUrl || q.image_url] : []);
        const imageUrls = rawImgs.filter((u: any) => typeof u === 'string' && u.trim().length > 0);
        const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
        
        let questionType = (q.questionType || q.question_type || '').toUpperCase();
        if (!questionType) {
          if (q.itemsToOrder || q.items_to_order || q.sequenceItems) {
            questionType = 'SEQUENCE_ORDER';
          } else if (imageUrls.length > 1 || (Array.isArray(q.options) && q.options.filter((o: any) => o.isCorrect || o.is_correct).length > 1 && q.options.some((o: any) => o.imageUrl || o.image_url))) {
            questionType = 'MULTI_IMAGE_SELECT';
          } else if (imageUrl || (Array.isArray(q.options) && q.options.some((o: any) => o.imageUrl || o.image_url))) {
            questionType = 'IMAGE_MCQ';
          } else if (q.columnA || q.column_a || q.leftItems) {
            questionType = 'MATCH_FOLLOWING';
          } else {
            questionType = 'SINGLE_CHOICE';
          }
        }

        const columnA = q.columnA || q.column_a || (q.metadata?.columnA) || [];
        const columnB = q.columnB || q.column_b || (q.metadata?.columnB) || [];
        const correctMatches = q.correctMatches || q.correct_matches || (q.metadata?.correctMatches) || '';
        const itemsToOrder = q.itemsToOrder || q.items_to_order || (q.metadata?.itemsToOrder) || [];
        const correctOrder = q.correctOrder || q.correct_order || (q.metadata?.correctOrder) || '';

        let options: { key: string; text: string; imageUrl?: string; isCorrect: boolean }[] = [];

        if (questionType === 'TRUE_FALSE') {
          const corr = String(q.correctOption || q.correct_option || q.correct || 'True').trim().toLowerCase();
          options = [
            { key: 'A', text: 'True', isCorrect: corr === 'true' || corr === 'a' },
            { key: 'B', text: 'False', isCorrect: corr === 'false' || corr === 'b' }
          ];
        } else if (Array.isArray(q.options)) {
          options = q.options.map((opt: any, i: number) => {
            const key = (opt.option_key || opt.key || String.fromCharCode(65 + i)).toUpperCase();
            const text = typeof opt === 'string' ? opt : (opt.option_text || opt.text || '');
            const optImg = typeof opt === 'object' ? (opt.imageUrl || opt.image_url || '') : '';
            let isCorrect = false;
            if (typeof opt === 'object' && opt.is_correct !== undefined) {
              isCorrect = Boolean(opt.is_correct);
            } else if (typeof opt === 'object' && opt.isCorrect !== undefined) {
              isCorrect = Boolean(opt.isCorrect);
            } else if (q.correctOption || q.correct_option || q.correct) {
              const corr = String(q.correctOption || q.correct_option || q.correct).trim().toUpperCase();
              isCorrect = corr === key || corr === text.trim().toUpperCase() || String(i) === corr;
            }
            return { key, text, imageUrl: optImg, isCorrect };
          });
        } else if (q.optionA || q.option_a || q.a) {
          const optA = q.optionA || q.option_a || q.a || '';
          const optB = q.optionB || q.option_b || q.b || '';
          const optC = q.optionC || q.option_c || q.c || '';
          const optD = q.optionD || q.option_d || q.d || '';
          const corr = String(q.correctOption || q.correct_option || q.correct || 'A').trim().toUpperCase();

          options = [
            { key: 'A', text: optA, isCorrect: corr === 'A' || corr === optA.trim().toUpperCase() },
            { key: 'B', text: optB, isCorrect: corr === 'B' || corr === optB.trim().toUpperCase() },
            { key: 'C', text: optC, isCorrect: corr === 'C' || corr === optC.trim().toUpperCase() },
            { key: 'D', text: optD, isCorrect: corr === 'D' || corr === optD.trim().toUpperCase() },
          ];
        }

        const hasOptions = options.length >= 2;
        const hasCorrect = options.some(o => o.isCorrect);
        const isValid = questionText.trim().length > 0 && hasOptions && hasCorrect;

        return {
          tempId,
          questionText,
          section,
          marks,
          negativeMarks,
          explanation,
          imageUrl,
          imageUrls,
          questionType,
          columnA,
          columnB,
          correctMatches,
          itemsToOrder,
          correctOrder,
          options,
          validationStatus: isValid ? 'VALID' : 'INVALID',
          validationIssues: [
            ...(!questionText.trim() ? ['Missing question text'] : []),
            ...(!hasOptions ? ['Question requires at least 2 options'] : []),
            ...(!hasCorrect ? ['No correct answer designated'] : [])
          ],
          raw: q
        };
      });

      setParsedQuestions(normalized);
      setParseError(null);
    } catch (err: any) {
      setParsedQuestions([]);
      setParseError(err.message || 'Invalid JSON syntax. Please check brackets and quotes.');
    }
  }, [jsonInput]);

  // Universal File Upload (JSON, Excel, CSV, ZIP)
  const handleUniversalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidatingFile(true);
    try {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (ext === '.json') {
        const text = await file.text();
        setJsonInput(text);
        setActiveTab('preview');
      } else {
        const fd = new FormData();
        fd.append('file', file);
        const res = await axios.post(`/api/admin/tests/${testId}/questions/validate`, fd);
        if (res.data?.success && Array.isArray(res.data?.questions)) {
          const mapped = res.data.questions.map((q: any) => ({
            tempId: q.temp_id,
            questionText: q.question_text,
            section: q.section_name,
            marks: q.marks,
            negativeMarks: q.negative_marks,
            explanation: q.explanation,
            imageUrl: q.image_url,
            imageUrls: q.metadata?.imageUrls || (q.image_url ? [q.image_url] : []),
            questionType: q.question_type,
            columnA: q.metadata?.columnA || [],
            columnB: q.metadata?.columnB || [],
            correctMatches: q.metadata?.correctMatches || '',
            itemsToOrder: q.metadata?.itemsToOrder || [],
            correctOrder: q.metadata?.correctOrder || '',
            options: (q.options || []).map((o: any) => ({
              key: o.option_key,
              text: o.option_text,
              imageUrl: o.image_url,
              isCorrect: Boolean(o.is_correct)
            })),
            validationStatus: q.validation_status,
            validationIssues: (q.validation_errors || []).map((e: any) => e.message),
            raw: q.raw || q
          }));
          setParsedQuestions(mapped);
          setJsonInput(JSON.stringify(mapped.map((m: any) => m.raw || m), null, 2));
          setActiveTab('preview');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to parse file.');
    } finally {
      setIsValidatingFile(false);
      if (universalFileInputRef.current) universalFileInputRef.current.value = '';
    }
  };

  // Interactive 1-Click Select Correct Option in Preview (Supports Multi-Select Image Options!)
  const handleSelectCorrectOption = (qIdx: number, optionKey: string) => {
    const updated = [...parsedQuestions];
    const q = updated[qIdx];
    if (!q) return;

    const isMultiSelectType =
      q.questionType === 'MULTIPLE_CHOICE' ||
      q.questionType === 'MULTI_SELECT' ||
      q.questionType === 'MULTI_IMAGE_SELECT' ||
      q.questionType === 'IMAGE_MULTI_SELECT';

    if (isMultiSelectType) {
      // Toggle selection for multiple correct images/choices
      q.options = q.options.map((o: any) => (o.key === optionKey ? { ...o, isCorrect: !o.isCorrect } : o));
    } else {
      // Single choice
      q.options = q.options.map((o: any) => ({ ...o, isCorrect: o.key === optionKey }));
    }

    const hasCorrect = q.options.some((o: any) => o.isCorrect);
    q.validationStatus = q.questionText.trim().length > 0 && q.options.length >= 2 && hasCorrect ? 'VALID' : 'INVALID';
    q.validationIssues = [
      ...(!q.questionText.trim() ? ['Missing question text'] : []),
      ...(q.options.length < 2 ? ['Question requires at least 2 options'] : []),
      ...(!hasCorrect ? ['No correct answer designated'] : [])
    ];

    if (q.raw) {
      if (Array.isArray(q.raw.options)) {
        q.raw.options = q.options.map((o: any) => ({
          option_key: o.key,
          key: o.key,
          option_text: o.text,
          text: o.text,
          imageUrl: o.imageUrl,
          is_correct: o.isCorrect,
          isCorrect: o.isCorrect
        }));
      } else {
        q.raw.correctOption = optionKey;
      }
    }

    setParsedQuestions(updated);
    try {
      setJsonInput(JSON.stringify(updated.map(i => i.raw || i), null, 2));
    } catch (_) {}
  };

  // Reorder items in "Arrange in Correct Order" preview
  const handleMoveOrderItem = (qIdx: number, itemIdx: number, direction: 'UP' | 'DOWN') => {
    const updated = [...parsedQuestions];
    const q = updated[qIdx];
    if (!q || !Array.isArray(q.itemsToOrder)) return;

    const items = [...q.itemsToOrder];
    const targetIdx = direction === 'UP' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[itemIdx];
    items[itemIdx] = items[targetIdx];
    items[targetIdx] = temp;

    q.itemsToOrder = items;
    if (q.raw) {
      q.raw.itemsToOrder = items;
    }

    setParsedQuestions(updated);
    try {
      setJsonInput(JSON.stringify(updated.map(i => i.raw || i), null, 2));
    } catch (_) {}
  };

  // Apply current arrangement as Option A & mark correct
  const handleApplyCurrentOrderAsCorrect = (qIdx: number) => {
    const updated = [...parsedQuestions];
    const q = updated[qIdx];
    if (!q || !Array.isArray(q.itemsToOrder)) return;

    const sequenceOrderStr = q.itemsToOrder
      .map((item: string) => {
        const match = item.match(/^(\d+|[A-Z])/i);
        return match ? match[1] : item.substring(0, 10);
      })
      .join(' -> ');

    q.correctOrder = sequenceOrderStr;
    if (q.options && q.options.length > 0) {
      q.options[0].text = sequenceOrderStr;
      q.options = q.options.map((o: any, idx: number) => ({ ...o, isCorrect: idx === 0 }));
    }

    if (q.raw) {
      q.raw.correctOrder = sequenceOrderStr;
      if (Array.isArray(q.raw.options) && q.raw.options.length > 0) {
        q.raw.options[0].text = sequenceOrderStr;
        q.raw.options = q.raw.options.map((o: any, idx: number) => ({ ...o, is_correct: idx === 0, isCorrect: idx === 0 }));
      }
    }

    setParsedQuestions(updated);
    try {
      setJsonInput(JSON.stringify(updated.map(i => i.raw || i), null, 2));
    } catch (_) {}
  };

  // Multi-Image Upload
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('images', files[i]);
      }

      const res = await axios.post('/api/admin/questions/upload-multiple-images', fd);
      if (res.data?.success && Array.isArray(res.data?.images)) {
        setUploadedAssets(prev => [...res.data.images, ...prev]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload images.');
    } finally {
      setIsUploadingImages(false);
      if (multiImageInputRef.current) multiImageInputRef.current.value = '';
    }
  };

  const handleCopyAssetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedAssetUrl(url);
    setTimeout(() => setCopiedAssetUrl(null), 2000);
  };

  const handleDownloadTemplate = (format: 'json' | 'excel' | 'csv' | 'zip') => {
    const url = `/api/admin/questions/templates/${format}`;
    window.open(url, '_blank');
  };

  const toggleExcludeQuestion = (tempId: string) => {
    setExcludedTempIds(prev => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  };

  const handleImportSubmit = async () => {
    const eligibleQuestions = parsedQuestions.filter(q => !excludedTempIds.has(q.tempId));
    if (eligibleQuestions.length === 0) {
      alert('No questions selected for import.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`/api/admin/tests/${testId}/questions/universal-import`, {
        questions: eligibleQuestions.map(p => p.raw || p),
        policy: errorPolicy
      });

      if (res.data?.success) {
        onSuccess();
      }
    } catch (err: any) {
      setParseError(err.response?.data?.message || 'Failed to import questions to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Lightbox
  const handleOpenLightbox = (url: string, title?: string) => {
    setLightboxImage({ url, title });
    setLightboxZoom(1);
  };

  // Filtered Questions in Preview Tab
  const filteredQuestions = parsedQuestions.filter(q => {
    const matchesSearch = !searchQuery ||
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some((o: any) => o.text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || q.questionType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || q.validationStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const validCount = parsedQuestions.filter(q => q.validationStatus === 'VALID').length;
  const invalidCount = parsedQuestions.length - validCount;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/30 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>Universal Question Authoring & Bulk Importer</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Test: {testTitle}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Advanced Test Authoring & Multi-Image Question System
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Code2 size={13} />
              <span>JSON Editor / Paste</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              disabled={parsedQuestions.length === 0}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Parsed Live Preview ({parsedQuestions.length})</span>
            </button>
          </div>

          {/* Upload and Download Tooling */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={universalFileInputRef}
              type="file"
              accept=".json,.xlsx,.xls,.csv,.zip"
              className="hidden"
              onChange={handleUniversalFileSelect}
            />
            <button
              type="button"
              disabled={isValidatingFile}
              onClick={() => universalFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              <FileSpreadsheet size={13} className="text-emerald-700" />
              <span>{isValidatingFile ? 'Validating...' : 'Upload File (Excel/CSV/JSON/ZIP)'}</span>
            </button>

            <input
              ref={multiImageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleMultipleImageUpload}
            />
            <button
              type="button"
              disabled={isUploadingImages}
              onClick={() => multiImageInputRef.current?.click()}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              <Upload size={13} className="text-blue-600" />
              <span>{isUploadingImages ? 'Uploading...' : 'Upload Images'}</span>
            </button>

            {/* Template Downloads */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Templates:</span>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('excel')}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                title="Download Excel Template"
              >
                <Download size={11} />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                title="Download CSV Template"
              >
                <Download size={11} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('zip')}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                title="Download Image Archive ZIP Template"
              >
                <Archive size={11} />
                <span>ZIP Package</span>
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Images Asset Tray (Collapsible) */}
        {uploadedAssets.length > 0 && (
          <div className="px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-3 overflow-x-auto shrink-0 text-xs">
            <span className="font-bold text-indigo-900 flex items-center gap-1 shrink-0">
              <ImageIcon size={13} className="text-indigo-600" />
              <span>Asset Tray ({uploadedAssets.length}):</span>
            </span>
            <div className="flex items-center gap-2">
              {uploadedAssets.map((asset, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-lg p-1 pr-2 shadow-2xs shrink-0"
                >
                  <img
                    src={asset.url}
                    alt={asset.originalname}
                    onClick={() => handleOpenLightbox(asset.url, asset.originalname)}
                    className="w-6 h-6 object-cover rounded cursor-pointer hover:opacity-80"
                  />
                  <span className="text-[10px] font-semibold text-slate-700 max-w-[100px] truncate">
                    {asset.originalname}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAssetUrl(asset.url)}
                    className="text-[10px] px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold cursor-pointer transition-colors"
                  >
                    {copiedAssetUrl === asset.url ? '✓ Copied' : 'Copy URL'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

          {activeTab === 'editor' ? (
            <div className="space-y-4">
              
              {/* Preset Template Switcher Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-700 text-xs">Load Ready-To-Use JSON Templates:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_SIMPLE_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Standard MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_IMAGE_MCQ_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Image MCQ (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_MULTI_IMAGE_SELECT_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300 text-[11px] font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <ImageIcon size={12} className="text-fuchsia-600" />
                    <span>Multiple Image Selection (MSQ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_TRUE_FALSE_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_MATCH_FOLLOWING_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Match the Following
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput(SAMPLE_SEQUENCE_ORDER_JSON)}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <ListOrdered size={12} className="text-sky-600" />
                    <span>Arrange in Correct Order</span>
                  </button>
                </div>
              </div>

              {/* JSON Textarea Editor */}
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`Paste your JSON array here or upload an Excel/CSV/ZIP archive...`}
                  rows={14}
                  className="w-full font-mono text-xs p-4 bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all leading-relaxed"
                />

                {parsedQuestions.length > 0 && !parseError && (
                  <div className="absolute right-4 bottom-4 px-3 py-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Valid JSON: {parsedQuestions.length} Questions Ready</span>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-start gap-2 text-xs">
                  <AlertCircle size={15} className="text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block font-bold">Import Issue:</strong>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Live Preview */
            <div className="space-y-4">
              {/* Search, Filter, and Action Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200 bg-slate-50/70 p-3 rounded-2xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-indigo-500 w-44 sm:w-56"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Question Types</option>
                    <option value="SINGLE_CHOICE">Standard MCQ</option>
                    <option value="IMAGE_MCQ">Image MCQ</option>
                    <option value="MULTI_IMAGE_SELECT">Multiple Image Selection</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="MATCH_FOLLOWING">Match the Following</option>
                    <option value="SEQUENCE_ORDER">Arrange in Correct Order</option>
                    <option value="MULTIPLE_CHOICE">Multiple Select</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Status ({parsedQuestions.length})</option>
                    <option value="VALID">Valid ({validCount})</option>
                    <option value="INVALID">Invalid ({invalidCount})</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      showAnswerKeys ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {showAnswerKeys ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{showAnswerKeys ? 'Answer Key Visible' : 'Answer Key Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {filteredQuestions.map((q, idx) => {
                  const isExcluded = excludedTempIds.has(q.tempId);
                  const isSequenceOrder = q.questionType === 'SEQUENCE_ORDER' || q.questionType === 'ARRANGE_ORDER' || (Array.isArray(q.itemsToOrder) && q.itemsToOrder.length > 0);
                  const isMultiImageSelect = q.questionType === 'MULTI_IMAGE_SELECT' || q.questionType === 'IMAGE_MULTI_SELECT' || (q.options.some((o: any) => o.imageUrl) && q.options.filter((o: any) => o.isCorrect).length > 1);

                  return (
                    <div
                      key={q.tempId || idx}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isExcluded
                          ? 'opacity-40 bg-slate-100 border-slate-300'
                          : q.validationStatus === 'INVALID'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleExcludeQuestion(q.tempId)}
                            className="mt-0.5 cursor-pointer text-slate-500 hover:text-slate-800"
                            title={isExcluded ? 'Include Question' : 'Exclude Question'}
                          >
                            {isExcluded ? <Square size={16} /> : <CheckSquare size={16} className="text-indigo-600" />}
                          </button>

                          <div className="font-bold text-slate-900 text-xs flex gap-2">
                            <span className="text-indigo-600 font-extrabold">Q{idx + 1}.</span>
                            <span>{q.questionText}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {q.validationStatus === 'INVALID' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded flex items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>Invalid</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                              <ShieldCheck size={11} />
                              <span>Validated</span>
                            </span>
                          )}

                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                            {q.questionType}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                            +{q.marks} / -{q.negativeMarks}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                            {q.section}
                          </span>
                        </div>
                      </div>

                      {/* Validation Issues Banner if any */}
                      {q.validationIssues && q.validationIssues.length > 0 && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 space-y-0.5">
                          {q.validationIssues.map((issue: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Supporting Question Images / Figures (Multiple or Single) */}
                      {q.imageUrls && q.imageUrls.length > 0 && (
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <ImageIcon size={13} className="text-indigo-600" />
                            <span>Supporting Question Figures ({q.imageUrls.length}):</span>
                          </span>

                          <div className={`grid gap-3 ${q.imageUrls.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {q.imageUrls.map((url: string, imgIdx: number) => (
                              <div
                                key={imgIdx}
                                className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden"
                              >
                                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[9px] font-bold z-10">
                                  Figure {imgIdx + 1}
                                </span>
                                <img
                                  src={url}
                                  alt={`Figure ${imgIdx + 1}`}
                                  className="max-h-48 object-contain rounded-lg cursor-pointer transition-transform group-hover:scale-[1.02]"
                                  onClick={() => handleOpenLightbox(url, `Question ${idx + 1} - Figure ${imgIdx + 1}`)}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleOpenLightbox(url, `Question ${idx + 1} - Figure ${imgIdx + 1}`)}
                                  className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Zoom Image"
                                >
                                  <Maximize2 size={12} />
                                  <span>Preview</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 1. TRUE_FALSE VIEW with 1-Click Correct Selection */}
                      {q.questionType === 'TRUE_FALSE' && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {q.options.map((opt: any) => (
                            <button
                              type="button"
                              key={opt.key}
                              onClick={() => handleSelectCorrectOption(idx, opt.key)}
                              className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer text-left ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {opt.text === 'True' ? (
                                  <CheckCircle size={16} className={opt.isCorrect ? 'text-emerald-600' : 'text-slate-400'} />
                                ) : (
                                  <XCircle size={16} className={opt.isCorrect ? 'text-emerald-600' : 'text-slate-400'} />
                                )}
                                <span>{opt.text}</span>
                              </div>
                              {opt.isCorrect ? (
                                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  ✓ Correct Answer
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 hover:text-slate-700">
                                  Click to make correct
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 2. MATCH_FOLLOWING VIEW */}
                      {q.questionType === 'MATCH_FOLLOWING' && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="space-y-1.5 border-r border-slate-100 pr-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Column A (Items)
                              </span>
                              {q.columnA.map((item: string, i: number) => (
                                <div key={i} className="p-1.5 bg-slate-50 rounded font-semibold text-slate-800 text-[11px]">
                                  {item}
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1.5 pl-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Column B (Matches)
                              </span>
                              {q.columnB.map((item: string, i: number) => (
                                <div key={i} className="p-1.5 bg-slate-50 rounded font-semibold text-slate-800 text-[11px]">
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>

                          {showAnswerKeys && q.correctMatches && (
                            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px]">
                              Correct Pairing: <span className="font-mono text-amber-800">{q.correctMatches}</span>
                            </div>
                          )}

                          {/* Options with 1-Click Select */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: any) => (
                              <button
                                type="button"
                                key={opt.key}
                                onClick={() => handleSelectCorrectOption(idx, opt.key)}
                                className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all text-left ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span><strong>{opt.key}.</strong> {opt.text}</span>
                                {opt.isCorrect ? (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                                    ✓ Correct
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Select</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. ARRANGE IN CORRECT ORDER (SEQUENCE_ORDER) VIEW */}
                      {isSequenceOrder && (
                        <div className="space-y-3 pt-1">
                          <div className="bg-white p-3.5 rounded-2xl border border-sky-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                                <ListOrdered size={14} className="text-sky-600" />
                                <span>Items to Arrange in Correct Order:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApplyCurrentOrderAsCorrect(idx)}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                              >
                                Apply Current Order to Option A (Correct)
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {q.itemsToOrder.map((item: string, itemIdx: number) => (
                                <div
                                  key={itemIdx}
                                  className="p-2 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                      {itemIdx + 1}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800">{item}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={itemIdx === 0}
                                      onClick={() => handleMoveOrderItem(idx, itemIdx, 'UP')}
                                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={itemIdx === q.itemsToOrder.length - 1}
                                      onClick={() => handleMoveOrderItem(idx, itemIdx, 'DOWN')}
                                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {q.correctOrder && (
                              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] font-bold flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-700">Correct Sequence:</span>
                                <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                                  {q.correctOrder}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: any) => (
                              <button
                                type="button"
                                key={opt.key}
                                onClick={() => handleSelectCorrectOption(idx, opt.key)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all text-left ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span><strong>{opt.key}.</strong> {opt.text}</span>
                                {opt.isCorrect ? (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                    ✓ Correct Sequence
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Click to select</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. IMAGE MCQ & MULTIPLE IMAGE SELECTION VIEW */}
                      {!isSequenceOrder && q.questionType !== 'TRUE_FALSE' && q.questionType !== 'MATCH_FOLLOWING' && (
                        <div className="space-y-2 pt-1">
                          {isMultiImageSelect && (
                            <div className="flex items-center justify-between px-2 py-1 bg-fuchsia-50 border border-fuchsia-200 rounded-xl text-fuchsia-900 text-[11px] font-bold">
                              <span>Multi-Image Selection: Click images to select/toggle multiple correct answers.</span>
                              <span className="text-fuchsia-700">
                                Selected: {q.options.filter((o: any) => o.isCorrect).map((o: any) => o.key).join(', ') || 'None'}
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt: any) => (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-2xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/80 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-bold text-slate-900">
                                    <strong>{opt.key}.</strong> {opt.text}
                                  </span>

                                  {/* Toggle button */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCorrectOption(idx, opt.key)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                      opt.isCorrect
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    <Check size={11} />
                                    <span>{opt.isCorrect ? 'Selected as Correct' : 'Select as Correct'}</span>
                                  </button>
                                </div>

                                {/* Option Image Preview & Zoom Lightbox */}
                                {opt.imageUrl && (
                                  <div className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2 flex justify-center items-center overflow-hidden">
                                    <img
                                      src={opt.imageUrl}
                                      alt={`Option ${opt.key}`}
                                      className="h-28 object-contain rounded cursor-pointer transition-transform group-hover:scale-105"
                                      onClick={() => handleOpenLightbox(opt.imageUrl, `Option ${opt.key} - ${opt.text}`)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleOpenLightbox(opt.imageUrl, `Option ${opt.key} - ${opt.text}`)}
                                      className="absolute bottom-1.5 right-1.5 p-1 bg-white/90 hover:bg-white text-slate-700 rounded-md border border-slate-200 text-[9px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                    >
                                      <Maximize2 size={10} />
                                      <span>Zoom</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {showAnswerKeys && q.explanation && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Skip Preview & Error Policy Settings */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Error Policy:</span>
              <select
                value={errorPolicy}
                onChange={(e) => setErrorPolicy(e.target.value as any)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="FAIL_ON_ERROR">Abort on Any Error</option>
                <option value="SKIP_ERRORS">Import Valid & Skip Errors</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={skipPreview}
                onChange={(e) => setSkipPreview(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>Skip Preview in Future</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={parsedQuestions.length === 0 || isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <span>Importing Questions...</span>
              ) : (
                <>
                  <span>
                    Import {parsedQuestions.filter(q => !excludedTempIds.has(q.tempId)).length} Questions
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* HIGH-RESOLUTION IMAGE LIGHTBOX ZOOM MODAL */}
      {/* ======================================================== */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-3">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between text-white text-xs px-2">
              <span className="font-bold truncate max-w-[400px]">
                {lightboxImage.title || 'Image High-Res Preview'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-mono px-1">{Math.round(lightboxZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 bg-white/10 hover:bg-rose-500/80 rounded-lg cursor-pointer transition-colors ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Image Viewer Container */}
            <div className="max-h-[80vh] overflow-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title || 'Preview'}
                style={{ transform: `scale(${lightboxZoom})`, transformOrigin: 'center center' }}
                className="max-h-[70vh] object-contain transition-transform duration-150 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

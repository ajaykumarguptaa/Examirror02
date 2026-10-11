import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles, Copy, Check, AlertCircle, FileCode, CheckCircle2,
  X, ArrowRight, Layers, HelpCircle, Code2, RefreshCw, BookOpen
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
  },
  {
    "question": "Which protocol is used to securely browse web pages over the internet?",
    "optionA": "HTTP",
    "optionB": "FTP",
    "optionC": "HTTPS",
    "optionD": "SMTP",
    "correctOption": "C",
    "section": "Networking & Internet",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "HTTPS (Hypertext Transfer Protocol Secure) encrypts communication over computer networks."
  }
]`;

const SAMPLE_NESTED_JSON = `[
  {
    "question_text": "What is the default port number for HTTP web servers?",
    "section_name": "Web Technologies",
    "marks": 2,
    "negative_marks": 0.5,
    "explanation": "Standard HTTP servers listen on TCP port 80 by default.",
    "options": [
      { "option_key": "A", "option_text": "21", "is_correct": false },
      { "option_key": "B", "option_text": "80", "is_correct": true },
      { "option_key": "C", "option_text": "443", "is_correct": false },
      { "option_key": "D", "option_text": "8080", "is_correct": false }
    ]
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
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live validation on JSON changes
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedQuestions([]);
      setParseError(null);
      return;
    }

    try {
      // Clean possible markdown code fences (```json ... ```)
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

      // Normalize question structures for live preview
      const normalized = list.map((q: any, idx: number) => {
        const questionText = q.question || q.question_text || q.title || `Question ${idx + 1}`;
        const section = q.section || q.section_name || 'General Assessment';
        const marks = q.marks !== undefined ? Number(q.marks) : 2;
        const negativeMarks = q.negativeMarks !== undefined ? Number(q.negativeMarks) : (q.negative_marks !== undefined ? Number(q.negative_marks) : 0.5);
        const explanation = q.explanation || q.desc || '';

        let options: { key: string; text: string; isCorrect: boolean }[] = [];

        if (Array.isArray(q.options)) {
          options = q.options.map((opt: any, i: number) => {
            const key = (opt.option_key || opt.key || String.fromCharCode(65 + i)).toUpperCase();
            const text = typeof opt === 'string' ? opt : (opt.option_text || opt.text || '');
            let isCorrect = false;
            if (typeof opt === 'object' && opt.is_correct !== undefined) {
              isCorrect = Boolean(opt.is_correct);
            } else if (q.correctOption || q.correct_option || q.correct) {
              const corr = String(q.correctOption || q.correct_option || q.correct).trim().toUpperCase();
              isCorrect = corr === key || corr === text.trim().toUpperCase();
            }
            return { key, text, isCorrect };
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

        return {
          questionText,
          section,
          marks,
          negativeMarks,
          explanation,
          options,
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

  const handleCopyPrompt = () => {
    const promptText = `Please generate multiple choice questions (MCQs) for the test "${testTitle}" in this exact JSON array format:

[
  {
    "question": "Question text here?",
    "optionA": "First Choice",
    "optionB": "Second Choice",
    "optionC": "Third Choice",
    "optionD": "Fourth Choice",
    "correctOption": "A",
    "section": "Core Concepts",
    "marks": 2,
    "negativeMarks": 0.5,
    "explanation": "Detailed explanation of why this answer is correct."
  }
]

Requirements:
- Provide 4 options (optionA, optionB, optionC, optionD)
- Specify correctOption as 'A', 'B', 'C', or 'D'
- Output ONLY raw valid JSON without markdown wrapping or commentary.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleCopySampleJson = () => {
    navigator.clipboard.writeText(SAMPLE_SIMPLE_JSON);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleLoadSample = () => {
    setJsonInput(SAMPLE_SIMPLE_JSON);
  };

  const handleImportSubmit = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSubmitting(true);
    try {
      const rawQuestions = parsedQuestions.map(p => p.raw);
      const url = customApiEndpoint || `/api/admin/tests/${testId}/questions/bulk`;
      await axios.post(url, {
        questions: rawQuestions
      });
      onSuccess();
    } catch (err: any) {
      setParseError(err.response?.data?.message || 'Failed to import questions to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/30 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>JSON Bulk Import & AI Generator</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Test: {testTitle}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Bulk Import Questions via JSON
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Prompt Template for ChatGPT / Gemini"
            >
              {copiedPrompt ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedPrompt ? 'Prompt Copied!' : 'Copy AI Prompt'}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Load Sample JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {activeTab === 'editor' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileCode size={14} className="text-indigo-600" />
                  <span>Paste JSON Code Here (Array of Questions)</span>
                </label>

                {parsedQuestions.length > 0 && !parseError && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>{parsedQuestions.length} Questions Ready</span>
                  </span>
                )}
              </div>

              <textarea
                rows={14}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste AI-generated or custom JSON here... e.g. [{ 'question': '...', 'optionA': '...', 'optionB': '...', 'correctOption': 'A' }]"
                className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 leading-relaxed resize-y"
                spellCheck={false}
              />

              {/* Validation Status Box */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-bold text-xs">JSON Syntax Error</div>
                    <div className="text-[11px] font-mono mt-0.5">{parseError}</div>
                  </div>
                </div>
              )}

              {/* Schema Hint */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <HelpCircle size={13} className="text-indigo-600" />
                    <span>Supported Format Structure:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySampleJson}
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {copiedJson ? 'Copied!' : 'Copy Sample Format'}
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  You can use simplified fields (<code>question</code>, <code>optionA</code>, <code>optionB</code>, <code>optionC</code>, <code>optionD</code>, <code>correctOption: &quot;A&quot;</code>) OR nested options (<code>options: [{'{'}&quot;option_key&quot;: &quot;A&quot;, &quot;option_text&quot;: &quot;...&quot;, &quot;is_correct&quot;: true{'}'}]</code>). Marks, section, and explanations are optional.
                </p>
              </div>
            </div>
          ) : (
            /* Live Parsed Preview Cards */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">
                  Parsed Questions Preview ({parsedQuestions.length})
                </span>
                <span className="text-xs text-slate-500">
                  Review before importing into database
                </span>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-xs flex gap-2">
                        <span className="text-indigo-600 font-extrabold">Q{idx + 1}.</span>
                        <span>{q.questionText}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                          +{q.marks} / -{q.negativeMarks}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                          {q.section}
                        </span>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt: any) => (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                            opt.isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span><strong>{opt.key}.</strong> {opt.text}</span>
                          {opt.isCorrect && <Check size={14} className="text-emerald-600 font-black" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500">
                        <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
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
              <span>Importing {parsedQuestions.length} Questions...</span>
            ) : (
              <>
                <span>Import {parsedQuestions.length} Questions to Test</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

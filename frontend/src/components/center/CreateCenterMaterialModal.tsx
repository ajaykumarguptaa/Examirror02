import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, FileText, Upload, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { prepareSafeHtmlContent } from '../../utils/htmlNoteSecurity';
import { LazyImage } from '../ui/LazyImage';
import { compressImageFile } from '../../utils/imageCompressor';

interface CreateCenterMaterialModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCenterMaterialModal: React.FC<CreateCenterMaterialModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    description: '',
    thumbnail_url: '',
    file_type: 'PDF',
    content_text: '',
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [htmlEditorTab, setHtmlEditorTab] = useState<'editor' | 'preview'>('editor');
  const { data: approvalFee = 100 } = useQuery({
    queryKey: ['enotes-approval-fee'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/api/public/settings/enotes_approval_fee');
      if (res.data?.success && res.data.data) {
        let val = res.data.data;
        if (typeof val === 'string') val = JSON.parse(val);
        return val.fee !== undefined ? Number(val.fee) : 100;
      }
      return 100;
    },
    refetchInterval: 5000 // Poll every 5 seconds so it updates automatically even if they don't change tabs
  });
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please select a valid PDF file.');
        setPdfFile(null);
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be less than 20MB.');
        setPdfFile(null);
        return;
      }
      setError('');
      setPdfFile(file);
    }
  };

  const getHeaders = () => {
    const token = localStorage.getItem('centerToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.file_type === 'PDF' && !pdfFile) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      let fileUrl = '';
      if (form.file_type === 'PDF' && pdfFile) {
        // Upload PDF first (using public upload route or specific doc route)
        const formData = new FormData();
        formData.append('file', pdfFile);
        const uploadRes = await axios.post('http://localhost:3000/api/public/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data?.url) {
          fileUrl = uploadRes.data.url;
        } else {
          throw new Error('Failed to upload PDF document');
        }
      }

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        thumbnail_url: form.thumbnail_url,
        file_type: form.file_type,
        file_url: fileUrl,
        content_text: form.content_text,
        file_size: pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
        is_free: 1, // Centers distribute for free to their own students
        price: 0,
        center_price: 0,
        student_price: 0,
        status: 'PUBLISHED'
      };

      await axios.post('http://localhost:3000/api/study-materials/center/create', payload, {
        headers: getHeaders()
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles size={20} />
            <h2 className="font-bold text-slate-800 text-lg">Create E-Note</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="create-note-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="e.g. Complete Mathematics Pack"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="General">General</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Programming">Programming</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Format</label>
                <select
                  value={form.file_type}
                  onChange={(e) => setForm({ ...form, file_type: e.target.value as any, content_text: '' })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="HTML">Rich Text (HTML)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Short Description</label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                placeholder="Brief description of the material..."
              />
            </div>

            {/* Note Thumbnail */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-600" />
                  <span>Cover Thumbnail Image (Optional)</span>
                </label>
                {form.thumbnail_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, thumbnail_url: '' })}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>

              {form.thumbnail_url && (
                <div className="relative aspect-video max-h-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <LazyImage
                    src={form.thumbnail_url}
                    alt="Cover Preview"
                    wrapperClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors">
                  <Upload size={13} className="text-indigo-600" />
                  <span>{form.thumbnail_url ? 'Change Image' : 'Upload Image (JPG/PNG/WebP)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImageFile(file, {
                          maxWidth: 800,
                          maxHeight: 600,
                          quality: 0.82,
                          targetFormat: 'image/webp'
                        });
                        const fd = new FormData();
                        fd.append('file', compressed.file);
                        const res = await axios.post('http://localhost:3000/api/public/upload', fd, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data?.url || res.data?.s3Url) {
                          setForm({ ...form, thumbnail_url: res.data.url || res.data.s3Url });
                          return;
                        }
                        if (compressed.dataUrl) {
                          setForm({ ...form, thumbnail_url: compressed.dataUrl });
                        }
                      } catch (err) {
                        console.error('Failed to compress/upload image', err);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {form.file_type === 'PDF' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Upload PDF Document</label>
                <label className="flex flex-col items-center justify-center w-full h-32 px-4 py-6 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload className={`w-8 h-8 mb-3 ${pdfFile ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <p className="mb-2 text-sm text-slate-500 font-medium">
                      {pdfFile ? <span className="text-indigo-700 font-bold">{pdfFile.name}</span> : <span>Click to upload PDF</span>}
                    </p>
                    <p className="text-xs text-slate-400">PDF up to 20MB</p>
                  </div>
                  <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-900 text-xs uppercase">
                      Note Content (HTML/Text)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {form.content_text.length} chars
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHtmlEditorTab('editor')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        htmlEditorTab === 'editor' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Code Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlEditorTab('preview')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        htmlEditorTab === 'preview' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Eye size={11} />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase mr-1">Insert:</span>
                  {[
                    { label: '+ Heading', tag: '<h3>Chapter Title</h3>\n' },
                    { label: '+ Bold Text', tag: '<strong>Important Concept:</strong> ' },
                    { label: '+ Formula Box', tag: '<div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl my-2"><strong>Formula:</strong> <code>x = y</code></div>\n' },
                    { label: '+ Highlight Box', tag: '<div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl my-2 text-amber-950 font-medium">⚠️ <strong>Exam Note:</strong> Remember this shortcut.</div>\n' },
                    { label: '+ Code Block', tag: '<pre class="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs my-2 overflow-x-auto"><code>// code</code></pre>\n' }
                  ].map((snippet) => (
                    <button
                      key={snippet.label}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, content_text: prev.content_text + snippet.tag }));
                      }}
                      className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md font-medium text-slate-700 cursor-pointer transition-colors shadow-2xs"
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>

                {htmlEditorTab === 'editor' ? (
                  <textarea
                    required
                    rows={6}
                    value={form.content_text}
                    onChange={(e) => setForm({ ...form, content_text: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs shadow-2xs leading-relaxed"
                    placeholder="<h2>Chapter 1</h2><p>Your notes here...</p>"
                  />
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs h-60">
                    {form.content_text ? (
                      <iframe 
                        srcDoc={prepareSafeHtmlContent(form.content_text, form.title || 'Live Preview')}
                        className="w-full h-full border-none bg-white"
                        title="Live Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No HTML content entered yet. Type code to preview.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 mt-auto">
          <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>
              <strong>Approval Process:</strong> Notes you create will be submitted for Super Admin approval. 
              Once approved, a fee of <strong className="text-indigo-700 font-bold">{approvalFee} Tokens</strong> will be automatically deducted from your center wallet.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-note-form"
              disabled={isLoading || (form.file_type === 'PDF' && !pdfFile)}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Submit for Approval</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

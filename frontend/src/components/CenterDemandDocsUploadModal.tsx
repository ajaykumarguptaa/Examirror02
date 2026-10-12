import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Plus,
  ShieldAlert,
  Send
} from 'lucide-react';
import axios from 'axios';

interface CenterDemandDocsUploadModalProps {
  centerId: number | string;
  isOpen: boolean;
  onClose: () => void;
  adminNotes?: string;
  demandedDocs?: string[];
  onSuccess: () => void;
}

interface UploadedDocItem {
  title: string;
  fileData: string;
  filename: string;
  filesize: string;
}

export const CenterDemandDocsUploadModal: React.FC<CenterDemandDocsUploadModalProps> = ({
  centerId,
  isOpen,
  onClose,
  adminNotes,
  demandedDocs = [],
  onSuccess
}) => {
  const [docItems, setDocItems] = useState<UploadedDocItem[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [centerNotes, setCenterNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, customTitle?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const titleToUse = customTitle || newDocTitle || file.name.split('.')[0] || 'Verification Document';

      setDocItems(prev => [
        ...prev,
        {
          title: titleToUse,
          fileData: base64,
          filename: file.name,
          filesize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        }
      ]);
      setNewDocTitle('');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (index: number) => {
    setDocItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docItems.length === 0) {
      setErrorMsg('Please upload at least one required document.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/submit-demanded-docs`, {
        notes: centerNotes,
        docs: docItems
      });

      if (res.data?.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.data?.message || 'Submission failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit documents.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] text-slate-800 animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload Requested Verification Documents</h3>
              <p className="text-[11px] text-amber-100">
                Official Document Demand by Super Admin Accreditation Board
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">

          {/* Super Admin Notice Card */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle size={15} className="text-amber-600" />
              <span>Super Admin Demand Instructions:</span>
            </div>
            <p className="text-xs text-amber-950 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/60 whitespace-pre-line">
              {adminNotes || 'Please upload the requested identity / premises documents to proceed with certificate verification.'}
            </p>

            {demandedDocs && demandedDocs.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1.5">
                  Demanded Documents Checklist:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {demandedDocs.map((docName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-amber-200/80 text-amber-950 rounded-lg text-xs font-bold border border-amber-300"
                    >
                      • {docName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Document Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Upload size={14} className="text-indigo-600" />
              <span>Upload Files (Image or PDF - Max 8MB each)</span>
            </h4>

            {/* Quick Upload Boxes for Demanded Docs if defined */}
            {demandedDocs && demandedDocs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-500 font-medium">Quick upload for listed requirements:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demandedDocs.map((docTitle, idx) => {
                    const isAlreadyAdded = docItems.some(item => item.title === docTitle);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          isAlreadyAdded
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200'
                        }`}
                      >
                        <div className="truncate flex-1">
                          <span className="font-bold text-xs block truncate">{docTitle}</span>
                          <span className="text-[10px] text-slate-500">
                            {isAlreadyAdded ? '✓ Attached' : 'Select file to upload'}
                          </span>
                        </div>
                        <label className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0">
                          {isAlreadyAdded ? 'Replace' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, docTitle)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generic Add Document Box */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center text-center gap-2">
              <FileText size={28} className="text-slate-400" />
              <div>
                <span className="font-bold text-xs text-slate-700 block">Upload Additional / Other Document</span>
                <span className="text-[11px] text-slate-400">Click button below to select image or document</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Document Label (e.g., Electricity Bill)"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white outline-none w-48 font-medium"
                />
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs">
                  <Plus size={14} />
                  <span>Attach File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e)}
                  />
                </label>
              </div>
            </div>

            {/* Attached Files List */}
            {docItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Attached Documents ({docItems.length}):
                </span>
                <div className="space-y-1.5">
                  {docItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.filename} ({item.filesize})
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Head Message / Remark */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Message / Clarification Note for Super Admin (Optional):
            </label>
            <textarea
              rows={2}
              value={centerNotes}
              onChange={(e) => setCenterNotes(e.target.value)}
              placeholder="e.g. Attached the latest electricity bill and renewed rent deed as requested by administration."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-500 bg-white"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || docItems.length === 0}
            onClick={handleSubmit}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all ${
              submitting || docItems.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20'
            }`}
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Submit Documents to Super Admin</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CenterDemandDocsUploadModal;

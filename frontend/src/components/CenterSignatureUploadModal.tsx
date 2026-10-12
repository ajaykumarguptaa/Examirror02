import React, { useState, useEffect } from 'react';
import { 
  X, Upload, CheckCircle2, ShieldCheck, Sparkles, Trash2, 
  Building2, UserCheck, RefreshCw, PenTool, Stamp
} from 'lucide-react';
import axios from 'axios';
import { getAssetUrl } from '../utils/axiosSetup';

interface CenterSignatureUploadModalProps {
  isOpen: boolean;
  centerId: number | string;
  initialSignature?: string;
  initialStamp?: string;
  initialHeadName?: string;
  centerName?: string;
  onClose: () => void;
  onSaved?: (updated: { signature_url: string; stamp_url: string; head_name: string }) => void;
}

export const CenterSignatureUploadModal: React.FC<CenterSignatureUploadModalProps> = ({
  isOpen,
  centerId,
  initialSignature = '',
  initialStamp = '',
  initialHeadName = '',
  centerName = 'Study Center',
  onClose,
  onSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [headName, setHeadName] = useState(initialHeadName);
  const [sigPreview, setSigPreview] = useState<string>(initialSignature);
  const [stampPreview, setStampPreview] = useState<string>(initialStamp);

  useEffect(() => {
    setHeadName(initialHeadName);
    setSigPreview(initialSignature);
    setStampPreview(initialStamp);
  }, [initialSignature, initialStamp, initialHeadName, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'signature') {
        setSigPreview(base64);
      } else {
        setStampPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!centerId) {
      setToast({ type: 'error', message: 'Center ID not found.' });
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/center/${centerId}/signature-stamp`, {
        signature_url: sigPreview,
        stamp_url: stampPreview,
        head_name: headName
      });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Center signature & stamp updated successfully!' });
        if (onSaved) {
          onSaved({
            signature_url: res.data.data?.signature_url || sigPreview,
            stamp_url: res.data.data?.stamp_url || stampPreview,
            head_name: headName
          });
        }
        setTimeout(() => {
          setToast(null);
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to update signature.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden relative flex flex-col my-4">
        
        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <CheckCircle2 size={16} />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a192f] text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-400/20 text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded">
                  Center Settings
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Center Director E-Signature & Stamp
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <ShieldCheck size={18} className="text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{centerName}</p>
              <p className="text-[11px] text-blue-800/90 mt-0.5">
                Upload once to permanently apply this signature and official rubber stamp to all student certificates and marksheets issued by your center.
              </p>
            </div>
          </div>

          {/* Center Head Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Center Director / Head Full Name
            </label>
            <input
              type="text"
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900"
            />
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Center Director Signature */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 transition-all flex flex-col items-center justify-between text-center min-h-[200px]">
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <PenTool size={14} className="text-blue-600" /> Director Signature
                </span>
                {sigPreview && (
                  <button
                    type="button"
                    onClick={() => setSigPreview('')}
                    className="text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              <div className="my-auto w-full flex flex-col items-center justify-center">
                {sigPreview ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <img 
                      src={sigPreview.startsWith('data:') ? sigPreview : getAssetUrl(sigPreview)} 
                      alt="Center Signature Preview" 
                      className="max-h-14 max-w-[160px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload size={26} className="mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">Upload Signature</p>
                    <p className="text-[10px] text-slate-400">PNG / JPG (crop closely)</p>
                  </div>
                )}
              </div>

              <label className="mt-3 w-full py-2 px-3 bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50/50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-2xs block">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                  className="hidden"
                />
              </label>
            </div>

            {/* 2. Center Official Rubber Stamp */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 transition-all flex flex-col items-center justify-between text-center min-h-[200px]">
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Stamp size={14} className="text-indigo-600" /> Center Stamp / Seal
                </span>
                {stampPreview && (
                  <button
                    type="button"
                    onClick={() => setStampPreview('')}
                    className="text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              <div className="my-auto w-full flex flex-col items-center justify-center">
                {stampPreview ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <img 
                      src={stampPreview.startsWith('data:') ? stampPreview : getAssetUrl(stampPreview)} 
                      alt="Center Stamp Preview" 
                      className="w-14 h-14 object-contain rotate-[-6deg]"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Stamp size={26} className="mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">Upload Center Stamp</p>
                    <p className="text-[10px] text-slate-400">Round seal or rubber stamp</p>
                  </div>
                )}
              </div>

              <label className="mt-3 w-full py-2 px-3 bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50/50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-2xs block">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'stamp')}
                  className="hidden"
                />
              </label>
            </div>

          </div>

        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Save E-Signature</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

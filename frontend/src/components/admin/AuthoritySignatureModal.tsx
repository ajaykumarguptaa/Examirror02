import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Award, CheckCircle2, ShieldCheck, Sparkles, FileText,
  Trash2, Eye, Building2, UserCheck, RefreshCw, PenTool, Stamp
} from 'lucide-react';
import axios from 'axios';
import { ExamirrorOfficialStamp } from '../common/ExamirrorOfficialStamp';
import { getAssetUrl } from '../../utils/axiosSetup';

interface AuthoritySignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AuthoritySignatureModal: React.FC<AuthoritySignatureModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    authority_signature_url: '',
    authority_stamp_url: '',
    authority_title: 'Controller of Examinations',
    authority_name: 'Examirror Examination Board'
  });

  const [sigPreview, setSigPreview] = useState<string>('');
  const [stampPreview, setStampPreview] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/admin/authority-signature');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setFormData({
          authority_signature_url: d.authority_signature_url || '',
          authority_stamp_url: d.authority_stamp_url || '',
          authority_title: d.authority_title || 'Controller of Examinations',
          authority_name: d.authority_name || 'Examirror Examination Board'
        });
        setSigPreview(d.authority_signature_url || '');
        setStampPreview(d.authority_stamp_url || '');
      }
    } catch (err: any) {
      console.error('Failed to load authority signature settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'signature') {
        setSigPreview(base64);
        setFormData((prev) => ({ ...prev, authority_signature_url: base64 }));
      } else {
        setStampPreview(base64);
        setFormData((prev) => ({ ...prev, authority_stamp_url: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post('http://localhost:3000/api/admin/authority-signature', {
        authority_signature_url: formData.authority_signature_url,
        authority_stamp_url: formData.authority_stamp_url,
        authority_title: formData.authority_title,
        authority_name: formData.authority_name
      });
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Authority E-Signature & Stamp saved successfully! Applied to all certificates & marksheets.' });
        if (onSaved) onSaved();
        setTimeout(() => {
          setToast(null);
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative flex flex-col my-4">
        
        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <CheckCircle2 size={16} />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a192f] text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <PenTool size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[9px] font-bold uppercase tracking-wider rounded">
                  Super Admin Settings
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Authority Digital E-Signature & Stamp
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
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">National Academic Certificate & Marksheet Authority</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Upload once here. The Controller of Examinations signature and official seal will automatically be rendered on the left/authority side of all student certificates and marksheets across all authorized study centers.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading Authority Signature Data...</p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Signatory Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Authority Title / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.authority_title}
                    onChange={(e) => setFormData({ ...formData, authority_title: e.target.value })}
                    placeholder="e.g. Controller of Examinations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Authority / Board Name
                  </label>
                  <input
                    type="text"
                    value={formData.authority_name}
                    onChange={(e) => setFormData({ ...formData, authority_name: e.target.value })}
                    placeholder="e.g. Examirror Examination Board"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Upload Grid: Signature & Stamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* 1. Authority Signature */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 transition-all flex flex-col items-center justify-between text-center min-h-[220px]">
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <PenTool size={14} className="text-indigo-600" /> Authority E-Signature
                    </span>
                    {sigPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setSigPreview('');
                          setFormData((prev) => ({ ...prev, authority_signature_url: '' }));
                        }}
                        className="text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="my-auto w-full flex flex-col items-center justify-center">
                    {sigPreview ? (
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <img 
                          src={sigPreview.startsWith('data:') ? sigPreview : getAssetUrl(sigPreview)} 
                          alt="Authority Signature Preview" 
                          className="max-h-16 max-w-[180px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload size={28} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-600">Upload Digital Signature</p>
                        <p className="text-[10px] text-slate-400">PNG / Transparent background recommended</p>
                      </div>
                    )}
                  </div>

                  <label className="mt-3 w-full py-2 px-4 bg-white border border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-2xs block">
                    Choose File (.png, .jpg)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 2. Authority Official Seal / Stamp */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 transition-all flex flex-col items-center justify-between text-center min-h-[220px]">
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Stamp size={14} className="text-amber-600" /> Official Stamp / Seal
                    </span>
                    {stampPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setStampPreview('');
                          setFormData((prev) => ({ ...prev, authority_stamp_url: '' }));
                        }}
                        className="text-[10px] text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="my-auto w-full flex flex-col items-center justify-center">
                    {stampPreview ? (
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <img 
                          src={stampPreview.startsWith('data:') ? stampPreview : getAssetUrl(stampPreview)} 
                          alt="Official Stamp Preview" 
                          className="w-16 h-16 object-contain rotate-[-6deg]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Stamp size={28} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-600">Upload Official Seal / Stamp</p>
                        <p className="text-[10px] text-slate-400">Round rubber stamp or crest</p>
                      </div>
                    )}
                  </div>

                  <label className="mt-3 w-full py-2 px-4 bg-white border border-slate-300 hover:border-indigo-600 hover:bg-indigo-50/50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-2xs block">
                    Choose File (.png, .jpg)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'stamp')}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {/* Real-time Certificate Signature Preview Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-2">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} /> Live Certificate Footer Preview
                </div>
                <div className="bg-white text-slate-900 p-4 rounded-xl flex items-center justify-between gap-4 border border-amber-300/30">
                  
                  {/* Authority Block (Left) */}
                  <div className="flex flex-col items-center text-center relative min-w-[130px]">
                    <div className="h-10 flex items-end justify-center mb-1 relative w-full">
                      {stampPreview ? (
                        <img 
                          src={stampPreview.startsWith('data:') ? stampPreview : getAssetUrl(stampPreview)}
                          alt="Stamp"
                          className="w-10 h-10 object-contain opacity-85 rotate-[-8deg] absolute -top-3 -left-3 pointer-events-none"
                        />
                      ) : (
                        <div className="absolute -top-3 -left-3 pointer-events-none">
                          <ExamirrorOfficialStamp size={44} />
                        </div>
                      )}
                      {sigPreview ? (
                        <img 
                          src={sigPreview.startsWith('data:') ? sigPreview : getAssetUrl(sigPreview)}
                          alt="Signature"
                          className="max-h-8 max-w-[110px] object-contain relative z-10"
                        />
                      ) : (
                        <div className="font-serif italic text-[11px] font-bold text-slate-700 relative z-10">
                          (Signature)
                        </div>
                      )}
                    </div>
                    <div className="w-28 border-b-2 border-slate-800 mb-0.5" />
                    <span className="text-[10px] font-serif font-bold text-[#0a192f]">
                      {formData.authority_title}
                    </span>
                    <span className="text-[8px] text-slate-500 font-sans">
                      {formData.authority_name}
                    </span>
                  </div>

                  <div className="text-center font-mono text-[9px] text-slate-400">
                    [ Official ISO Seal & QR ]
                  </div>

                  {/* Center Director Block (Right) */}
                  <div className="flex flex-col items-center text-center relative min-w-[130px]">
                    <div className="h-10 flex items-end justify-center mb-1 relative w-full">
                      <div className="font-serif italic text-[11px] font-bold text-slate-400">
                        (Center Signature)
                      </div>
                    </div>
                    <div className="w-28 border-b-2 border-slate-800 mb-0.5" />
                    <span className="text-[10px] font-serif font-bold text-[#0a192f]">
                      Center Director
                    </span>
                    <span className="text-[8px] text-slate-500 font-sans">
                      Authorised Study Center
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}
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
                <span>Saving Signatures...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Save & Apply Globally</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

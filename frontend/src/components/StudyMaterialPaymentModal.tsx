import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Upload, ArrowRight, ShieldCheck, IndianRupee, Sparkles, FileText } from 'lucide-react';
import axios from 'axios';

interface StudyMaterialPaymentModalProps {
  material: any;
  student: any;
  onClose: () => void;
  onSuccess: () => void;
  userType?: 'student' | 'center';
}

export const StudyMaterialPaymentModal: React.FC<StudyMaterialPaymentModalProps> = ({
  material,
  student,
  onClose,
  onSuccess,
  userType = 'student'
}) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upiId = material.qr_upi_id || 'examirror@upi';
  const accountName = material.qr_account_name || 'Examirror Educational Foundation';
  const price = userType === 'center' 
    ? Number(material.center_price != null ? material.center_price : material.price || 0)
    : Number(material.student_price != null ? material.student_price : material.price || 0);

  const qrUrl = material.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountName)}&am=${price.toFixed(2)}&cu=INR`
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.length < 6) {
      setError('Please enter a valid 12-digit UPI / UTR Transaction ID.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem(userType === 'center' ? 'centerToken' : 'studentToken');
      const endpoint = userType === 'center' 
        ? `http://localhost:3000/api/study-materials/center/${material.id}/purchase`
        : `http://localhost:3000/api/study-materials/student/${material.id}/purchase`;
        
      const res = await axios.post(endpoint, {
        utr_number: utrNumber.trim(),
        amount: price,
        payment_mode: 'UPI_QR',
        ...(userType === 'center' ? { centerId: localStorage.getItem('centerId') || localStorage.getItem('userId') } : {})
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data?.success) {
        onSuccess();
      } else {
        setError(res.data?.message || 'Payment submission failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100">
              Unlock Note
            </span>
            <span className="text-xs text-slate-500 font-medium">Instant Access</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">
            {material.title}
          </h3>
          <p className="text-xs text-slate-500">
            One-time study material pass with anti-piracy secure reader access.
          </p>
        </div>

        {/* Amount to Pay Banner */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Amount to Pay</div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
              <IndianRupee size={22} className="text-indigo-600" />
              <span>{price.toFixed(2)}</span>
            </div>
          </div>
          <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-2xs">
            One-time Purchase
          </span>
        </div>

        {/* HDFC Bank QR Code Container */}
        <div className="relative flex flex-col items-center">
          <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-xs relative flex items-center justify-center">
            <img
              src="/assets/hdfc-qr.png"
              alt="HDFC Bank QR Code"
              className="w-48 h-48 object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2.5">
            Scan & Pay via PhonePe / GPay / Paytm / Any UPI App
          </span>
        </div>

        {/* Bank Details Table */}
        <div className="w-full overflow-hidden border border-gray-200 rounded-xl shadow-2xs bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 w-36 border-r border-gray-200">
                  Account Holder
                </td>
                <td className="py-2.5 px-4 font-bold text-gray-900 tracking-wide uppercase text-xs">
                  EXAMIRROREDUTECH PRIVATE LIMITED
                </td>
              </tr>
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                  Ac/No.
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-sm">
                  50200100145470
                </td>
              </tr>
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                  Bank
                </td>
                <td className="py-2.5 px-4 font-bold text-gray-900 uppercase">
                  HDFC BANK
                </td>
              </tr>
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                  IFSC
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-gray-900 uppercase">
                  HDFC0002643
                </td>
              </tr>
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                  Branch
                </td>
                <td className="py-2.5 px-4 font-semibold text-gray-900 uppercase">
                  PATLIPUTRA
                </td>
              </tr>
              <tr className="hover:bg-gray-50/60">
                <td className="py-2.5 px-4 font-bold text-gray-800 bg-gray-50/80 border-r border-gray-200">
                  Account Type
                </td>
                <td className="py-2.5 px-4 font-semibold text-gray-900">
                  Current Account
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* UTR Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              UPI Reference / 12-Digit UTR Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 427819203812"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            />
            <p className="text-[10px] text-slate-500">
              Enter the transaction reference from GPay, PhonePe, Paytm, or BHIM.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              {submitting ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Submit Payment UTR</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Encrypted payment verification with Examirror guarantee</span>
        </div>

      </div>
    </div>
  );
};

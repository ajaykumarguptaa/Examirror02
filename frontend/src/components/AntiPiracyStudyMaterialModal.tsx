import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ShieldAlert, ShieldCheck, Lock, Eye, BookOpen, AlertTriangle, 
  Sparkles, Building2, User, Clock, FileText, ChevronRight, FileCode,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Check, RefreshCw, LayoutTemplate,
  Monitor, Columns, Smartphone, QrCode, Copy, CreditCard, CheckCircle2, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { getAssetUrl } from '../utils/axiosSetup';
import { prepareSafeHtmlContent } from '../utils/htmlNoteSecurity';

interface AntiPiracyStudyMaterialModalProps {
  materialId: number | string;
  student?: any;
  onClose: () => void;
  onUnlockClick?: (materialId: number | string) => void;
}

export const AntiPiracyStudyMaterialModal: React.FC<AntiPiracyStudyMaterialModalProps> = ({
  materialId,
  student,
  onClose,
  onUnlockClick
}) => {
  const [loading, setLoading] = useState(true);
  const [materialData, setMaterialData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScreenCaptured, setIsScreenCaptured] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'AUTO' | 'HTML' | 'PDF'>('AUTO');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readerWidth, setReaderWidth] = useState<'full' | 'standard'>('full');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Inline Payment state when no external callback passed
  const [showInlinePayment, setShowInlinePayment] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    fetchSecureContent();

    // Anti-piracy screenshot & copy keyboard blocker
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Print (Ctrl+P, Cmd+P), Save (Ctrl+S, Cmd+S), Source (Ctrl+U), PrintScreen
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault();
        setIsScreenCaptured(true);
        setTimeout(() => setIsScreenCaptured(false), 2500);
      }
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setIsScreenCaptured(true);
        setTimeout(() => setIsScreenCaptured(false), 2500);
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [materialId]);

  // Usage Analytics Ping
  useEffect(() => {
    if (!sessionToken) return;
    
    const interval = setInterval(() => {
      axios.post('http://localhost:3000/api/study-materials/analytics/ping', {
        sessionToken,
        seconds: 10
      }).catch(err => console.error('Analytics ping failed', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionToken]);

  const fetchSecureContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const isCenter = window.location.pathname.startsWith('/center');
      const isAdmin = window.location.pathname.startsWith('/admin');
      
      let activeToken = null;
      if (isCenter) {
        activeToken = localStorage.getItem('centerToken') || localStorage.getItem('token');
      } else if (isAdmin) {
        activeToken = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || localStorage.getItem('token');
      } else {
        activeToken = localStorage.getItem('studentToken');
      }

      // Explicitly pass centerId in the query if available to ensure fallback works even if token is expired
      const centerIdParam = student?.centerId ? `?centerId=${student.centerId}` : '';
      const res = await axios.get(`http://localhost:3000/api/study-materials/student/${materialId}/view${centerIdParam}`, {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
      });
      if (res.data?.success) {
        setMaterialData(res.data.data);
        
        // Start analytics session
        try {
          const analyticsRes = await axios.post(`http://localhost:3000/api/study-materials/analytics/${materialId}/start`, { viewType: 'FULL' }, {
            headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
          });
          if (analyticsRes.data.success) {
            setSessionToken(analyticsRes.data.sessionToken);
          }
        } catch (err) {
          console.error('Failed to start analytics', err);
        }
      } else {
        setError(res.data?.message || 'Failed to load secure document.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Access restricted. Please unlock this note.');
    } finally {
      setLoading(false);
    }
  };

  const stamp = materialData?.watermarkStamp || {
    watermarkText: `EXAMIRROR SECURE • CANDIDATE: ${(student?.firstName || 'STUDENT').toUpperCase()} ${(student?.lastName || '').toUpperCase()} • ROLL: ${student?.roll_no || student?.id || 'AUTH-SECURE'} • ${student?.centerName || 'AUTHORIZED CENTER'}`,
    candidateName: `${student?.firstName || 'Student'} ${student?.lastName || 'Candidate'}`,
    rollNo: student?.roll_no || `ROL-${10000 + (student?.id || 1)}`,
    enrollmentNo: student?.enrollment_no || `EXAM-2026-${student?.id || 1}`,
    centerName: student?.centerName || 'Examirror Authorized E-Library',
    centerCode: student?.centerCode || '6767',
    accessTime: new Date().toLocaleDateString('en-GB')
  };

  const isHtml = materialData?.file_type === 'HTML' || (materialData?.content_text && /<[a-z][\s\S]*>/i.test(materialData.content_text));
  const hasPdfUrl = materialData?.file_url && (materialData.file_url.includes('pdf') || materialData.file_type === 'PDF');
  const effectiveMode = viewMode === 'AUTO' ? (isHtml ? 'HTML' : hasPdfUrl ? 'PDF' : 'HTML') : viewMode;

  const pdfSource = getAssetUrl(materialData?.file_url);

  // Prepare full-view interactive HTML document with anti-copy style injection and anchor link interceptor
  const preparedHtmlDoc = useMemo(() => {
    return prepareSafeHtmlContent(materialData?.content_text || '', materialData?.title || 'E-Note');
  }, [materialData?.content_text, materialData?.title]);

  return (
    <div 
      className="fixed inset-0 z-[150] w-full h-full min-h-screen flex flex-col bg-slate-950 select-none animate-in fade-in duration-200 overflow-hidden transform-gpu"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', transform: 'translate3d(0,0,0)', willChange: 'transform' }}
    >
      <div className="bg-slate-950 w-full h-full flex-1 flex flex-col border-0 rounded-none overflow-hidden relative min-h-0 transform-gpu">
        
        {/* Anti-Screen Recording Blur Shield */}
        {isScreenCaptured && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert size={36} />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-xl font-bold text-white">Examirror Digital Rights Protection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Screenshots, screen recording, and unauthorized copying are strictly prohibited. Click back into this window to resume reading.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsScreenCaptured(false)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Resume Reading
            </button>
          </div>
        )}

        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 transform-gpu relative z-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              {effectiveMode === 'HTML' ? <FileCode size={18} /> : <BookOpen size={18} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider rounded">
                  Anti-Piracy Protected
                </span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold rounded uppercase">
                  {materialData?.file_type || (effectiveMode === 'HTML' ? 'HTML E-NOTE' : 'PDF')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                  Doc ID #{materialId}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-mono font-bold rounded hidden lg:inline">
                  100% FULL-WIDTH VIEW
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5 max-w-md sm:max-w-2xl">
                {materialData?.title || 'Secure E-Note Document'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle if both HTML and PDF exist */}
            {(materialData?.content_text && hasPdfUrl) && (
              <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('HTML')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    effectiveMode === 'HTML' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  HTML View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('PDF')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                    effectiveMode === 'PDF' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PDF Document
                </button>
              </div>
            )}

            {/* Reader Width Switcher */}
            {effectiveMode === 'HTML' && (
              <div className="hidden lg:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setReaderWidth('full')}
                  title="Full 100% Width Interactive View"
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    readerWidth === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor size={12} /> 100% Width
                </button>
                <button
                  type="button"
                  onClick={() => setReaderWidth('standard')}
                  title="Centered Book Layout"
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    readerWidth === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns size={12} /> Centered (1200px)
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            {effectiveMode === 'HTML' && (
              <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  title="Zoom Out"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-2 text-[10px] font-mono text-slate-300 font-bold">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(160, prev + 10))}
                  title="Zoom In"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="Close Note Reader"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Security Warning Strip - 100% Width */}
        <div className="w-full bg-amber-50 border-b border-amber-200/80 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-amber-900 shrink-0 gap-2 transform-gpu relative z-40">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck size={14} className="text-amber-700 shrink-0" />
            <span>Watermarked with Candidate Roll ({stamp.rollNo}) & Center Code ({stamp.centerCode}). Redistribution strictly prohibited.</span>
          </div>
          <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
            SECURE DRM • EXAMIRROR ACADEMY
          </span>
        </div>

        {/* Content Viewer Body - 100% EDGE-TO-EDGE VIEWPORT */}
        <div className="flex-1 min-h-0 w-full overflow-hidden p-0 m-0 relative flex flex-col items-center justify-center bg-slate-950">
          
          {loading ? (
            <div className="py-28 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decrypting Secure Note...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl my-auto text-white">
              {!showInlinePayment ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner">
                    <Lock size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Access Restricted</h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">{error}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUnlockClick) {
                          onUnlockClick(materialId);
                        } else {
                          setShowInlinePayment(true);
                        }
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2 border border-indigo-400/30"
                    >
                      <QrCode size={16} /> Pay & Unlock Note
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setShowInlinePayment(false)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      UPI Payment Gateway
                    </span>
                  </div>

                  {paymentSuccess ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs font-bold space-y-3 text-center">
                      <CheckCircle2 size={28} className="mx-auto text-emerald-400" />
                      <p>{paymentSuccess}</p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Close Reader
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!utrNumber.trim() || utrNumber.length < 6) {
                        setPaymentError('Please enter a valid 12-digit UPI / UTR Transaction ID.');
                        return;
                      }
                      setSubmittingPayment(true);
                      setPaymentError(null);
                      try {
                        let token = null;
                        if (window.location.pathname.startsWith('/center')) {
                          token = localStorage.getItem('centerToken') || localStorage.getItem('token');
                        } else if (window.location.pathname.startsWith('/admin')) {
                          token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || localStorage.getItem('token');
                        } else {
                          token = localStorage.getItem('studentToken');
                        }
                        const res = await axios.post(`http://localhost:3000/api/study-materials/student/${materialId}/purchase`, {
                          utr_number: utrNumber.trim(),
                          payment_mode: 'UPI_QR'
                        }, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                        });
                        if (res.data?.success) {
                          setPaymentSuccess('Payment reference submitted successfully! Access will be unlocked upon verification.');
                        } else {
                          setPaymentError(res.data?.message || 'Payment submission failed.');
                        }
                      } catch (err: any) {
                        setPaymentError(err.response?.data?.message || 'Failed to submit payment reference.');
                      } finally {
                        setSubmittingPayment(false);
                      }
                    }} className="space-y-4">
                      {/* HDFC Bank QR Code Container */}
                      <div className="flex flex-col items-center">
                        <div className="p-2.5 bg-white border border-gray-300 rounded-xl shadow-xs relative flex items-center justify-center">
                          <img
                            src="/assets/hdfc-qr.png"
                            alt="HDFC Bank QR Code"
                            className="w-40 h-40 object-contain rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">
                          Scan & Pay via PhonePe / GPay / Paytm / Any UPI App
                        </span>
                      </div>

                      {/* Bank Details Table */}
                      <div className="w-full overflow-hidden border border-slate-800 rounded-xl bg-slate-900/90 text-slate-200">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <tbody className="divide-y divide-slate-800">
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 w-32 border-r border-slate-800">
                                Account Holder
                              </td>
                              <td className="py-2 px-3 font-bold text-white uppercase text-[10px]">
                                EXAMIRROREDUTECH PRIVATE LIMITED
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 border-r border-slate-800">
                                Ac/No.
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-400 text-xs">
                                50200100145470
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 border-r border-slate-800">
                                Bank
                              </td>
                              <td className="py-2 px-3 font-bold text-white uppercase">
                                HDFC BANK
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 border-r border-slate-800">
                                IFSC
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-white uppercase">
                                HDFC0002643
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 border-r border-slate-800">
                                Branch
                              </td>
                              <td className="py-2 px-3 font-semibold text-white uppercase">
                                PATLIPUTRA
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-bold text-slate-400 bg-slate-950/60 border-r border-slate-800">
                                Account Type
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-300">
                                Current Account
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {paymentError && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold">
                          {paymentError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Enter 12-Digit UTR / Transaction ID
                        </label>
                        <input
                          type="text"
                          required
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 428900123456"
                          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowInlinePayment(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                        >
                          {submittingPayment ? 'Submitting...' : 'Submit Payment Reference'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : effectiveMode === 'PDF' && hasPdfUrl ? (
            /* PDF VIEWER MODE - 100% FULL-WIDTH WITH WATERMARK OVERLAY */
            <div className="w-full h-full flex-1 flex flex-col items-center relative bg-slate-900 overflow-hidden border-0">
              {/* REPEATING EXAMIRROR SECURITY WATERMARK GRID */}
              <div 
                className="absolute inset-0 pointer-events-none z-20 flex flex-wrap items-center justify-center gap-24 opacity-[0.08] overflow-hidden rotate-[-25deg] transform scale-125 select-none"
              >
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="text-center font-black font-mono uppercase text-white tracking-wider text-xs whitespace-nowrap">
                    EXAMIRROR SECURE PDF • {stamp.candidateName} • {stamp.rollNo} • {stamp.centerCode}
                  </div>
                ))}
              </div>

              <iframe
                src={`${pdfSource}#toolbar=0&navpanes=0&scrollbar=1`}
                title={materialData.title}
                className="w-full h-full flex-1 border-0 relative z-10 block"
              />
            </div>
          ) : (
            /* 100% FULL-WIDTH INTERACTIVE HTML E-NOTE VIEWER */
            <div className={`w-full h-full flex-1 flex flex-col relative overflow-hidden bg-white transition-all transform-gpu z-10 ${
              readerWidth === 'standard' ? 'max-w-6xl mx-auto border-x border-slate-200 shadow-2xl' : 'w-full max-w-none border-0'
            }`}>
              
              {/* REPEATING EXAMIRROR SECURITY WATERMARK GRID OVERLAY */}
              <div 
                className="absolute inset-0 pointer-events-none z-20 flex flex-wrap items-center justify-center gap-28 opacity-[0.05] overflow-hidden rotate-[-25deg] transform scale-125 select-none"
              >
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="text-center font-black font-mono uppercase text-slate-950 tracking-wider text-xs whitespace-nowrap">
                    EXAMIRROR SECURE NOTE • {stamp.candidateName} • {stamp.rollNo} • {stamp.centerCode}
                  </div>
                ))}
              </div>

              {/* Sandboxed 100% Full-Width Interactive HTML Document Frame */}
              {preparedHtmlDoc ? (
                <iframe
                  srcDoc={preparedHtmlDoc}
                  title={materialData.title || 'Interactive HTML Note'}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="w-full h-full flex-1 border-0 relative z-10 bg-white block"
                  style={{ 
                    zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <FileText size={48} className="mx-auto text-slate-400 mb-3" />
                  <p className="font-bold text-slate-800 text-sm">No HTML Content Found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Format: {materialData.file_type || 'Document'} • Size: {materialData.file_size || '2.5 MB'}
                  </p>
                  {hasPdfUrl && (
                    <button
                      type="button"
                      onClick={() => setViewMode('PDF')}
                      className="mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Switch to PDF Viewer
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Bottom Controls - 100% Width */}
        <div className="w-full p-2.5 px-4 sm:px-6 bg-slate-900 text-slate-300 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">100% Full-Width Secure Note Stream • {materialData?.file_size || '2.5 MB'}</span>
            <span className="sm:hidden">{materialData?.file_size || '2.5 MB'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs active:scale-95"
            >
              Close Reader
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};



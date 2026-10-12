import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Check,
  Building2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { CenterCertificateCard, type CenterCertificateData, CENTER_CERT_WIDTH, CENTER_CERT_HEIGHT } from './CenterCertificateCard';

interface CenterCertificateModalProps {
  center: CenterCertificateData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CenterCertificateModal: React.FC<CenterCertificateModalProps> = ({
  center,
  isOpen,
  onClose
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 0.5;
      if (window.innerWidth < 1024) return 0.68;
      if (window.innerWidth < 1440) return 0.8;
      return 0.88;
    }
    return 0.8;
  });
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !center) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.examirror.in';
  const verifyUrl = `${origin}/verify/center/${encodeURIComponent(center.centerCode)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    const certElement = document.getElementById('center-affiliation-certificate');
    if (!certElement) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(certElement, {
        scale: 2.5, // 2.5x retina quality for ultra crisp printing & PDF export
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfbfa',
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${center.centerName.replace(/[^a-zA-Z0-9]/g, '_')}_Center_Affiliation_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download center certificate:', err);
      alert('Unable to generate image. Please use the Print button to Save as PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const msg = `*EXAMIRROR EDUTECH - CENTER ACCREDITATION CERTIFICATE*\n\n` +
      `🏛️ *Center Name:* ${center.centerName}\n` +
      `🆔 *Center Code:* ${center.centerCode}\n` +
      `📜 *Certificate No:* ${center.certificateNumber || 'EXAM-ATC-2026'}\n` +
      `👤 *Center Director:* ${center.headName}\n\n` +
      `Official Verification URL:\n${verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container Card */}
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shadow-xs">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Official Center Affiliation Certificate
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Verified & Authorized</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {center.centerName} &bull; Code: <span className="font-mono font-bold text-amber-300">{center.centerCode}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2">
            {/* Interactive Zoom Controls */}
            <div className="hidden md:flex items-center bg-white/10 rounded-xl p-1 border border-white/10 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.08).toFixed(2))))}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="font-mono px-1.5 text-[11px] font-bold text-amber-300 min-w-[38px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(1.2, Number((prev + 0.08).toFixed(2))))}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const defaultZoom = typeof window !== 'undefined'
                    ? (window.innerWidth < 640 ? 0.5 : window.innerWidth < 1024 ? 0.68 : window.innerWidth < 1440 ? 0.8 : 0.88)
                    : 0.8;
                  setZoomLevel(defaultZoom);
                }}
                className="px-2 py-0.5 hover:bg-white/20 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Print Certificate"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
              title="Download HD Certificate"
            >
              <Download size={14} />
              <span>{downloading ? 'Exporting...' : 'Download HD'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Share on WhatsApp"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Certificate Viewport */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-4 sm:p-8 flex items-center justify-center">
          <div 
            style={{
              width: `${Math.round(CENTER_CERT_WIDTH * zoomLevel)}px`,
              height: `${Math.round(CENTER_CERT_HEIGHT * zoomLevel)}px`
            }}
            className="relative shadow-2xl rounded-sm transition-all flex items-center justify-center overflow-hidden shrink-0 my-auto"
          >
            <div 
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                width: `${CENTER_CERT_WIDTH}px`,
                height: `${CENTER_CERT_HEIGHT}px`
              }}
            >
              <CenterCertificateCard center={center} />
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Online Verification:</span>
            <span className="font-mono text-indigo-600 text-[11px] truncate max-w-xs">{verifyUrl}</span>
            <button
              onClick={handleCopyLink}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Copy link"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Certificate ID: <strong className="text-slate-800 font-mono">{center.certificateNumber || 'EXAM-ATC-2026'}</strong></span>
            <span>&bull;</span>
            <span>Authorized by <strong>Examirror Edutech Pvt. Ltd.</strong></span>
          </div>
        </div>

      </div>

      {/* Print-specific style tags */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #center-affiliation-certificate, #center-affiliation-certificate * {
            visibility: visible;
          }
          #center-affiliation-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw !important;
            height: 100vh !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CenterCertificateModal;

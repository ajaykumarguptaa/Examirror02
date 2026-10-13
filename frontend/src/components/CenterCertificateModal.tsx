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
  Maximize2,
  FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import axios from '../utils/axiosSetup';
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

  // Helper to calculate exact optimal zoom scale fitting both modal width & height
  const calculateOptimalZoom = () => {
    if (typeof window === 'undefined') return 0.75;
    const modalMaxW = Math.min(window.innerWidth - 32, 1152);
    const modalMaxH = window.innerHeight * 0.94 - 150; // account for header & footer
    const scaleW = (modalMaxW - 64) / CENTER_CERT_WIDTH;
    const scaleH = modalMaxH / CENTER_CERT_HEIGHT;
    return Math.min(0.95, Math.max(0.35, Number(Math.min(scaleW, scaleH).toFixed(2))));
  };

  const [zoomLevel, setZoomLevel] = useState<number>(calculateOptimalZoom);

  if (!isOpen || !center) return null;

  // Normalize center data
  const centerCode = center.centerCode || (center as any).code || (center as any).center_code || 'EXAMc2026-101';
  const centerName = center.centerName || (center as any).name || (center as any).center_name || 'Authorized Study Centre';
  const certNo = center.certificateNumber || (center as any).certificate_number || `EXAM-ATC-2026-${String(center.id || 101).padStart(4, '0')}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.examirror.in';
  const verifyUrl = `${origin}/verify/center/${encodeURIComponent(centerCode)}`;

  const handlePrint = () => {
    const certElement = document.getElementById('center-affiliation-certificate');
    if (!certElement) {
      window.print();
      return;
    }

    // 1. Clone certificate element and neutralize zoom transforms
    const certClone = certElement.cloneNode(true) as HTMLElement;
    certClone.style.transform = 'none';
    certClone.style.margin = '0 auto';
    certClone.style.boxShadow = 'none';
    certClone.style.position = 'static';

    const cleanTitle = `${centerName.replace(/[^a-zA-Z0-9]/g, '_')}_Affiliation_Certificate_${centerCode}`;

    // 2. Open dedicated print window matching StudentCertificateModal pattern
    const printWindow = window.open('', '_blank', 'width=1250,height=850');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <base href="${origin}/" />
          <title>${cleanTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape !important;
              margin: 0 !important;
            }
            *, *::before, *::after {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fcfbfa !important;
              width: 100% !important;
              height: 100% !important;
              font-family: 'Inter', sans-serif;
            }
            .font-serif {
              font-family: 'Cinzel', serif, Georgia;
            }
            .font-mono {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .font-cursive {
              font-family: 'Great Vibes', cursive;
            }
            .cert-print-container {
              width: 297mm;
              height: 210mm;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              overflow: hidden;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cert-print-scaler {
              width: ${CENTER_CERT_WIDTH}px;
              height: ${CENTER_CERT_HEIGHT}px;
              transform: scale(0.96);
              transform-origin: center center;
              box-shadow: none !important;
              margin: 0 auto;
              flex-shrink: 0;
            }
            @media screen {
              body {
                background: #1e293b !important;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 16px;
              }
              .cert-print-container {
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                background: #fcfbfa;
              }
            }
            @media print {
              body {
                background: #fcfbfa !important;
                overflow: hidden !important;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body class="bg-[#fcfbfa] text-slate-900 m-0 p-0 overflow-hidden">
          <div class="cert-print-container">
            <div class="cert-print-scaler">
              ${certClone.outerHTML}
            </div>
          </div>
          <script>
            function triggerPrint() {
              window.focus();
              window.print();
              window.onafterprint = function() {
                window.close();
              };
              // Fallback close after printing or cancelling
              setTimeout(function() {
                try { window.close(); } catch (_) {}
              }, 4000);
            }

            window.onload = function() {
              function proceed() {
                var imgs = Array.from(document.images);
                if (imgs.length === 0) {
                  setTimeout(triggerPrint, 400);
                } else {
                  var loaded = 0;
                  var total = imgs.length;
                  var fired = false;
                  function check() {
                    loaded++;
                    if (loaded >= total && !fired) {
                      fired = true;
                      setTimeout(triggerPrint, 350);
                    }
                  }
                  imgs.forEach(function(img) {
                    if (img.complete) {
                      check();
                    } else {
                      img.addEventListener('load', check);
                      img.addEventListener('error', check);
                    }
                  });
                  setTimeout(function() {
                    if (!fired) {
                      fired = true;
                      triggerPrint();
                    }
                  }, 1200);
                }
              }

              if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(proceed).catch(proceed);
              } else {
                proceed();
              }
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPdf = async () => {
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
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // A4 landscape is exactly 297mm x 210mm
      pdf.addImage(image, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      pdf.save(`${centerName.replace(/[^a-zA-Z0-9]/g, '_')}_Center_Affiliation_Certificate_${centerCode}.pdf`);

      // Automatically store generated PDF in AWS S3 Bucket
      const pdfBase64 = pdf.output('datauristring');
      axios.post('/api/certificates/save-to-s3', {
        type: 'center',
        identifier: centerCode,
        fileBase64: pdfBase64,
        format: 'pdf',
        title: centerName
      }).catch(s3Err => {
        console.warn('[S3] Auto-archive certificate notice:', s3Err?.message || s3Err);
      });
    } catch (err) {
      console.error('Failed to download center certificate PDF:', err);
      // Fallback: trigger print dialog to Save as PDF
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    const certElement = document.getElementById('center-affiliation-certificate');
    if (!certElement) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(certElement, {
        scale: 2.5, // 2.5x retina quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfbfa',
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${centerName.replace(/[^a-zA-Z0-9]/g, '_')}_Center_Affiliation_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Automatically store generated HD PNG in AWS S3 Bucket
      axios.post('/api/certificates/save-to-s3', {
        type: 'center',
        identifier: centerCode,
        fileBase64: image,
        format: 'png',
        title: centerName
      }).catch(s3Err => {
        console.warn('[S3] Auto-archive certificate PNG notice:', s3Err?.message || s3Err);
      });
    } catch (err) {
      console.error('Failed to download center certificate image:', err);
      handlePrint();
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
      `🏛️ *Center Name:* ${centerName}\n` +
      `🆔 *Center Code:* ${centerCode}\n` +
      `📜 *Certificate No:* ${certNo}\n` +
      `👤 *Center Director:* ${center.headName || 'Center Director'}\n\n` +
      `Official Verification URL:\n${verifyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="center-cert-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container Card */}
      <div className="center-cert-modal-card bg-white rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        
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
                {centerName} &bull; Code: <span className="font-mono font-bold text-amber-300">{centerCode}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2">
            {/* Interactive Zoom Controls */}
            <div className="hidden md:flex items-center bg-white/10 rounded-xl p-1 border border-white/10 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.35, Number((prev - 0.06).toFixed(2))))}
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
                onClick={() => setZoomLevel(prev => Math.min(1.2, Number((prev + 0.06).toFixed(2))))}
                className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(calculateOptimalZoom())}
                className="px-2 py-0.5 hover:bg-white/20 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Print Certificate (Landscape)"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
              title="Download Official PDF Certificate"
            >
              <FileText size={14} />
              <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
              title="Download High-Resolution PNG"
            >
              <Download size={14} />
              <span className="hidden sm:inline">HD PNG</span>
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
        <div className="center-cert-modal-viewport flex-1 overflow-auto bg-slate-300/70 p-4 sm:p-8 flex items-center justify-center min-h-[420px]">
          <div 
            style={{
              width: `${Math.round(CENTER_CERT_WIDTH * zoomLevel)}px`,
              height: `${Math.round(CENTER_CERT_HEIGHT * zoomLevel)}px`
            }}
            className="center-cert-zoom-wrapper relative shadow-2xl rounded-sm transition-all shrink-0 my-auto overflow-hidden bg-[#fcfbfa]"
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${CENTER_CERT_WIDTH}px`,
                height: `${CENTER_CERT_HEIGHT}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: '0 0'
              }}
              className="center-cert-scaled-box"
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
            <span>Certificate ID: <strong className="text-slate-800 font-mono">{certNo}</strong></span>
            <span>&bull;</span>
            <span>Authorized by <strong>Examirror Edutech Pvt. Ltd.</strong></span>
          </div>
        </div>

      </div>

      {/* Print-specific style tags for direct Cmd+P / browser print fallback */}
      <style>{`
        @page {
          size: A4 landscape !important;
          margin: 0 !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #fcfbfa !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          /* Neutralize modal wrappers so they don't clip content */
          .center-cert-modal-overlay,
          .center-cert-modal-card,
          .center-cert-modal-viewport,
          .center-cert-zoom-wrapper,
          .center-cert-scaled-box,
          .fixed, .absolute, .flex, .flex-col, .overflow-hidden, .overflow-y-auto, .max-h-full {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: auto !important;
          }
          #center-affiliation-certificate,
          #center-affiliation-certificate * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #center-affiliation-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: scale(0.96) !important;
            transform-origin: top left !important;
            width: ${CENTER_CERT_WIDTH}px !important;
            height: ${CENTER_CERT_HEIGHT}px !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CenterCertificateModal;

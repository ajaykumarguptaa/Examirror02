import { useState } from 'react';
import { X, Printer, ExternalLink, ZoomIn, ZoomOut, Scissors, CreditCard, FileText } from 'lucide-react';
import { StudentIdCard } from './StudentIdCard';

export const StudentIdCardModal = ({ student, onClose }: { student: any, onClose: () => void }) => {
  const [scale, setScale] = useState<number>(1.35);
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);

  if (!student) return null;

  const handlePrint = (mode: 'a4' | 'cr80' = 'a4') => {
    const cardElement = document.getElementById(`printable-id-card-${student.id}`);
    if (!cardElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print ID cards.');
      return;
    }

    const copiedStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    let pageStyles = '';
    let bodyContent = '';

    if (mode === 'a4') {
      pageStyles = `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 297mm;
        }
        .a4-single-page {
          width: 210mm;
          height: 297mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          box-sizing: border-box;
        }
        .print-note {
          font-family: monospace;
          font-size: 8pt;
          color: #64748b;
          margin-top: 6mm;
          text-align: center;
        }
      `;
      bodyContent = `
        <div class="a4-single-page">
          <div class="${showCutGuides ? 'cut-guide' : ''}">
            ${cardElement.outerHTML}
          </div>
          <div class="print-note">
            Examirror CR80 ID Card (53.98 × 85.60 mm • 638 × 1011 px @ 300 DPI) • Cut along dashed line
          </div>
        </div>
      `;
    } else {
      pageStyles = `
        @page {
          size: 53.98mm 85.60mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
      `;
      bodyContent = cardElement.outerHTML;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ID Card - ${student.firstName} ${student.lastName}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .cut-guide {
              outline: 0.5px dashed #94a3b8;
              outline-offset: 1px;
            }
            ${pageStyles}
          </style>
          ${copiedStyles}
        </head>
        <body>
          ${bodyContent}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 relative my-auto">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-amber-400">
          <div>
            <h3 className="font-bold text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} /> Official Student Identity Card
            </h3>
            <p className="text-[11px] text-slate-300">
              Standard CR80 (53.98 × 85.60 mm • 638 × 1011 px @ 300 DPI)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Toolbar */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none text-[11px]">
              <input
                type="checkbox"
                checked={showCutGuides}
                onChange={(e) => setShowCutGuides(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Scissors size={13} className="text-slate-500" /> Cut Guides
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Preview Zoom:</span>
            <button
              onClick={() => setScale(1)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                scale === 1 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title="100% 1:1 Actual physical card dimensions"
            >
              100% (1:1)
            </button>
            <button
              onClick={() => setScale(1.35)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                scale === 1.35 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title="135% Comfortable view"
            >
              135% (Fit)
            </button>
            <button
              onClick={() => setScale(1.6)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                scale === 1.6 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title="160% High definition view"
            >
              160% (HD)
            </button>
          </div>
        </div>

        {/* Card Canvas Preview */}
        <div className="p-6 bg-slate-200/60 flex flex-col items-center justify-center min-h-[360px] overflow-auto">
          <div className="shadow-2xl rounded-[3.6mm] overflow-hidden transition-transform duration-150">
            <StudentIdCard
              id={`printable-id-card-${student.id}`}
              student={student}
              showCutGuides={showCutGuides}
              previewScale={scale}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <a
            href={`/verify/student/${student.enrollment_no || student.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <ExternalLink size={13} /> Open Live Verification
          </a>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handlePrint('cr80')}
              className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print directly to standard CR80 PVC plastic card printer"
            >
              <CreditCard size={14} className="text-slate-600" /> Direct PVC Card
            </button>
            <button
              type="button"
              onClick={() => handlePrint('a4')}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Print formatted on standard A4 paper with cutting guides"
            >
              <Printer size={14} /> Print on A4 Sheet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

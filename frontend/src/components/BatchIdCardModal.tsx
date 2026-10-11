import { useState } from 'react';
import { X, Printer, Scissors, Layers, Check, ChevronLeft, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { StudentIdCard } from './StudentIdCard';

export interface BatchIdCardModalProps {
  students: any[];
  onClose: () => void;
}

export const BatchIdCardModal = ({ students, onClose }: BatchIdCardModalProps) => {
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number | 'all'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);

  const CARDS_PER_A4 = 9; // 3 columns x 3 rows grid
  const totalCards = students.length;

  // Chunk students into groups of 9 for each A4 sheet
  const a4Sheets: any[][] = [];
  for (let i = 0; i < totalCards; i += CARDS_PER_A4) {
    a4Sheets.push(students.slice(i, i + CARDS_PER_A4));
  }

  const totalSheets = a4Sheets.length;

  const handlePrint = (sheetIdx?: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups in your browser to print ID cards.');
      return;
    }

    const copiedStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    let sheetsToPrint: HTMLElement[] = [];
    if (typeof sheetIdx === 'number') {
      const el = document.getElementById(`a4-sheet-render-${sheetIdx}`);
      if (el) sheetsToPrint = [el];
    } else {
      const allEls = document.querySelectorAll('.a4-print-sheet-unit');
      sheetsToPrint = Array.from(allEls) as HTMLElement[];
    }

    if (sheetsToPrint.length === 0) {
      alert('No sheets found to print.');
      return;
    }

    const sheetsHTML = sheetsToPrint.map((s) => s.outerHTML).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Batch Print ID Cards - A4 Sheets (${totalCards} Cards)</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-print-sheet-unit {
              width: 210mm !important;
              height: 297mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              padding: 12mm 14mm !important;
              display: grid !important;
              grid-template-columns: repeat(3, 53.98mm) !important;
              grid-template-rows: repeat(3, 85.60mm) !important;
              column-gap: 10mm !important;
              row-gap: 8mm !important;
              box-sizing: border-box !important;
              justify-content: center !important;
              align-content: center !important;
              background: #ffffff !important;
              page-break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
            }
            .a4-print-sheet-unit:last-of-type {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          </style>
          ${copiedStyles}
        </head>
        <body>
          ${sheetsHTML}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col h-[94vh] border border-slate-700 overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-950 text-white flex flex-wrap items-center justify-between border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Layers size={18} />
              </span>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  A4 Batch Print ID Cards
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {totalCards} Students Selected
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  CR80 Format: <strong className="text-slate-200">53.98 × 85.60 mm</strong> (300 DPI: <strong className="text-slate-200">638 × 1011 px</strong>) • 
                  <strong className="text-amber-300 ml-1">3 × 3 Grid ({CARDS_PER_A4} Cards/Sheet)</strong> • Total: <strong className="text-white">{totalSheets} A4 Sheet{totalSheets > 1 ? 's' : ''}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint()}
              className="py-2 px-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition active:scale-95"
            >
              <Printer size={15} /> Print All Sheets ({totalSheets} Page{totalSheets > 1 ? 's' : ''})
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="px-5 py-2.5 bg-slate-800/90 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          
          {/* Sheet Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">View Sheet:</span>
            <button
              onClick={() => setActiveSheetIndex('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                activeSheetIndex === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Sheets ({totalSheets})
            </button>
            {a4Sheets.map((sheet, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSheetIndex(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
                  activeSheetIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sheet {idx + 1}
                <span className="text-[10px] opacity-75 font-mono">({sheet.length})</span>
              </button>
            ))}
          </div>

          {/* Options & Zoom */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none text-[11px] text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showCutGuides}
                onChange={(e) => setShowCutGuides(e.target.checked)}
                className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-400"
              />
              <Scissors size={13} className="text-amber-400" /> Scissors Cut Guides
            </label>

            <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
              <span className="text-slate-400 text-[11px]">Zoom:</span>
              <button
                onClick={() => setZoomLevel(0.65)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  zoomLevel === 0.65 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                65%
              </button>
              <button
                onClick={() => setZoomLevel(0.85)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  zoomLevel === 0.85 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                85% (Fit)
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  zoomLevel === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                100% (1:1)
              </button>
            </div>
          </div>

        </div>

        {/* Scrollable A4 Canvas Preview Area */}
        <div className="flex-1 bg-slate-950/80 p-4 md:p-8 overflow-y-auto overflow-x-auto space-y-8 flex flex-col items-center">
          {a4Sheets.map((sheet, sheetIdx) => {
            const isVisible = activeSheetIndex === 'all' || activeSheetIndex === sheetIdx;
            if (!isVisible) return null;

            return (
              <div key={sheetIdx} className="flex flex-col items-center space-y-2 shrink-0">
                {/* Sheet Title Bar */}
                <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2 max-w-[210mm]" style={{ width: `${210 * zoomLevel}mm` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">A4 Sheet {sheetIdx + 1} of {totalSheets}</span>
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {sheet.length} ID Card{sheet.length > 1 ? 's' : ''} (Slots 1-{sheet.length})
                    </span>
                  </div>
                  <button
                    onClick={() => handlePrint(sheetIdx)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer hover:underline text-[11px]"
                  >
                    <Printer size={12} /> Print Sheet {sheetIdx + 1} Only
                  </button>
                </div>

                {/* Scaled A4 Paper Container */}
                <div
                  style={{
                    width: `${210 * zoomLevel}mm`,
                    height: `${297 * zoomLevel}mm`,
                    position: 'relative',
                  }}
                  className="shadow-2xl rounded-sm transition-transform"
                >
                  <div
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left',
                      width: '210mm',
                      height: '297mm',
                    }}
                  >
                    {/* Real 1:1 Physical A4 Print Sheet Unit */}
                    <div
                      id={`a4-sheet-render-${sheetIdx}`}
                      className="a4-print-sheet-unit bg-white border border-slate-300 box-border"
                      style={{
                        width: '210mm',
                        height: '297mm',
                        minWidth: '210mm',
                        maxWidth: '210mm',
                        minHeight: '297mm',
                        maxHeight: '297mm',
                        padding: '12mm 14mm',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 53.98mm)',
                        gridTemplateRows: 'repeat(3, 85.60mm)',
                        columnGap: '10mm',
                        rowGap: '8mm',
                        boxSizing: 'border-box',
                        justifyContent: 'center',
                        alignContent: 'center',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {sheet.map((student) => (
                        <StudentIdCard
                          key={student.id}
                          student={student}
                          showCutGuides={showCutGuides}
                          id={`batch-card-${student.id}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            Tip: In browser print dialog, choose <strong className="text-slate-200">Paper: A4</strong>, <strong className="text-slate-200">Margins: None/Default</strong>, and enable <strong className="text-slate-200">Background graphics</strong>.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer transition"
            >
              Close
            </button>
            <button
              onClick={() => handlePrint()}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
            >
              <Printer size={14} /> Print All ({totalSheets} A4 Sheets)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

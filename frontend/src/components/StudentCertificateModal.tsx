import React, { useState, useEffect } from 'react';
import { X, Award, ShieldAlert, Printer } from 'lucide-react';
import axios from 'axios';
import { OfficialCertificateCard, CERT_WIDTH, CERT_HEIGHT } from './OfficialCertificateCard';

export const StudentCertificateModal = ({ student, onClose, onOpenMarksheet }: any) => {
  const [securityToast, setSecurityToast] = useState(false);
  const isAdmin = !!localStorage.getItem('adminToken') || !!localStorage.getItem('admin_token');

  const [fullStudent, setFullStudent] = useState(student);
  const [centerDetails, setCenterDetails] = useState<any>(null);

  useEffect(() => {
    setFullStudent(student);
    
    // 1. Fetch complete fresh student data with center details and exam marks
    if (student?.id) {
      Promise.all([
        axios.get(`http://localhost:3000/api/center/students/${student.id}`),
        axios.get(`http://localhost:3000/api/center/students/${student.id}/marks`).catch(() => ({ data: { marks: [] } }))
      ])
        .then(([stuRes, marksRes]) => {
          setFullStudent((prev: any) => {
            const data = stuRes.data?.data || {};
            const marks = (marksRes.data?.marks && marksRes.data.marks.length > 0)
              ? marksRes.data.marks
              : (data.marks && data.marks.length > 0)
                ? data.marks
                : prev?.marks || student?.marks || [];
            return {
              ...prev,
              ...data,
              marks
            };
          });
        })
        .catch(() => {});
    }

    // 2. Fetch center details fallback if needed
    const cid = student?.centerId || student?.center_id;
    if (cid && !student?.centerName && !student?.center?.name) {
      axios.get(`http://localhost:3000/api/public/verify/center/${cid}`)
        .then(res => {
          if (res.data?.success && res.data.data) {
            setCenterDetails(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [student]);

  if (!student) return null;

  const handlePrint = () => {
    const el = document.getElementById('printable-certificate');
    if (el) {
      const content = el.cloneNode(true) as HTMLElement;
      // Remove any interactive UI or borders not needed for print
      const printWindow = window.open('', '_blank', 'width=1200,height=900');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Official Certificate - ${fullStudent?.firstName || fullStudent?.first_name || ''} ${fullStudent?.lastName || fullStudent?.last_name || ''}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet">
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: white; }
                  @page { size: A4 landscape; margin: 0; }
                  #printable-certificate { border: none !important; box-shadow: none !important; transform: scale(0.97); transform-origin: top left; margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body class="bg-white text-slate-900 m-0 p-0 overflow-hidden">
              <div class="flex justify-center p-0 m-0">
                ${content.outerHTML}
              </div>
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
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto select-none no-print"
      onContextMenu={(e) => { e.preventDefault(); setSecurityToast(true); setTimeout(() => setSecurityToast(false), 3000); }}
    >
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 0 !important;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
            height: 100% !important;
          }
          body * {
            visibility: hidden;
          }
          /* Reset modal wrappers so they don't clip content */
          .fixed, .absolute, .flex, .flex-col, .overflow-hidden, .overflow-y-auto, .max-h-full {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            transform: none !important;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: scale(0.97) !important;
            transform-origin: top left !important;
            width: ${CERT_WIDTH}px !important;
            height: ${CERT_HEIGHT}px !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {securityToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-slate-700">
          <ShieldAlert size={18} className="text-rose-400 shrink-0" />
          <span className="text-sm font-semibold">Right-click and downloading is disabled.</span>
        </div>
      )}

      <div className="bg-slate-100 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden border border-slate-700">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Award className="text-blue-400" />
            <h2 className="text-lg font-bold">Official Certificate Preview</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Certificate Body (Responsive scroll wrapper for mobile) */}
        <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto flex-1 flex justify-start sm:justify-center bg-gray-50 relative group no-scrollbar">

          <div className="certificate-wrapper min-w-[650px] sm:min-w-0 flex justify-center shrink-0 w-full">
            <OfficialCertificateCard
              id="printable-certificate"
              student={{
                ...fullStudent,
                centerName: fullStudent.centerName || centerDetails?.name,
                centerCode: fullStudent.centerCode || centerDetails?.center_code
              }}
            />
          </div>
        </div>
      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-gray-200 flex justify-between shrink-0">
        <div className="flex gap-2">
          {onOpenMarksheet && (
            <button
              onClick={() => { onClose(); onOpenMarksheet(); }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md text-sm"
            >
              View Marksheet
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
          >
            <Printer size={18} /> Print Certificate
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

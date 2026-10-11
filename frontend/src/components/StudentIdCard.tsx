import { useEffect, useRef } from 'react';
import { GraduationCap, CheckCircle2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';

export interface StudentIdCardProps {
  student: any;
  id?: string;
  showCutGuides?: boolean;
  previewScale?: number;
  className?: string;
}

export const StudentIdCard = ({
  student,
  id,
  showCutGuides = false,
  previewScale = 1,
  className = '',
}: StudentIdCardProps) => {
  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  const cardElementId = id || `id-card-${student?.id || Math.random().toString(36).slice(2, 7)}`;

  const formatImageSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:3000';
    return `${baseUrl}${url}`;
  };

  const getStoredCenterData = () => {
    try {
      if (typeof window !== 'undefined') {
        const u = localStorage.getItem('centerUser');
        if (u) {
          return JSON.parse(u);
        }
      }
    } catch (_) {}
    return {};
  };

  const storedCenter = getStoredCenterData();
  const centerName =
    student?.centerName ||
    storedCenter?.name ||
    storedCenter?.centerName ||
    (student?.centerId ? `Study Center #${student.centerId}` : 'Authorized Study Center');

  const centerCode =
    student?.centerCode ||
    storedCenter?.centerCode ||
    student?.centerId ||
    '6767';

  // Smart Session Formatter: prevents clipping and formats dates cleanly
  const formatSession = (start?: string, end?: string) => {
    if (!start && !end) return '2025 – 2026';
    const formatPart = (val?: string) => {
      if (!val) return '';
      // If YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const parts = val.split('-');
        const year = parts[0];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const month = monthNames[monthIdx] || parts[1];
        return `${month} ${year}`;
      }
      return val;
    };

    const startFmt = formatPart(start);
    const endFmt = formatPart(end);

    if (startFmt && endFmt) {
      if (startFmt === endFmt) return startFmt;
      return `${startFmt} – ${endFmt}`;
    }
    return startFmt || endFmt || '2025 – 2026';
  };

  const formattedSession = formatSession(student?.session_start, student?.session_end);

  const barcodeValue = String(
    student?.enrollment_no ||
    student?.roll_no ||
    `EXAM-2026-${student?.id || 101}`
  ).replace(/[^a-zA-Z0-9_-]/g, '-');

  useEffect(() => {
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, barcodeValue, {
          format: 'CODE128',
          width: 0.92,
          height: 15,
          displayValue: true,
          fontSize: 6.5,
          font: 'monospace',
          textMargin: 1,
          margin: 0,
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [barcodeValue]);

  const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student Name';
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/student/${student?.enrollment_no || student?.id}`
    : `https://examirror.com/verify/student/${student?.enrollment_no || student?.id}`;

  const cardCore = (
    <div
      id={cardElementId}
      style={{
        width: '53.98mm',
        height: '85.60mm',
        minWidth: '53.98mm',
        maxWidth: '53.98mm',
        minHeight: '85.60mm',
        maxHeight: '85.60mm',
        borderRadius: '3.6mm',
        overflow: 'hidden',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
      className={`bg-white overflow-hidden flex flex-col justify-between font-sans text-slate-800 relative select-none shrink-0 shadow-md ${
        showCutGuides
          ? 'border border-dashed border-slate-400'
          : 'border-[1.2px] border-slate-300'
      } ${className}`}
    >
      {/* 1. Executive Rounded Top Header (Height ~14mm) */}
      <div
        style={{
          borderTopLeftRadius: '3.6mm',
          borderTopRightRadius: '3.6mm',
        }}
        className="bg-gradient-to-r from-[#070d19] via-[#0c1626] to-[#070d19] text-white px-[2.2mm] pt-[1.6mm] pb-[1.4mm] flex items-center justify-between border-b border-amber-400/80 shrink-0 z-10 relative"
      >
        <div className="flex items-center gap-[2mm] min-w-0">
          <div className="w-[7.8mm] h-[7.8mm] min-w-[7.8mm] rounded-full overflow-hidden bg-slate-900 ring-1 ring-amber-400/70 p-[0.4mm] flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="/Blue Circular Tech Emblem Logo.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 text-left">
            <div
              style={{ fontSize: '7.8pt', lineHeight: '1.05', letterSpacing: '0.12em' }}
              className="font-black text-amber-300 uppercase tracking-widest truncate"
            >
              EXAMIRROR
            </div>
            <div
              style={{ fontSize: '3.8pt', lineHeight: '1.1', letterSpacing: '0.06em' }}
              className="font-medium text-slate-300 uppercase truncate"
            >
              VOCATIONAL & SKILL CREDENTIAL
            </div>
          </div>
        </div>

        {/* Minimalist Center Code Pill */}
        <div className="shrink-0 text-right pl-[1mm]">
          <span
            style={{ fontSize: '3.8pt', lineHeight: '1' }}
            className="bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono font-bold px-[1.4mm] py-[0.5mm] rounded-sm inline-block tracking-tight"
          >
            {centerCode}
          </span>
        </div>
      </div>

      {/* 2. Main Card Body (Height ~68.8mm) */}
      <div className="flex-1 px-[2.2mm] py-[1.6mm] flex flex-col justify-between overflow-hidden bg-white relative">
        
        {/* Anti-Counterfeit In-Line Watermark Pattern */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          {/* Repeating In-Line Security Watermark Lines */}
          <svg
            className="w-full h-full absolute inset-0 opacity-[0.038]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`inline-wm-${cardElementId}`}
                width="72"
                height="19"
                patternTransform="rotate(-26 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <text
                  x="0"
                  y="12"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                  fontSize="4.4"
                  fontWeight="700"
                  fill="#0f172a"
                  letterSpacing="0.8"
                >
                  {centerName.toUpperCase()} ✦ EXAMIRROR
                </text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#inline-wm-${cardElementId})`} />
          </svg>

          {/* Faint Center Emblem Watermark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.045]">
            <img
              src="/Blue Circular Tech Emblem Logo.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
              alt="Watermark Emblem"
              className="w-[30mm] h-[30mm] object-contain grayscale"
            />
            <div
              style={{ fontSize: '4.8pt', letterSpacing: '0.14em' }}
              className="font-black text-slate-800 uppercase tracking-widest whitespace-nowrap mt-[-6mm] text-center"
            >
              {centerName}
            </div>
          </div>
        </div>

        {/* Hero Identity Section (Photo + Name + Badges) */}
        <div className="flex items-center gap-[2.2mm] shrink-0 relative z-10">
          {/* Student Portrait */}
          <div className="w-[17.5mm] h-[21.5mm] min-w-[17.5mm] rounded-[2.2mm] ring-1 ring-slate-300 overflow-hidden bg-slate-50 shadow-2xs shrink-0">
            <img
              src={
                formatImageSrc(student?.photo_url) ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=070d19&color=f59e0b`
              }
              className="w-full h-full object-cover"
              alt="Student"
            />
          </div>

          {/* Student Name & Core Credentials */}
          <div className="flex-1 min-w-0 space-y-[0.6mm]">
            <h4
              style={{ fontSize: '7.5pt', lineHeight: '1.15' }}
              className="font-black text-slate-900 uppercase tracking-tight break-words line-clamp-2"
            >
              {studentName}
            </h4>

            {/* Monospace Credentials */}
            <div className="space-y-[0.3mm]">
              <div
                style={{ fontSize: '5.2pt', lineHeight: '1.1' }}
                className="font-bold text-slate-800 font-mono truncate"
              >
                <span className="text-slate-400 font-medium">ENR:</span> {student?.enrollment_no || `EXAM-2026-${student?.id || 101}`}
              </div>
              <div
                style={{ fontSize: '5pt', lineHeight: '1.1' }}
                className="font-medium text-slate-600 font-mono truncate"
              >
                <span className="text-slate-400">ROLL:</span> {student?.roll_no || `ROL-${10000 + (student?.id || 1)}`}
              </div>
            </div>

            {/* Minimalist Status Micro-Pill */}
            <div className="pt-[0.2mm]">
              {student?.academic_status === 'passout' ? (
                <span
                  style={{ fontSize: '4.2pt', lineHeight: '1' }}
                  className="bg-blue-50/90 text-blue-800 font-bold px-[1.4mm] py-[0.5mm] rounded-full inline-flex items-center gap-[0.8mm] ring-1 ring-blue-200"
                >
                  <span className="w-1 h-1 rounded-full bg-blue-600 inline-block" />
                  PASSOUT
                </span>
              ) : (
                <span
                  style={{ fontSize: '4.2pt', lineHeight: '1' }}
                  className="bg-emerald-50/90 text-emerald-800 font-bold px-[1.4mm] py-[0.5mm] rounded-full inline-flex items-center gap-[0.8mm] ring-1 ring-emerald-200"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                  PURSUING
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Credential Particulars (Each Detail on a Separate Line) */}
        <div
          style={{ fontSize: '4.8pt', lineHeight: '1.25' }}
          className="bg-slate-50/90 border border-slate-200/90 rounded-[2.2mm] p-[1.6mm] text-left space-y-[0.7mm] shrink-0 relative z-10 shadow-3xs"
        >
          {/* Line 1: Course */}
          <div className="flex items-center gap-[1.2mm] min-w-0">
            <span
              style={{ fontSize: '3.6pt', lineHeight: '1' }}
              className="bg-indigo-600 text-white font-extrabold uppercase tracking-wider px-[1.2mm] py-[0.5mm] rounded-xs shrink-0"
            >
              COURSE
            </span>
            <span
              style={{ fontSize: '5.2pt', lineHeight: '1.15' }}
              className="font-black text-slate-900 truncate"
              title={student?.courseName || student?.courseId || 'Vocational Training'}
            >
              {student?.courseName || student?.courseId || 'Vocational Training'}
            </span>
          </div>

          {/* Line 2: Center */}
          <div className="flex items-center gap-[1.2mm] min-w-0">
            <span
              style={{ fontSize: '3.6pt', lineHeight: '1' }}
              className="bg-amber-500 text-slate-950 font-extrabold uppercase tracking-wider px-[1.2mm] py-[0.5mm] rounded-xs shrink-0"
            >
              CENTER
            </span>
            <span
              style={{ fontSize: '5pt', lineHeight: '1.15' }}
              className="font-bold text-slate-800 truncate"
              title={centerName}
            >
              {centerName}
            </span>
          </div>

          {/* Line 3: Father's Name */}
          <div className="flex items-baseline gap-[1.2mm] min-w-0 pt-[0.4mm] border-t border-slate-200/60">
            <span
              style={{ fontSize: '3.8pt' }}
              className="text-slate-400 font-bold uppercase tracking-wider shrink-0"
            >
              FATHER:
            </span>
            <span
              style={{ fontSize: '4.8pt' }}
              className="font-bold text-slate-800 truncate"
            >
              {student?.father_name || 'N/A'}
            </span>
          </div>

          {/* Line 4: Duration */}
          <div className="flex items-baseline gap-[1.2mm] min-w-0">
            <span
              style={{ fontSize: '3.8pt' }}
              className="text-slate-400 font-bold uppercase tracking-wider shrink-0"
            >
              DURATION:
            </span>
            <span
              style={{ fontSize: '4.8pt' }}
              className="font-bold text-slate-800 truncate"
            >
              {student?.duration || '6 Months'}
            </span>
          </div>

          {/* Line 5: Session */}
          <div className="flex items-baseline gap-[1.2mm] min-w-0">
            <span
              style={{ fontSize: '3.8pt' }}
              className="text-slate-400 font-bold uppercase tracking-wider shrink-0"
            >
              SESSION:
            </span>
            <span
              style={{ fontSize: '4.8pt' }}
              className="font-bold text-slate-800 font-mono truncate"
              title={formattedSession}
            >
              {formattedSession}
            </span>
          </div>

          {/* Line 6: Contact */}
          <div className="flex items-baseline gap-[1.2mm] min-w-0">
            <span
              style={{ fontSize: '3.8pt' }}
              className="text-slate-400 font-bold uppercase tracking-wider shrink-0"
            >
              CONTACT:
            </span>
            <span
              style={{ fontSize: '4.8pt' }}
              className="font-bold text-slate-800 font-mono truncate"
            >
              {student?.phone || 'N/A'}
            </span>
          </div>
        </div>

        {/* 4. Security & Verification Deck (Barcode + QR Code) */}
        <div className="pt-[0.8mm] border-t border-slate-100 flex items-center justify-between gap-[1.5mm] shrink-0 relative z-10">
          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            <svg
              ref={barcodeSvgRef}
              className="w-full max-w-[28mm] h-auto overflow-hidden"
              style={{ maxHeight: '12mm' }}
            />
          </div>

          <div className="p-[0.8mm] bg-white rounded-[1.2mm] ring-1 ring-slate-200/80 shadow-2xs flex flex-col items-center shrink-0">
            <QRCodeSVG
              value={verificationUrl}
              size={33}
              level="M"
              includeMargin={false}
            />
            <span
              style={{ fontSize: '3.4pt', lineHeight: '1', letterSpacing: '0.04em' }}
              className="text-slate-400 font-bold uppercase mt-[0.4mm]"
            >
              VERIFY
            </span>
          </div>
        </div>

      </div>

      {/* 5. Executive Rounded Bottom Accent (Height ~2.8mm) */}
      <div
        style={{
          borderBottomLeftRadius: '3.6mm',
          borderBottomRightRadius: '3.6mm',
        }}
        className="bg-[#070d19] text-slate-300 text-center py-[0.6mm] border-t border-amber-400/60 shrink-0 z-10 relative flex items-center justify-center"
      >
        <div
          style={{ fontSize: '3.5pt', lineHeight: '1', letterSpacing: '0.06em' }}
          className="font-mono text-slate-300/90 font-medium truncate px-[1mm]"
        >
          OFFICIAL STUDENT IDENTITY • <span className="text-amber-300 font-bold">{centerCode}</span> • EXAMIRROR
        </div>
      </div>
    </div>
  );

  if (previewScale && previewScale !== 1) {
    return (
      <div
        style={{
          width: `${53.98 * previewScale}mm`,
          height: `${85.60 * previewScale}mm`,
          display: 'inline-block',
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
          }}
        >
          {cardCore}
        </div>
      </div>
    );
  }

  return cardCore;
};

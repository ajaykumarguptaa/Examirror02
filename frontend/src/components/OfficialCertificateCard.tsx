import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { calculateStudentAcademicGrade } from '../utils/academicGrade';

export const CERT_WIDTH = 1149;
export const CERT_HEIGHT = 758;

interface OfficialCertificateCardProps {
  student: any;
  id?: string;
  scale?: number;
  className?: string;
}

export const OfficialCertificateCard: React.FC<OfficialCertificateCardProps> = ({
  student,
  id,
  scale = 1,
  className = ''
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const centerName = student.centerName 
    || student.center?.name 
    || student.center_name 
    || (student.centerId === 2 ? 'LAXMAN IT ACADEMY' : '') 
    || 'Authorized Study Centre';

  const centerCode = student.centerCode 
    || student.center?.center_code 
    || student.center_code 
    || (student.centerId === 2 ? '6767' : '') 
    || '6767';

  const slNo = student.certificate_number || `EXAM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const regNo = student.enrollment_no || student.roll_no || `EXAM-2026-${student.id || 1005}`;

  const issueDate = student.certificate_issued_date
    ? new Date(student.certificate_issued_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');

  const sessionText = student.session_start && student.session_end
    ? `${student.session_start} – ${student.session_end}` : '2026';

  const gradeResult = calculateStudentAcademicGrade(student);
  const calculatedGrade = gradeResult.grade;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.examirror.in';
  const verifyUrl = `${origin}/verify/student/${encodeURIComponent(regNo || slNo)}`;

  useEffect(() => {
    if (barcodeSvgRef.current) {
      const barcodeValue = student.certificate_number 
        || student.enrollment_no 
        || student.roll_no 
        || `EXAM-2026-${student.id || 1005}`;
      try {
        JsBarcode(barcodeSvgRef.current, barcodeValue, {
          format: "CODE128",
          width: 1.25,
          height: 28,
          displayValue: true,
          fontSize: 9,
          font: "monospace",
          margin: 0,
          background: "transparent",
          lineColor: "#1e3a8a"
        });
      } catch (err) {
        console.error('Barcode error', err);
      }
    }
  }, [student, regNo, slNo]);

  return (
    <div
      id={id}
      className={`relative bg-white shadow-xl flex-shrink-0 select-none overflow-hidden ${className}`}
      style={{
        width: `${CERT_WIDTH}px`,
        height: `${CERT_HEIGHT}px`,
        transformOrigin: 'top center',
        ...(scale !== 1 ? { transform: `scale(${scale})` } : {})
      }}
    >
      {/* Outer Border Layer */}
      <div className="absolute inset-2 border-[12px] border-[#0f172a] rounded-sm pointer-events-none z-10" />

      {/* Inner Decorative Border with Glow */}
      <div className="absolute inset-6 border-[3px] border-[#d97706] rounded-sm pointer-events-none z-10 opacity-80 shadow-[0_0_15px_rgba(217,119,6,0.15)]" />
      <div className="absolute inset-7 border-[1px] border-[#d97706] rounded-sm pointer-events-none z-10 opacity-50" />

      {/* Corner Ornaments with subtle glow */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-[6px] border-l-[6px] border-[#d97706] z-10 shadow-[inset_3px_3px_5px_rgba(217,119,6,0.2)]" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-[6px] border-r-[6px] border-[#d97706] z-10 shadow-[inset_-3px_3px_5px_rgba(217,119,6,0.2)]" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-[6px] border-l-[6px] border-[#d97706] z-10 shadow-[inset_3px_-3px_5px_rgba(217,119,6,0.2)]" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-[6px] border-r-[6px] border-[#d97706] z-10 shadow-[inset_-3px_-3px_5px_rgba(217,119,6,0.2)]" />

      {/* Background Watermark & Rich Premium Background */}
      <div className="absolute inset-0 bg-white z-0" />
      
      {/* Repeating Anti-Counterfeit Text Watermark with dynamic registration */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col pt-3 select-none">
        {Array.from({ length: 30 }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex whitespace-nowrap opacity-[0.03] select-none space-x-4 mb-3 -ml-16 transform -rotate-6">
            {Array.from({ length: 12 }).map((_, colIndex) => (
              <span key={colIndex} className="text-sm font-mono font-black text-black tracking-[0.18em] uppercase leading-normal">
                EXAMIRROR • {regNo} • ISO 9001:2015 • AUTHENTIC RECORD •
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Embedded Holographic Security Thread (Vertical Micro-Print Ribbon) */}
      <div className="absolute top-8 bottom-8 left-[68px] w-[8px] pointer-events-none z-10 flex flex-col items-center justify-around overflow-hidden opacity-80 bg-gradient-to-b from-amber-400/25 via-emerald-400/25 to-blue-500/25 border-x border-amber-500/30">
        <div className="flex flex-col items-center gap-16 text-[5px] font-mono font-bold tracking-widest text-slate-700 rotate-90 whitespace-nowrap opacity-60">
          <span>EXAMIRROR SECURE</span>
          <span>VERIFIED ORIGINAL</span>
          <span>TAMPER PROOF</span>
          <span>GOVT ACT 2013</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
        <img src="/assets/favicon.png" alt="watermark" className="w-[600px] h-[600px] object-contain grayscale" />
      </div>

      {/* Certificate Content Container */}
      <div className="absolute inset-0 z-20 flex flex-col p-12 justify-start">

        {/* Header Row (Logo, Title, SL No) */}
        <div className="flex justify-between items-start w-full">
          {/* Left Logo */}
          <div className="w-48 flex flex-col items-center">
            <img src="/assets/logo.png" alt="Logo" className="w-32 h-auto object-contain" />
            <span className="text-[9px] text-gray-500 mt-1 font-semibold text-center leading-tight">CIN: U85500BR2023PTC065167</span>
          </div>

          {/* Center Title */}
          <div className="flex-1 flex flex-col items-center pt-2">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-indigo-700 to-blue-900 tracking-wider font-sans leading-none drop-shadow-sm">EXAMIRROR</h1>
            <h2 className="text-xl font-bold text-blue-900/90 tracking-widest mt-2 leading-none">COMPUTER ACADEMY</h2>
            <div className="text-[9px] text-gray-500 font-bold mt-2 uppercase tracking-wide">
              Regd. under the companies Act. 2013 Ministry of Corporate Affairs, Govt. of India
            </div>
            <div className="text-[11px] font-bold text-blue-800 mt-1.5 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 backdrop-blur-sm px-5 py-1.5 rounded-full border border-blue-200/60 shadow-[0_2px_10px_rgba(59,130,246,0.15)] uppercase tracking-wide">
              An ISO 9001:2015 Certified Company
            </div>
          </div>

          {/* Right Serial Numbers */}
          <div className="w-56 flex flex-col items-end pt-4 pr-2 relative">
            <div className="flex items-baseline mb-2 w-full">
              <span className="text-sm font-bold text-gray-700 w-16">Sl. No.</span>
              <span className="flex-1 border-b-[1.5px] border-gray-400 border-dotted text-right font-bold text-sm text-[#0f172a] pb-0.5 whitespace-nowrap overflow-visible">
                {slNo}
              </span>
            </div>
            <div className="flex items-baseline w-full">
              <span className="text-sm font-bold text-gray-700 w-16">Reg. No.</span>
              <span className="flex-1 border-b-[1.5px] border-gray-400 border-dotted text-right font-bold text-sm text-[#0f172a] pb-0.5 whitespace-nowrap overflow-visible">
                {regNo}
              </span>
            </div>
            <div className="absolute top-[84px] right-2 bg-white/90 backdrop-blur-md p-2 border border-blue-200/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5">
              <QRCodeSVG value={verifyUrl} size={100} level="H" />
            </div>
          </div>
        </div>

        {/* Certificate Big Title */}
        <div className="flex flex-col items-center mt-2 mb-2">
          <h3 className="text-5xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 tracking-[0.2em] uppercase leading-none drop-shadow-sm">Certificate</h3>
          <h4 className="text-lg font-bold text-amber-600 tracking-[0.3em] uppercase mt-3">Of Course Completion</h4>
          <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-3 opacity-70"></div>
        </div>

        {/* Main Body Text */}
        <div className="flex flex-col items-center w-full px-12 mt-2 mb-2 z-20">

          <div className="text-xl text-slate-500 italic font-sans mb-2 font-medium">This Certificate is proudly awarded to</div>

          <div className="w-full max-w-4xl text-center border-b-[1.5px] border-amber-600/40 border-dashed pb-1 mb-3 relative">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-900 tracking-wider uppercase font-sans drop-shadow-sm">
              {`${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`}
            </span>
          </div>

          {/* Row 1 */}
          <div className="flex items-baseline w-full max-w-5xl text-base text-gray-600 font-sans mb-3 font-medium">
            <span className="whitespace-nowrap mr-3">Son/Daughter of</span>
            <span className="flex-1 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#1e3a8a] uppercase pb-0.5">
              {student.fatherName || student.father_name || 'N/A'}
            </span>
          </div>

          {/* Row 2 */}
          <div className="flex items-baseline w-full max-w-5xl text-base text-gray-600 font-sans mb-3 font-medium">
            <span className="whitespace-nowrap mr-3">On successful completion of the Course</span>
            <span className="flex-1 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#d97706] uppercase pb-0.5">
              {student.courseName || student.course_name || 'N/A'}
            </span>
          </div>

          {/* Row 3 */}
          <div className="flex items-baseline w-full max-w-5xl text-base text-gray-600 font-sans mb-3 font-medium">
            <span className="whitespace-nowrap mr-3">from our Authorized Study Centre</span>
            <span className="flex-1 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#1e3a8a] uppercase px-2 pb-0.5">
              {centerName}
            </span>
            <span className="whitespace-nowrap mx-3">Centre Code</span>
            <span className="w-32 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#1e3a8a] font-mono uppercase pb-0.5 tracking-wider">
              {centerCode}
            </span>
          </div>

          {/* Row 4 */}
          <div className="flex items-baseline w-full max-w-5xl text-base text-gray-600 font-sans mb-3 font-medium">
            <span className="whitespace-nowrap mr-3">of Duration</span>
            <span className="w-40 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#1e3a8a] uppercase pb-0.5">
              {student.duration || student.courseDuration || '3 MONTHS'}
            </span>
            <span className="whitespace-nowrap mx-3">in session</span>
            <span className="flex-1 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-bold text-[#1e3a8a] uppercase pb-0.5">
              {sessionText}
            </span>
          </div>

          {/* Row 5 */}
          <div className="flex items-baseline w-full max-w-5xl text-base text-gray-600 font-sans mb-2 font-medium">
            <span className="whitespace-nowrap mr-3">and has procured the Grade</span>
            <span className="w-32 border-b-[1.5px] border-amber-600/40 border-dashed text-center font-black text-emerald-600 text-lg uppercase pb-0.5 drop-shadow-sm">
              {calculatedGrade}
            </span>
            <span className="whitespace-nowrap ml-3">on the recommendation of the board of examiners.</span>
          </div>

        </div>

        {/* Footer section */}
        <div className="flex justify-between items-end w-full px-4 mt-auto">

          {/* Left Footer: Issue Date */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-1 pb-0.5">
              <div className="flex items-end">
                <span className="text-sm font-bold text-[#1e3a8a] mr-2">Date of Issue:</span>
                <span className="text-base font-bold text-gray-800 border-b-[1.5px] border-gray-400 border-dotted pb-0.5 px-3 leading-none">{issueDate.toUpperCase()}</span>
              </div>
              <div className="flex flex-col mt-1">
                <span className="text-xs font-bold text-[#1e3a8a] leading-none mb-1">Certified By:</span>
                <span className="text-[9px] font-bold text-gray-700 leading-none mb-0.5">Registered Office:</span>
                <span className="text-[8px] text-gray-500 leading-tight">
                  c/o rakesh kumar, gali no4, near K-14,<br />
                  kankarbagh, Sampatchak, Patna,<br />
                  Bihar-800020
                </span>
              </div>
            </div>
          </div>

          {/* Website Centered & Barcode */}
          <div className="flex flex-col items-center justify-end pb-1.5 z-20">
            <div className="flex flex-col items-center mb-1 bg-white/80 px-2 py-0.5 rounded">
              <svg ref={barcodeSvgRef} className="max-w-[170px] h-[32px] overflow-visible"></svg>
            </div>
            <div className="text-[11px] font-bold text-[#1e3a8a] tracking-widest opacity-80 uppercase">
              www.examirror.in
            </div>
          </div>

          {/* Right Footer: Stamp and Signature */}
          <div className="flex items-end justify-end h-[80px]">
            {/* Official Stamp */}
            <div className="opacity-95 mix-blend-multiply drop-shadow-sm pb-1 pointer-events-none -rotate-12 translate-x-12 z-20">
              <img 
                src="/Blue Circular Tech Emblem Logo.png?v=3" 
                alt="Official Stamp" 
                className="w-[75px] h-[75px] object-contain" 
              />
            </div>

            {/* Signature Block */}
            <div className="flex flex-col items-center justify-end w-48 relative">
              <img
                src="/Saurabh_Signature_Final.png?v=3"
                alt="Signature"
                className="w-40 h-14 object-contain z-10 mb-1 mix-blend-multiply pointer-events-none"
              />

              <div className="w-full border-t-[1.5px] border-blue-900/60 text-center pt-1">
                <span className="text-xs font-bold text-[#1e3a8a] font-sans italic tracking-wide drop-shadow-sm">Authorised Signature</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

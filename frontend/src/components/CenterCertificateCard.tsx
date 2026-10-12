import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { ShieldCheck, Award, CheckCircle2, Sparkles, Building2, Globe, MapPin, Calendar, Check } from 'lucide-react';
import { getAssetUrl } from '../utils/axiosSetup';

export const CENTER_CERT_WIDTH = 1149;
export const CENTER_CERT_HEIGHT = 758;

export interface CenterCertificateData {
  id?: number | string;
  centerName: string;
  centerCode: string;
  headName: string;
  headPhoto?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  fullAddress?: string;
  certificateNumber?: string;
  issueDate?: string;
  validUntil?: string;
  status?: string;
}

interface CenterCertificateCardProps {
  center: CenterCertificateData;
  id?: string;
  scale?: number;
  className?: string;
}

export const CenterCertificateCard: React.FC<CenterCertificateCardProps> = ({
  center,
  id = 'center-affiliation-certificate',
  scale = 1,
  className = ''
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const centerName = (center.centerName || 'AUTHORIZED STUDY CENTER').toUpperCase();
  const centerCode = center.centerCode || 'EXAMc2026-101';
  const headName = center.headName || 'Center Director';
  const certNo = center.certificateNumber || `EXAM-ATC-2026-${String(center.id || 101).padStart(4, '0')}`;

  const address = center.fullAddress || [
    center.address,
    center.addressLine2,
    center.city,
    center.district,
    center.state,
    center.pincode
  ].filter(Boolean).join(', ') || 'Registered Training Center Location';

  const issueDateFormatted = center.issueDate
    ? new Date(center.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const validUntilFormatted = center.validUntil
    ? new Date(center.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '31 Mar 2027';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.examirror.in';
  const verifyUrl = `${origin}/verify/center/${encodeURIComponent(centerCode)}`;

  useEffect(() => {
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, certNo, {
          format: 'CODE128',
          width: 1.3,
          height: 28,
          displayValue: true,
          fontSize: 9,
          font: 'monospace',
          margin: 0,
          background: 'transparent',
          lineColor: '#1e3a8a'
        });
      } catch (err) {
        console.error('Center Certificate Barcode error:', err);
      }
    }
  }, [certNo, centerCode]);

  return (
    <div
      id={id}
      className={`relative bg-[#fcfbfa] shadow-2xl flex-shrink-0 select-none overflow-hidden text-slate-800 ${className}`}
      style={{
        width: `${CENTER_CERT_WIDTH}px`,
        height: `${CENTER_CERT_HEIGHT}px`,
        transformOrigin: 'top center',
        ...(scale !== 1 ? { transform: `scale(${scale})` } : {})
      }}
    >
      {/* 1. Heavy Outer Royal Navy Border */}
      <div className="absolute inset-2 border-[12px] border-[#0f172a] rounded-sm pointer-events-none z-10" />

      {/* 2. Double Golden Guilloche Borders */}
      <div className="absolute inset-5 border-[3px] border-[#d97706] rounded-sm pointer-events-none z-10 opacity-90 shadow-[0_0_12px_rgba(217,119,6,0.2)]" />
      <div className="absolute inset-6.5 border-[1px] border-[#b45309] rounded-sm pointer-events-none z-10 opacity-60" />

      {/* 3. Intricate Corner Ornaments */}
      <div className="absolute top-5 left-5 w-14 h-14 border-t-[6px] border-l-[6px] border-[#d97706] z-10 shadow-[inset_3px_3px_6px_rgba(217,119,6,0.25)]" />
      <div className="absolute top-5 right-5 w-14 h-14 border-t-[6px] border-r-[6px] border-[#d97706] z-10 shadow-[inset_-3px_3px_6px_rgba(217,119,6,0.25)]" />
      <div className="absolute bottom-5 left-5 w-14 h-14 border-b-[6px] border-l-[6px] border-[#d97706] z-10 shadow-[inset_3px_-3px_6px_rgba(217,119,6,0.25)]" />
      <div className="absolute bottom-5 right-5 w-14 h-14 border-b-[6px] border-r-[6px] border-[#d97706] z-10 shadow-[inset_-3px_-3px_6px_rgba(217,119,6,0.25)]" />

      {/* 4. Subtle Guilloche Background Pattern & Center Watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(#1e3a8a 1.2px, transparent 1.2px), radial-gradient(#b45309 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />
      
      {/* Large Emblem Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.045] z-0">
        <img src="/logo.png" alt="Watermark" className="w-[520px] h-[520px] object-contain filter grayscale" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full h-full p-10 flex flex-col justify-between">
        
        {/* HEADER SECTION */}
        <div>
          {/* Top Statutory Header Banner */}
          <div className="flex items-center justify-between border-b border-amber-300/80 pb-2.5 px-2">
            <div className="text-[10.5px] font-bold tracking-widest text-[#1e293b] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
              <span>Regd. Under Ministry of Corporate Affairs, Govt. of India (MCA)</span>
              <span className="text-amber-700">|</span>
              <span className="font-mono text-slate-700">CIN: U85499BR2024PTC068153</span>
            </div>
            <div className="text-[10.5px] font-extrabold tracking-wider text-amber-800 uppercase flex items-center gap-1.5 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              <Award size={13} className="text-amber-600" />
              <span>An ISO 9001:2015 Certified Edutech Network</span>
            </div>
          </div>

          {/* Main Institution Brand Block */}
          <div className="flex items-center justify-between mt-3 px-4">
            {/* Left: Organization Logo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white p-2 border-2 border-amber-400 shadow-md flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Examirror Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase font-serif">
                  EXAMIRROR EDUTECH
                </h1>
                <p className="text-xs font-bold text-amber-800 tracking-wider uppercase">
                  National Skill Development & Computer Education Mission
                </p>
                <p className="text-[10.5px] text-slate-500 font-medium">
                  Autonomous Organization for Professional Information Technology, Vocational & Technical Literacy
                </p>
              </div>
            </div>

            {/* Right: Barcode & Official Badge */}
            <div className="flex flex-col items-end gap-1">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <svg ref={barcodeSvgRef} className="h-9"></svg>
              </div>
              <span className="text-[9.5px] font-mono font-bold text-slate-600 tracking-wider">
                CERTIFICATE ID: {certNo}
              </span>
            </div>
          </div>

          {/* Ribbon Title */}
          <div className="mt-3 relative flex items-center justify-center">
            <div className="absolute inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#d97706] to-transparent" />
            <div className="relative px-8 py-1.5 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white rounded-full shadow-lg border-2 border-amber-400/90 flex items-center gap-3">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <h2 className="text-sm font-black tracking-[0.25em] uppercase text-amber-300 font-serif">
                CERTIFICATE OF AFFILIATION & ACCREDITATION
              </h2>
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* BODY / CERTIFICATE STATEMENT */}
        <div className="px-8 my-auto space-y-4 text-center">
          
          <p className="text-xs font-serif italic text-slate-600 max-w-3xl mx-auto leading-relaxed">
            This is to solemnly certify that the educational institution mentioned below has successfully met all institutional norms, infrastructure specifications, and technical standards established by the Academic Governing Council. Accreditation is hereby granted as an
          </p>

          {/* Core Title */}
          <div className="inline-block px-6 py-1 bg-amber-50/80 border-y border-amber-300">
            <span className="text-base font-black text-[#9a3412] uppercase tracking-[0.2em] font-serif">
              ★ AUTHORIZED STUDY CENTRE (ASC) ★
            </span>
          </div>

          {/* Center Name & Directorship Block */}
          <div className="space-y-1.5 py-1">
            <h3 className="text-3xl font-black text-[#0f172a] tracking-wide font-serif uppercase drop-shadow-2xs">
              {centerName}
            </h3>
            
            <div className="text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5">
              <span>Under the Directorship / Management of:</span>
              <strong className="text-slate-900 font-bold uppercase text-[13px] underline decoration-amber-500 underline-offset-4">
                {headName}
              </strong>
            </div>

            <div className="text-[11.5px] text-slate-600 font-medium flex items-center justify-center gap-1.5 pt-1">
              <MapPin size={13} className="text-amber-600 shrink-0" />
              <span>Location: <strong>{address}</strong></span>
            </div>
          </div>

          {/* Authorization Statement */}
          <p className="text-[11px] text-slate-600 max-w-3xl mx-auto leading-relaxed font-sans">
            The study centre is fully authorized to conduct IT & Vocational Diploma programs, Computer Skill certifications, and online examinations under the auspices of <strong>Examirror Edutech Private Limited</strong> for the authorized session.
          </p>

        </div>

        {/* BOTTOM AUTHENTICATION FOOTER */}
        <div className="pt-2 px-6 border-t border-amber-200/90 grid grid-cols-12 items-end gap-4">
          
          {/* Left Column: Center Code & Validity Details */}
          <div className="col-span-4 space-y-2 text-left">
            <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Center Code</span>
                <span className="font-mono font-black text-indigo-950 text-xs px-2 py-0.5 rounded bg-white border border-amber-200">
                  {centerCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Issue</span>
                <span className="font-bold text-slate-800">{issueDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valid Through</span>
                <span className="font-bold text-emerald-700">{validUntilFormatted}</span>
              </div>
            </div>

            <div className="text-[9.5px] text-slate-500 leading-tight">
              Verify online status anytime at <span className="text-indigo-600 font-bold">{origin.replace(/^https?:\/\//, '')}/verify/center</span>
            </div>
          </div>

          {/* Middle Column: Holographic Gold Seal & QR Code */}
          <div className="col-span-4 flex items-center justify-center gap-6 pb-1">
            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-2 rounded-xl border-2 border-amber-400 shadow-sm inline-block">
                <QRCodeSVG
                  value={verifyUrl}
                  size={68}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-600 block mt-1 uppercase tracking-wider">
                Scan to Verify
              </span>
            </div>

            {/* Embossed Golden Holographic Seal */}
            <div className="relative w-22 h-22 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-1 shadow-lg border-2 border-amber-200 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full border-2 border-dashed border-amber-800/60 flex flex-col items-center justify-center text-center p-1 bg-gradient-to-tr from-amber-400 to-yellow-200 text-[#78350f]">
                <ShieldCheck size={20} className="text-[#78350f] mb-0.5" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter leading-tight">
                  OFFICIALLY ACCREDITED
                </span>
                <span className="text-[6.5px] font-bold uppercase tracking-widest text-[#92400e]">
                  EXAMIRROR EDUTECH
                </span>
                <span className="text-[6px] font-mono font-bold mt-0.5">
                  ★ GOVT. REGD ★
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Authorized Signatures & Seals */}
          <div className="col-span-4 flex justify-end gap-6 text-center">
            
            {/* Center Head / Director Specimen */}
            {center.headPhoto ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-18 rounded-lg overflow-hidden border-2 border-amber-400 shadow-sm bg-white mb-1">
                  <img
                    src={getAssetUrl(center.headPhoto)}
                    alt="Center Head"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase">
                  Authorized Head
                </span>
              </div>
            ) : null}

            {/* Managing Director Signature & Seal */}
            <div className="flex flex-col items-center justify-end">
              <div className="relative w-28 h-12 flex items-center justify-center">
                {/* Digital Signature Specimen */}
                <span className="font-serif italic font-bold text-2xl text-indigo-950 tracking-wider transform -rotate-3 select-none">
                  A.K. Gupta
                </span>
                {/* Red/Purple Official Corporate Stamp */}
                <div className="absolute -bottom-1 -right-2 w-14 h-14 rounded-full border border-purple-600/40 text-purple-700/50 flex items-center justify-center pointer-events-none rotate-12">
                  <span className="text-[7px] font-black uppercase text-center leading-tight">
                    EXAMIRROR<br/>SEAL
                  </span>
                </div>
              </div>
              <div className="w-32 border-t-2 border-slate-800 pt-1 mt-0.5">
                <div className="text-[11px] font-black text-slate-900 uppercase font-serif">
                  Managing Director
                </div>
                <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Examirror Edutech Pvt. Ltd.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

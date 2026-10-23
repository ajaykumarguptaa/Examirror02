import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Building2,
  GraduationCap,
  Scale,
  Award,
  AlertTriangle,
  Lock,
  PhoneCall,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeUp, StaggerContainer, StaggerItem } from '../../motion';
import SEO from '../../components/SEO';

const TermsAndConditions = () => {
  const lastUpdated = 'October 2026';

  const sections = [
    {
      id: 'affiliation',
      icon: Building2,
      title: '1. Study Center Affiliation & Operational Standards',
      color: 'border-t-blue-600',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      content: [
        'Study centers affiliated with Examirror are authorized to conduct vocational, technical, and computer software training programs in compliance with national skill standards.',
        'Zero Franchise Fee policy grants affiliation rights for qualified educational institutes without licensing surcharge, provided standard infrastructure (computers, verified trainers, and dedicated classroom) is maintained.',
        'Affiliated centers must maintain accurate physical attendance, computerized batch logs, and verify all original student credentials during admission.',
        'Misrepresentation of affiliation or running unapproved parallel programs under the Examirror seal is strictly prohibited and subject to immediate cancellation of center credentials.'
      ]
    },
    {
      id: 'student-admission',
      icon: GraduationCap,
      title: '2. Student Admission, Enrollment & Eligibility',
      color: 'border-t-amber-500',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      content: [
        'Candidates must satisfy minimum educational eligibility criteria specified for respective Diploma and Certificate programs prior to enrollment.',
        'Upon successful registration by an authorized center, each student is assigned a unique, permanent Enrollment Number and Roll Number recorded in the centralized portal.',
        'Students must provide genuine identity verification documents (Aadhar / PAN / School ID). Any submission of falsified documents will result in immediate disqualification without fee refund.',
        'Transfers between study centers must be officially requested and approved by the Examirror Academic Controller.'
      ]
    },
    {
      id: 'examinations',
      icon: Scale,
      title: '3. Examination Conduct & Online Assessment Rules',
      color: 'border-t-purple-600',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      content: [
        'Exams are administered online via the secured Examirror Examination Portal with randomized question sequencing, timing locks, and activity logging.',
        'Candidates must adhere to anti-cheating guidelines: tab switching, unauthorized external aids, or proxy examinees are strictly disallowed and automatically flagged.',
        'Center coordinators are solely responsible for ensuring fair and supervised testing environments on scheduled examination dates.',
        'Re-examination requests due to technical failures or medical absences must be submitted within 7 working days from the test date.'
      ]
    },
    {
      id: 'certification',
      icon: Award,
      title: '4. Marksheet, Certificate Issuance & QR Verification',
      color: 'border-t-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      content: [
        'Official Marksheets and Diplomas are generated upon successful clearance of all course modules, practicals, and required passing percentages.',
        'Every issued document features a tamper-proof encrypted QR code and unique Certificate ID verifiable worldwide via the centralized verification gateway.',
        'Examirror reserves the right to recall, invalidate, or reissue certificates if discrepancies in center evaluations or student eligibility are detected post-issuance.',
        'Duplicate physical certificates in cases of loss or damage can be requested through authorized centers subject to verification fees.'
      ]
    },
    {
      id: 'payments',
      icon: Lock,
      title: '5. Fees, Center Wallets & Non-Refundable Policy',
      color: 'border-t-blue-600',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      content: [
        'Examination fees, registration charges, and center wallet recharge credits are strictly non-refundable once an enrollment ID or exam session has been initiated.',
        'Study centers must ensure sufficient wallet balance prior to registering student batches or scheduling test dates.',
        'Course tuition fees collected by individual centers are governed by the center’s own local policies; Examirror is not responsible for tuition fee disputes between students and study centers.'
      ]
    },
    {
      id: 'termination',
      icon: AlertTriangle,
      title: '6. Code of Conduct, Anti-Fraud & Termination',
      color: 'border-t-red-600',
      badgeColor: 'bg-red-50 text-red-800 border-red-200',
      content: [
        'Examirror enforces a zero-tolerance policy against document fabrication, test score manipulation, or unauthorized usage of institution branding.',
        'Center affiliation may be suspended or permanently terminated with forfeiture of portal access if any audit uncovers unethical examination practices.',
        'Legal jurisdiction for all contractual, academic, and administrative matters resides exclusively within the judicial courts of East Singhbhum, Jharkhand, India.'
      ]
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-20 selection:bg-blue-600 selection:text-white">
      <SEO
        title="Terms & Conditions | Examirror Guidelines"
        description="Read the official terms and conditions for students, study centers, and franchisee partners using the Examirror educational portal."
        keywords={[
          'Examirror Terms and Conditions',
          'Student Policy',
          'Center Affiliation Terms',
          'Certification Rules'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Terms & Conditions', item: '/terms' }
        ]}
      />
      
      {/* Top Header Banner with Apple Compact Height & Motion */}
      <section className="bg-slate-950 text-white py-4 sm:py-5 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto space-y-1.5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-blue-400 text-[11px] font-bold uppercase tracking-wider"
          >
            <FileText size={13} />
            <span>Official Institutional Framework</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white"
          >
            Terms & Conditions
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs sm:text-[13px] text-slate-300 max-w-2xl mx-auto font-normal leading-normal"
          >
            Please read these terms carefully before utilizing the Examirror educational portal, applying for study center affiliation, or registering for certified programs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="pt-1 flex items-center justify-center gap-3 text-xs text-slate-400"
          >
            <span className="flex items-center gap-1">
              <Clock size={13} /> Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck size={14} /> Legally Binding Agreement
            </span>
          </motion.div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        
        {/* Quick Overview Notice */}
        <FadeUp>
          <div className="card-3d p-6 sm:p-7 mb-8 bg-white shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Scale size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Institutional Governance & Academic Integrity
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    By accessing Examirror portals (Student, Center, or Public Verification), you acknowledge and agree to comply with all operational guidelines and anti-fraud regulations set forth herein.
                  </p>
                </div>
              </div>

              <Link
                to="/privacy"
                className="btn-3d-white py-2 px-4 text-xs font-bold text-blue-700 shrink-0 inline-flex items-center gap-1.5"
              >
                <span>Read Privacy Policy</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Structured Terms Sections */}
        <StaggerContainer className="space-y-6">
          {sections.map((section, idx) => (
            <StaggerItem key={section.id || idx}>
              <motion.div
                whileHover={{ y: -2 }}
                className={`card-3d p-6 sm:p-8 bg-white shadow-md relative overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                      <section.icon size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${section.badgeColor}`}>
                    Section 0{idx + 1}
                  </span>
                </div>

                <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
                  {section.content.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        ✓
                      </div>
                      <p>{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Contact & Legal Inquiries Card */}
        <FadeUp delay={0.2}>
          <div className="card-3d p-8 mt-10 bg-slate-900 text-white shadow-xl relative overflow-hidden border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <HelpCircle size={14} />
                  <span>Legal & Regulatory Assistance</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Have questions about our Terms or Affiliation Guidelines?
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Our legal and academic affiliation desk is available to address queries regarding center registration, examination protocols, or certification validity.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="btn-3d-amber py-3 px-6 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall size={14} />
                  <span>Contact Support Desk</span>
                </Link>
                <Link
                  to="/franchise/requirements"
                  className="btn-3d-white py-3 px-5 text-xs text-slate-900"
                >
                  <span>Affiliation Criteria</span>
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>

      </div>

    </div>
  );
};

export default TermsAndConditions;

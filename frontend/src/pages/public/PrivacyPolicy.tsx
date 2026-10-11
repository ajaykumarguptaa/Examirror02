import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Clock,
  ExternalLink,
  CheckCircle2,
  Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeUp, StaggerContainer, StaggerItem } from '../../motion';
import SEO from '../../components/SEO';

const PrivacyPolicy = () => {
  const lastUpdated = 'October 2026';

  const sections = [
    {
      id: 'collection',
      icon: Database,
      title: '1. Information We Collect',
      color: 'border-t-blue-600',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      content: [
        'Student Profile Data: Full name, father’s/mother’s name, date of birth, gender, permanent address, contact number, and academic qualifications submitted at enrollment.',
        'Institutional & Center Operator Data: Franchise owner name, center premises address, Aadhar / PAN credentials, bank account info for recharge settlements, and classroom photos.',
        'Academic & Assessment Records: Online examination session logs, timestamps, MCQ answers, scored percentages, graded marks, and issued certificate numbers.',
        'Technical Logs: IP address, device browser headers, login timestamps, and anti-cheating monitoring logs during live exam sessions.'
      ]
    },
    {
      id: 'usage',
      icon: UserCheck,
      title: '2. How We Use Collected Information',
      color: 'border-t-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      content: [
        'Generating and authenticating tamper-proof Student Marksheets, Diplomas, and unique Certificate QR codes.',
        'Maintaining centralized verification gateways allowing employers and students to verify authentic educational credentials in real-time.',
        'Managing Study Center operational wallets, batch enrollments, syllabus delivery, and examination scheduling.',
        'Communicating crucial institutional notices, exam schedules, and academic score release alerts.'
      ]
    },
    {
      id: 'security',
      icon: Lock,
      title: '3. Data Security & Storage Standards',
      color: 'border-t-purple-600',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      content: [
        'All student and center records are stored in secured, encrypted databases protected with role-based permission controls and firewall barriers.',
        'Authentication tokens, passwords, and sensitive financial logs utilize industry-standard salted hashing and HTTPS transport layer security.',
        'Regular automated database backups are performed to prevent accidental loss or corruption of verified student records.',
        'Strict internal policies prevent unauthorized access or modification of historical examination grades.'
      ]
    },
    {
      id: 'disclosure',
      icon: Eye,
      title: '4. Third-Party Disclosure & Non-Sale Guarantee',
      color: 'border-t-amber-500',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
      content: [
        'Examirror strictly never sells, rents, or monetizes student or center contact information to third-party marketing agencies.',
        'Data is disclosed only to verified employers or government accreditation bodies upon explicit student consent via the public QR verification gateway.',
        'Legal compliance: Information may be provided to law enforcement or regulatory authorities solely upon formal judicial subpoena or statutory mandate.'
      ]
    },
    {
      id: 'cookies',
      icon: Server,
      title: '5. Cookies, Session Storage & Token Policies',
      color: 'border-t-blue-600',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      content: [
        'Our portal uses essential session cookies and JWT local authentication tokens solely to keep authorized Center and Student users securely logged in.',
        'No invasive third-party tracking beacons or behavioral advertising trackers are utilized across our portal ecosystem.',
        'Users can manage cookie preferences in browser settings, though disabling session cookies will prevent login to the student and examination portal.'
      ]
    },
    {
      id: 'rights',
      icon: ShieldCheck,
      title: '6. Student Data Rights & Correction Policy',
      color: 'border-t-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      content: [
        'Students have the right to review their enrolled profile details and request typographical corrections in name or father’s name prior to final certificate printing.',
        'Correction requests must be routed via the authorized study center with supporting government ID proof.',
        'Requests for marksheet duplicate re-issuance or profile updates are processed within 3–5 working days by the examination cell.'
      ]
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-20 selection:bg-blue-600 selection:text-white">
      <SEO
        title="Privacy Policy | Examirror Data Protection"
        description="Learn how Examirror protects student, franchise, and user data privacy in accordance with data protection guidelines."
        keywords={[
          'Examirror Privacy Policy',
          'Data Protection Examirror',
          'Student Data Security'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Privacy Policy', item: '/privacy' }
        ]}
      />
      
      {/* Top Header Banner */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b-2 border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Data Protection & Privacy Standards</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Privacy Policy
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Learn how Examirror safeguards student identity, examination integrity, and study center data across our educational ecosystem.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={13} /> Last Updated: {lastUpdated}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Lock size={14} /> 256-Bit Encrypted Data Protection
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        
        {/* Quick Overview Notice */}
        <FadeUp>
          <div className="card-3d p-6 sm:p-7 mb-8 bg-white shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Our Commitment to Transparent Data Governance
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    We only collect essential academic, identification, and operational data necessary to administer genuine skill certification and provide real-time verification gateways.
                  </p>
                </div>
              </div>

              <Link
                to="/terms"
                className="btn-3d-white py-2 px-4 text-xs font-bold text-blue-700 shrink-0 inline-flex items-center gap-1.5"
              >
                <span>Read Terms & Conditions</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* Structured Privacy Sections */}
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
                    Policy 0{idx + 1}
                  </span>
                </div>

                <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
                  {section.content.map((point, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
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

        {/* Grievance & Data Officer Card */}
        <FadeUp delay={0.2}>
          <div className="card-3d p-8 mt-10 bg-slate-900 text-white shadow-xl relative overflow-hidden border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <HelpCircle size={14} />
                  <span>Privacy Inquiries & Grievance Redressal</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Need to report a data issue or request profile correction?
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Our Data Protection Officer handles all student data verification, privacy inquiries, and correction requests promptly.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="btn-3d-primary py-3 px-6 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall size={14} />
                  <span>Contact Privacy Officer</span>
                </Link>
                <Link
                  to="/verify/student"
                  className="btn-3d-white py-3 px-5 text-xs text-slate-900"
                >
                  <span>Student Verification</span>
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>

      </div>

    </div>
  );
};

export default PrivacyPolicy;

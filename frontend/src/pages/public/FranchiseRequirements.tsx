import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import {
  Monitor,
  Printer,
  GraduationCap,
  Maximize2,
  Tv,
  Wifi,
  Droplet,
  Award,
  FileText,
  CreditCard,
  Image as ImageIcon,
  PenTool,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  PhoneCall,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Check
} from 'lucide-react';

const FranchiseRequirements = () => {
  const minimumRequirements = [
    {
      title: '2-3 Computers (or more)',
      desc: 'Adequate computing systems with working OS and standard software tools for student practicals.',
      icon: Monitor,
      highlight: true
    },
    {
      title: 'Multifunction Printer / Scanner',
      desc: 'All-in-one printer for student registration slips, admission forms, and project printouts.',
      icon: Printer,
      highlight: true
    },
    {
      title: 'Well Educated Faculty',
      desc: 'Qualified instructors with DCA, ADCA, BCA, MCA, or relevant computer proficiency.',
      icon: GraduationCap,
      highlight: true
    },
    {
      title: '100 Sq. ft. (or more) Area',
      desc: 'Dedicated lab and theory classroom area suitable for seated computer batches.',
      icon: Maximize2,
      highlight: true
    },
    {
      title: 'White Board / Marker Board',
      desc: 'Standard whiteboard for theory sessions, programming logic, and lectures.',
      icon: Tv,
      highlight: true
    },
    {
      title: 'Broadband / Internet Connection',
      desc: 'Active Wi-Fi or broadband connection for online exams, portal operations, and student tests.',
      icon: Wifi,
      highlight: true
    },
    {
      title: 'Drinking Water Facility',
      desc: 'Hygienic RO / filtered drinking water setup for students and staff.',
      icon: Droplet,
      highlight: true
    },
    {
      title: 'Good Teaching & Communication Skills',
      desc: 'Passionate and articulate trainers committed to student mentoring and skill enhancement.',
      icon: Award,
      highlight: true
    },
    // Enhanced Recommended Additions from Platform
    {
      title: 'Power Backup / Inverter / UPS',
      desc: 'Uninterrupted power support to prevent exam and practical session disruptions.',
      icon: Zap,
      highlight: false
    },
    {
      title: 'Reception & Counseling Desk',
      desc: 'Organized inquiry space for student admissions, prospectus display, and visitor queries.',
      icon: Building,
      highlight: false
    }
  ];

  const documentRequirements = [
    {
      title: 'ID & Address Proof of Center Head',
      desc: 'Self-attested copy of Aadhaar Card, Voter ID Card, Ration Card, or PAN Card.',
      icon: CreditCard,
      badge: 'Mandatory'
    },
    {
      title: 'Educational Qualification Certificates',
      desc: 'Copies of Matriculation (10th), Intermediate (12th), Graduation, ITI, Computer Diploma, PGDCA, or higher degrees.',
      icon: GraduationCap,
      badge: 'Mandatory'
    },
    {
      title: 'Center Head Passport Size Photographs',
      desc: 'Recent color passport-sized photos of the Center Director / Authorized Signatory.',
      icon: ImageIcon,
      badge: 'Mandatory'
    },
    {
      title: 'Center Head Specimen Signature',
      desc: 'Clear official signature sample on white paper for digital authorization records.',
      icon: PenTool,
      badge: 'Mandatory'
    },
    {
      title: 'Center Premises Photographs (Min. 2 Photos)',
      desc: 'Clear photos showing (1) Front exterior view with center display board, and (2) Internal computer lab setup.',
      icon: FileText,
      badge: 'Mandatory'
    },
    {
      title: 'Premises Ownership / Rent Proof (Optional)',
      desc: 'Recent electricity bill, property tax receipt, or valid rent agreement copy for address record.',
      icon: Building,
      badge: 'Recommended'
    }
  ];

  const benefits = [
    {
      title: 'Zero Franchise Royalty',
      desc: 'No heavy annual royalties or hidden renewal charges. 100% transparent fee structure.',
      icon: Sparkles
    },
    {
      title: 'Instant Online Portal Access',
      desc: 'Comprehensive dashboard for admissions, exam scheduling, fee receipts, and student tracking.',
      icon: Layers
    },
    {
      title: 'ISO 9001:2015 Certification',
      desc: 'Nationally recognized diplomas with tamper-proof QR code & barcode verification.',
      icon: ShieldCheck
    },
    {
      title: 'Fast Certificate Turnaround',
      desc: 'Swift exam result evaluation and prompt digital & physical certificate dispatch.',
      icon: Clock
    }
  ];

  const steps = [
    { step: '01', title: 'Submit Application', desc: 'Fill out the online franchise registration form with center details.' },
    { step: '02', title: 'Document Verification', desc: 'Our academic onboarding team reviews your premises and ID credentials.' },
    { step: '03', title: 'Center Authorization', desc: 'Receive your unique Center Code, login portal credentials, and digital banner kit.' },
    { step: '04', title: 'Commence Admissions', desc: 'Enroll students, access standard syllabus, conduct exams, and issue certificates.' }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 selection:bg-indigo-600 selection:text-white pb-20">
      <SEO
        title="Computer Franchise Requirements | Free Institute Affiliation"
        description="Learn the minimum infrastructure, document requirements, and step-by-step process to open an authorized Examirror computer training center in India with zero franchise fee."
        keywords={[
          'Computer Center Franchise Requirements',
          'Free Computer Institute Affiliation',
          'Start Computer Training Center',
          'Examirror Franchise Registration',
          'ISO Certified Institute Franchise'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Franchise Requirements', item: '/franchise/requirements' }
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Computer Institute Franchise & Affiliation Requirements',
          description: 'Minimum infrastructure and documentation required for starting an authorized Examirror computer institute.'
        }}
      />
      
      {/* 1. Header Banner */}
      <section className="bg-slate-900 text-white py-14 px-4 relative overflow-hidden border-b-2 border-slate-800">
        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
            <Sparkles size={14} />
            <span>Authorized Study Center Affiliation 2026-27</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Franchise & Affiliation Requirements
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Partner with Examirror to launch an authorized computer and vocational skill development institute in your city or town with zero franchise fee.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/franchise/register"
              className="btn-3d-amber px-7 py-3 text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <span>Apply for Franchise Now</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/contact"
              className="btn-3d-white px-6 py-3 text-xs flex items-center gap-2"
            >
              <PhoneCall size={14} />
              <span>Talk to Affiliation Officer</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid (Requirements & Document Checklist) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Requirements Lists */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Minimum Franchise Requirement Card */}
            <div className="card-3d-amber p-0 overflow-hidden shadow-lg">
              <div className="border-b border-slate-200 p-6 sm:p-8 bg-amber-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-700 tracking-tight flex items-center gap-2.5">
                    <Monitor className="text-amber-600" size={24} />
                    Minimum Franchise Requirement
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Essential infrastructure needed to qualify as an authorized study center.</p>
                </div>
                <span className="hidden sm:inline-block bg-amber-200 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Basic Setup
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {minimumRequirements.map((req, idx) => (
                  <div key={idx} className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <req.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{req.title}</h3>
                        {req.highlight && (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{req.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Requirements Card */}
            <div className="card-3d p-0 overflow-hidden shadow-lg">
              <div className="border-b border-slate-200 p-6 sm:p-8 bg-blue-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2.5">
                    <FileText className="text-blue-600" size={24} />
                    Documents Requirements
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Checklist of documents to submit during center affiliation registration.</p>
                </div>
                <span className="hidden sm:inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Verification
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {documentRequirements.map((doc, idx) => (
                  <div key={idx} className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                      <doc.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{doc.title}</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          doc.badge === 'Mandatory' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {doc.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Visual Showcase & Sticky Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            
            {/* Visual Classroom Setup Banner */}
            <div className="card-3d p-4 overflow-hidden group">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80"
                  alt="Modern Computer Lab Setup"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-slate-950/70 flex flex-col justify-end p-5 text-white">
                  <span className="text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider">Examirror Lab Standard</span>
                  <h4 className="text-lg font-bold text-white mt-1">Smart Computer Training Center Setup</h4>
                  <p className="text-xs text-slate-200 mt-1">Modern lab with network connectivity, software packages, and individual workstations.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl mt-3 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Government & ISO Aligned
                </span>
                <span className="text-blue-700 font-bold">100% Assistance</span>
              </div>
            </div>

            {/* Why Partner with Examirror */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-lg space-y-5 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm">
                  ★
                </div>
                <h3 className="font-bold text-lg text-white">Why Choose Examirror?</h3>
              </div>

              <div className="space-y-4">
                {benefits.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{b.title}</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/franchise/register"
                  className="btn-3d-amber w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register Center Online</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Quick Contact Desk */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle size={17} className="text-indigo-600" />
                <span>Need Assistance with Requirements?</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our affiliation coordinators are available to answer queries regarding hardware, floor plans, and documentation.
              </p>
              <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span>Helpline / WhatsApp:</span>
                <span>+91 98765 43210</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Step-by-Step Affiliation Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl shadow-slate-200/40 text-center space-y-8">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Affiliation Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              How to Start Your Examirror Study Center in 4 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {steps.map((st, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-600">{st.step}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100/70 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{st.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-center">
            <Link
              to="/franchise/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Submit Franchise Application</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default FranchiseRequirements;

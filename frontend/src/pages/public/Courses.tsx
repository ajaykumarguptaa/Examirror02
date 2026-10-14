import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Clock,
  IndianRupee,
  ArrowRight,
  BookOpen,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  GraduationCap,
  Sparkles,
  Layers,
  FileText,
  BadgeCheck,
  Send,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export interface CourseModule {
  moduleNumber: string;
  title: string;
  duration: string;
  topics: string[];
}

export interface CourseItem {
  id: number | string;
  slug: string;
  code: string;
  name: string;
  category: string;
  categoryId: string;
  duration: string;
  mode?: string;
  shortDescription: string;
  fee: number;
  badge?: string;
  eligibility?: string;
  certification?: string;
  thumbnailUrl: string;
  modules?: CourseModule[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Programs' },
  { id: 'dca-adca', label: 'DCA / ADCA' },
  { id: 'programming', label: 'Programming & Web' },
  { id: 'accounting', label: 'Accounting & Tally' },
  { id: 'hardware-networking', label: 'Hardware & Networking' },
  { id: 'vocational', label: 'Vocational Skills' }
];

const COMPREHENSIVE_COURSES: CourseItem[] = [
  {
    id: 1,
    slug: 'advanced-diploma-in-computer-application',
    code: 'ADCA',
    name: 'Advanced Diploma in Computer Application',
    category: 'DCA / ADCA',
    categoryId: 'dca-adca',
    duration: '12 Months',
    mode: 'Classroom & Lab',
    badge: 'Most Popular',
    eligibility: '10th / 12th Pass',
    certification: 'Govt. Aligned National Diploma',
    shortDescription: 'Comprehensive one-year professional diploma covering computer fundamentals, office automation, web design, financial accounting, and DTP.',
    fee: 12000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Computer Fundamentals & Windows OS',
        duration: '2 Months',
        topics: ['History & Architecture of Computers', 'Operating Systems (Windows 10/11 & Linux CLI Basics)', 'File Management, Control Panel & System Utilities', 'Typing Skills & Keyboard Ergonomics (English / Regional)']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Office Automation & Business Productivity',
        duration: '3 Months',
        topics: ['MS Word: Advanced Document Formatting, Mail Merge, Tables & Macros', 'MS Excel: Formulas (VLOOKUP, XLOOKUP, INDEX-MATCH), Pivot Tables & Charts', 'MS PowerPoint: Professional Slide Decks & Animations', 'MS Access: Database Design & Query Execution']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Financial Accounting with Tally Prime & GST',
        duration: '3 Months',
        topics: ['Accounting Principles, Journal Entries & Ledger Creation', 'Voucher Entry, Inventory Management & Bank Reconciliation', 'GST Computation, E-Way Bill & Tax Filing Basics', 'Final Accounts: Balance Sheet, P&L Statement']
      },
      {
        moduleNumber: 'Module 04',
        title: 'Web Designing & Desktop Publishing (DTP)',
        duration: '4 Months',
        topics: ['HTML5, CSS3 & Responsive Web Design Basics', 'Adobe Photoshop: Image Editing, Retouching & Banner Creation', 'CorelDraw: Vector Graphics, Logo & Pamphlet Designing', 'Live Capstone Project & Portfolio Submission']
      }
    ]
  },
  {
    id: 2,
    slug: 'diploma-in-computer-application',
    code: 'DCA',
    name: 'Diploma in Computer Application',
    category: 'DCA / ADCA',
    categoryId: 'dca-adca',
    duration: '6 Months',
    mode: 'Classroom & Lab',
    badge: 'Job-Ready Diploma',
    eligibility: '10th Pass',
    certification: 'Recognized 6-Month Diploma',
    shortDescription: 'Essential 6-month foundational computer program covering Windows, MS Office suite, internet technologies, and basic cyber safety.',
    fee: 6500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Foundations of Computer & Peripherals',
        duration: '1.5 Months',
        topics: ['Computer Hardware Architecture & Storage Devices', 'OS Installation & User Account Management', 'Printers, Scanners & Peripheral Configuration']
      },
      {
        moduleNumber: 'Module 02',
        title: 'MS Office Suite Mastery',
        duration: '2.5 Months',
        topics: ['MS Word Drafting, Reports & Certificates', 'MS Excel Data Entry, Formulas & Filter Tools', 'MS PowerPoint Presentation Delivery']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Internet, Email & Digital Security',
        duration: '2 Months',
        topics: ['Internet Protocols, Web Browsing & Search Techniques', 'Professional Email Writing & Cloud Drive Sync', 'Cyber Hygiene, Antivirus & Online Safety']
      }
    ]
  },
  {
    id: 3,
    slug: 'full-stack-web-development-diploma',
    code: 'FSWD',
    name: 'Full Stack Web Development Diploma',
    category: 'Programming & Web',
    categoryId: 'programming',
    duration: '8 Months',
    mode: 'Hybrid / Practical Lab',
    badge: 'Industry Aligned',
    eligibility: '12th Pass / Graduate',
    certification: 'National Tech Certification',
    shortDescription: 'Master modern frontend and backend development with JavaScript, React, Node.js, Express, and relational/NoSQL databases.',
    fee: 18500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Modern Frontend Fundamentals (HTML5, CSS3, JS)',
        duration: '2 Months',
        topics: ['Semantic HTML5, CSS Grid, Flexbox & Responsive Layouts', 'Vanilla JavaScript (ES6+), DOM Manipulation & Fetch API', 'Git, GitHub, Branches & Collaboration Workflows']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Frontend Frameworks with React',
        duration: '2 Months',
        topics: ['React Components, Props, State & Hooks', 'React Router, Context API & State Management', 'Tailwind CSS & Component Libraries Integration']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Backend Engineering with Node.js & Express',
        duration: '2 Months',
        topics: ['RESTful API Architecture & Express Middleware', 'Authentication with JWT & Password Hashing', 'PostgreSQL & MongoDB Database Schema Design']
      },
      {
        moduleNumber: 'Module 04',
        title: 'Deployment & Full-Stack Capstone Project',
        duration: '2 Months',
        topics: ['Cloud Deployment (Vercel, Render, Railway)', 'Performance Optimization & Security Best Practices', 'Production-Grade SaaS Application Portfolio']
      }
    ]
  },
  {
    id: 4,
    slug: 'tally-prime-with-gst-specialist',
    code: 'TALLY-GST',
    name: 'Tally Prime with GST & E-Way Bill',
    category: 'Accounting & Tally',
    categoryId: 'accounting',
    duration: '3 Months',
    mode: 'Practical Lab Based',
    badge: '100% Practical',
    eligibility: '10th / 12th / Commerce',
    certification: 'Certified Accounting Specialist',
    shortDescription: 'Complete computerized accounting diploma covering ledger vouchers, inventory control, GST invoicing, TDS, payroll, and audit reports.',
    fee: 5500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Accounting Fundamentals & Company Creation',
        duration: '3 Weeks',
        topics: ['Double Entry Accounting Rules & Journal Bookkeeping', 'Company Creation, Security Control & Groups Setup', 'Ledger & Sub-Ledger Classification']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Voucher Entries & Inventory Management',
        duration: '4 Weeks',
        topics: ['Payment, Receipt, Journal, Contra & Sales Vouchers', 'Stock Items, Units of Measure & Godown Tracking', 'Order Processing: Purchase & Sales Orders']
      },
      {
        moduleNumber: 'Module 03',
        title: 'GST, TDS, Payroll & E-Filing Reporting',
        duration: '5 Weeks',
        topics: ['GST Activation, CGST/SGST/IGST Calculations & Invoices', 'TDS Deduction & Statutory Reports', 'Payroll Management: Salary Slips & Attendance', 'Balance Sheet, Profit & Loss and Trial Balance Analysis']
      }
    ]
  },
  {
    id: 5,
    slug: 'hardware-networking-cctv-technician',
    code: 'HN-CCTV',
    name: 'Hardware, Networking & CCTV Engineering',
    category: 'Hardware & Networking',
    categoryId: 'hardware-networking',
    duration: '4 Months',
    mode: 'Hands-on Hardware Lab',
    badge: 'High Demand',
    eligibility: '10th Pass',
    certification: 'Certified Hardware Technician',
    shortDescription: 'Hands-on hardware assembly, desktop/laptop troubleshooting, LAN/WAN routing, IP configuration, and CCTV camera network installation.',
    fee: 8500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'PC Hardware Assembly & Diagnostics',
        duration: '1 Month',
        topics: ['Motherboards, CPUs, RAM, SMPS & Storage Installation', 'BIOS/UEFI Configuration & OS Deployment', 'Hardware Diagnostics & Component Testing']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Computer Networking & Wi-Fi Configuration',
        duration: '1.5 Months',
        topics: ['OSI Model, IP Addressing (IPv4/IPv6) & Subnetting', 'Crimping (RJ45), Switches, Routers & LAN Setup', 'Wi-Fi Access Points, Security & Firewall Basics']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Analog & IP CCTV Surveillance Systems',
        duration: '1.5 Months',
        topics: ['DVR & NVR Installation, BNC/RJ45 Cabling', 'IP Camera Configuration, Port Forwarding & Mobile Remote View', 'Storage Calculation & CCTV Maintenance Troubleshooting']
      }
    ]
  },
  {
    id: 6,
    slug: 'smartphone-repairing-technology',
    code: 'SM-TECH',
    name: 'Smartphone Hardware & Software Repairing',
    category: 'Vocational Skills',
    categoryId: 'vocational',
    duration: '3 Months',
    mode: 'Practical Workshop',
    badge: 'Self-Employment',
    eligibility: '8th / 10th Pass',
    certification: 'Professional Repairing Certificate',
    shortDescription: 'Master SMD micro-soldering, IC reballing, display/touch combo replacement, flashing, unlocking, and software troubleshooting for all smartphones.',
    fee: 9000,
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Mobile Electronics & Circuit Architecture',
        duration: '3 Weeks',
        topics: ['Multimeter Usage, Resistors, Capacitors & Diodes', 'PCB Tracing & Schematic Diagram Reading', 'Short Circuit Detection & Power Supply Testing']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Hardware Repairs & Micro-Soldering',
        duration: '5 Weeks',
        topics: ['SMD Rework Station Handling & Temperature Management', 'Charging Port, Speaker, Mic & Display Combo Replacement', 'IC Reballing & BGA Chip Replacement Basics']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Software Flashing & FRP Unlocking',
        duration: '4 Weeks',
        topics: ['Stock ROM Flashing (Odin, SP Flash Tool, Mi Flash)', 'FRP Bypass, Pattern Lock Removal & IMEI Repair Basics', 'Troubleshooting Dead Boot & Bootloop Issues']
      }
    ]
  },
  {
    id: 7,
    slug: 'professional-fashion-designing-tailoring',
    code: 'FASHION-STITCH',
    name: 'Professional Fashion Designing & Tailoring',
    category: 'Vocational Skills',
    categoryId: 'vocational',
    duration: '6 Months',
    mode: 'Studio Practical',
    badge: 'Women Empowerment',
    eligibility: 'Open to All',
    certification: 'Govt. Aligned Vocational Diploma',
    shortDescription: 'Learn garment drafting, pattern making, professional cutting, boutique sewing techniques, and modern fashion illustration.',
    fee: 7500,
    thumbnailUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=600',
    modules: [
      {
        moduleNumber: 'Module 01',
        title: 'Sewing Machine Handling & Basic Stitches',
        duration: '1.5 Months',
        topics: ['Machine Maintenance, Threading & Tension Control', 'Hand Stitches, Seams & Hemming Techniques', 'Body Measurements & Proportion Rules']
      },
      {
        moduleNumber: 'Module 02',
        title: 'Pattern Making & Garment Drafting',
        duration: '2.5 Months',
        topics: ['Drafting Kurti, Salwar, Blouse, Frocks & Western Tops', 'Paper Pattern Cutting, Layout & Fabric Estimation', 'Dart Manipulation & Neckline Finishing']
      },
      {
        moduleNumber: 'Module 03',
        title: 'Designer Boutique Finishing & Business Skills',
        duration: '2 Months',
        topics: ['Piping, Zips, Buttonholes & Embroidery Accents', 'Fitting Adjustments & Alteration Expertise', 'Costing, Pricing & Boutique Management Basics']
      }
    ]
  }
];

export const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [activeSyllabusCourse, setActiveSyllabusCourse] = useState<CourseItem | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  // Debounce search term by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // TanStack Query for Dynamic Courses from backend
  const { data: dbCourses, isLoading } = useQuery({
    queryKey: ['publicCoursesList'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/public/courses');
        if (!response.ok) return null;
        const json = await response.json();
        return json.data || null;
      } catch {
        return null;
      }
    }
  });

  // Merge backend courses with rich syllabus data
  const allCourses = useMemo(() => {
    if (dbCourses && Array.isArray(dbCourses) && dbCourses.length > 0) {
      // Enrich backend courses with fallback modules if missing
      return dbCourses.map((c: any, index: number) => {
        const matchingTemplate = COMPREHENSIVE_COURSES.find(
          tc => tc.code.toLowerCase() === (c.code || '').toLowerCase() ||
            tc.name.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(tc.name.toLowerCase())
        );

        let parsedModules: CourseModule[] | undefined = undefined;
        if (c.semesters) {
          try {
            const sems = typeof c.semesters === 'string' ? JSON.parse(c.semesters) : c.semesters;
            if (Array.isArray(sems) && sems.length > 0) {
              parsedModules = sems.map((s: any) => ({
                moduleNumber: `Semester ${s.num || 1}`,
                title: s.subjects ? (s.subjects.split(',')[0] || `Semester ${s.num || 1}`) : `Semester ${s.num || 1}`,
                duration: c.duration ? `Part of ${c.duration}` : 'Semester Duration',
                topics: s.subjects
                  ? s.subjects.split(',').map((subj: string) => subj.trim()).filter(Boolean)
                  : ['Core Theory & Practical Training', 'Hands-on Lab Exercises', 'Assessment & Viva']
              }));
            }
          } catch (_) {}
        }

        const rawImg = c.image_url || c.thumbnail_url;
        const resolvedImg = rawImg 
          ? (rawImg.startsWith('http') || rawImg.startsWith('data:') ? rawImg : `http://localhost:3000${rawImg}`)
          : (matchingTemplate?.thumbnailUrl || COMPREHENSIVE_COURSES[index % COMPREHENSIVE_COURSES.length].thumbnailUrl);

        // Intelligent category resolver for category tabs
        const textToMatch = `${c.name} ${c.code || ''} ${c.categoryId || ''}`.toLowerCase();
        let derivedCategory = matchingTemplate?.category || c.categoryId || 'Professional Program';
        let derivedCategoryId = matchingTemplate?.categoryId || 'all';

        if (textToMatch.includes('adca') || textToMatch.includes('dca') || textToMatch.includes('pgdca') || textToMatch.includes('computer application')) {
          derivedCategory = 'DCA / ADCA';
          derivedCategoryId = 'dca-adca';
        } else if (textToMatch.includes('web') || textToMatch.includes('programming') || textToMatch.includes('stack') || textToMatch.includes('python') || textToMatch.includes('java') || textToMatch.includes('dit') || textToMatch.includes('it')) {
          derivedCategory = 'Programming & Web';
          derivedCategoryId = 'programming';
        } else if (textToMatch.includes('tally') || textToMatch.includes('gst') || textToMatch.includes('account') || textToMatch.includes('finan')) {
          derivedCategory = 'Accounting & Tally';
          derivedCategoryId = 'accounting';
        } else if (textToMatch.includes('hardware') || textToMatch.includes('network') || textToMatch.includes('cctv') || textToMatch.includes('lan')) {
          derivedCategory = 'Hardware & Networking';
          derivedCategoryId = 'hardware-networking';
        } else if (textToMatch.includes('typing') || textToMatch.includes('office') || textToMatch.includes('basic') || textToMatch.includes('vocational') || textToMatch.includes('repair') || textToMatch.includes('tailor') || textToMatch.includes('fashion')) {
          derivedCategory = 'Vocational Skills';
          derivedCategoryId = 'vocational';
        }

        return {
          id: c.id || index + 1,
          slug: c.slug || c.code?.toLowerCase() || `course-${index + 1}`,
          code: c.code || 'EXM-CRS',
          name: c.name,
          category: derivedCategory,
          categoryId: derivedCategoryId,
          duration: c.duration || matchingTemplate?.duration || '3–6 Months',
          mode: matchingTemplate?.mode || 'Classroom & Hands-on Lab',
          badge: matchingTemplate?.badge || (index === 0 ? 'Featured' : 'Industry Aligned'),
          eligibility: c.eligibility || matchingTemplate?.eligibility || '10th / 12th Pass',
          certification: matchingTemplate?.certification || 'Recognized National Certificate',
          shortDescription: c.shortDescription || c.description || matchingTemplate?.shortDescription || 'Professional certification curriculum tailored for career readiness and practical skills.',
          fee: Number(c.fee) || matchingTemplate?.fee || 5000,
          thumbnailUrl: resolvedImg,
          modules: (parsedModules && parsedModules.length > 0) ? parsedModules : (matchingTemplate?.modules || [
            {
              moduleNumber: 'Module 01',
              title: 'Core Fundamentals & Theory',
              duration: '1 Month',
              topics: ['Fundamental Concepts & Terminology', 'Standard Operating Procedures', 'Safety & Best Practices']
            },
            {
              moduleNumber: 'Module 02',
              title: 'Practical Application & Hands-on Lab',
              duration: '2 Months',
              topics: ['Software/Hardware Tool Training', 'Real-world Case Studies', 'Supervised Practical Exercises']
            },
            {
              moduleNumber: 'Module 03',
              title: 'Project Work & Exam Preparation',
              duration: '1 Month',
              topics: ['Live Capstone Project', 'Viva & Practical Assessment', 'Final Examination & Certification']
            }
          ])
        } as CourseItem;
      });
    }
    return COMPREHENSIVE_COURSES;
  }, [dbCourses]);

  // Filtered & Sorted Courses
  const displayedCourses = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allCourses
      .filter((course) => {
        const matchesSearch =
          !q ||
          course.name.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q) ||
          course.category.toLowerCase().includes(q) ||
          course.shortDescription.toLowerCase().includes(q);

        const matchesCategory =
          selectedCategory === 'all' || course.categoryId === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'fee-low') return a.fee - b.fee;
        if (sortBy === 'fee-high') return b.fee - a.fee;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0; // featured default
      });
  }, [allCourses, debouncedSearch, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
      <SEO
        title="Courses Catalog | Examirror"
        description="Explore Examirror's accredited computer application, programming, Tally accounting, hardware, and vocational skill certification courses designed for career growth."
        keywords={[
          'DCA Course',
          'ADCA Course',
          'Tally Prime GST Certification',
          'Computer Programming Courses',
          'Hardware Networking Course',
          'Vocational Skill Certification',
          'Examirror Courses'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Courses', item: '/courses' }
        ]}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Examirror Career Certification Courses',
            description: 'Accredited computer & vocational certification courses offered across India.',
            itemListElement: COMPREHENSIVE_COURSES.slice(0, 10).map((c, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Course',
                name: c.name,
                description: c.shortDescription,
                provider: {
                  '@type': 'EducationalOrganization',
                  name: 'Examirror',
                  sameAs: 'https://examirror.edu.in'
                }
              }
            }))
          }
        ]}
      />
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-14 sm:py-16 text-center relative overflow-hidden border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles size={13} />
            <span>Govt. Aligned & Industry Ready Curriculum</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Certified Career & Skill Programs
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Explore national diplomas, technical certificates, and vocational skills with authorized study center support, hands-on labs, and centralized QR verification.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Search & Sort Row */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3.5 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-96 flex-shrink-0">
              <input
                type="text"
                placeholder="Search by course name, code (e.g. ADCA, Tally)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-colors text-slate-800 placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">Sort by:</span>
              <select
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured / Recommended</option>
                <option value="name">Course Name (A–Z)</option>
                <option value="fee-low">Fee: Lowest First</option>
                <option value="fee-high">Fee: Highest First</option>
              </select>
            </div>
          </div>

          {/* Horizontally Scrollable Category Filter Pills */}
          <div className="pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-2 pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 px-1">
          <p className="text-xs font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-900">{displayedCourses.length}</span> programs
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </p>
          {(searchTerm || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div
                key={sk}
                className="bg-white rounded-2xl border border-slate-200 p-0 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-48 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-10 bg-slate-200 rounded-md w-full" />
                  <div className="h-10 bg-slate-200 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.25) }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
              >
                {/* Thumbnail Image */}
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Category & Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="bg-slate-900/90 text-white px-2.5 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-xs">
                      {course.code}
                    </span>
                    {course.badge && (
                      <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide">
                        {course.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full bg-slate-950/75 px-3.5 py-1.5 flex items-center justify-between text-white text-xs">
                    <span className="font-medium text-slate-200">{course.category}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> {course.mode || 'Classroom + Lab'}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex flex-col flex-grow space-y-3">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2 min-h-[48px] group-hover:text-blue-600 transition-colors">
                    {course.name}
                  </h3>

                  <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                    {course.shortDescription}
                  </p>

                  {/* Course Highlights */}
                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-600 shrink-0" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{course.eligibility || '10th / 12th'}</span>
                    </div>
                  </div>

                  {/* Fee & Action Buttons */}
                  <div className="mt-auto pt-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Standard Program Fee</span>
                      <div className="flex items-center text-slate-900 font-bold text-base">
                        <IndianRupee size={15} />
                        <span>{course.fee.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSyllabusCourse(course);
                          setExpandedModule(0);
                        }}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 active:scale-98"
                      >
                        <BookOpen size={14} className="text-blue-600" />
                        <span>View Syllabus</span>
                      </button>

                      <Link
                        to={`/contact?course=${encodeURIComponent(course.name)}&code=${encodeURIComponent(course.code)}`}
                        className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      >
                        <span>Apply / Inquire</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No courses found</h3>
            <p className="text-xs text-slate-500 mb-5">
              We couldn't find any courses matching "{searchTerm}". Try another search term or browse all categories.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </section>

      {/* Quick Syllabus Drawer / Modal */}
      <AnimatePresence>
        {activeSyllabusCourse && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="bg-white w-full sm:max-w-2xl max-h-[88vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white relative">
                <button
                  type="button"
                  onClick={() => setActiveSyllabusCourse(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold mb-2">
                  <span>{activeSyllabusCourse.code}</span>
                  <span>•</span>
                  <span>{activeSyllabusCourse.duration}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white pr-10">
                  {activeSyllabusCourse.name}
                </h3>
                <p className="text-slate-300 text-xs mt-1">
                  Official Detailed Curriculum & Learning Outcomes
                </p>
              </div>

              {/* Drawer Body — Accordion Modules */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-grow">
                {/* Meta Highlights */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Eligibility</span>
                    <span className="font-semibold text-slate-800 truncate block">{activeSyllabusCourse.eligibility || '10th / 12th'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mode</span>
                    <span className="font-semibold text-slate-800 truncate block">{activeSyllabusCourse.mode || 'Classroom + Lab'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Standard Fee</span>
                    <span className="font-bold text-emerald-700 block">₹{activeSyllabusCourse.fee.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    <span>Modules & Syllabus Breakdown</span>
                  </h4>

                  {activeSyllabusCourse.modules && activeSyllabusCourse.modules.length > 0 ? (
                    activeSyllabusCourse.modules.map((mod, idx) => {
                      const isExpanded = expandedModule === idx;
                      return (
                        <div
                          key={idx}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedModule(isExpanded ? null : idx)}
                            className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                                {mod.moduleNumber}
                              </span>
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {mod.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
                                {mod.duration}
                              </span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                              <ul className="space-y-1.5">
                                {mod.topics.map((topic, tIdx) => (
                                  <li
                                    key={tIdx}
                                    className="text-xs text-slate-700 flex items-start gap-2"
                                  >
                                    <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                                    <span>{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 py-4">Detailed modules available upon center enrollment.</p>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSyllabusCourse(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>

                <Link
                  to={`/contact?course=${encodeURIComponent(activeSyllabusCourse.name)}`}
                  onClick={() => setActiveSyllabusCourse(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Apply at Authorized Center</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;

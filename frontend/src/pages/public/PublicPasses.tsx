import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Check, 
  X,
  RotateCcw, 
  Trophy, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  ChevronDown,
  Flame,
  Star,
  Users,
  Target,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

interface PassItem {
  id: number;
  pass_type: 'BASIC' | 'ELITE';
  title: string;
  subtitle: string;
  price: string | number;
  validity_days: number;
  features: string[];
  badge_text?: string;
}

const FALLBACK_PASSES: PassItem[] = [
  {
    id: 1,
    pass_type: 'BASIC',
    title: 'Basic Practice Pass',
    subtitle: 'Foundational Mock Tests & Solutions',
    price: 199,
    validity_days: 90,
    features: [
      'Access to Standard Mock Tests & Foundations',
      'Instant Scorecard & Detailed Question Solutions',
      'Topic-wise Performance Analytics',
      'Subject Weakness & Accuracy Analysis',
      'Valid for 90 Days'
    ],
    badge_text: 'STARTER'
  },
  {
    id: 2,
    pass_type: 'ELITE',
    title: 'Examirror Elite Pass',
    subtitle: 'All-Access VIP Pass to ALL Test Series & Live Mocks',
    price: 499,
    validity_days: 365,
    features: [
      'UNLIMITED 1-Click Access to ALL Paid Test Series',
      'Zero Extra Payment - Instant Test Activation',
      'Unlimited Mock Re-attempts & Practice Rounds',
      'Official All India Ranking (AIR) & Percentile Cards',
      'Detailed Solution PDF Explanations',
      'VIP Candidate Verification Badge & Priority Support',
      'Valid for Full 365 Days (1 Year)'
    ],
    badge_text: 'BEST VALUE'
  }
];

const cleanText = (str: string) => {
  if (!str) return '';
  return str.replace(/^[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\s•\-]+/u, '').trim();
};

const cleanTitle = (title: string) => {
  if (!title) return '';
  return title.replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '').trim();
};

const renderFeatureIcon = (feature: string, isElite: boolean) => {
  const lower = feature.toLowerCase();
  const iconBase = `w-4 h-4 shrink-0 ${isElite ? 'text-amber-400' : 'text-indigo-600'}`;

  if (lower.includes('unlimited') || lower.includes('test series') || lower.includes('access')) {
    return <Layers className={iconBase} />;
  }
  if (lower.includes('zero') || lower.includes('instant') || lower.includes('activation')) {
    return <Zap className={iconBase} />;
  }
  if (lower.includes('re-attempt') || lower.includes('rounds') || lower.includes('practice')) {
    return <RotateCcw className={iconBase} />;
  }
  if (lower.includes('ranking') || lower.includes('air') || lower.includes('percentile')) {
    return <Trophy className={iconBase} />;
  }
  if (lower.includes('pdf') || lower.includes('solution') || lower.includes('explanation')) {
    return <FileText className={iconBase} />;
  }
  if (lower.includes('vip') || lower.includes('support') || lower.includes('badge')) {
    return <ShieldCheck className={iconBase} />;
  }
  if (lower.includes('valid') || lower.includes('days') || lower.includes('year')) {
    return <Calendar className={iconBase} />;
  }
  return <CheckCircle2 className={iconBase} />;
};

export default function PublicPasses() {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<PassItem[]>(FALLBACK_PASSES);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const isStudentLoggedIn = Boolean(localStorage.getItem('studentToken'));

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/student/wallet/passes')
      .then(res => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPasses(res.data.data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handlePassSelect = (_pass: PassItem) => {
    if (isStudentLoggedIn) {
      navigate('/student/passes');
    } else {
      navigate('/login/student?redirect=/student/passes');
    }
  };

  const elitePass = passes.find(p => p.pass_type === 'ELITE') || passes[1] || FALLBACK_PASSES[1];
  const basicPass = passes.find(p => p.pass_type === 'BASIC') || passes[0] || FALLBACK_PASSES[0];

  const comparisonRows = [
    { feature: 'Free Demo Mock Tests', free: true, basic: true, elite: true },
    { feature: 'Detailed Question Explanations & Solutions', free: 'Basic only', basic: true, elite: true },
    { feature: 'Topic-wise Accuracy & Weakness Analytics', free: false, basic: true, elite: true },
    { feature: 'All Standard Mock Tests & Foundations', free: false, basic: true, elite: true },
    { feature: 'All-India Rank (AIR) & Percentile Cards', free: false, basic: 'Selected', elite: true },
    { feature: 'Unlimited 1-Click Access to ALL Paid Test Series', free: false, basic: false, elite: true },
    { feature: 'Zero Additional Purchase Cost on New Test Series', free: false, basic: false, elite: true },
    { feature: 'Unlimited Mock Re-attempts & Practice Rounds', free: false, basic: false, elite: true },
    { feature: 'Downloadable Solution PDFs', free: false, basic: false, elite: true },
    { feature: 'Verified VIP Candidate Badge & Priority Support', free: false, basic: false, elite: true },
    { feature: 'Pass Validity Duration', free: 'Limited', basic: '90 Days', elite: '365 Days (1 Year)' }
  ];

  const faqs = [
    {
      q: 'What is the Examirror Elite Pass?',
      a: 'The Examirror Elite Pass is an all-access premium membership that unlocks all existing and upcoming paid test series, mock exams, previous year papers, and performance analytics across all categories for 365 days.'
    },
    {
      q: 'Do I need to pay again when new test series are added?',
      a: 'No! Absolutely zero extra payment. Every single new test series published by Examirror during your active 365-day validity will unlock automatically for free with 1 click.'
    },
    {
      q: 'How do I activate the pass after signing up?',
      a: 'Once logged into your student account, open the "Examirror Pass" tab, recharge your wallet using the instant UPI QR code, and click "Activate with Wallet". Your pass activates within seconds!'
    },
    {
      q: 'Can I re-attempt mock tests to improve my accuracy?',
      a: 'Yes! Elite Pass holders get unlimited re-attempts on all test series so you can master difficult topics and track your improvement over time.'
    },
    {
      q: 'Is there any auto-debit or hidden recurring fee?',
      a: 'No auto-debit. We believe in 100% transparent pricing. You pay once for your chosen validity and will never be charged automatically.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 selection:text-black">
      <SEO
        title="Examirror Elite Pass | Unlimited Online Test Series & Mock Tests"
        description="Get unlimited 1-click access to all mock test series, All-India rankings, and solutions with the Examirror Elite Pass. Full 365-day validity for just ₹499."
        keywords={['Elite Pass', 'Examirror Pass', 'Mock Test Pass', 'Unlimited Test Series', 'Government Exam Pass', 'Online Test Subscription']}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Passes', item: '/passes' }
        ]}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden border-b border-slate-800">
        {/* Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-10 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wide uppercase mb-6"
          >
            <Crown size={15} className="text-amber-400 animate-bounce" />
            <span>Official Examirror Student Passes</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Pass One Exam or Clear Them All with{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              Examirror Pass
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Get unlimited access to India’s most comprehensive test series library. Practice with live timed mocks, full solutions, and All-India percentile rank.
          </motion.p>

          {/* Social Proof Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-400" />
              Over 50,000+ Questions Available
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-400" />
              100% Latest Exam Pattern & Syllabus
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-400" />
              Instant Wallet Activation
            </span>
          </motion.div>

        </div>
      </section>

      {/* Pass Cards Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Basic Pass (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                  {basicPass.badge_text || 'Starter'}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {basicPass.validity_days} Days Access
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">
                {cleanTitle(basicPass.title)}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {basicPass.subtitle}
              </p>

              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-slate-800">
                <span className="text-4xl font-extrabold text-white">
                  ₹{Number(basicPass.price).toFixed(0)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / {basicPass.validity_days} Days
                </span>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {(basicPass.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    {renderFeatureIcon(feat, false)}
                    <span className="leading-snug">{cleanText(feat)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePassSelect(basicPass)}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{isStudentLoggedIn ? 'Activate Basic Pass (₹199)' : 'Sign In to Buy Basic Pass'}</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>

          {/* Elite Pass (7 cols, Luxury Obsidian Gold) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 relative group rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-400 via-amber-600/50 to-amber-700 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col justify-between"
          >
            {/* Top Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Sparkles size={12} className="text-slate-950" />
                <span>{elitePass.badge_text || 'MOST POPULAR • BEST VALUE'}</span>
              </span>
            </div>

            <div className="bg-slate-950/95 backdrop-blur-2xl rounded-[23px] p-6 sm:p-9 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                    <Crown size={14} className="text-amber-400" />
                    <span>ELITE ALL-ACCESS</span>
                  </div>
                  <span className="text-xs font-bold text-amber-200/90 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
                    365 Days Unlimited Access
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>{cleanTitle(elitePass.title)}</span>
                  <Flame size={24} className="text-amber-400 shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mb-6">
                  {elitePass.subtitle}
                </p>

                {/* Price Display */}
                <div className="flex flex-wrap items-baseline gap-3 mb-6 pb-6 border-b border-amber-500/20">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    ₹{Number(elitePass.price).toFixed(0)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Full Year (365 Days)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Just ₹1.36 / day • Unlimited Tests
                    </span>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {(elitePass.features || []).map((feat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-200"
                    >
                      {renderFeatureIcon(feat, true)}
                      <span className="leading-snug font-medium">{cleanText(feat)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handlePassSelect(elitePass)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Crown size={18} />
                <span>{isStudentLoggedIn ? 'Get Elite Pass for ₹499' : 'Login / Register to Get Elite Pass'}</span>
                <ArrowRight size={18} />
              </button>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Feature Comparison Matrix Table */}
      <section className="py-16 bg-slate-900/50 border-t border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Compare Membership Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              See why more than 85% of our candidates choose the Examirror Elite Pass.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-300">Feature</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-400 text-center">Free Account</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-indigo-400 text-center">Basic Pass (₹199)</th>
                  <th className="py-4 px-3 sm:px-4 font-black text-amber-400 text-center bg-amber-500/10 border-x border-amber-500/30">
                    👑 Elite Pass (₹499)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-medium text-slate-200">
                      {row.feature}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check size={16} className="text-emerald-400 mx-auto" />
                        ) : (
                          <X size={16} className="text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">{row.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? (
                          <Check size={16} className="text-indigo-400 mx-auto" />
                        ) : (
                          <X size={16} className="text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] text-indigo-300 font-semibold">{row.basic}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center bg-amber-500/5 border-x border-amber-500/20 font-bold text-amber-300">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? (
                          <Check size={18} className="text-amber-400 mx-auto font-black" />
                        ) : (
                          <X size={16} className="text-slate-600 mx-auto" />
                        )
                      ) : (
                        <span>{row.elite}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-amber-400' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/30 text-center relative overflow-hidden">
          <Crown size={32} className="text-amber-400 mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Ready to Accelerate Your Exam Preparation?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Join thousands of serious aspirants who practice with Examirror Elite Pass everyday.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handlePassSelect(elitePass)}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <span>Get Elite Pass Now</span>
              <ArrowRight size={16} />
            </button>
            <Link
              to="/test-series"
              className="py-3 px-5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs hover:bg-slate-800"
            >
              Browse Test Series
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
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
  ChevronDown,
  Flame
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
  original_price?: string | number | null;
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
    original_price: 399,
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
    original_price: 999,
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
  const iconBase = `w-4 h-4 shrink-0 ${isElite ? 'text-amber-600' : 'text-indigo-600'}`;

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

export const PublicPasses: React.FC = () => {
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
    { feature: 'All India Ranking (AIR) & Leaderboard', free: false, basic: true, elite: true },
    { feature: 'Sectional & Topic-Wise Speed Tests', free: false, basic: true, elite: true },
    { feature: 'Paid Full-Length Mock Test Series', free: false, basic: 'Selected only', elite: 'ALL UNLIMITED' },
    { feature: 'Zero Extra Cost Per Test Activation', free: false, basic: false, elite: true },
    { feature: 'Unlimited Mock Test Re-attempts', free: false, basic: false, elite: true },
    { feature: 'Downloadable Bilingual Solution PDFs', free: false, basic: false, elite: true },
    { feature: 'VIP Candidate Verification Badge', free: false, basic: false, elite: true },
    { feature: 'Validity Duration', free: 'Lifetime', basic: `${basicPass.validity_days} Days`, elite: `${elitePass.validity_days} Days (1 Year)` }
  ];

  const faqs = [
    {
      q: 'What is the Examirror Elite Pass?',
      a: 'The Elite Pass is an all-inclusive VIP pass designed for students preparing for competitive and academic exams. With a single one-time payment, you unlock every paid test series on Examirror for a full year.'
    },
    {
      q: 'Will new test series launched during my pass period be included?',
      a: 'Yes! Any new exam or test series launched by Examirror during your active validity is automatically accessible to you with zero additional charges.'
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
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
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-white via-amber-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black tracking-wide uppercase mb-6 shadow-xs"
          >
            <Crown size={15} className="text-amber-600 animate-bounce" />
            <span>Official Examirror Student Passes</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto"
          >
            Pass One Exam or Clear Them All with{' '}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Examirror Pass
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Get unlimited access to India’s most comprehensive test series library. Practice with live timed mocks, full solutions, and All-India percentile rank.
          </motion.p>

          {/* Social Proof Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-600" />
              Over 50,000+ Questions Available
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-600" />
              100% Latest Exam Pattern & Syllabus
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-amber-600" />
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
            className="lg:col-span-5 bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  {basicPass.badge_text || 'Starter'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {basicPass.validity_days} Days Access
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {cleanTitle(basicPass.title)}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {basicPass.subtitle}
              </p>

              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  ₹{Number(basicPass.price).toFixed(0)}
                </span>
                {basicPass.original_price && Number(basicPass.original_price) > Number(basicPass.price) && (
                  <span className="text-base line-through text-slate-400 font-bold">
                    ₹{Number(basicPass.original_price).toFixed(0)}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  / {basicPass.validity_days} Days
                </span>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                {(basicPass.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    {renderFeatureIcon(feat, false)}
                    <span className="leading-snug font-medium">{cleanText(feat)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePassSelect(basicPass)}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-sm text-center flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>{isStudentLoggedIn ? `Activate Basic Pass (₹${Number(basicPass.price).toFixed(0)})` : 'Sign In to Buy Basic Pass'}</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>

          {/* Elite Pass (7 cols, Luxury Light Golden Crown) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 relative group rounded-3xl p-[2px] bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 transition-all flex flex-col justify-between"
          >
            {/* Top Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1.5">
                <Crown size={12} className="text-slate-950" />
                <span>{elitePass.badge_text || 'MOST POPULAR • BEST VALUE'}</span>
              </span>
            </div>

            <div className="bg-gradient-to-b from-white via-amber-50/30 to-white rounded-[22px] p-6 sm:p-9 h-full flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shadow-xs">
                    <Crown size={14} className="text-amber-600" />
                    <span>ELITE ALL-ACCESS</span>
                  </div>
                  <span className="text-xs font-bold text-amber-950 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    {elitePass.validity_days} Days Unlimited Access
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight flex items-center gap-2">
                  <span>{cleanTitle(elitePass.title)}</span>
                  <Flame size={24} className="text-amber-500 shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mb-6 font-medium">
                  {elitePass.subtitle}
                </p>

                {/* Price Display */}
                <div className="flex flex-wrap items-baseline gap-3 mb-6 pb-6 border-b border-amber-200/70">
                  <span className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
                    ₹{Number(elitePass.price).toFixed(0)}
                  </span>
                  {elitePass.original_price && Number(elitePass.original_price) > Number(elitePass.price) && (
                    <>
                      <span className="text-xl line-through text-slate-400 font-bold">
                        ₹{Number(elitePass.original_price).toFixed(0)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-xs">
                        {Math.round(((Number(elitePass.original_price) - Number(elitePass.price)) / Number(elitePass.original_price)) * 100)}% OFF
                      </span>
                    </>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                      {elitePass.validity_days} Days Validity
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Just ₹{(Number(elitePass.price) / (elitePass.validity_days || 365)).toFixed(2)} / day • Unlimited Tests
                    </span>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {(elitePass.features || []).map((feat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-slate-800"
                    >
                      {renderFeatureIcon(feat, true)}
                      <span className="leading-snug font-semibold text-slate-800">{cleanText(feat)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handlePassSelect(elitePass)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Crown size={18} />
                <span>{isStudentLoggedIn ? `Get Elite Pass for ₹${Number(elitePass.price).toFixed(0)}` : 'Login / Register to Get Elite Pass'}</span>
                <ArrowRight size={18} />
              </button>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Feature Comparison Matrix Table (Light Mode) */}
      <section className="py-16 bg-white border-t border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Compare Membership Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              See why more than 85% of our candidates choose the Examirror Elite Pass.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-4 sm:px-6 font-bold text-slate-800">Feature</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-slate-600 text-center">Free Account</th>
                  <th className="py-4 px-3 sm:px-4 font-bold text-indigo-700 text-center">Basic Pass (₹{Number(basicPass.price).toFixed(0)})</th>
                  <th className="py-4 px-3 sm:px-4 font-black text-amber-900 text-center bg-amber-50 border-x border-amber-200">
                    👑 Elite Pass (₹{Number(elitePass.price).toFixed(0)})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-800">
                      {row.feature}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check size={16} className="text-emerald-600 mx-auto" />
                        ) : (
                          <X size={16} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold">{row.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? (
                          <Check size={16} className="text-indigo-600 mx-auto" />
                        ) : (
                          <X size={16} className="text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] text-indigo-700 font-bold">{row.basic}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center bg-amber-50/50 border-x border-amber-200/80 font-bold text-amber-900">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? (
                          <Check size={18} className="text-amber-600 mx-auto font-black" />
                        ) : (
                          <X size={16} className="text-slate-300 mx-auto" />
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

      {/* FAQs Section (Light Mode) */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 bg-white rounded-2xl overflow-hidden transition-colors shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full py-4 px-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-amber-600' : ''}`}
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
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white border border-amber-200 text-center relative overflow-hidden shadow-sm">
          <Crown size={32} className="text-amber-600 mx-auto mb-3" />
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Ready to Accelerate Your Exam Preparation?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-6">
            Join thousands of serious aspirants who practice with Examirror Elite Pass everyday.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handlePassSelect(elitePass)}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              <span>Get Elite Pass Now</span>
              <ArrowRight size={16} />
            </button>
            <Link
              to="/test-series"
              className="py-3 px-5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-xs"
            >
              Browse Test Series
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PublicPasses;

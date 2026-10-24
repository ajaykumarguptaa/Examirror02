import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  RotateCcw, 
  Trophy, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Flame
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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

// Clean raw emoji artifacts from titles and features for a polished SaaS look
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

export const HomeElitePassSection: React.FC = () => {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<PassItem[]>(FALLBACK_PASSES);
  const isStudentLoggedIn = Boolean(localStorage.getItem('studentToken'));

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/student/wallet/passes')
      .then(res => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPasses(res.data.data);
        }
      })
      .catch(() => {
        // Fallback already pre-set
      });
    return () => { isMounted = false; };
  }, []);

  const handleCtaClick = () => {
    if (isStudentLoggedIn) {
      navigate('/student/passes');
    } else {
      navigate('/passes');
    }
  };

  const elitePass = passes.find(p => p.pass_type === 'ELITE') || passes[1] || FALLBACK_PASSES[1];
  const basicPass = passes.find(p => p.pass_type === 'BASIC') || passes[0] || FALLBACK_PASSES[0];

  return (
    <section id="elite-pass" className="py-20 bg-gradient-to-b from-slate-50 via-white to-amber-50/25 text-slate-900 relative overflow-hidden border-t border-b border-slate-200/80 scroll-mt-14 font-sans">
      
      {/* Subtle Background Lighting & Accents (Light Mode) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
        
        {/* Crisp grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      </div>

      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-black tracking-wide uppercase shadow-xs mb-4"
          >
            <Crown size={15} className="text-amber-600 animate-bounce" />
            <span>VIP Student Membership</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight"
          >
            One Pass. Unlimited Exams.{' '}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Zero Extra Cost.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-600 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Stop paying for test series individually. Unlock full access to every existing and upcoming live mock test, All-India rankings, and solutions with the Examirror Elite Pass.
          </motion.p>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto mb-14">
          
          {/* Card 1: Basic Pass (Starter - Clean Light Minimalist) */}
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

              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {cleanTitle(basicPass.title)}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {basicPass.subtitle}
              </p>

              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-slate-100">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  ₹{Number(basicPass.price).toFixed(0)}
                </span>
                {basicPass.original_price && Number(basicPass.original_price) > Number(basicPass.price) && (
                  <span className="text-sm line-through text-slate-400 font-bold">
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

            <Link
              to={isStudentLoggedIn ? '/student/passes' : '/passes'}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95"
            >
              <span>Explore Basic Pass</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Card 2: Elite Pass (Light Mode Premium Gold Crown Card) */}
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
              {/* Internal Soft Golden Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
              
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

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight flex items-center gap-2">
                  <span>{cleanTitle(elitePass.title)}</span>
                  <Flame size={22} className="text-amber-500 shrink-0" />
                </h3>
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
                      Just ₹{(Number(elitePass.price) / (elitePass.validity_days || 365)).toFixed(2)} / day • No hidden charges
                    </span>
                  </div>
                </div>

                {/* Features Grid (2 columns on tablet/desktop) */}
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Crown size={16} />
                  <span>{isStudentLoggedIn ? 'Upgrade to Elite Pass Now' : 'Get Elite Pass Now'}</span>
                  <ArrowRight size={16} />
                </button>
                <Link
                  to="/passes"
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-xs text-center transition-all shadow-xs"
                >
                  View Full Pass Comparison
                </Link>
              </div>

            </div>
          </motion.div>

        </div>

        {/* Trust Badges & Guarantee (Light Mode) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-8 border-t border-slate-200 text-center">
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Free Access to Paid Mocks</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-amber-600">365 Days</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Year-Round Unlimited Validity</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900">AIR Rank</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">All-India Percentile Scoring</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-emerald-600">Instant</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">1-Click Test Activation</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HomeElitePassSection;

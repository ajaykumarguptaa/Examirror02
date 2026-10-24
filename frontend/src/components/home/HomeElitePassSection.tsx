import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  RotateCcw, 
  Trophy, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Star,
  Check,
  Flame,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    <section id="elite-pass" className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-b border-slate-800 scroll-mt-14">
      {/* Background Lighting Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      </div>

      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wide uppercase shadow-inner shadow-amber-500/10 mb-4"
          >
            <Crown size={15} className="text-amber-400 animate-bounce" />
            <span>VIP Student Membership</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight"
          >
            One Pass. Unlimited Exams.{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
              Zero Extra Cost.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-300 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed"
          >
            Stop paying for test series individually. Unlock full access to every existing and upcoming live mock test, All-India rankings, and solutions with the Examirror Elite Pass.
          </motion.p>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto mb-14">
          
          {/* Card 1: Basic Pass (4 cols) */}
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

              <h3 className="text-xl font-bold text-white mb-1">
                {cleanTitle(basicPass.title)}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {basicPass.subtitle}
              </p>

              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-slate-800">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
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

            <Link
              to={isStudentLoggedIn ? '/student/passes' : '/passes'}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>Explore Basic Pass</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Card 2: Elite Pass (7 cols, Luxury Obsidian Gold) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 relative group rounded-3xl p-[1px] bg-gradient-to-b from-amber-400 via-amber-600/40 to-amber-700/80 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col justify-between"
          >
            {/* Top Recommended Tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Sparkles size={12} className="text-slate-950" />
                <span>{elitePass.badge_text || 'MOST POPULAR • BEST VALUE'}</span>
              </span>
            </div>

            <div className="bg-slate-950/95 backdrop-blur-2xl rounded-[23px] p-6 sm:p-9 h-full flex flex-col justify-between relative overflow-hidden">
              {/* Internal Accent Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
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

                <h3 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
                  <span>{cleanTitle(elitePass.title)}</span>
                  <Flame size={22} className="text-amber-400 shrink-0" />
                </h3>
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
                      Just ₹1.36 / day • No hidden charges
                    </span>
                  </div>
                </div>

                {/* Features Grid (2 columns on tablet/desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {(elitePass.features || []).map((feat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-200"
                    >
                      {renderFeatureIcon(feat, true)}
                      <span className="leading-snug font-medium">{cleanText(feat)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Crown size={16} />
                  <span>{isStudentLoggedIn ? 'Upgrade to Elite Pass Now' : 'Get Elite Pass Now'}</span>
                  <ArrowRight size={16} />
                </button>
                <Link
                  to="/passes"
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs text-center transition-all"
                >
                  View Full Pass Comparison
                </Link>
              </div>

            </div>
          </motion.div>

        </div>

        {/* Trust Badges & Guarantee */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-slate-800/80 text-center">
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 font-medium">Free Access to Paid Mocks</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-amber-400">365 Days</p>
            <p className="text-xs text-slate-400 font-medium">Year-Round Unlimited Validity</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-white">AIR Rank</p>
            <p className="text-xs text-slate-400 font-medium">All-India Percentile Scoring</p>
          </div>
          <div className="p-3">
            <p className="text-xl sm:text-2xl font-black text-emerald-400">Instant</p>
            <p className="text-xs text-slate-400 font-medium">1-Click Test Activation</p>
          </div>
        </div>

      </div>
    </section>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  UserPlus,
  Play,
  RotateCcw,
  BarChart3,
  ChevronDown,
  X,
  IndianRupee,
  Check,
  Crown
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useDebounce } from '../../hooks/useDebounce';
import { DirectStudentRegisterModal } from '../../components/DirectStudentRegisterModal';

interface TestSeriesItem {
  id: number | string;
  title: string;
  slug: string;
  category_id?: number | string;
  category_name?: string;
  description?: string;
  price?: number;
  total_tests?: number;
  validity_days?: number;
  thumbnail_url?: string;
  difficulty?: string;
  is_free?: boolean;
}

interface CategoryItem {
  id: number | string;
  name: string;
  slug: string;
  icon?: string;
}

export default function TestSeriesPage() {
  const navigate = useNavigate();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'tests' | 'price-asc' | 'price-desc'>('featured');

  // Candidate Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedSeriesForRegister, setSelectedSeriesForRegister] = useState<any>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch Categories
  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['publicTestCategories'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/test-series/public/categories');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Fetch All Test Series
  const { data: testSeriesList = [], isLoading } = useQuery<TestSeriesItem[]>({
    queryKey: ['publicTestSeriesList'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/test-series/public/list');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Dynamic Student Passes
  const { data: passesData } = useQuery({
    queryKey: ['publicPasses'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/student/wallet/passes');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const dynamicElitePass = passesData?.find((p: any) => p.pass_type === 'ELITE');
  const elitePassPrice = dynamicElitePass?.price ? Number(dynamicElitePass.price).toFixed(0) : '299';

  // Filter & Sort Logic
  const filteredSeries = useMemo(() => {
    let list = [...testSeriesList];

    // Search query filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category_name?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((item) => String(item.category_id) === String(selectedCategory));
    }

    // Price filter
    if (priceFilter === 'free') {
      list = list.filter((item) => Number(item.price || 0) === 0);
    } else if (priceFilter === 'paid') {
      list = list.filter((item) => Number(item.price || 0) > 0);
    }

    // Sort order
    if (sortBy === 'tests') {
      list.sort((a, b) => (b.total_tests || 0) - (a.total_tests || 0));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return list;
  }, [testSeriesList, debouncedSearch, selectedCategory, priceFilter, sortBy]);

  // Category fallback thumbnail images
  const getCategoryFallbackImage = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('computer') || n.includes('dca') || n.includes('adca')) {
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';
    }
    if (n.includes('bank') || n.includes('finance')) {
      return 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=800&q=80';
    }
    if (n.includes('rail') || n.includes('ssc') || n.includes('govt')) {
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
    }
    if (n.includes('code') || n.includes('python') || n.includes('program')) {
      return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80';
  };

  // Check student login status
  const isStudentLoggedIn = Boolean(localStorage.getItem('studentToken'));

  const handleStartTestClick = (series: TestSeriesItem) => {
    if (isStudentLoggedIn) {
      navigate('/student/test-series');
    } else {
      setSelectedSeriesForRegister(series);
      setIsRegisterModalOpen(true);
    }
  };

  const faqs = [
    {
      q: 'Can I attempt test series without joining an offline coaching center?',
      a: 'Yes, absolutely! Examirror allows any candidate anywhere in India to register directly using an email. You can practice full-length mocks, sectional tests, and access detailed answer solutions directly.'
    },
    {
      q: 'Are the test questions based on latest exam patterns?',
      a: 'All mock tests and questions are prepared by subject matter experts strictly following the updated syllabus, timing rules, and marking criteria.'
    },
    {
      q: 'Do I get instant scorecards and all-India percentile ranks?',
      a: 'Yes. As soon as you submit your test, you receive an instant score, accuracy analysis, time spent per question, and comparative all-India rankings.'
    },
    {
      q: 'Can I re-attempt mock tests to improve my score?',
      a: 'Yes, enrolled series allow review of full solutions and multiple practice attempts so you can track your continuous learning progression.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <SEO
        title="Online Test Series & Live Mock Tests | Examirror"
        description="Practice All-India mock test series, previous years papers, live timed assessments, and sectional tests with instant solutions and percentile analysis."
        keywords={['Test Series', 'Online Mock Tests', 'Live Assessments', 'Examirror Test Hub', 'Candidate Test Portal']}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Test Series', item: '/test-series' }
        ]}
      />

      {/* Unified Compact Header Banner with Apple Text Reveal Animation (Matching About, Courses, and E-Notes) */}
      <section className="bg-slate-950 text-white py-4 sm:py-5 text-center relative overflow-hidden border-b border-slate-800/80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-1.5">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>Live Assessments & All-India Mock Test Series</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight"
          >
            Online Test Series & Live Mock Tests
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-slate-300 text-xs sm:text-[13px] max-w-2xl mx-auto leading-normal"
          >
            Prepare with timed online assessments, high-yield question banks, detailed step-by-step solutions, and all-India percentile benchmarking.
          </motion.p>
        </div>
      </section>

      {/* Main Full-Width Container */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">
        {/* Direct Candidate Registration Quick Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-indigo-900/60">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm">
              <UserPlus size={19} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-400" />
                <span>New Student Registration</span>
              </div>
              <div className="text-xs sm:text-[13px] font-medium text-slate-200 mt-0.5">
                Not enrolled in an authorized branch? Register now to start practicing live mock tests & assessments.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shrink-0 shadow-md cursor-pointer transition-all"
          >
            <span>Register Now</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Elite Pass All-Access Banner */}
        <div className="mb-6 p-4.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-950 to-amber-950/90 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 text-left relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg font-black">
              <Crown size={22} className="text-slate-950" />
            </div>
            <div>
              <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Examirror Elite Pass • 365 Days Unlimited Access</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                Don't buy individual tests! Unlock all live mock exams, solutions & All-India ranks for just <span className="text-amber-400 font-extrabold">₹{elitePassPrice}/year</span>.
              </div>
            </div>
          </div>
          <Link
            to="/passes"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer transition-all relative z-10"
          >
            <span>Explore Elite Pass</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Search, Filter & Controls Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96 group">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by exam name, syllabus or topic..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-900"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Price Filter Pill */}
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setPriceFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${priceFilter === 'all'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900'
                  }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter('free')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${priceFilter === 'free'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'hover:text-slate-900'
                  }`}
              >
                Free Mocks
              </button>
              <button
                type="button"
                onClick={() => setPriceFilter('paid')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${priceFilter === 'paid'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'hover:text-slate-900'
                  }`}
              >
                Premium
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="featured">Featured Mocks</option>
              <option value="tests">Most Test Papers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories Filter Tabs */}
        {categories.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              All Categories ({testSeriesList.length})
            </button>
            {categories.map((cat) => {
              const count = testSeriesList.filter(
                (s) => String(s.category_id) === String(cat.id)
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${selectedCategory === String(cat.id)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === String(cat.id)
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Test Series Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="h-44 bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-10 bg-slate-200 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No test series found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No mock assessments match your current filters. Try resetting search or select
                another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeries.map((series) => {
                const isFree = Number(series.price || 0) === 0;
                return (
                  <motion.div
                    key={series.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="h-48 w-full relative overflow-hidden bg-slate-900">
                        <img
                          src={series.thumbnail_url || getCategoryFallbackImage(series.title)}
                          alt={series.title}
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 opacity-90"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Badges on Thumbnail */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-400" />
                            <span>LIVE TEST</span>
                          </span>
                          {isFree ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                              FREE MOCK
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                              PREMIUM
                            </span>
                          )}
                        </div>

                        {/* Series Details Badge at Bottom of Thumbnail */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="flex items-center gap-1 font-semibold text-slate-200 text-[11px]">
                            <Layers size={13} className="text-blue-400" />
                            <span>{series.total_tests || 1} Full Mocks</span>
                          </span>
                          {series.validity_days && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-300">
                              <Clock size={12} className="text-amber-400" />
                              <span>{series.validity_days} Days Access</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5">
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {series.title}
                        </h3>

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-normal leading-relaxed">
                          {series.description ||
                            'Standard exam simulation with comprehensive multiple choice questions, timer, negative marking, and instant explanation.'}
                        </p>

                        {/* Feature Badges */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-600 font-medium">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1">
                            <Check size={11} className="text-emerald-600" />
                            <span>Timer & Rank</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1">
                            <Check size={11} className="text-emerald-600" />
                            <span>Instant Solution</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 pt-0">
                      <div className="flex items-center justify-between mb-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Enrollment Fee
                          </span>
                          <div className="flex items-baseline gap-1">
                            {isFree ? (
                              <span className="text-lg font-black text-emerald-600">FREE</span>
                            ) : (
                              <>
                                <span className="text-lg font-black text-slate-900 flex items-center">
                                  <IndianRupee size={15} />
                                  {series.price}
                                </span>
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{Math.round(Number(series.price) * 1.5)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Verified Content
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartTestClick(series)}
                        className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${isFree
                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20'
                            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/20'
                          }`}
                      >
                        <Play size={13} className="fill-current" />
                        <span>{isStudentLoggedIn ? 'Access Test in Hub' : 'Attempt Free Mock'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform Highlights Section */}
        <div className="mt-20 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Smart Testing Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Why 50,000+ Students Practice on Examirror
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Engineered with national examination standards to offer zero-latency testing,
              anti-cheating safeguards, and actionable weakness diagnostics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 text-blue-300 flex items-center justify-center mb-3">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-sm text-white">Strict Timing Controls</h4>
              <p className="text-xs text-slate-300 mt-1 font-normal">
                Auto-submits on time lapse, mirrors actual exam countdowns and sectional timers.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center mb-3">
                <BarChart3 size={20} />
              </div>
              <h4 className="font-bold text-sm text-white">Percentile Benchmarking</h4>
              <p className="text-xs text-slate-300 mt-1 font-normal">
                See where you stand among thousands of candidates nationwide instantly.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center mb-3">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-sm text-white">Subject-Expert Verified</h4>
              <p className="text-xs text-slate-300 mt-1 font-normal">
                Questions verified by certified instructors with bilingual explanations.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center mb-3">
                <UserPlus size={20} />
              </div>
              <h4 className="font-bold text-sm text-white">Independent Direct Access</h4>
              <p className="text-xs text-slate-300 mt-1 font-normal">
                No center registration needed. Register with OTP and start practicing in 60 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4.5 text-left font-bold text-sm text-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4.5 pt-0 text-xs text-slate-600 leading-relaxed font-normal border-t border-slate-100">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Candidate Registration Modal */}
      <DirectStudentRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setSelectedSeriesForRegister(null);
        }}
        targetTestSeriesId={selectedSeriesForRegister?.id}
      />
    </div>
  );
}

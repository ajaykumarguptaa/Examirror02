import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen,
  FileText,
  ArrowRight,
  Search,
  X,
  Sparkles,
  Eye,
  Clock,
  Layers,
  CheckCircle2,
  Filter,
  Crown,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  Cpu,
  ShieldCheck,
  CreditCard,
  Brain,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../../components/SEO';
import { useDebounce } from '../../hooks/useDebounce';
import { LazyImage } from '../../components/ui/LazyImage';

interface StudyNote {
  id: number;
  title: string;
  category?: string;
  description?: string;
  thumbnail_url?: string;
  file_type?: string;
  file_size?: string;
  price?: number | string;
  views_count?: number;
  created_at?: string;
}

export default function StudyMaterialLibrary() {
  const location = useLocation();
  const isStudent = location.pathname.startsWith('/student');

  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'views' | 'free'>('featured');
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // VIP / Elite Pass state
  const [walletOverview, setWalletOverview] = useState<any | null>(null);

  const fetchWallet = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
      const userStr = localStorage.getItem('studentUser') || localStorage.getItem('user');
      let studentId = null;
      try {
        if (userStr) studentId = JSON.parse(userStr)?.id;
      } catch {}

      const headers = {
        Authorization: `Bearer ${token || ''}`,
        'x-student-id': String(studentId || '')
      };

      const res = await axios.get('/api/student/wallet/overview', { headers })
        .catch(() => axios.get('http://localhost:3000/api/student/wallet/overview', { headers }));
      if (res?.data?.success) {
        setWalletOverview(res.data.data);
      }
    } catch {
      // safe ignore
    }
  }, []);

  const isElite = Boolean(walletOverview?.activePass?.isElite);
  const passDaysRemaining = Number(walletOverview?.activePass?.daysRemaining ?? 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [notesRes, catRes] = await Promise.all([
          axios.get('/api/study-materials').catch(() => axios.get('http://localhost:3000/api/study-materials')),
          axios.get('/api/study-materials/categories').catch(() => axios.get('http://localhost:3000/api/study-materials/categories'))
        ]);

        if (notesRes?.data?.success) {
          setNotes(notesRes.data.data || []);
        }
        if (catRes?.data?.success) {
          setCategories(catRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load study notes', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (isStudent) {
      fetchWallet();
      window.addEventListener('studentWalletUpdated', fetchWallet);
      return () => {
        window.removeEventListener('studentWalletUpdated', fetchWallet);
      };
    }
  }, [fetchWallet, isStudent]);

  // Dynamic categories aggregated from notes and backend categories
  const dynamicCategories = useMemo(() => {
    const countsMap = new Map<string, number>();

    // Count notes by category
    notes.forEach((n) => {
      const cat = n.category?.trim();
      if (cat) {
        const key = cat.toLowerCase();
        countsMap.set(key, (countsMap.get(key) || 0) + 1);
      }
    });

    const list: { name: string; count: number }[] = [];
    const seen = new Set<string>();

    // 1. Add all categories that actually have notes
    countsMap.forEach((count, key) => {
      const originalName = notes.find(n => (n.category || '').trim().toLowerCase() === key)?.category?.trim()
        || categories.find(c => (c.name || '').trim().toLowerCase() === key)?.name?.trim()
        || key;
      seen.add(key);
      list.push({ name: originalName, count });
    });

    // 2. Also include any backend predefined categories
    categories.forEach((c) => {
      const catName = c.name?.trim();
      if (catName) {
        const key = catName.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          const count = countsMap.get(key) || (c as any).count || 0;
          if (count > 0) {
            list.push({ name: catName, count });
          }
        }
      }
    });

    return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [notes, categories]);

  // Sidebar Filtered Categories
  const filteredCategoriesForSidebar = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return dynamicCategories;
    return dynamicCategories.filter(cat => cat.name.toLowerCase().includes(q));
  }, [dynamicCategories, sidebarSearch]);

  // Toggle Category Selection
  const toggleCategory = (catName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCategoryNames(prev => {
      const exists = prev.includes(catName);
      if (exists) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const resetFilters = () => {
    setSelectedCategoryNames([]);
    setSearchTerm('');
    setSidebarSearch('');
    setFilterType('ALL');
    setSortBy('featured');
  };

  const freeNotesCount = useMemo(() => {
    return notes.filter(n => Number(n.price || 0) === 0).length;
  }, [notes]);

  const paidNotesCount = useMemo(() => {
    return notes.filter(n => Number(n.price || 0) > 0).length;
  }, [notes]);

  // Filter & Search Logic
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];

    // Multi-Category Filter
    if (selectedCategoryNames.length > 0) {
      result = result.filter(n => {
        const cat = (n.category || '').trim().toLowerCase();
        return selectedCategoryNames.some(sel => sel.trim().toLowerCase() === cat);
      });
    }

    // Access Tier Filter
    if (filterType === 'FREE') {
      result = result.filter(n => Number(n.price || 0) === 0);
    } else if (filterType === 'PAID') {
      result = result.filter(n => Number(n.price || 0) > 0);
    }

    // Debounced Search Filter
    if (debouncedSearchTerm.trim()) {
      const q = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q) ||
        (n.description || '').toLowerCase().includes(q)
      );
    }

    // Sort Logic
    if (sortBy === 'views') {
      result.sort((a, b) => (Number(b.views_count) || 0) - (Number(a.views_count) || 0));
    } else if (sortBy === 'free') {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }

    return result;
  }, [notes, selectedCategoryNames, filterType, debouncedSearchTerm, sortBy]);

  const getCategoryIcon = (name: string, isSelected = false) => {
    const n = (name || '').toLowerCase();
    const className = `shrink-0 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}`;
    if (n.includes('computer') || n.includes('it') || n.includes('tech') || n.includes('code') || n.includes('software') || n.includes('programming') || n.includes('python') || n.includes('java')) {
      return <Cpu size={16} className={className} />;
    }
    if (n.includes('bpsc') || n.includes('ssc') || n.includes('cgl') || n.includes('rrb') || n.includes('railway') || n.includes('govt')) {
      return <ShieldCheck size={16} className={className} />;
    }
    if (n.includes('bank') || n.includes('tally') || n.includes('accounting') || n.includes('finance')) {
      return <CreditCard size={16} className={className} />;
    }
    if (n.includes('reasoning') || n.includes('aptitude') || n.includes('math')) {
      return <Brain size={16} className={className} />;
    }
    return <BookOpen size={16} className={className} />;
  };

  // Sidebar Content Component
  const renderSidebarContent = (isMobile = false) => {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 space-y-4 shadow-xs select-none">
        {/* Header with Title and Total Count Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <BookOpen size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Subjects & Notes</h2>
              <p className="text-[10px] text-slate-400 font-medium">Select subjects to filter notes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-100">
              {notes.length} Notes
            </span>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search within Sidebar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects & categories..."
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {sidebarSearch && (
            <button
              type="button"
              onClick={() => setSidebarSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tier Quick Filter Buttons (All, Free, VIP) */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Access Tier
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('FREE')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'FREE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Free ({freeNotesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('PAID')}
              className={`py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'PAID'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              VIP ({paidNotesCount})
            </button>
          </div>
        </div>

        {/* Category Dropdown Navigation */}
        <div className="space-y-2">
          {/* Main Dropdown Header */}
          <button
            type="button"
            onClick={() => setIsCategoriesDropdownOpen(prev => !prev)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer group shadow-2xs select-none ${
              isCategoriesDropdownOpen
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-indigo-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isCategoriesDropdownOpen ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-indigo-600'
              }`}>
                <LayoutGrid size={16} />
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {selectedCategoryNames.length === 0 ? 'Browsing All' : 'Active Filters'}
                </span>
                <span className="font-black text-xs break-words leading-tight">
                  {selectedCategoryNames.length === 0
                    ? 'All Subjects'
                    : selectedCategoryNames.length === 1
                      ? selectedCategoryNames[0]
                      : `${selectedCategoryNames.length} Subjects Selected`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isCategoriesDropdownOpen ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {filteredAndSortedNotes.length}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  isCategoriesDropdownOpen ? 'rotate-180 text-indigo-400' : 'text-slate-500'
                }`}
              />
            </div>
          </button>

          {/* Categories Dropdown Panel */}
          {isCategoriesDropdownOpen && (
            <div className="space-y-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-2 shadow-inner">
              {/* Show All Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryNames([]);
                  if (isMobile) setMobileFilterOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedCategoryNames.length === 0
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedCategoryNames.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Layers size={13} />
                  </span>
                  <span className="break-words leading-tight">All Subjects (Show All)</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    selectedCategoryNames.length === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {notes.length}
                  </span>
                  {selectedCategoryNames.length === 0 && <Check size={13} className="text-white" />}
                </div>
              </button>

              <div className="border-t border-slate-200/80 my-1" />

              {/* Dynamic Categories List with Multi-Selection */}
              {filteredCategoriesForSidebar.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No subjects match "{sidebarSearch}"
                </div>
              ) : (
                filteredCategoriesForSidebar.map(cat => {
                  const isCatSelected = selectedCategoryNames.includes(cat.name);

                  return (
                    <div
                      key={cat.name}
                      onClick={(e) => {
                        toggleCategory(cat.name, e);
                        if (isMobile) setMobileFilterOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group select-none border ${
                        isCatSelected
                          ? 'border-indigo-300 bg-white text-indigo-950 font-black shadow-xs ring-1 ring-indigo-200'
                          : 'border-slate-200/70 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1.5">
                        {/* Multi-Select Checkbox */}
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          isCatSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                            : 'border-slate-300 bg-white group-hover:border-indigo-400'
                        }`}>
                          {isCatSelected && <Check size={11} strokeWidth={3} />}
                        </div>

                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isCatSelected ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}>
                          {getCategoryIcon(cat.name, isCatSelected)}
                        </span>
                        <span className="text-xs font-bold leading-snug break-words text-left flex-1 min-w-0">
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isCatSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cat.count}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Clear All Filters Button if active */}
        {(selectedCategoryNames.length > 0 || filterType !== 'ALL' || searchTerm || sidebarSearch) && (
          <button
            type="button"
            onClick={resetFilters}
            className="w-full py-2 px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Clear All Filters</span>
          </button>
        )}

        {/* Elite Pass Status / Promo Mini Card */}
        {isElite ? (
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <Link
              to="/student/passes"
              className="block p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-300 hover:border-amber-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                  <Crown size={14} className="text-amber-600 fill-amber-500 shrink-0" />
                  <span>VIP Pass Active</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {passDaysRemaining > 0 ? `${passDaysRemaining}d Left` : 'Active'}
                </span>
              </div>
              <p className="text-[10px] text-amber-900 mt-1 leading-snug font-medium">
                Unlimited access active! All E-Notes & study materials across every subject are completely unlocked for you.
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
                <span>Manage VIP Pass</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <Link
              to={isStudent ? '/student/passes' : '/passes'}
              className="block p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-300/80 hover:border-amber-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                <Crown size={14} className="text-amber-600 fill-amber-500 shrink-0" />
                <span>Examirror Elite Pass</span>
              </div>
              <p className="text-[10px] text-amber-900 mt-1 leading-snug">
                Unlock all study notes & reference materials across every subject with 1 click.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
                <span>View VIP Pass</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className="w-full space-y-6 pb-16 font-sans">
      <SEO
        title="Digital Study Library & E-Notes | Examirror"
        description="Access our official collection of interactive HTML notes, chapter summaries, and secure reference materials for technical diploma and competitive computer courses."
        keywords={[
          'Examirror E-Notes',
          'Computer Course Notes',
          'ADCA Study Material',
          'DCA HTML Notes',
          'Tally Prime Study Guides',
          'Online Digital Study Library'
        ]}
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'E-Notes', item: '/notes' }
        ]}
      />

      {/* Ultra-Compact High-Impact Header Banner Matching Test Series */}
      <div className="bg-white/95 backdrop-blur-xs px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-slate-200/90 shadow-2xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
            {/* Left: Breadcrumbs + Gradient Title */}
            <div className="flex flex-col gap-1 min-w-0">
              {/* Top Micro-Row: Breadcrumb + Tag Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <Link
                    to={isStudent ? '/student/dashboard' : '/'}
                    className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-slate-500"
                  >
                    {isStudent ? 'Dashboard' : 'Home'}
                  </Link>
                  <ChevronRight size={11} className="text-slate-300" />
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="hover:text-indigo-600 transition-colors cursor-pointer text-indigo-600 font-bold"
                  >
                    E-Notes
                  </button>
                </nav>

                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />

                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 text-amber-900 border border-amber-300/80 shadow-2xs">
                  <Crown size={11} className="text-amber-600 fill-amber-500 shrink-0" />
                  <span>Digital Study Library & E-Notes</span>
                </div>
              </div>

              {/* Bottom Title Row with VIP-Pass Style Vibrant Gradient Typography */}
              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-tight flex items-baseline flex-wrap gap-1.5">
                  <span>All Competitive & Academic E-Notes.</span>
                  <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent font-black drop-shadow-2xs">
                    Unlimited Digital Study Materials.
                  </span>
                </h1>
                <span className="hidden xl:inline text-[11px] text-slate-400 font-medium">
                  • SSC CGL, RRB NTPC, Banking, NDA, Diplomas, Reasoning & Technical Guides
                </span>
              </div>
            </div>

            {/* Right: Quick Stats Badge */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-black text-xs shadow-2xs">
                {notes.length} Available Notes
              </span>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT: Interactive Sticky Sidebar + Results Grid */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          {/* Desktop Sticky Sidebar (lg+) */}
          <aside className="hidden lg:block w-84 xl:w-96 shrink-0 sticky top-[4.5rem] self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1 z-30">
            {renderSidebarContent(false)}
          </aside>

          {/* Mobile Category Explorer Drawer (< lg) */}
          {mobileFilterOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-stretch justify-start">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="relative w-84 sm:w-92 max-w-[90vw] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
                {renderSidebarContent(true)}
              </div>
            </div>
          )}

          {/* Right Main Content Area */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Top Toolbar: Search, Mobile Filter Toggle, & Result Header */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Mobile Filter Drawer Button (< lg screens) */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <SlidersHorizontal size={14} />
                  <span>
                    Subjects
                    {selectedCategoryNames.length > 0 && ` (${selectedCategoryNames.length})`}
                  </span>
                </button>

                {/* Search notes input */}
                <div className="relative flex-1 sm:w-80">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notes by title, topic..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Sort By & Results Count */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold shrink-0">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="featured">Featured / Default</option>
                    <option value="views">Most Popular (Views)</option>
                    <option value="free">Free First</option>
                  </select>
                </div>

                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
                  {filteredAndSortedNotes.length} Available
                </span>
              </div>
            </div>

            {/* Active Filter Chips/Pills Row */}
            {(selectedCategoryNames.length > 0 || filterType !== 'ALL' || searchTerm) && (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-2 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Active Filters:
                </span>

                {selectedCategoryNames.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 shadow-2xs transition-colors cursor-pointer group"
                  >
                    <span>{cat}</span>
                    <X size={12} className="text-slate-400 group-hover:text-red-500" />
                  </button>
                ))}

                {filterType !== 'ALL' && (
                  <button
                    onClick={() => setFilterType('ALL')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-amber-700 shadow-2xs transition-colors cursor-pointer group"
                  >
                    <span>Tier: {filterType === 'FREE' ? 'Free Only' : 'VIP Only'}</span>
                    <X size={12} className="text-slate-400 group-hover:text-red-500" />
                  </button>
                )}

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer group"
                  >
                    <span>"{searchTerm}"</span>
                    <X size={12} className="text-slate-400 group-hover:text-red-500" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto px-2 py-0.5 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Notes Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((sk) => (
                  <div
                    key={sk}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4"
                  >
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-10 bg-slate-200 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAndSortedNotes.map((note, index) => {
                  const isHtml = note.file_type === 'HTML';
                  const isFree = Number(note.price || 0) === 0;

                  return (
                    <motion.div
                      key={note.id || index}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.03 }}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-indigo-300 transition-all flex flex-col group overflow-hidden"
                    >
                      {/* Card Thumbnail Banner */}
                      {note.thumbnail_url ? (
                        <div className="relative w-full h-40 overflow-hidden bg-slate-100">
                          <LazyImage
                            src={note.thumbnail_url}
                            alt={note.title}
                            wrapperClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                          <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs border pointer-events-none z-10 ${
                            isFree ? 'bg-emerald-500 text-white border-emerald-400' : isElite ? 'bg-amber-400 text-slate-950 border-amber-300 font-black' : 'bg-amber-500 text-slate-950 border-amber-400'
                          }`}>
                            {isFree ? 'FREE ACCESS' : isElite ? '👑 ELITE PASS' : `₹${note.price}`}
                          </span>
                          <span className="absolute bottom-3 left-3 text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-md pointer-events-none z-10">
                            {note.category || 'General'}
                          </span>
                        </div>
                      ) : (
                        <div className="relative w-full h-28 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-3.5 flex flex-col justify-between overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-200 bg-white/10 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                              {note.category || 'General'}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              isFree
                                ? 'bg-emerald-500/90 text-white border-emerald-400/50'
                                : isElite
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                                  : 'bg-amber-400 text-slate-950 border-amber-300'
                            }`}>
                              {isFree ? 'FREE ACCESS' : isElite ? '👑 ELITE PASS' : `₹${note.price}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center">
                              {isHtml ? <FileText size={15} /> : <BookOpen size={15} />}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                              {isHtml ? 'Interactive HTML Notes' : 'PDF Study Guide'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Title */}
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                            {note.title}
                          </h3>

                          {/* Meta Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                              {isHtml ? 'Interactive HTML' : 'PDF Document'}
                            </span>
                            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1">
                              <Eye size={11} /> {note.views_count || 0} Reads
                            </span>
                            {note.file_size && (
                              <span className="text-slate-400 text-[10px] font-medium">
                                • {note.file_size}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                            {note.description || 'Comprehensive exam-aligned study guide with key concepts, definitions, and practice revision.'}
                          </p>
                        </div>

                        {/* Features list */}
                        <div className="pt-2 space-y-1 border-t border-slate-100 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            <span className="truncate">Instant Browser Reading Access</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            <span className="truncate">Examirror Certified Academic Material</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom CTA */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Layers size={12} /> Module Note
                        </span>
                        <Link
                          to={isStudent ? `/student/notes/${note.id}` : `/notes/${note.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-all shadow-2xs group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 cursor-pointer"
                        >
                          <span>Read Note</span>
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-300" />
                <h3 className="text-base font-bold text-slate-800">No Study Materials Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any study notes matching your active filters. Try clearing your filters or search for another subject.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  if (isStudent) {
    return content;
  }

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen px-3.5 sm:px-8 lg:px-10 py-5 sm:py-6">
      {content}
    </div>
  );
}

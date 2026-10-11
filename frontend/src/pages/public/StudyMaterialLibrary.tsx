import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../../components/SEO';

interface StudyNote {
  id: number;
  title: string;
  category?: string;
  description?: string;
  file_type?: string;
  price?: number | string;
  views_count?: number;
  created_at?: string;
}

export default function StudyMaterialLibrary() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'views' | 'free'>('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  }, []);

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

    // 2. Also include any backend predefined categories that have notes
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

  // Filter & Search Logic
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(n => (n.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
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
  }, [notes, selectedCategory, searchTerm, sortBy]);

  return (
    <div className="flex flex-col w-full bg-slate-50 min-h-screen">
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

      {/* Unified Header Banner matching Courses, Centers & Gallery */}
      <section className="bg-slate-900 text-white py-14 sm:py-16 text-center relative overflow-hidden border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 text-blue-300 px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles size={13} className="text-amber-400" />
            <span>Interactive Learning & Digital Reference Library</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Digital Study Library & E-Notes
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Access our curated collection of interactive study notes, chapter summaries, and secure reference guides designed for all computer and skill development programs.
          </p>
        </div>
      </section>

      {/* Main Full-Width Container */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow">

        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3.5 justify-between items-stretch lg:items-center">

            {/* Search Input */}
            <div className="relative w-full lg:w-96 shrink-0">
              <input
                type="text"
                placeholder="Search notes by title, topic, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-colors text-slate-800 placeholder-slate-400"
              />
              <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort & Count Controls */}
            <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold shrink-0">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                >
                  <option value="featured">Featured / Default</option>
                  <option value="views">Most Popular (Views)</option>
                  <option value="free">Free First</option>
                </select>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
                {filteredAndSortedNotes.length} Notes Available
              </span>
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              All Subjects ({notes.length})
            </button>
            {dynamicCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.name} <span className="opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNotes.map((note, index) => {
              const isHtml = note.file_type === 'HTML';
              const isFree = Number(note.price || 0) === 0;

              return (
                <motion.div
                  key={note.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col group overflow-hidden"
                >
                  {/* Card Content Top */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Icon & Badge Row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${isHtml
                            ? 'bg-blue-50 border border-blue-100 text-blue-600'
                            : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                          }`}>
                          {isHtml ? <FileText size={22} /> : <BookOpen size={22} />}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${isFree
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                            {isFree ? 'FREE ACCESS' : `₹${note.price}`}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {note.title}
                      </h3>

                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {note.category || 'General'}
                        </span>
                        <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                          <Eye size={13} /> {note.views_count || 0} Views
                        </span>
                        <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                          <Clock size={13} /> {isHtml ? 'Interactive' : 'Document'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-3">
                        {note.description || 'Comprehensive exam-aligned study guide with key concepts, definitions, and practice revision.'}
                      </p>
                    </div>

                    {/* Features list */}
                    <div className="pt-2 space-y-1.5 border-t border-slate-100 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate">Instant Browser Reading Access</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate">Examirror Certified Academic Material</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Layers size={13} /> Module Note
                    </span>
                    <Link
                      to={`/notes/${note.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <span>Read Note</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
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
              We couldn't find any study notes matching "{searchTerm || selectedCategory}". Try clearing your filters or search for another subject.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </section>
    </div>
  );
}

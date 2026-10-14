import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Clock, 
  CheckCircle2, 
  Play, 
  Search, 
  Star,
  ExternalLink,
  Tv,
  Sparkles,
  ShieldCheck,
  Film,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';

export interface VideoItem {
  id: number;
  title: string;
  url?: string;
  youtube_id?: string;
  description?: string;
  duration?: string;
  module_name?: string;
  category?: string;
  thumbnail?: string;
  is_featured?: number | boolean;
  is_active?: number | boolean;
  sort_order?: number;
}

export const extractYouTubeVideoId = (urlOrId?: string): string => {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : '';
};

export const TrainingVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const playerRef = useRef<HTMLDivElement>(null);

  // Fetch configured videos dynamically from backend
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      // First try standard API path (normalized by axiosSetup or proxy)
      let res;
      try {
        res = await axios.get('http://localhost:3000/api/center/training-videos');
      } catch {
        res = await axios.get('/api/center/training-videos');
      }

      if (res.data?.success && Array.isArray(res.data.data)) {
        const fetchedVideos: VideoItem[] = res.data.data.map((item: any, idx: number) => {
          const yId = item.youtube_id || extractYouTubeVideoId(item.url) || 'M7lc1UVf-VE';
          return {
            id: item.id || idx + 1,
            title: item.title || `Training Tutorial #${idx + 1}`,
            url: item.url || `https://www.youtube.com/watch?v=${yId}`,
            youtube_id: yId,
            description: item.description || 'Step-by-step training module for center operators.',
            duration: item.duration || '08:00',
            module_name: item.module_name || `Module 0${idx + 1}`,
            category: item.category || 'Portal Guide',
            is_featured: item.is_featured,
            is_active: item.is_active,
            sort_order: item.sort_order,
            thumbnail: item.thumbnail || (yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : '')
          };
        });

        setVideos(fetchedVideos);
        if (fetchedVideos.length > 0) {
          const featured = fetchedVideos.find((v) => Boolean(v.is_featured)) || fetchedVideos[0];
          setActiveVideo(featured);
        } else {
          setActiveVideo(null);
        }
      } else {
        setVideos([]);
        setActiveVideo(null);
      }
    } catch (err) {
      console.error('Failed to load training videos:', err);
      setVideos([]);
      setActiveVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle video selection & smooth scroll to player
  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Extract unique categories dynamically
  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category || 'Portal Guide').filter(Boolean)))];

  // Filter videos
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      video.title.toLowerCase().includes(q) || 
      (video.description || '').toLowerCase().includes(q) ||
      (video.module_name || '').toLowerCase().includes(q) ||
      (video.category || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeYtId = activeVideo?.youtube_id || extractYouTubeVideoId(activeVideo?.url) || 'M7lc1UVf-VE';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      <SEO
        title="Training Videos & Tutorials | Study Center"
        description="Official step-by-step video tutorials and portal walkthroughs for Examirror authorized study centers."
        noindex={true}
      />

      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Training Videos & Portal Tutorials
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Step-by-step video tutorials added by Super Admin for center onboarding, exams, and student management.
              </p>
            </div>
          </div>
        </div>

        {/* Live Channel Status & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{videos.length} Modules Live</span>
          </div>

          <button
            onClick={fetchVideos}
            disabled={isLoading}
            title="Refresh Videos"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
          </button>
        </div>
      </div>

      {/* Active Master Video Player Card (Light Mode, Premium, Solid Colors) */}
      <div 
        ref={playerRef}
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main 16:9 YouTube Video Embed Player */}
          <div className="lg:col-span-8">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group">
              {activeYtId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeYtId}?rel=0&modestbranding=1&enablejsapi=1&autoplay=0`}
                  title={activeVideo?.title || 'Examirror Portal Tutorial'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Tv size={36} className="opacity-50" />
                  <span className="text-xs">Select a video tutorial below to play</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Video Info & Walkthrough Sidebar */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 font-mono">
                  <Sparkles size={12} className="text-indigo-600" />
                  {activeVideo?.module_name || 'Module 01'}
                </span>
                
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 font-mono">
                  <Clock size={12} className="text-slate-500" />
                  {activeVideo?.duration || '08:00'}
                </span>

                {activeVideo?.category && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {activeVideo.category}
                  </span>
                )}

                {Boolean(activeVideo?.is_featured) && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {activeVideo?.title || 'Official Video Tutorial'}
              </h2>

              {/* Description */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-1">
                  {activeVideo?.description || 'Learn how to configure student admissions, duration tokens, online exams, and tamper-proof certificate downloads in the Examirror portal.'}
                </p>
              </div>

              {/* Quality & Security Checklist */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Full HD 1080p Crystal Clear Walkthrough</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                  <span>Verified Super Admin Documentation Guide</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & YouTube Link */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-slate-400">
                ID: #{activeVideo?.id || '—'}
              </span>

              {activeVideo?.url && (
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Watch on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Video Curriculum Grid Section */}
      <div className="space-y-4">
        
        {/* Filter & Search Bar (Clean Solid Light Mode) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tutorial videos by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:border-indigo-600 outline-none bg-slate-50 focus:bg-white text-slate-800 transition-colors"
            />
          </div>

        </div>

        {/* Video Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((vid, idx) => {
              const isCurrent = activeVideo?.id === vid.id;
              const ytId = vid.youtube_id || extractYouTubeVideoId(vid.url) || 'M7lc1UVf-VE';
              const thumbUrl = vid.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '');

              return (
                <motion.div 
                  key={vid.id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => handleSelectVideo(vid)}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col justify-between group cursor-pointer h-full ${
                    isCurrent 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/10' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="h-44 sm:h-48 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Film size={36} className="text-slate-500" />
                    )}

                    {/* Top Badges (Solid pills, no gradient) */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="bg-slate-900/90 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-slate-700">
                        {vid.module_name || `Module 0${idx + 1}`}
                      </span>
                      {Boolean(vid.is_featured) && (
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Star size={10} className="fill-slate-950" /> Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-slate-900/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                        <Clock size={10} />
                        {vid.duration || '08:00'}
                      </span>
                    </div>

                    {/* Center Play Icon Button */}
                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                        isCurrent
                          ? 'bg-indigo-600 text-white scale-110 shadow-indigo-600/30'
                          : 'bg-white text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110'
                      }`}>
                        <Play size={20} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Status Strip (Solid Bar, No Gradient) */}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white px-3 py-1.5 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-300 truncate max-w-[65%]">
                        {vid.category || 'Portal Guide'}
                      </span>
                      <span className={`font-bold ${isCurrent ? 'text-indigo-300' : 'text-slate-300 group-hover:text-amber-300'}`}>
                        {isCurrent ? '● Now Playing' : 'Click to Play'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Section */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className={`font-bold text-sm leading-snug transition-colors line-clamp-2 ${
                        isCurrent ? 'text-indigo-600' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}>
                        {vid.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {vid.description}
                      </p>
                    </div>

                    {/* Card Footer Button (Solid Light Mode) */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        1080p HD
                      </span>
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                        }`}
                      >
                        <Play size={11} fill="currentColor" />
                        <span>{isCurrent ? 'Playing' : 'Play Video'}</span>
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredVideos.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            No training videos found matching your search. Super Admin has not published any videos under this filter yet.
          </div>
        )}

      </div>
    </div>
  );
};

export default TrainingVideos;

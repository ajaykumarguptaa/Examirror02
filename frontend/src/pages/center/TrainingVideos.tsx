import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Play, 
  Layers, 
  X,
  ExternalLink,
  Search,
  Filter,
  Film,
  BookOpen,
  Volume2,
  Maximize2,
  Tv,
  Star
} from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';
import { SpotlightCard, MagneticButton } from '../../components/ui';

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

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 1,
    title: 'How to Register Students in Center Dashboard',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    youtube_id: 'M7lc1UVf-VE',
    description: 'Complete walkthrough of student admission, duration token deduction, photo & ID upload, and parent details entry.',
    duration: '10:15',
    module_name: 'Module 01',
    category: 'Student Admissions',
    is_featured: 1,
    thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg'
  },
  {
    id: 2,
    title: 'Setting and Conducting Course Examinations',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    youtube_id: 'L_LUpnjgPso',
    description: 'Learn how to configure online MCQ exams, set timers, assign batches, and view student submission logs in real time.',
    duration: '08:45',
    module_name: 'Module 02',
    category: 'Online Examinations',
    is_featured: 0,
    thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg'
  },
  {
    id: 3,
    title: 'Wallet Recharge & UPI QR Code Process',
    url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
    youtube_id: 'kUMe1FH4CHE',
    description: 'How to scan official dynamic QR code, enter 12-digit bank UTR reference, and receive instant token balance with audit receipts.',
    duration: '05:20',
    module_name: 'Module 03',
    category: 'Wallet & Topup',
    is_featured: 0,
    thumbnail: 'https://img.youtube.com/vi/kUMe1FH4CHE/hqdefault.jpg'
  },
  {
    id: 4,
    title: 'Issuing Student Certificates & Security Policy',
    url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    youtube_id: 'fJ9rUzIMcZQ',
    description: 'Understanding certificate generation, tamper-proof QR validation, ID card issuance, and center compliance guidelines.',
    duration: '06:30',
    module_name: 'Module 04',
    category: 'Certificates & QR',
    is_featured: 0,
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
  }
];

export const TrainingVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>(DEFAULT_VIDEOS);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(DEFAULT_VIDEOS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const playerRef = useRef<HTMLDivElement>(null);

  // Fetch configured videos from backend
  useEffect(() => {
    setIsLoading(true);
    axios.get('/api/center/training-videos')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any, idx: number) => {
            const yId = item.youtube_id || extractYouTubeVideoId(item.url) || DEFAULT_VIDEOS[idx % DEFAULT_VIDEOS.length]?.youtube_id || 'M7lc1UVf-VE';
            return {
              id: item.id || idx + 1,
              title: item.title,
              url: item.url || `https://www.youtube.com/watch?v=${yId}`,
              youtube_id: yId,
              description: item.description || 'Step-by-step training module for center operators.',
              duration: item.duration || '08:00',
              module_name: item.module_name || `Module 0${idx + 1}`,
              category: item.category || 'Portal Guide',
              is_featured: item.is_featured,
              thumbnail: item.thumbnail || `https://img.youtube.com/vi/${yId}/hqdefault.jpg`
            };
          });
          setVideos(mapped);
          const featured = mapped.find((v: VideoItem) => v.is_featured) || mapped[0];
          setActiveVideo(featured);
        } else {
          setVideos(DEFAULT_VIDEOS);
          setActiveVideo(DEFAULT_VIDEOS[0]);
        }
      })
      .catch(() => {
        setVideos(DEFAULT_VIDEOS);
        setActiveVideo(DEFAULT_VIDEOS[0]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Handle video selection & smooth scroll to player
  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(videos.map(v => v.category || 'Portal Guide')))];

  // Filter videos
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      video.title.toLowerCase().includes(q) || 
      (video.description || '').toLowerCase().includes(q) ||
      (video.module_name || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeYtId = activeVideo?.youtube_id || extractYouTubeVideoId(activeVideo?.url) || 'M7lc1UVf-VE';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-14 px-2 sm:px-4">
      <SEO
        title="Training Videos & Tutorials | Study Center"
        description="Official step-by-step video tutorials and portal walkthroughs for Examirror authorized study centers."
        noindex={true}
      />

      {/* Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Training Videos & Portal Tutorials
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
            Official step-by-step video guides on portal management, test setup, student admissions, and wallet recharges.
          </p>
        </div>

        {/* Live Channel Status Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Official Tutorials Live & Active</span>
        </div>
      </div>

      {/* Interactive Master Video Player Hero */}
      <div 
        ref={playerRef}
        className="bg-slate-950 rounded-3xl border border-indigo-950 p-4 sm:p-6 shadow-2xl text-white relative overflow-hidden"
      >
        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Main 16:9 YouTube Video Embed Player */}
          <div className="lg:col-span-8">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1 font-mono">
                  <Sparkles size={12} className="text-yellow-400" />
                  {activeVideo?.module_name || 'Module 01'}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-slate-300 flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  {activeVideo?.duration || '08:00'}
                </span>
                {activeVideo?.category && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                    {activeVideo.category}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {activeVideo?.title || 'Official Video Tutorial'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
                {activeVideo?.description || 'Learn how to effortlessly configure student admissions, duration tokens, online exams, and tamper-proof certificate downloads in the Examirror portal.'}
              </p>
            </div>

            {/* Quick Actions & YouTube Link */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Full HD 1080p Video</span>
              </div>

              {activeVideo?.url && (
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                >
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
        
        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1e1b4b] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tutorial videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50 focus:bg-white"
            />
          </div>

        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((vid, idx) => {
            const isCurrent = activeVideo?.id === vid.id;
            const ytId = vid.youtube_id || extractYouTubeVideoId(vid.url) || 'M7lc1UVf-VE';
            const thumbUrl = vid.thumbnail || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

            return (
              <SpotlightCard key={vid.id || idx} className="h-full border-none shadow-none bg-transparent">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => handleSelectVideo(vid)}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative h-full ${
                    isCurrent 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/15 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                {/* Thumbnail Header with Play Button */}
                <div className="h-44 sm:h-48 relative overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img
                    src={thumbUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Module Tag & Duration */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border border-white/20">
                      {vid.module_name || `Module 0${idx + 1}`}
                    </span>
                    {vid.is_featured ? (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star size={10} className="fill-slate-950" /> Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1">
                      <Clock size={10} />
                      {vid.duration || '08:00'}
                    </span>
                  </div>

                  {/* Center Play Icon */}
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                      isCurrent
                        ? 'bg-indigo-600 text-white scale-110 shadow-indigo-600/30'
                        : 'bg-white/20 backdrop-blur-md text-white group-hover:bg-indigo-600 group-hover:scale-110'
                    }`}>
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-white/90">
                    <span className="text-[10px] font-semibold text-slate-300">
                      {vid.category || 'Portal Guide'}
                    </span>
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-indigo-300' : 'text-yellow-300'}`}>
                      {isCurrent ? '● Now Playing' : 'Click to Play'}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
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

                  {/* Card Footer Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      1080p HD Video
                    </span>
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>{isCurrent ? 'Active Player' : 'Play Video'}</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            </SpotlightCard>
          );
          })}
        </div>

        {filteredVideos.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            No training videos found matching your search.
          </div>
        )}

      </div>
    </div>
  );
};

export default TrainingVideos;

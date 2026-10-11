import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Bell, 
  Clapperboard, 
  Film, 
  Radio, 
  BookOpen, 
  Layers, 
  X,
  Play
} from 'lucide-react';
import axios from 'axios';
import SEO from '../../components/SEO';

interface VideoItem {
  id: number;
  title: string;
  url?: string;
  description?: string;
  duration?: string;
  module?: string;
  topics?: string[];
  status?: string;
}

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 1,
    title: 'How to Register Students in Center Dashboard',
    description: 'Complete walkthrough of student admission, duration token deduction, photo & ID upload, and parent details entry.',
    duration: '10:15',
    module: 'Module 01',
    status: 'In Post-Production',
    topics: ['Student Personal & Academic Details', 'Course Duration Token System', 'Auto-generated Enrollment & Roll Numbers']
  },
  {
    id: 2,
    title: 'Setting and Conducting Course Examinations',
    description: 'Learn how to configure online MCQ exams, set timers, assign batches, and view student submission logs in real time.',
    duration: '08:45',
    module: 'Module 02',
    status: 'In Recording',
    topics: ['Question Bank & Topic Selection', 'Exam Window & Anti-Cheat Protocols', 'Score Calculations & Pass/Fail Criteria']
  },
  {
    id: 3,
    title: 'Wallet Recharge & UPI QR Code Process',
    description: 'How to scan official dynamic QR code, enter 12-digit bank UTR reference, and receive instant token balance with audit receipts.',
    duration: '05:20',
    module: 'Module 03',
    status: 'In Post-Production',
    topics: ['Instant QR Scanner Top-up', 'UTR Verification Workflow', 'Transaction Statement & GST Invoices']
  },
  {
    id: 4,
    title: 'Issuing Student Certificates & Security Policy',
    description: 'Understanding certificate generation, tamper-proof QR validation, ID card issuance, and center compliance guidelines.',
    duration: '06:30',
    module: 'Module 04',
    status: 'Mastering & QA',
    topics: ['Digital Certificate Generation', 'Live QR Verification Portal', 'Instant Print-Ready PDF Downloads']
  }
];

const TrainingVideos = () => {
  const [videos, setVideos] = useState<VideoItem[]>(DEFAULT_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [notifiedModules, setNotifiedModules] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    axios.get('http://localhost:3000/api/center/training-videos')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          // Map backend items ensuring no random video URLs are exposed
          const mapped = res.data.data.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            title: item.title,
            description: item.description,
            duration: item.duration || '08:00',
            module: `Module 0${idx + 1}`,
            status: 'In Studio Production',
            topics: DEFAULT_VIDEOS[idx % DEFAULT_VIDEOS.length]?.topics || [
              'Step-by-step portal workflow',
              'Best practices & common troubleshooting',
              'Automated verification steps'
            ]
          }));
          setVideos(mapped);
        }
      })
      .catch(() => {
        // Fallback to default upcoming catalog
        setVideos(DEFAULT_VIDEOS);
      });
  }, []);

  const handleNotifyToggle = (id: number) => {
    setNotifiedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

        {/* Live Animated Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-900 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span>Official Series In Production</span>
        </div>
      </div>

      {/* Hero Coming Soon Animated Feature Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-7 sm:p-10 border border-indigo-800/40 shadow-xl"
      >
        {/* Ambient Decorative Glow Circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
              <Sparkles size={13} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>HIGH-DEFINITION MASTERCLASS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Official Portal Video Guides Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500">Coming Soon!</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Our central academic team is recording comprehensive, chapter-by-chapter walkthroughs. Learn how to effortlessly navigate student enrollments, instant exam conduction, QR wallet recharges, and tamper-proof certificate generation.
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs font-medium text-slate-300 backdrop-blur-md">
                <Radio size={13} className="text-emerald-400 animate-pulse" /> Bilingual Hindi & English
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs font-medium text-slate-300 backdrop-blur-md">
                <Film size={13} className="text-indigo-400" /> Full HD 1080p Screen Capture
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs font-medium text-slate-300 backdrop-blur-md">
                <CheckCircle2 size={13} className="text-amber-400" /> Official Operator Certification
              </span>
            </div>
          </div>

          {/* Right Animated Graphic Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              
              {/* Outer Pulsing Rings */}
              <motion.div 
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border border-indigo-400/30"
              />
              <motion.div 
                animate={{ scale: [1.08, 1.2, 1.08], opacity: [0.15, 0.35, 0.15] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -inset-4 rounded-full border border-yellow-400/20"
              />

              {/* Glowing Center Orb */}
              <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-tr from-indigo-900/80 via-slate-900/90 to-purple-900/80 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group">
                
                {/* Live Recording Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/30 text-[10px] font-mono font-bold text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>REC IN STUDIO</span>
                </div>

                {/* Animated Floating Clapper Icon */}
                <motion.div
                  animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-3"
                >
                  <Clapperboard size={30} className="stroke-[2.2]" />
                </motion.div>

                <div className="text-xs font-black tracking-wider uppercase text-yellow-300">
                  Episodes In Edit
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Releasing to Authorized Centers
                </p>
              </div>

            </div>
          </div>

        </div>
      </motion.div>

      {/* Videos Grid with Coming Soon Animation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" /> Upcoming Video Curriculum
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {videos.length} Modules in Production
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid, idx) => {
            const isNotified = notifiedModules[vid.id];

            return (
              <motion.div 
                key={vid.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Video Thumbnail with Coming Soon Graphic Overlay */}
                <div 
                  onClick={() => setSelectedVideo(vid)}
                  className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 h-48 relative flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {/* Subtle Shimmer Texture */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="bg-amber-400/90 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Clock size={10} /> Coming Soon
                    </span>
                    <span className="bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                      {vid.module || `Mod 0${idx + 1}`}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/15">
                      {vid.duration || '08:00'}
                    </span>
                  </div>

                  {/* Center Play Indicator with Pulse */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-yellow-400 border border-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-all shadow-xl">
                      <Play size={22} fill="currentColor" className="ml-1 opacity-90" />
                    </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                      <Radio size={11} className="text-amber-400 animate-pulse" /> {vid.status || 'In Studio Production'}
                    </span>
                    <span className="text-yellow-400 font-semibold text-[10px]">
                      Click to Preview
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {vid.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                      {vid.description || 'Step-by-step training module for center operators.'}
                    </p>
                  </div>

                  {/* Key Syllabus Badges */}
                  {vid.topics && vid.topics.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {vid.topics.slice(0, 2).map((topic, tidx) => (
                        <div key={tidx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <CheckCircle2 size={12} className="text-indigo-500 shrink-0" />
                          <span className="truncate">{topic}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Footer (NO external/random video links) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                      <Sparkles size={12} /> Official Module
                    </span>

                    <button
                      onClick={() => handleNotifyToggle(vid.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isNotified 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60'
                      }`}
                    >
                      {isNotified ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Notified</span>
                        </>
                      ) : (
                        <>
                          <Bell size={12} />
                          <span>Notify Me</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Module Details & Coming Soon Animation Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200"
            >
              {/* Modal Top Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center border-b border-indigo-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
                    <Film size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-yellow-300 font-bold block">
                      {selectedVideo.module || 'Video Tutorial Module'}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate max-w-sm">
                      {selectedVideo.title}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Animated Studio Preview */}
              <div className="p-6 bg-slate-950 text-center text-white py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Pulsing Clapper Animation */}
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-500/20"
                  >
                    <Clapperboard size={32} />
                  </motion.div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono font-bold mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      RECORDING & AUDIO MASTERING IN PROGRESS
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white px-4">
                      {selectedVideo.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {selectedVideo.description}
                    </p>
                  </div>

                  {/* Production Progress Bar */}
                  <div className="max-w-xs mx-auto pt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Production Status</span>
                      <span className="text-yellow-400 font-bold">85% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Curriculum Breakdown */}
              <div className="p-6 space-y-4 bg-slate-50 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" /> Topics Covered in this Video:
                </div>
                <div className="space-y-2">
                  {(selectedVideo.topics || [
                    'Step-by-step portal navigation',
                    'Security token handling & verification',
                    'Common errors and recovery workflows'
                  ]).map((topic, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleNotifyToggle(selectedVideo.id);
                      setSelectedVideo(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-yellow-400 hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Bell size={14} />
                    <span>{notifiedModules[selectedVideo.id] ? 'Notification Active' : 'Notify Me When Available'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="py-2.5 px-5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TrainingVideos;

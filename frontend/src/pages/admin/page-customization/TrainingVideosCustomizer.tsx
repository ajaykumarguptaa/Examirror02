import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  Star,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Film,
  Clock,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

export interface TrainingVideoData {
  id?: number | string;
  title: string;
  url: string;
  youtube_id?: string;
  description?: string;
  duration?: string;
  module_name?: string;
  category?: string;
  is_featured?: boolean | number;
  is_active?: boolean | number;
  sort_order?: number;
  thumbnail?: string;
}

// Utility to parse any YouTube URL to 11-char Video ID
export const extractYouTubeVideoId = (urlOrId?: string): string => {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : '';
};

export const TrainingVideosCustomizer: React.FC = () => {
  const [videos, setVideos] = useState<TrainingVideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<TrainingVideoData | null>(null);

  // Fetch current videos
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/admin/training-videos');
      if (res.data.success && Array.isArray(res.data.data)) {
        setVideos(res.data.data);
        if (res.data.data.length > 0) {
          const featured = res.data.data.find((v: any) => v.is_featured == 1) || res.data.data[0];
          setPreviewVideo(featured);
        }
      }
    } catch (err: any) {
      console.error('Error fetching admin training videos:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load training videos from database' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Add a new empty video row
  const handleAddVideo = () => {
    const nextModuleNum = videos.length + 1;
    const newVideo: TrainingVideoData = {
      id: `temp-${Date.now()}`,
      title: `Portal Walkthrough Part ${nextModuleNum}`,
      url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
      youtube_id: 'M7lc1UVf-VE',
      description: 'Step-by-step video tutorial explaining portal operation and dashboard procedures.',
      duration: '08:00',
      module_name: `Module 0${nextModuleNum}`,
      category: 'Portal Guide',
      is_featured: videos.length === 0 ? 1 : 0,
      is_active: 1,
      sort_order: videos.length,
      thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg'
    };
    const updated = [...videos, newVideo];
    setVideos(updated);
    setPreviewVideo(newVideo);
  };

  // Update a video field
  const handleUpdateField = (index: number, field: keyof TrainingVideoData, value: any) => {
    const updated = [...videos];
    const current = { ...updated[index], [field]: value };

    // If changing URL, auto-extract youtube_id and thumbnail
    if (field === 'url') {
      const ytId = extractYouTubeVideoId(value);
      if (ytId) {
        current.youtube_id = ytId;
        current.thumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }
    }

    updated[index] = current;
    setVideos(updated);

    if (previewVideo && (previewVideo.id === current.id || (index === 0 && !previewVideo.id))) {
      setPreviewVideo(current);
    }
  };

  // Toggle Featured Video (only one featured at a time)
  const handleSetFeatured = (index: number) => {
    const updated = videos.map((v, i) => ({
      ...v,
      is_featured: i === index ? 1 : 0
    }));
    setVideos(updated);
    setPreviewVideo(updated[index]);
  };

  // Toggle Active/Inactive
  const handleToggleActive = (index: number) => {
    const updated = [...videos];
    updated[index].is_active = updated[index].is_active ? 0 : 1;
    setVideos(updated);
  };

  // Delete Video
  const handleDeleteVideo = async (index: number) => {
    const videoToDelete = videos[index];
    if (window.confirm(`Are you sure you want to delete "${videoToDelete.title}"?`)) {
      if (videoToDelete.id && typeof videoToDelete.id === 'number') {
        try {
          await axios.delete(`/api/admin/training-videos/${videoToDelete.id}`);
        } catch (e) {
          console.error('Delete error:', e);
        }
      }
      const updated = videos.filter((_, i) => i !== index);
      setVideos(updated);
      if (previewVideo?.id === videoToDelete.id) {
        setPreviewVideo(updated[0] || null);
      }
    }
  };

  // Move Up / Move Down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-assign sort_order
    updated.forEach((v, i) => {
      v.sort_order = i;
    });

    setVideos(updated);
  };

  // Save All Changes to Database
  const handleSaveAll = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await axios.post('/api/admin/training-videos/batch', { videos });
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: 'All training videos published successfully to Center Portal!' });
        fetchVideos();
      } else {
        setStatusMessage({ type: 'error', text: res.data.message || 'Failed to save videos' });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Server error saving videos' });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  };

  const previewYtId = previewVideo ? (extractYouTubeVideoId(previewVideo.url) || previewVideo.youtube_id || 'M7lc1UVf-VE') : '';

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700">
              <Video size={18} />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Training Videos & YouTube Tutorial Customizer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Add, edit, and organize official portal video guides. Study centers will watch and play these videos with full interactive player controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAddVideo}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Add YouTube Video</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Live YouTube Player on Left, Video Link Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live YouTube Player Preview */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Play size={14} className="text-indigo-600" />
              <span>Live Player Preview</span>
            </span>
            {previewVideo?.is_featured ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Star size={10} className="fill-amber-400" />
                Featured Hero Player
              </span>
            ) : null}
          </div>

          {/* Embedded YouTube Player */}
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner relative group">
            {previewYtId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewYtId}?rel=0&modestbranding=1`}
                title={previewVideo?.title || 'YouTube Tutorial Player'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-4 text-center">
                <Film size={32} className="opacity-50" />
                <span>Enter a valid YouTube link or video ID to load player preview.</span>
              </div>
            )}
          </div>

          {/* Video Metadata Preview */}
          {previewVideo && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {previewVideo.module_name || 'Module 01'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {previewVideo.duration || '08:00'}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">
                {previewVideo.title || 'Untitled Video Guide'}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2">
                {previewVideo.description || 'No description provided.'}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>YouTube ID: <code className="text-slate-700 font-mono font-bold">{previewYtId || 'None'}</code></span>
                <a
                  href={`https://www.youtube.com/watch?v=${previewYtId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  Watch on YouTube <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Multiple Video Link Manager Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              Configured Tutorial Videos ({videos.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Click any card to preview in the player
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <Film size={36} className="mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-800 text-sm">No Training Videos Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the button below to add your first YouTube portal walkthrough video for your study centers.
              </p>
              <button
                type="button"
                onClick={handleAddVideo}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Add First Video
              </button>
            </div>
          ) : (
            videos.map((video, index) => {
              const ytId = extractYouTubeVideoId(video.url) || video.youtube_id || '';
              const isSelected = previewVideo?.id === video.id || (!previewVideo?.id && index === 0);

              return (
                <div
                  key={video.id || index}
                  onClick={() => setPreviewVideo(video)}
                  className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs space-y-4 cursor-pointer relative ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header with Module, Featured Pill, and Reorder Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs font-mono">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {video.module_name || `Module 0${index + 1}`}
                      </span>
                      {video.is_featured ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Star size={11} className="fill-amber-500 text-amber-600" />
                          Featured Hero Video
                        </span>
                      ) : null}
                      {!video.is_active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <EyeOff size={11} /> Hidden
                        </span>
                      )}
                    </div>

                    {/* Actions: Move Up, Move Down, Set Featured, Toggle Active, Delete */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Move Up"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveUp size={14} />
                      </button>
                      <button
                        type="button"
                        title="Move Down"
                        disabled={index === videos.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <MoveDown size={14} />
                      </button>
                      <button
                        type="button"
                        title={video.is_featured ? 'Featured Video' : 'Set as Featured Video'}
                        onClick={() => handleSetFeatured(index)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          video.is_featured ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Star size={15} className={video.is_featured ? 'fill-amber-400' : ''} />
                      </button>
                      <button
                        type="button"
                        title={video.is_active ? 'Visible to Centers' : 'Hidden from Centers'}
                        onClick={() => handleToggleActive(index)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          video.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {video.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        type="button"
                        title="Delete Video"
                        onClick={() => handleDeleteVideo(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                    {/* Video Title */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Video Title</label>
                      <input
                        type="text"
                        value={video.title || ''}
                        onChange={(e) => handleUpdateField(index, 'title', e.target.value)}
                        placeholder="e.g. How to Register Students in Center Dashboard"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>

                    {/* YouTube URL or Video ID */}
                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span>YouTube Link or Video ID</span>
                          {ytId && (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                              ID: {ytId}
                            </span>
                          )}
                        </label>
                        <span className="text-[10px] text-slate-400">Accepts full URL, youtu.be, or 11-char ID</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={video.url || ''}
                          onChange={(e) => handleUpdateField(index, 'url', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white text-indigo-900"
                        />
                        <Film size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Module Tag */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Module Label</label>
                      <input
                        type="text"
                        value={video.module_name || ''}
                        onChange={(e) => handleUpdateField(index, 'module_name', e.target.value)}
                        placeholder="Module 01, Chapter 1, etc."
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Duration (MM:SS)</label>
                      <input
                        type="text"
                        value={video.duration || ''}
                        onChange={(e) => handleUpdateField(index, 'duration', e.target.value)}
                        placeholder="e.g. 10:15"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Category Tag</label>
                      <input
                        type="text"
                        value={video.category || ''}
                        onChange={(e) => handleUpdateField(index, 'category', e.target.value)}
                        placeholder="e.g. Admissions, Exams, Wallet"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>

                    {/* Custom Thumbnail (Optional) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Custom Thumbnail (Optional)</label>
                      <input
                        type="text"
                        value={video.thumbnail || ''}
                        onChange={(e) => handleUpdateField(index, 'thumbnail', e.target.value)}
                        placeholder="Auto-generated from YouTube if empty"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white text-slate-600"
                      />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Video Description</label>
                      <textarea
                        rows={2}
                        value={video.description || ''}
                        onChange={(e) => handleUpdateField(index, 'description', e.target.value)}
                        placeholder="Brief summary of what the study center will learn in this video guide."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-600 outline-none bg-slate-50/50 focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default TrainingVideosCustomizer;

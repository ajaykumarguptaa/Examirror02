import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Megaphone, 
  Sparkles, 
  Flame, 
  Zap, 
  Award, 
  Upload, 
  Save, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  Eye, 
  CheckCircle2, 
  Image as ImageIcon,
  Sliders,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  DEFAULT_AD_SETTINGS 
} from '../../../types/advertisement';

export const AdvertisementCustomizer: React.FC = () => {
  const [ad, setAd] = useState<HomeAdvertisementSettings>(DEFAULT_AD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewTab, setPreviewTab] = useState<'popup' | 'ribbon' | 'card'>('popup');

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/settings/home_advertisement')
        .catch(() => axios.get('http://localhost:3000/api/v1/settings/home_advertisement'));

      if (res.data?.success && res.data?.data) {
        setAd({ ...DEFAULT_AD_SETTINGS, ...res.data.data });
      }
    } catch (err) {
      console.error('Failed to load advertisement settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        '/api/v1/settings/home_advertisement',
        ad,
        { headers: getAuthHeader() }
      ).catch(() => axios.put(
        'http://localhost:3000/api/v1/settings/home_advertisement',
        ad,
        { headers: getAuthHeader() }
      ));

      if (res.data?.success) {
        toast.success('Advertisement settings published to Home Page!');
      } else {
        toast.success('Saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save advertisement settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeader()
        }
      });
      if (res.data?.success && res.data?.url) {
        setAd(prev => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Poster image uploaded successfully!');
      }
    } catch (err) {
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setAd(prev => ({ ...prev, imageUrl: uploadEvent.target?.result as string }));
          toast.success('Image loaded!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'offer': return <Flame size={12} className="text-amber-400 fill-amber-400" />;
      case 'urgent': return <Zap size={12} className="text-rose-400 fill-rose-400" />;
      case 'exam': return <Award size={12} className="text-emerald-400" />;
      default: return <Sparkles size={12} className="text-indigo-400 fill-indigo-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
        <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading advertisement settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Megaphone size={13} className="text-amber-600" />
              Landing Page Campaign Manager
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Multi-Format Ad Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Home Page Advertisements & Launch Banners
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast upcoming test series, new course launches, discounts, or alerts via popups, top ribbons, or spotlight cards.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchSettings}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? 'Publishing...' : 'Publish to Live Home Page'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Master Enable Switch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">Master Campaign Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">Turn the advertisement campaign on or off immediately on the main landing page.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ad.enabled}
                  onChange={(e) => setAd(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Display Formats Selector */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
                Active Placement Formats (Select Any or All)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  ad.displayFormats?.popupModal ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={ad.displayFormats?.popupModal ?? true}
                    onChange={(e) => setAd(prev => ({
                      ...prev,
                      displayFormats: { ...prev.displayFormats, popupModal: e.target.checked }
                    }))}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-black">Popup Modal</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">High-converting entry modal</div>
                  </div>
                </label>

                <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  ad.displayFormats?.topRibbon ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={ad.displayFormats?.topRibbon ?? true}
                    onChange={(e) => setAd(prev => ({
                      ...prev,
                      displayFormats: { ...prev.displayFormats, topRibbon: e.target.checked }
                    }))}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-black">Top Ribbon</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Sticky header announcement</div>
                  </div>
                </label>

                <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  ad.displayFormats?.heroCard ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={ad.displayFormats?.heroCard ?? false}
                    onChange={(e) => setAd(prev => ({
                      ...prev,
                      displayFormats: { ...prev.displayFormats, heroCard: e.target.checked }
                    }))}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-black">Hero Card</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Spotlight banner on home</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Ad Content & Messaging */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <span>Campaign Messaging & Content</span>
            </h3>

            {/* Badge & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text *</label>
                <input
                  type="text"
                  value={ad.badgeText}
                  onChange={(e) => setAd(prev => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="e.g. 🚀 NEW COURSE LAUNCH"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Category Theme</label>
                <select
                  value={ad.badgeType}
                  onChange={(e) => setAd(prev => ({ ...prev, badgeType: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="launch">🚀 Launch (Indigo / Purple)</option>
                  <option value="offer">🔥 Offer / Discount (Amber / Gold)</option>
                  <option value="exam">🏆 Exam Alert / Scholarship (Emerald)</option>
                  <option value="urgent">⚡ Urgent / Limited (Rose / Red)</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Headline / Title *</label>
              <input
                type="text"
                value={ad.title}
                onChange={(e) => setAd(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. SSC CGL 2025 Complete Mock & Video Solution Pack"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Key Highlights</label>
              <textarea
                rows={2}
                value={ad.subtitle}
                onChange={(e) => setAd(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. 50 Full Length Tests + AIR Percentile + Solution PDFs"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>

            {/* Image / Poster Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ad Poster Graphic (Optional for Modal)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={ad.imageUrl || ''}
                  onChange={(e) => setAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Paste image URL or upload below..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
                <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  <Upload size={14} />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {ad.imageUrl && (
                  <button
                    onClick={() => setAd(prev => ({ ...prev, imageUrl: '' }))}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Call to Action Button & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Label *</label>
                <input
                  type="text"
                  value={ad.ctaText}
                  onChange={(e) => setAd(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="e.g. Enroll Now @ ₹199"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Target Link *</label>
                <input
                  type="text"
                  value={ad.ctaLink}
                  onChange={(e) => setAd(prev => ({ ...prev, ctaLink: e.target.value }))}
                  placeholder="e.g. /test-series or /student/passes"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-indigo-700 outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Secondary Footer Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reassurance Note (Optional)</label>
              <input
                type="text"
                value={ad.secondaryText || ''}
                onChange={(e) => setAd(prev => ({ ...prev, secondaryText: e.target.value }))}
                placeholder="e.g. Instant 1-Click Activation • No Auto-Debits"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 3. Countdown & Behavior Settings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <span>Countdown & Display Behavior</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ad.countdownEnabled}
                    onChange={(e) => setAd(prev => ({ ...prev, countdownEnabled: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  <span>Show Live Countdown Timer</span>
                </label>

                {ad.countdownEnabled && (
                  <input
                    type="datetime-local"
                    value={ad.countdownEndDate ? ad.countdownEndDate.slice(0, 16) : ''}
                    onChange={(e) => setAd(prev => ({ ...prev, countdownEndDate: new Date(e.target.value).toISOString() }))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-indigo-600"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Popup Delay (Seconds): {ad.popupDelaySeconds}s
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={ad.popupDelaySeconds}
                  onChange={(e) => setAd(prev => ({ ...prev, popupDelaySeconds: Number(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={ad.showOncePerSession}
                    onChange={(e) => setAd(prev => ({ ...prev, showOncePerSession: e.target.checked }))}
                    className="rounded text-indigo-600"
                  />
                  <span>Show once per visitor session (Recommended)</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl text-white space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="text-amber-400" />
                <span className="font-black text-sm">Real-time Campaign Preview</span>
              </div>
              
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setPreviewTab('popup')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === 'popup' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Modal
                </button>
                <button
                  onClick={() => setPreviewTab('ribbon')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === 'ribbon' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Ribbon
                </button>
                <button
                  onClick={() => setPreviewTab('card')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewTab === 'card' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hero Card
                </button>
              </div>
            </div>

            {/* PREVIEW 1: POPUP MODAL */}
            {previewTab === 'popup' && (
              <div className="bg-slate-950 rounded-2xl p-5 border border-white/15 space-y-4 relative overflow-hidden shadow-2xl">
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
                  }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/15 text-amber-300">
                    {getBadgeIcon(ad.badgeType)}
                    <span>{ad.badgeText || 'Special Announcement'}</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 text-xs">✕</div>
                </div>

                {ad.imageUrl && (
                  <div className="relative z-10 rounded-xl overflow-hidden max-h-36 bg-slate-900 border border-white/10">
                    <img src={ad.imageUrl} alt="Poster" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="relative z-10 space-y-1.5">
                  <h4 className="text-base font-black text-white leading-snug">
                    {ad.title || 'Your Headline Here'}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {ad.subtitle || 'Your campaign description will be visible to all visitors here.'}
                  </p>
                </div>

                {ad.countdownEnabled && (
                  <div className="relative z-10 p-2.5 rounded-xl bg-slate-900 border border-white/10 text-center font-mono text-xs flex justify-around text-amber-300 font-bold">
                    <span>02d</span> : <span>14h</span> : <span>35m</span> : <span>12s</span>
                  </div>
                )}

                <div className="relative z-10 pt-1">
                  <div className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25">
                    <span>{ad.ctaText || 'Enroll Now'}</span>
                    <ArrowRight size={13} />
                  </div>
                  {ad.secondaryText && (
                    <div className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck size={11} className="text-emerald-400" />
                      <span>{ad.secondaryText}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PREVIEW 2: TOP RIBBON */}
            {previewTab === 'ribbon' && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-400">Preview as Top Sticky Header Bar:</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 text-white flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/10 text-amber-300 shrink-0">
                      {ad.badgeText || 'ALERT'}
                    </span>
                    <span className="font-bold truncate text-[11px]">{ad.title}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shrink-0 flex items-center gap-1">
                    <span>{ad.ctaText || 'Open'}</span>
                    <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW 3: HERO SPOTLIGHT CARD */}
            {previewTab === 'card' && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-400">Preview as Spotlight Card on Landing Page:</div>
                <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-400/40 text-white space-y-3">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-white/10 text-amber-300">
                    {ad.badgeText || 'SPECIAL'}
                  </div>
                  <h4 className="font-black text-sm text-white">{ad.title}</h4>
                  <p className="text-[10px] text-slate-300">{ad.subtitle}</p>
                  <div className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center gap-1.5">
                    <span>{ad.ctaText || 'Explore Now'}</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Pro Tip:</strong> Setting a countdown timer creates authentic urgency and boosts student enrollment rates by over 40%!
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AdvertisementCustomizer;

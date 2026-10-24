import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Megaphone, 
  Flame, 
  Zap, 
  Award, 
  Upload, 
  Save, 
  RefreshCw, 
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
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  Palette,
  Layout,
  ExternalLink,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  type AdSlideItem,
  type AdColorTheme,
  DEFAULT_AD_SETTINGS,
  DEFAULT_AD_SLIDES
} from '../../../types/advertisement';

export const AdvertisementCustomizer: React.FC = () => {
  const [ad, setAd] = useState<HomeAdvertisementSettings>(DEFAULT_AD_SETTINGS);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        const data = res.data.data;
        const rawSlides = (data.slides && Array.isArray(data.slides) && data.slides.length > 0)
          ? data.slides
          : (data.title || data.imageUrl ? [{
              id: 'slide-1',
              title: data.title || '',
              subtitle: data.subtitle || '',
              badgeText: data.badgeText,
              badgeType: data.badgeType,
              imageUrl: data.imageUrl,
              colorTheme: 'amberSunset',
              ctaText: data.ctaText || 'Explore Now',
              ctaLink: data.ctaLink || '/test-series',
              secondaryText: data.secondaryText,
              countdownEnabled: data.countdownEnabled,
              countdownEndDate: data.countdownEndDate
            }] : DEFAULT_AD_SLIDES);

        setAd({
          ...DEFAULT_AD_SETTINGS,
          ...data,
          bannerPosition: 'below_hero', // Always keep below hero
          bannerWidth: 'container',     // Always card layout
          slides: rawSlides
        });
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

  const currentSlide: AdSlideItem = ad.slides[activeSlideIndex] || ad.slides[0] || DEFAULT_AD_SLIDES[0];

  const updateCurrentSlide = (fields: Partial<AdSlideItem>) => {
    setAd(prev => {
      const updatedSlides = [...prev.slides];
      if (updatedSlides[activeSlideIndex]) {
        updatedSlides[activeSlideIndex] = { ...updatedSlides[activeSlideIndex], ...fields };
      }
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleAddSlide = () => {
    const newSlide: AdSlideItem = {
      id: `slide-${Date.now()}`,
      title: 'New Mock Test Series Launch',
      subtitle: 'Attempt live exam pattern mock tests with All India Ranking, instant scorecards and bilingual PDF solutions.',
      badgeText: '🚀 NEW LAUNCH',
      badgeType: 'launch',
      colorTheme: 'indigoBlue',
      imageUrl: '',
      ctaText: 'Explore Now',
      ctaLink: '/test-series',
      openInNewTab: false,
      secondaryText: 'Instant 1-Click Activation • Unlimited Practice',
      countdownEnabled: false
    };

    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('New banner card added!');
  };

  const handleDeleteSlide = (index: number) => {
    if (ad.slides.length <= 1) {
      toast.error('At least one banner card is required.');
      return;
    }
    setAd(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
    setActiveSlideIndex(Math.max(0, index - 1));
    toast.success('Slide card removed');
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToCopy = ad.slides[index];
    if (!slideToCopy) return;
    const duplicated: AdSlideItem = {
      ...slideToCopy,
      id: `slide-${Date.now()}`,
      title: slideToCopy.title ? `${slideToCopy.title} (Copy)` : 'Banner Copy'
    };
    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, duplicated]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('Slide card duplicated');
  };

  const handleMoveSlide = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ad.slides.length) return;
    setAd(prev => {
      const updated = [...prev.slides];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return { ...prev, slides: updated };
    });
    setActiveSlideIndex(newIndex);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...ad,
        bannerPosition: 'below_hero',
        bannerWidth: 'container',
        displayFormats: {
          ...ad.displayFormats,
          heroCard: true
        },
        // Sync first slide as legacy fallback
        title: ad.slides[0]?.title || ad.title,
        subtitle: ad.slides[0]?.subtitle || ad.subtitle,
        badgeText: ad.slides[0]?.badgeText || ad.badgeText,
        badgeType: ad.slides[0]?.badgeType || ad.badgeType,
        imageUrl: ad.slides[0]?.imageUrl || ad.imageUrl,
        ctaText: ad.slides[0]?.ctaText || ad.ctaText,
        ctaLink: ad.slides[0]?.ctaLink || ad.ctaLink,
        secondaryText: ad.slides[0]?.secondaryText || ad.secondaryText
      };

      const res = await axios.put(
        '/api/v1/settings/home_advertisement',
        payload,
        { headers: getAuthHeader() }
      ).catch(() => axios.put(
        'http://localhost:3000/api/v1/settings/home_advertisement',
        payload,
        { headers: getAuthHeader() }
      ));

      if (res.data?.success) {
        toast.success('Banner cards published live to Home Page!');
      } else {
        toast.success('Saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save banner settings');
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
        updateCurrentSlide({ imageUrl: res.data.url });
        toast.success('Image graphic uploaded successfully!');
      }
    } catch (err) {
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          updateCurrentSlide({ imageUrl: uploadEvent.target?.result as string });
          toast.success('Image graphic loaded!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const getThemeWrapperClass = (theme?: string) => {
    switch (theme) {
      case 'amberSunset':
        return 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white border-amber-300/40';
      case 'emeraldTeal':
        return 'bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white border-emerald-400/40';
      case 'royalPurple':
        return 'bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white border-purple-400/40';
      case 'cleanLight':
        return 'bg-gradient-to-r from-white via-blue-50/70 to-indigo-50/70 text-slate-900 border-indigo-200';
      case 'indigoBlue':
      default:
        return 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border-blue-400/40';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
        <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading banner settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* 1. TOP HEADER & PUBLISH BAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Megaphone size={13} className="text-amber-600" />
              Spotlight Campaign Cards Manager
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Multi-Slide Card Slider
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Home Page Spotlight Banner Cards
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add promotional ad cards below the hero section. Customize color gradients, upload images, set links, and control autoplay.
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
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
          >
            <Save size={15} />
            <span>{saving ? 'Publishing...' : 'Publish to Live Home Page'}</span>
          </button>
        </div>
      </div>

      {/* 2. MASTER TOGGLE & SLIDER CONTROLS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ad.enabled}
                onChange={(e) => setAd(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
            <div>
              <span className="text-sm font-black text-slate-900 block">
                {ad.enabled ? '🟢 Campaign Card Slider is ACTIVE on Home Page' : '⚪ Campaign Card Slider is PAUSED'}
              </span>
              <span className="text-xs text-slate-500">
                Displays below the Hero Section between hero and stats.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Autoplay Interval:</label>
            <select
              value={ad.autoSlideIntervalSeconds || 5}
              onChange={(e) => setAd(prev => ({ ...prev, autoSlideIntervalSeconds: Number(e.target.value) }))}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
            >
              <option value={3}>Every 3 seconds</option>
              <option value={4}>Every 4 seconds</option>
              <option value={5}>Every 5 seconds (Recommended)</option>
              <option value={7}>Every 7 seconds</option>
              <option value={10}>Every 10 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. MULTI-SLIDE CARDS MANAGER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Slides Tab Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Cards ({ad.slides.length}):
            </span>
            {ad.slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all shrink-0 ${
                  activeSlideIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt="" className="w-5 h-4 object-cover rounded shadow-xs shrink-0" />
                ) : (
                  <ImageIcon size={14} className="opacity-60" />
                )}
                <span>Card {idx + 1}</span>
                {s.title && <span className="max-w-[110px] truncate opacity-75 text-[10px]">({s.title})</span>}
              </button>
            ))}

            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3.5 py-2 rounded-xl border border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Add Card</span>
            </button>
          </div>

          {/* Slide Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => handleMoveSlide(activeSlideIndex, 'left')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move card left (earlier in rotation)"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === ad.slides.length - 1}
              onClick={() => handleMoveSlide(activeSlideIndex, 'right')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move card right (later in rotation)"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => handleDuplicateSlide(activeSlideIndex)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Duplicate current card"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>
            {ad.slides.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteSlide(activeSlideIndex)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Delete current card"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. CURRENT ACTIVE CARD EDITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form: Details, Color Theme & Image Upload */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Color Theme Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-600" />
                <span>Card Gradient Color Theme</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'amberSunset', label: 'Sunset Amber / Orange', swatch: 'from-amber-600 to-rose-700' },
                  { id: 'indigoBlue', label: 'Royal Cobalt / Indigo', swatch: 'from-blue-700 to-indigo-800' },
                  { id: 'emeraldTeal', label: 'Emerald / Dark Teal', swatch: 'from-emerald-700 to-slate-900' },
                  { id: 'royalPurple', label: 'Regal Violet / Purple', swatch: 'from-purple-800 to-slate-900' },
                  { id: 'cleanLight', label: 'Pearl Light / Clean', swatch: 'from-white to-blue-50 border-slate-300' }
                ].map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateCurrentSlide({ colorTheme: theme.id as AdColorTheme })}
                    className={`p-2.5 rounded-xl border-2 text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                      currentSlide.colorTheme === theme.id
                        ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.swatch} shrink-0 border border-black/10`} />
                    <span className="text-xs font-bold text-slate-800 truncate">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Graphic Upload */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={15} className="text-indigo-600" />
                  <span>Card Graphic Image (Optional)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  Displays on the right side of the card
                </span>
              </div>

              {currentSlide.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white h-44 group shadow-sm flex items-center justify-center">
                  <img
                    src={currentSlide.imageUrl}
                    alt="Card Graphic"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100 shadow-md">
                      <span>Change Image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => updateCurrentSlide({ imageUrl: '' })}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white transition-all">
                  <Upload size={24} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploadingImage ? 'Uploading Image...' : 'Click to Upload Image for Card'}
                  </span>
                  <span className="text-[11px] text-slate-400 text-center">
                    Upload a course thumbnail, book mockup, or flyer. It will show on the right side of the card.
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Badge Tag & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Badge Tag Text</label>
                <input
                  type="text"
                  value={currentSlide.badgeText || ''}
                  onChange={(e) => updateCurrentSlide({ badgeText: e.target.value })}
                  placeholder="e.g. 🚀 NEW TEST SERIES LAUNCH"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Badge Icon Category</label>
                <select
                  value={currentSlide.badgeType || 'launch'}
                  onChange={(e) => updateCurrentSlide({ badgeType: e.target.value as any })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="launch">🚀 Launch (Rocket)</option>
                  <option value="offer">🔥 Offer / Discount (Flame)</option>
                  <option value="urgent">⚡ Urgent / Alert (Zap)</option>
                  <option value="exam">🏆 Exam / Results (Award)</option>
                </select>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Headline Title</label>
                <input
                  type="text"
                  value={currentSlide.title || ''}
                  onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                  placeholder="e.g. SSC CGL & Railway NTPC 2026 Live Mega Mock Series"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Subtitle Description</label>
                <textarea
                  rows={2}
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                  placeholder="Attempt full-length exam pattern mock tests..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Secondary Checkpoint / Guarantee</label>
                <input
                  type="text"
                  value={currentSlide.secondaryText || ''}
                  onChange={(e) => updateCurrentSlide({ secondaryText: e.target.value })}
                  placeholder="e.g. Instant 1-Click Activation • Unlimited Mock Re-attempts"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Destination Link (CTA Link) & Button */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-indigo-600" />
                <span>Button & Destination Link</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Button Text:</span>
                  <input
                    type="text"
                    value={currentSlide.ctaText || ''}
                    onChange={(e) => updateCurrentSlide({ ctaText: e.target.value })}
                    placeholder="e.g. EXPLORE TEST SERIES NOW"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Click Link (URL):</span>
                  <input
                    type="text"
                    value={currentSlide.ctaLink || ''}
                    onChange={(e) => updateCurrentSlide({ ctaLink: e.target.value })}
                    placeholder="e.g. /test-series"
                    className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Links:</span>
                {[
                  { label: 'Test Series', link: '/test-series' },
                  { label: 'Courses', link: '/courses' },
                  { label: 'Elite Pass', link: '/passes' },
                  { label: 'Franchise', link: '/franchise-register' },
                  { label: 'Free Tests', link: '#free-tests' }
                ].map(preset => (
                  <button
                    key={preset.link}
                    type="button"
                    onClick={() => updateCurrentSlide({ ctaLink: preset.link })}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={currentSlide.openInNewTab ?? false}
                    onChange={(e) => updateCurrentSlide({ openInNewTab: e.target.checked })}
                    className="rounded accent-indigo-600"
                  />
                  <span>Open link in new browser tab</span>
                </label>

                {/* Countdown Timer Toggle */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentSlide.countdownEnabled ?? false}
                      onChange={(e) => updateCurrentSlide({ countdownEnabled: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Show Timer</span>
                  </label>
                  {currentSlide.countdownEnabled && (
                    <input
                      type="datetime-local"
                      value={currentSlide.countdownEndDate ? currentSlide.countdownEndDate.substring(0, 16) : ''}
                      onChange={(e) => updateCurrentSlide({ countdownEndDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200"
                    />
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Live Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-indigo-600" />
                <span>Live Card Preview</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Card {activeSlideIndex + 1} of {ad.slides.length}
              </span>
            </div>

            {/* Exact Card Preview */}
            <div className="rounded-3xl border border-slate-200 p-3 bg-slate-50 shadow-sm space-y-3">
              
              <div className={`relative rounded-3xl p-6 border-2 shadow-xl ${getThemeWrapperClass(currentSlide.colorTheme)}`}>
                
                <div className="flex flex-col gap-4">
                  {currentSlide.badgeText && (
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/30 text-white w-max shadow-xs">
                      {currentSlide.badgeText}
                    </span>
                  )}

                  <h4 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-sm">
                    {currentSlide.title || 'Announcement Headline'}
                  </h4>

                  {currentSlide.subtitle && (
                    <p className="text-xs text-white/90 line-clamp-2">
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {/* If image uploaded, show image inside card */}
                  {currentSlide.imageUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-white/20 shadow-md">
                      <img src={currentSlide.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {currentSlide.secondaryText && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-100">
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span>{currentSlide.secondaryText}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {currentSlide.countdownEnabled && (
                      <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 font-bold">
                        12d : 18h : 13m
                      </span>
                    )}

                    <span className="ml-auto px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider bg-white text-slate-950 shadow-md flex items-center gap-1.5">
                      <span>{currentSlide.ctaText || 'EXPLORE NOW'}</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>

                </div>

              </div>

              {/* Minimal Dot Indicators */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {ad.slides.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full ${
                      activeSlideIndex === i ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-bold text-slate-800">Below Hero Section</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Link:</span>
                  <span className="font-mono text-indigo-600 font-bold truncate max-w-[200px]">{currentSlide.ctaLink}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdvertisementCustomizer;

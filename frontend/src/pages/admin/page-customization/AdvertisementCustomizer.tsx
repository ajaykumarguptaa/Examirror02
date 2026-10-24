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
  Crown
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  type AdSlideItem,
  type AdColorTheme,
  type AdLayoutType,
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
        const normalizedSlides = (data.slides && Array.isArray(data.slides) && data.slides.length > 0)
          ? data.slides
          : (data.title ? [{
              id: 'slide-1',
              title: data.title,
              subtitle: data.subtitle || '',
              badgeText: data.badgeText,
              badgeType: data.badgeType,
              imageUrl: data.imageUrl,
              layoutType: data.imageUrl ? 'splitCard' : 'compactCard',
              colorTheme: 'indigoBlue',
              ctaText: data.ctaText || 'Explore Now',
              ctaLink: data.ctaLink || '/test-series',
              secondaryText: data.secondaryText,
              countdownEnabled: data.countdownEnabled,
              countdownEndDate: data.countdownEndDate
            }] : DEFAULT_AD_SLIDES);

        setAd({
          ...DEFAULT_AD_SETTINGS,
          ...data,
          slides: normalizedSlides
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
      title: 'New Launch Announcement',
      subtitle: 'Write a compelling highlight description for students here.',
      badgeText: 'NEW LAUNCH',
      badgeType: 'launch',
      layoutType: 'splitCard',
      colorTheme: 'indigoBlue',
      imageUrl: '',
      ctaText: 'Explore Now',
      ctaLink: '/test-series',
      secondaryText: 'Instant Access • Unlimited Practice',
      countdownEnabled: false
    };

    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('New banner slide added!');
  };

  const handleDeleteSlide = (index: number) => {
    if (ad.slides.length <= 1) {
      toast.error('At least one banner slide is required.');
      return;
    }
    setAd(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
    setActiveSlideIndex(Math.max(0, index - 1));
    toast.success('Slide removed');
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToCopy = ad.slides[index];
    if (!slideToCopy) return;
    const duplicated: AdSlideItem = {
      ...slideToCopy,
      id: `slide-${Date.now()}`,
      title: `${slideToCopy.title} (Copy)`
    };
    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, duplicated]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('Slide duplicated');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...ad,
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
        toast.success('Advertisements & Slideshow published live to Home Page!');
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
        updateCurrentSlide({ imageUrl: res.data.url });
        toast.success('Banner graphic uploaded successfully!');
      }
    } catch (err) {
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          updateCurrentSlide({ imageUrl: uploadEvent.target?.result as string });
          toast.success('Banner graphic loaded!');
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
        return 'bg-gradient-to-r from-white via-blue-50/60 to-indigo-50/60 text-slate-900 border-indigo-200';
      case 'indigoBlue':
      default:
        return 'bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border-blue-400/40';
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
              Multi-Slide Banner Slideshow Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Home Page Advertisements & Slideshow Banners
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create high-impact banner slideshows, upload custom graphic posters, set color themes, and connect 1-click CTA links.
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

      {/* Global Campaign Master Toggle & Format Settings */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
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
                {ad.enabled ? '🟢 Campaign is ACTIVE on Live Website' : '⚪ Campaign is PAUSED'}
              </span>
              <span className="text-xs text-slate-500">
                Turn on to display active banners, ribbons, or modals to website visitors.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700">Auto-slide Interval:</label>
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

        {/* Display Formats Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${ad.displayFormats.heroCard ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
            <input
              type="checkbox"
              checked={ad.displayFormats.heroCard}
              onChange={(e) => setAd(prev => ({ ...prev, displayFormats: { ...prev.displayFormats, heroCard: e.target.checked } }))}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">📌 Home Page Spotlight Slideshow</span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">High-converting carousel right below the hero banner.</span>
            </div>
          </label>

          <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${ad.displayFormats.topRibbon ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
            <input
              type="checkbox"
              checked={ad.displayFormats.topRibbon}
              onChange={(e) => setAd(prev => ({ ...prev, displayFormats: { ...prev.displayFormats, topRibbon: e.target.checked } }))}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">🔔 Top Announcement Ribbon</span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">Thin sticky alert bar at the very top of the webpage.</span>
            </div>
          </label>

          <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${ad.displayFormats.popupModal ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
            <input
              type="checkbox"
              checked={ad.displayFormats.popupModal}
              onChange={(e) => setAd(prev => ({ ...prev, displayFormats: { ...prev.displayFormats, popupModal: e.target.checked } }))}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">💬 High-Impact Popup Modal</span>
              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">Automated lightbox modal with countdown timer.</span>
            </div>
          </label>
        </div>
      </div>

      {/* Slideshow Manager Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">
              Slides ({ad.slides.length}):
            </span>
            {ad.slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  activeSlideIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Slide {idx + 1}</span>
                {s.title && <span className="max-w-[120px] truncate opacity-80 text-[10px]">({s.title})</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3 py-2 rounded-xl border border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Slide</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDuplicateSlide(activeSlideIndex)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1"
              title="Duplicate current slide"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>
            {ad.slides.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteSlide(activeSlideIndex)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                title="Delete current slide"
              >
                <Trash2 size={13} />
                <span>Delete Slide</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active Slide Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form: Content & Customization */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Layout Mode & Color Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Layout size={14} className="text-indigo-600" />
                  <span>Banner Layout Style</span>
                </label>
                <select
                  value={currentSlide.layoutType || 'splitCard'}
                  onChange={(e) => updateCurrentSlide({ layoutType: e.target.value as AdLayoutType })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                >
                  <option value="splitCard">🗂️ Split Card (Text + Graphic)</option>
                  <option value="fullBanner">🖼️ Full Graphic Banner (Poster Only / Image-First)</option>
                  <option value="compactCard">📄 Vibrant Gradient Text Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Palette size={14} className="text-indigo-600" />
                  <span>Color Theme Preset</span>
                </label>
                <select
                  value={currentSlide.colorTheme || 'indigoBlue'}
                  onChange={(e) => updateCurrentSlide({ colorTheme: e.target.value as AdColorTheme })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                >
                  <option value="indigoBlue">🔵 Royal Cobalt & Electric Indigo</option>
                  <option value="amberSunset">🟠 Sunset Amber & Vibrant Orange</option>
                  <option value="emeraldTeal">🟢 Emerald & Dark Teal</option>
                  <option value="royalPurple">🟣 Regal Violet & Deep Purple</option>
                  <option value="cleanLight">⚪ Clean Modern Light / Pearl</option>
                </select>
              </div>
            </div>

            {/* 2. Custom Graphic Banner Poster Upload */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={15} className="text-indigo-600" />
                  <span>Custom Banner Image / Poster</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Recommended: 1200x400 or 1920x600 (PNG / JPG / WebP)
                </span>
              </div>

              {currentSlide.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white max-h-48 group">
                  <img
                    src={currentSlide.imageUrl}
                    alt="Slide Graphic"
                    className="w-full h-full object-cover max-h-48"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100">
                      <span>Change Image</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => updateCurrentSlide({ imageUrl: '' })}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white transition-all">
                  <Upload size={22} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingImage ? 'Uploading Image...' : 'Click to Upload Custom Graphic Poster'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Design your poster in Canva/Photoshop and upload here for an exact custom look.
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* 3. Badge Tag & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Badge Tag Text
                </label>
                <input
                  type="text"
                  value={currentSlide.badgeText || ''}
                  onChange={(e) => updateCurrentSlide({ badgeText: e.target.value })}
                  placeholder="e.g. NEW LAUNCH, 50% OFF, EXAM ALERT"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Badge Icon Category
                </label>
                <select
                  value={currentSlide.badgeType || 'launch'}
                  onChange={(e) => updateCurrentSlide({ badgeType: e.target.value as any })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="launch">⚡ Launch / New Batch</option>
                  <option value="offer">🔥 Special Offer / Discount</option>
                  <option value="exam">🏆 Exam / Results Alert</option>
                  <option value="urgent">⚠️ Urgent / Admission Alert</option>
                </select>
              </div>
            </div>

            {/* 4. Title & Subtitle */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Banner Headline Title
                </label>
                <input
                  type="text"
                  value={currentSlide.title || ''}
                  onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                  placeholder="e.g. All India SSC CGL 2026 Live Mock Tests"
                  className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Sub-headline / Key Benefit
                </label>
                <textarea
                  rows={2}
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                  placeholder="e.g. Live timed exams, bilingual question solutions, instant AIR ranking."
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>
            </div>

            {/* 5. CTA Button & 1-Click Target Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={currentSlide.ctaText || ''}
                  onChange={(e) => updateCurrentSlide({ ctaText: e.target.value })}
                  placeholder="e.g. Explore Test Series"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>Destination Target Link</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={
                      ['/test-series', '/passes', '/courses', '/#test-series', '/#elite-pass', '/login/student'].includes(currentSlide.ctaLink)
                        ? currentSlide.ctaLink
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        updateCurrentSlide({ ctaLink: e.target.value });
                      }
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                  >
                    <option value="/test-series">🎯 Test Series Catalog (/test-series)</option>
                    <option value="/passes">👑 Examirror Elite Pass (/passes)</option>
                    <option value="/#test-series">📌 Home: Test Series Section (/#test-series)</option>
                    <option value="/#elite-pass">👑 Home: Elite Pass Section (/#elite-pass)</option>
                    <option value="/courses">📚 Courses Catalog (/courses)</option>
                    <option value="/login/student">👤 Student Login & Register (/login/student)</option>
                    <option value="custom">🔗 Custom Link / External URL</option>
                  </select>

                  <input
                    type="text"
                    value={currentSlide.ctaLink || ''}
                    onChange={(e) => updateCurrentSlide({ ctaLink: e.target.value })}
                    placeholder="Enter custom path or URL e.g. /test-series or https://..."
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 6. Reassurance Text & Countdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Secondary Assurance Note
                </label>
                <input
                  type="text"
                  value={currentSlide.secondaryText || ''}
                  onChange={(e) => updateCurrentSlide({ secondaryText: e.target.value })}
                  placeholder="e.g. Instant 1-Click Activation • Unlimited Practice"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Countdown Timer
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentSlide.countdownEnabled)}
                      onChange={(e) => updateCurrentSlide({ countdownEnabled: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Enable</span>
                  </label>
                </div>
                {currentSlide.countdownEnabled && (
                  <input
                    type="datetime-local"
                    value={currentSlide.countdownEndDate ? new Date(currentSlide.countdownEndDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateCurrentSlide({ countdownEndDate: new Date(e.target.value).toISOString() })}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                  />
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Live Instant Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-indigo-600" />
                <span>Live Slide Preview (Slide {activeSlideIndex + 1})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Shows exact visitor view
              </span>
            </div>

            {/* Interactive Preview Box */}
            <div className={`rounded-3xl p-6 border-2 transition-all shadow-xl relative overflow-hidden ${getThemeWrapperClass(currentSlide.colorTheme)}`}>
              {currentSlide.layoutType === 'fullBanner' && currentSlide.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-end p-4">
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    {currentSlide.badgeText && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                        {currentSlide.badgeText}
                      </span>
                    )}
                    <h4 className="text-base font-black text-white">{currentSlide.title}</h4>
                    <button className="px-4 py-2 mt-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md">
                      <span>{currentSlide.ctaText || 'Explore Now'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSlide.badgeText && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/25">
                      <Zap size={11} className="text-amber-300" />
                      <span>{currentSlide.badgeText}</span>
                    </span>
                  )}
                  <h4 className="text-lg font-black tracking-tight leading-snug">
                    {currentSlide.title || 'Your Slide Title Here'}
                  </h4>
                  {currentSlide.subtitle && (
                    <p className="text-xs opacity-90 line-clamp-2">
                      {currentSlide.subtitle}
                    </p>
                  )}
                  {currentSlide.imageUrl && (
                    <div className="w-full h-28 rounded-xl overflow-hidden border border-white/20 mt-2">
                      <img src={currentSlide.imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span>{currentSlide.ctaText || 'Explore Now'}</span>
                      <ArrowRight size={13} />
                    </button>
                    {currentSlide.secondaryText && (
                      <span className="text-[10px] font-semibold opacity-80 truncate">
                        {currentSlide.secondaryText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800">💡 Pro Tip for Banners:</p>
              <p>
                • If you design banners in Canva (1200x400), select <strong>Full Graphic Banner</strong> and upload your image directly.
              </p>
              <p>
                • If you prefer text highlights, choose <strong>Split Card</strong> with Royal Cobalt or Sunset Amber theme.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdvertisementCustomizer;

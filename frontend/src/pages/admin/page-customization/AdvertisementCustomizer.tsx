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
  ArrowLeftRight,
  Maximize2,
  Monitor,
  Maximize,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { 
  type HomeAdvertisementSettings, 
  type AdSlideItem,
  type AdColorTheme,
  type AdLayoutType,
  type AdBannerPosition,
  type AdBannerWidth,
  type AdBannerHeight,
  type AdImageFit,
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
              imageFit: data.bannerFit || 'cover',
              layoutType: data.imageUrl ? 'pureImage' : 'compactCard',
              colorTheme: 'indigoBlue',
              ctaText: data.ctaText || 'Explore Now',
              ctaLink: data.ctaLink || '/test-series',
              secondaryText: data.secondaryText,
              countdownEnabled: data.countdownEnabled,
              countdownEndDate: data.countdownEndDate
            }] : DEFAULT_AD_SLIDES);

        // Auto-fix any slide that has an image but was stuck in compactCard
        const normalizedSlides = rawSlides.map((s: AdSlideItem) => {
          if (s.imageUrl && (s.layoutType === 'compactCard' || !s.layoutType)) {
            return { ...s, layoutType: 'pureImage' as AdLayoutType };
          }
          return s;
        });

        setAd({
          ...DEFAULT_AD_SETTINGS,
          ...data,
          bannerPosition: data.bannerPosition || 'top',
          bannerWidth: data.bannerWidth || 'full',
          bannerHeight: data.bannerHeight || 'standard',
          bannerFit: data.bannerFit || 'cover',
          showArrows: data.showArrows ?? true,
          showDots: data.showDots ?? true,
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
      layoutType: 'pureImage',
      colorTheme: 'indigoBlue',
      imageUrl: '',
      imageFit: ad.bannerFit || 'cover',
      ctaText: 'Explore Now',
      ctaLink: '/test-series',
      openInNewTab: false,
      secondaryText: 'Instant Access • Unlimited Practice',
      countdownEnabled: false
    };

    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('New banner slide added! Upload your banner image now.');
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
      title: slideToCopy.title ? `${slideToCopy.title} (Copy)` : 'Banner Copy'
    };
    setAd(prev => ({
      ...prev,
      slides: [...prev.slides, duplicated]
    }));
    setActiveSlideIndex(ad.slides.length);
    toast.success('Slide duplicated');
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
        displayFormats: {
          ...ad.displayFormats,
          heroCard: true // Always ensure homepage banner format is enabled
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
        toast.success('Banner Slider published live to Home Page!');
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
        updateCurrentSlide({ 
          imageUrl: res.data.url,
          // Auto switch to pureImage if user uploaded an image and hasn't chosen fullBanner
          layoutType: currentSlide.layoutType === 'compactCard' ? 'pureImage' : (currentSlide.layoutType || 'pureImage')
        });
        toast.success('Banner image uploaded successfully!');
      }
    } catch (err) {
      // Fallback base64
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          updateCurrentSlide({ 
            imageUrl: uploadEvent.target?.result as string,
            layoutType: currentSlide.layoutType === 'compactCard' ? 'pureImage' : (currentSlide.layoutType || 'pureImage')
          });
          toast.success('Banner image loaded!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
        <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Loading banner slider settings...</p>
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
              Homepage Banner Slider & Ads Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Multi-Image Carousel
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Home Page Ad & Launch Banners Slider
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload full-width responsive banner graphics, create multi-slide carousels, set click links, and adjust banner heights.
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

      {/* 2. GLOBAL SLIDER CONFIGURATION & DISPLAY CONTROLS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Master Active / Pause Toggle */}
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
                {ad.enabled ? '🟢 Banner Slider is ACTIVE on Live Home Page' : '⚪ Banner Slider is PAUSED'}
              </span>
              <span className="text-xs text-slate-500">
                When enabled, visitors will see the full-width promotional banner slider on the homepage.
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

        {/* Banner Layout & Size Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Placement */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Monitor size={14} className="text-indigo-600" />
              <span>Homepage Placement</span>
            </label>
            <select
              value={ad.bannerPosition || 'top'}
              onChange={(e) => setAd(prev => ({ ...prev, bannerPosition: e.target.value as AdBannerPosition }))}
              className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="top">📌 Top of Home Page (Below Header / Notice)</option>
              <option value="below_hero">📍 Below Hero Section (Spotlight Banner)</option>
            </select>
            <span className="text-[10px] text-slate-500 block leading-tight">
              'Top of Home Page' gives maximum visibility like top e-learning platforms.
            </span>
          </div>

          {/* 2. Banner Width */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Maximize2 size={14} className="text-indigo-600" />
              <span>Banner Width</span>
            </label>
            <select
              value={ad.bannerWidth || 'full'}
              onChange={(e) => setAd(prev => ({ ...prev, bannerWidth: e.target.value as AdBannerWidth }))}
              className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="full">🌐 Full Width (100% Edge-to-Edge)</option>
              <option value="container">📦 Boxed Container (Max 1600px)</option>
            </select>
            <span className="text-[10px] text-slate-500 block leading-tight">
              Full Width stretches across the entire screen seamlessly.
            </span>
          </div>

          {/* 3. Banner Height */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Maximize size={14} className="text-indigo-600" />
              <span>Banner Height</span>
            </label>
            <select
              value={ad.bannerHeight || 'standard'}
              onChange={(e) => setAd(prev => ({ ...prev, bannerHeight: e.target.value as AdBannerHeight }))}
              className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="standard">📐 Standard (300px - 480px, Best for Web)</option>
              <option value="compact">📏 Compact (220px - 340px, Sleek Ribbon)</option>
              <option value="large">📐 Large Hero (360px - 600px, High Impact)</option>
              <option value="auto">📏 Auto Aspect Ratio (21:9 Widescreen)</option>
            </select>
            <span className="text-[10px] text-slate-500 block leading-tight">
              Responsive height automatically adapts on mobile phones.
            </span>
          </div>

          {/* 4. Image Fit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-indigo-600" />
              <span>Image Fit Mode</span>
            </label>
            <select
              value={ad.bannerFit || 'cover'}
              onChange={(e) => setAd(prev => ({ ...prev, bannerFit: e.target.value as AdImageFit }))}
              className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white text-slate-800"
            >
              <option value="cover">🔲 Cover (Fills 100% of banner area smoothly)</option>
              <option value="contain">🔳 Contain (Shows entire image without cropping)</option>
            </select>
            <span className="text-[10px] text-slate-500 block leading-tight">
              'Contain' preserves 100% text/logos on edges with soft backdrop.
            </span>
          </div>

        </div>

        {/* Navigation Arrows & Indicators Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ad.showArrows !== false}
              onChange={(e) => setAd(prev => ({ ...prev, showArrows: e.target.checked }))}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span>Show Navigation Arrows (&lt; / &gt;)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ad.showDots !== false}
              onChange={(e) => setAd(prev => ({ ...prev, showDots: e.target.checked }))}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span>Show Bottom Indicator Dots (Pills)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer ml-auto text-slate-500">
            <input
              type="checkbox"
              checked={ad.displayFormats?.topRibbon ?? true}
              onChange={(e) => setAd(prev => ({ ...prev, displayFormats: { ...prev.displayFormats, topRibbon: e.target.checked } }))}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span>Top Floating Announcement Ribbon</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-500">
            <input
              type="checkbox"
              checked={ad.displayFormats?.popupModal ?? true}
              onChange={(e) => setAd(prev => ({ ...prev, displayFormats: { ...prev.displayFormats, popupModal: e.target.checked } }))}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span>Entry Popup Ad Modal</span>
          </label>
        </div>

      </div>

      {/* 3. MULTI-SLIDE CAROUSEL MANAGER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Slides Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 shrink-0">
              Slides ({ad.slides.length}):
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
                {/* Thumbnail Preview */}
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt="" className="w-5 h-4 object-cover rounded shadow-xs shrink-0" />
                ) : (
                  <ImageIcon size={14} className="opacity-60" />
                )}
                <span>Slide {idx + 1}</span>
                {s.title && <span className="max-w-[100px] truncate opacity-75 text-[10px]">({s.title})</span>}
              </button>
            ))}

            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3.5 py-2 rounded-xl border border-dashed border-indigo-400 text-indigo-600 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Add Slide</span>
            </button>
          </div>

          {/* Slide Actions (Move / Duplicate / Delete) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => handleMoveSlide(activeSlideIndex, 'left')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move slide left (earlier in order)"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === ad.slides.length - 1}
              onClick={() => handleMoveSlide(activeSlideIndex, 'right')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Move slide right (later in order)"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => handleDuplicateSlide(activeSlideIndex)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Duplicate current slide"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>
            {ad.slides.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteSlide(activeSlideIndex)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Delete current slide"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. CURRENT ACTIVE SLIDE EDITOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form: Graphic Upload & Content Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Banner Mode Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Layout size={14} className="text-indigo-600" />
                <span>Banner Slide Mode</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateCurrentSlide({ layoutType: 'pureImage' })}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                    currentSlide.layoutType === 'pureImage'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🖼️</span>
                    <span className="text-xs font-black text-slate-900">Pure Image Banner</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Clean poster image without text overlay. Perfect for Photoshop/Canva banners.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => updateCurrentSlide({ layoutType: 'fullBanner' })}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                    currentSlide.layoutType === 'fullBanner'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎴</span>
                    <span className="text-xs font-black text-slate-900">Image + Text Overlay</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Banner graphic in background with title, badge, countdown & CTA button.
                  </p>
                </button>
              </div>
            </div>

            {/* Banner Image Uploader */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={15} className="text-indigo-600" />
                  <span>Banner Image Graphic</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  Recommended: 1920x600, 1600x500, or 1200x400
                </span>
              </div>

              {currentSlide.imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[21/9] sm:aspect-[24/8] group shadow-inner">
                  <img
                    src={currentSlide.imageUrl}
                    alt="Slide Graphic"
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
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white transition-all">
                  <Upload size={26} className="text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {uploadingImage ? 'Uploading Image...' : 'Click to Upload Banner Image (JPG, PNG, WebP)'}
                  </span>
                  <span className="text-[11px] text-slate-400 text-center max-w-sm">
                    Design your promotional poster in Canva or Photoshop and upload here. It will display in full width on the homepage.
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Destination Link (CTA Link) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LinkIcon size={14} className="text-indigo-600" />
                <span>Destination Click Link (Target URL)</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentSlide.ctaLink || ''}
                  onChange={(e) => updateCurrentSlide({ ctaLink: e.target.value })}
                  placeholder="e.g. /test-series, /courses, /passes or https://..."
                  className="flex-1 text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500"
                />
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

              <div className="flex items-center justify-between pt-1 text-xs font-semibold text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSlide.openInNewTab ?? false}
                    onChange={(e) => updateCurrentSlide({ openInNewTab: e.target.checked })}
                    className="rounded accent-indigo-600"
                  />
                  <span>Open link in new browser tab</span>
                </label>

                <div>
                  <span className="text-slate-400 mr-2 text-[11px]">Button Text:</span>
                  <input
                    type="text"
                    value={currentSlide.ctaText || ''}
                    onChange={(e) => updateCurrentSlide({ ctaText: e.target.value })}
                    placeholder="e.g. Explore Now"
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 w-32"
                  />
                </div>
              </div>
            </div>

            {/* Optional Overlay Text Customization (If fullBanner mode) */}
            {currentSlide.layoutType === 'fullBanner' && (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-4">
                <span className="text-xs font-black text-indigo-900 block flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  Text Overlay Content
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={currentSlide.badgeText || ''}
                      onChange={(e) => updateCurrentSlide({ badgeText: e.target.value })}
                      placeholder="e.g. 50% OFF, NEW LAUNCH"
                      className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Badge Icon Category</label>
                    <select
                      value={currentSlide.badgeType || 'launch'}
                      onChange={(e) => updateCurrentSlide({ badgeType: e.target.value as any })}
                      className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="launch">🚀 Launch (Rocket)</option>
                      <option value="offer">🔥 Offer / Discount (Flame)</option>
                      <option value="urgent">⚡ Urgent / Flash Sale (Zap)</option>
                      <option value="exam">🏆 Exam / Results (Award)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Headline Title</label>
                  <input
                    type="text"
                    value={currentSlide.title || ''}
                    onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                    placeholder="e.g. SSC CGL & Railway NTPC Mega Mock Series"
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Subtitle Description</label>
                  <textarea
                    rows={2}
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                    placeholder="Short highlight for students..."
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentSlide.countdownEnabled ?? false}
                      onChange={(e) => updateCurrentSlide({ countdownEnabled: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Show Countdown Timer</span>
                  </label>

                  {currentSlide.countdownEnabled && (
                    <input
                      type="datetime-local"
                      value={currentSlide.countdownEndDate ? currentSlide.countdownEndDate.substring(0, 16) : ''}
                      onChange={(e) => updateCurrentSlide({ countdownEndDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                    />
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Right Column: Live Interactive Slider Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-indigo-600" />
                <span>Live Slider Preview</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Slide {activeSlideIndex + 1} of {ad.slides.length}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3 bg-slate-100 shadow-sm space-y-3">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>Display: {ad.bannerPosition === 'top' ? '📌 Top of Homepage' : '📍 Below Hero'}</span>
                <span>Width: {ad.bannerWidth === 'full' ? '100% Full Width' : 'Boxed Container'}</span>
              </div>

              {/* Card Preview Frame */}
              <div className={`relative rounded-xl overflow-hidden bg-slate-950 aspect-[21/9] sm:aspect-[24/8] border border-slate-300 shadow-md flex items-center justify-center`}>
                {currentSlide.imageUrl ? (
                  <>
                    <img
                      src={currentSlide.imageUrl}
                      alt="Banner Preview"
                      className={`w-full h-full ${
                        (currentSlide.imageFit || ad.bannerFit) === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />

                    {currentSlide.layoutType === 'fullBanner' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end text-left">
                        {currentSlide.badgeText && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 w-max mb-1">
                            {currentSlide.badgeText}
                          </span>
                        )}
                        {currentSlide.title && (
                          <h4 className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow truncate">
                            {currentSlide.title}
                          </h4>
                        )}
                        {currentSlide.subtitle && (
                          <p className="text-[10px] text-slate-200 line-clamp-1 opacity-90">
                            {currentSlide.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <ImageIcon size={32} className="mx-auto opacity-40" />
                    <p className="text-xs font-semibold">No Image Uploaded Yet</p>
                    <p className="text-[10px] text-slate-500">Upload a banner image from the left panel to preview.</p>
                  </div>
                )}

                {/* Simulated Arrows */}
                <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center">
                    <ChevronLeft size={14} />
                  </div>
                </div>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center">
                    <ChevronRight size={14} />
                  </div>
                </div>

                {/* Simulated Bottom Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 pointer-events-none">
                  {ad.slides.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full ${
                        activeSlideIndex === i ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Slider Summary Box */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Target Link:</span>
                  <span className="font-mono text-indigo-600 font-bold truncate max-w-[200px]">
                    {currentSlide.ctaLink || '/test-series'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Slide Mode:</span>
                  <span className="font-bold text-slate-800">
                    {currentSlide.layoutType === 'pureImage' ? '🖼️ Pure Graphic Banner' : '🎴 Banner + Text'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Open in:</span>
                  <span className="font-bold text-slate-800">
                    {currentSlide.openInNewTab ? 'New Tab (_blank)' : 'Same Tab'}
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Tips Box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs space-y-1.5">
              <span className="font-black flex items-center gap-1">
                💡 High-Converting Banner Tips
              </span>
              <ul className="list-disc list-inside text-[11px] text-amber-900/90 space-y-1">
                <li>Create 1920x600 banner graphics in Canva for sharp high-resolution displays.</li>
                <li>Set "Banner Width" to <strong>Full Width</strong> for an edge-to-edge look like top coaching portals.</li>
                <li>Add multiple slides (e.g. 2 to 4 slides) to showcase Test Series, Courses, and Special Passes in rotation.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdvertisementCustomizer;

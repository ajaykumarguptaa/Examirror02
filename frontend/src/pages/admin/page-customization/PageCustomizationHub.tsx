import React, { useState } from 'react';
import { 
  Globe, 
  Home, 
  BookOpen, 
  Phone, 
  Sparkles, 
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  Layers,
  Image,
  Video
} from 'lucide-react';
import HomePageCustomizer from './HomePageCustomizer';
import AboutPageCustomizer from './AboutPageCustomizer';
import ContactPageCustomizer from './ContactPageCustomizer';
import GlobalSiteCustomizer from './GlobalSiteCustomizer';
import GalleryCustomizer from './GalleryCustomizer';
import TrainingVideosCustomizer from './TrainingVideosCustomizer';

const PageCustomizationHub = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'contact' | 'gallery' | 'global' | 'training'>('home');

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home Page',
      description: 'Hero banner, stats counters, key features, CTA',
      icon: Home
    },
    {
      id: 'about' as const,
      label: 'About & Leadership',
      description: 'Leadership team, vision, mission & director statement',
      icon: BookOpen
    },
    {
      id: 'contact' as const,
      label: 'Contact & Address',
      description: 'Helplines, emails, office address, map embed',
      icon: Phone
    },
    {
      id: 'gallery' as const,
      label: 'Photo Gallery',
      description: 'Campus moments, convocation & lab photos',
      icon: Image
    },
    {
      id: 'global' as const,
      label: 'Global Branding',
      description: 'Site name, top ticker, header & footer copyright',
      icon: Globe
    },
    {
      id: 'training' as const,
      label: 'Training Videos',
      description: 'YouTube tutorial links, module guides & live player',
      icon: Video
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <SlidersHorizontal size={13} />
              Website Customization Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Live Public Sync
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Comprehensive Page & Content Customizer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify text, headlines, helplines, vision, mission, and brand information across all public portal pages.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <span>Preview Live Website</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive 
                  ? 'bg-[#1e1b4b] text-white border-[#1e1b4b] shadow-md -translate-y-0.5' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-white/10 text-yellow-400' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  <Icon size={18} />
                </div>
                {isActive && <span className="text-[10px] font-bold bg-yellow-400 text-[#1e1b4b] px-2 py-0.5 rounded-full">Active Editor</span>}
              </div>

              <div className="mt-3">
                <div className={`font-black text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {tab.label}
                </div>
                <div className={`text-[11px] mt-0.5 line-clamp-1 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Page Editor Component */}
      <div className="mt-6">
        {activeTab === 'home' && <HomePageCustomizer />}
        {activeTab === 'about' && <AboutPageCustomizer />}
        {activeTab === 'contact' && <ContactPageCustomizer />}
        {activeTab === 'gallery' && <GalleryCustomizer />}
        {activeTab === 'global' && <GlobalSiteCustomizer />}
        {activeTab === 'training' && <TrainingVideosCustomizer />}
      </div>

    </div>
  );
};

export default PageCustomizationHub;

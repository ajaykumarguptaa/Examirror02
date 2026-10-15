import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Globe, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const DEFAULT_GLOBAL_SETTINGS = {
  brand: {
    siteName: 'Examirror',
    siteShortName: 'EXAMIRROR',
    tagline: 'Empowering India Through Skill Development & Vocational Training',
    announcement: '📢 ADMISSIONS OPEN 2026-27 | FREE CENTER FRANCHISE REGISTRATION | ISO 9001:2015 CERTIFIED'
  },
  header: {
    helplinePhone: '+91 98765 43210',
    supportEmail: 'saurabhcsjnu@gmail.com',
    showAnnouncement: true
  },
  footer: {
    copyrightText: '© 2026 Examirror. All Rights Reserved.',
    disclaimer: 'Examirror is an autonomous educational organization registered under the Indian Trust Act & MSME Government of India.'
  }
};

const GlobalSiteCustomizer = () => {
  const [data, setData] = useState(DEFAULT_GLOBAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/v1/settings/global');
      if (res.data?.success && res.data?.data) {
        setData({
          ...DEFAULT_GLOBAL_SETTINGS,
          ...res.data.data,
          brand: { ...DEFAULT_GLOBAL_SETTINGS.brand, ...(res.data.data.brand || {}) },
          header: { ...DEFAULT_GLOBAL_SETTINGS.header, ...(res.data.data.header || {}) },
          footer: { ...DEFAULT_GLOBAL_SETTINGS.footer, ...(res.data.data.footer || {}) }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.put('http://localhost:3000/api/v1/settings/global', { data });
      if (res.data?.success) {
        toast.success('Global branding and header/footer settings saved!');
      } else {
        toast.error('Failed to update settings.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Server error while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-800">


      {/* 1. Brand Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Brand Identity & Organization Name</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Organization Name</label>
            <input
              type="text"
              value={data.brand.siteName}
              onChange={(e) => setData({ ...data, brand: { ...data.brand, siteName: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Short Code / Acronym</label>
            <input
              type="text"
              value={data.brand.siteShortName}
              onChange={(e) => setData({ ...data, brand: { ...data.brand, siteShortName: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-mono font-bold text-indigo-700"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Institutional Tagline</label>
          <input
            type="text"
            value={data.brand.tagline}
            onChange={(e) => setData({ ...data, brand: { ...data.brand, tagline: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Global Top Announcement Ticker</label>
          <input
            type="text"
            value={data.brand.announcement}
            onChange={(e) => setData({ ...data, brand: { ...data.brand, announcement: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 bg-amber-50/50 text-amber-900"
          />
        </div>
      </div>

      {/* 2. Header & Footer Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Header & Footer Global Settings</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Header Quick Helpline</label>
            <input
              type="text"
              value={data.header.helplinePhone}
              onChange={(e) => setData({ ...data, header: { ...data.header, helplinePhone: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Header Quick Email</label>
            <input
              type="email"
              value={data.header.supportEmail}
              onChange={(e) => setData({ ...data, header: { ...data.header, supportEmail: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Footer Copyright Text</label>
          <input
            type="text"
            value={data.footer.copyrightText}
            onChange={(e) => setData({ ...data, footer: { ...data.footer, copyrightText: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Footer Official Registration Disclaimer</label>
          <textarea
            rows={2}
            value={data.footer.disclaimer}
            onChange={(e) => setData({ ...data, footer: { ...data.footer, disclaimer: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
          />
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end gap-3 sticky bottom-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-lg z-20">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#1e1b4b] hover:bg-[#2e2b5e] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          <span>{saving ? 'Saving Changes...' : 'Save Global Settings'}</span>
        </button>
      </div>

    </form>
  );
};

export default GlobalSiteCustomizer;

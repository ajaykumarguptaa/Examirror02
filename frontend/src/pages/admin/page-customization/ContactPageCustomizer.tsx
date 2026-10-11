import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Globe, Clock, Share2 } from 'lucide-react';
import axios from 'axios';

export const DEFAULT_CONTACT_SETTINGS = {
  header: {
    title: 'Contact & Support Desk',
    subtitle: 'Get in touch with our institutional support team or locate our administrative headquarters.'
  },
  contactInfo: {
    address: 'Examirror Academy, 3rd Floor, IT Skill Complex, Bailey Road, Patna, Bihar - 800001',
    phone1: '+91 98765 43210',
    phone2: '+91 87654 32109',
    whatsapp: '+91 98765 43210',
    emailGeneral: 'saurabhcsjnu@gmail.com',
    emailFranchise: 'franchise@examirror.edu.in',
    workingHours: 'Monday to Saturday: 09:30 AM – 06:30 PM (Sunday Closed)'
  },
  map: {
    embedUrl: 'https://maps.google.com/maps?q=Patna%20Bihar&t=&z=13&ie=UTF8&iwloc=&output=embed'
  },
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com'
  }
};

const ContactPageCustomizer = () => {
  const [data, setData] = useState(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/v1/settings/contact');
      if (res.data?.success && res.data?.data) {
        setData({
          ...DEFAULT_CONTACT_SETTINGS,
          ...res.data.data,
          header: { ...DEFAULT_CONTACT_SETTINGS.header, ...(res.data.data.header || {}) },
          contactInfo: { ...DEFAULT_CONTACT_SETTINGS.contactInfo, ...(res.data.data.contactInfo || {}) },
          map: { ...DEFAULT_CONTACT_SETTINGS.map, ...(res.data.data.map || {}) },
          social: { ...DEFAULT_CONTACT_SETTINGS.social, ...(res.data.data.social || {}) }
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
      setToast(null);
      const res = await axios.put('http://localhost:3000/api/v1/settings/contact', { data });
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Contact page settings customized and saved successfully!' });
      } else {
        setToast({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Server error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-800">

      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Contact Page Header</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Page Title</label>
            <input
              type="text"
              value={data.header.title}
              onChange={(e) => setData({ ...data, header: { ...data.header, title: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={data.header.subtitle}
              onChange={(e) => setData({ ...data, header: { ...data.header, subtitle: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 2. Official Contact & Address Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Official Contact & Address Information</h3>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <MapPin size={13} className="text-rose-500" />
            <span>Administrative Head Office Address</span>
          </label>
          <textarea
            rows={2}
            value={data.contactInfo.address}
            onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, address: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Primary Helpline (Phone 1)</label>
            <input
              type="text"
              value={data.contactInfo.phone1}
              onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, phone1: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Secondary Support (Phone 2)</label>
            <input
              type="text"
              value={data.contactInfo.phone2}
              onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, phone2: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">WhatsApp Support Number</label>
            <input
              type="text"
              value={data.contactInfo.whatsapp}
              onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, whatsapp: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-emerald-800 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Mail size={13} className="text-indigo-600" />
              <span>General Support Email</span>
            </label>
            <input
              type="email"
              value={data.contactInfo.emailGeneral}
              onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, emailGeneral: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Mail size={13} className="text-amber-600" />
              <span>Franchise & Center Support Email</span>
            </label>
            <input
              type="email"
              value={data.contactInfo.emailFranchise}
              onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, emailFranchise: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Clock size={13} className="text-slate-500" />
            <span>Working Hours & Days</span>
          </label>
          <input
            type="text"
            value={data.contactInfo.workingHours}
            onChange={(e) => setData({ ...data, contactInfo: { ...data.contactInfo, workingHours: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* 3. Google Maps Embed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Google Map Embed Link</h3>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Map Embed URL (iframe src)</label>
          <input
            type="text"
            value={data.map.embedUrl}
            onChange={(e) => setData({ ...data, map: { ...data.map, embedUrl: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs font-mono"
          />
        </div>
      </div>

      {/* 4. Social Media Links */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Official Social Media Profiles</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Facebook Page URL</label>
            <input
              type="text"
              value={data.social.facebook}
              onChange={(e) => setData({ ...data, social: { ...data.social, facebook: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Instagram Handle URL</label>
            <input
              type="text"
              value={data.social.instagram}
              onChange={(e) => setData({ ...data, social: { ...data.social, instagram: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">YouTube Channel URL</label>
            <input
              type="text"
              value={data.social.youtube}
              onChange={(e) => setData({ ...data, social: { ...data.social, youtube: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">LinkedIn Page URL</label>
            <input
              type="text"
              value={data.social.linkedin}
              onChange={(e) => setData({ ...data, social: { ...data.social, linkedin: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
          </div>
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
          <span>{saving ? 'Saving Changes...' : 'Save Contact Settings'}</span>
        </button>
      </div>

    </form>
  );
};

export default ContactPageCustomizer;

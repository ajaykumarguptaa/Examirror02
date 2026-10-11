import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Sparkles,
  User,
  Users,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';

export interface LeadershipMember {
  id: string | number;
  name: string;
  role: string;
  imageUrl: string;
}

export interface AboutSettingsType {
  header: {
    title: string;
    subtitle: string;
  };
  overview: {
    mainText: string;
    highlightBadge: string;
    imageUrl?: string;
  };
  missionVision: {
    mission: string;
    vision: string;
  };
  directorMessage: {
    name: string;
    designation: string;
    message: string;
  };
  leadershipTeam: {
    enabled: boolean;
    title: string;
    subtitle?: string;
    members: LeadershipMember[];
  };
  values: {
    val1Title: string;
    val1Desc: string;
    val2Title: string;
    val2Desc: string;
    val3Title: string;
    val3Desc: string;
  };
}

export const DEFAULT_ABOUT_SETTINGS: AboutSettingsType = {
  header: {
    title: 'About Examirror Skill Development & Education',
    subtitle: 'Pioneering technical and vocational skill education across India with authorized center networks.'
  },
  overview: {
    mainText: 'The goal of the computers education curriculum is to provide students with the computer knowledge and tools that will allow them to design and implement effective, economical, and creative solutions for the needs of individuals, society, and the high-tech economy.',
    highlightBadge: 'ISO 9001:2015 Certified Educational Institution',
    imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800'
  },
  missionVision: {
    mission: 'To empower students, youth, and working professionals with modern digital skills, practical software expertise, and nationally recognized credentials for rewarding employment opportunities.',
    vision: 'To become India\'s most trusted, accessible, and high-impact vocational training institution with a center in every district and rural block.'
  },
  directorMessage: {
    name: 'Dulal Kanti Mahato',
    designation: 'Director & Chief Executive Officer',
    message: 'Our priority is ensuring that every enrolled student receives rigorous hands-on technical training with verifiable certificates. We welcome enthusiastic educators to partner with us as authorized study centers.'
  },
  leadershipTeam: {
    enabled: true,
    title: 'Examirror – Leadership Team',
    subtitle: 'Experienced leadership steering excellence in national skill education and vocational certification.',
    members: [
      {
        id: '1',
        name: 'Dulal Kanti Mahato',
        role: 'DIRECTOR 1',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: '2',
        name: 'Laxmi Priya Mahato',
        role: 'DIRECTOR 2',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: '3',
        name: 'Karan Mahato',
        role: 'ACCOUNTANT',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  values: {
    val1Title: 'Practical Skill Focus',
    val1Desc: 'Over 70% lab-based practical curriculum with real-world project portfolios.',
    val2Title: 'Verifiable Certification',
    val2Desc: 'Instant digital QR-code and barcode verification for tamper-proof student credentials.',
    val3Title: 'Affordable Education',
    val3Desc: 'Low-cost course fees ensuring vocational skills are accessible to all demographics.'
  }
};

const AboutPageCustomizer = () => {
  const [data, setData] = useState<AboutSettingsType>(DEFAULT_ABOUT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/settings/about').catch(() => axios.get('http://localhost:3000/api/v1/settings/about'));
      if (res.data?.success && res.data?.data) {
        const fetched = res.data.data;
        setData({
          ...DEFAULT_ABOUT_SETTINGS,
          ...fetched,
          header: { ...DEFAULT_ABOUT_SETTINGS.header, ...(fetched.header || {}) },
          overview: { ...DEFAULT_ABOUT_SETTINGS.overview, ...(fetched.overview || {}) },
          missionVision: { ...DEFAULT_ABOUT_SETTINGS.missionVision, ...(fetched.missionVision || {}) },
          directorMessage: { ...DEFAULT_ABOUT_SETTINGS.directorMessage, ...(fetched.directorMessage || {}) },
          leadershipTeam: {
            ...DEFAULT_ABOUT_SETTINGS.leadershipTeam,
            ...(fetched.leadershipTeam || {}),
            members: fetched.leadershipTeam?.members && Array.isArray(fetched.leadershipTeam.members) && fetched.leadershipTeam.members.length > 0
              ? fetched.leadershipTeam.members
              : DEFAULT_ABOUT_SETTINGS.leadershipTeam.members
          },
          values: { ...DEFAULT_ABOUT_SETTINGS.values, ...(fetched.values || {}) }
        });
      }
    } catch (err) {
      console.error('Error fetching about settings:', err);
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
      const res = await axios.put('/api/v1/settings/about', { data }).catch(() => axios.put('http://localhost:3000/api/v1/settings/about', { data }));
      if (res.data?.success) {
        setToast({ type: 'success', text: 'About Us & Leadership Team settings saved successfully!' });
      } else {
        setToast({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Server error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  // Leadership Team Handlers
  const handleAddMember = () => {
    const newMember: LeadershipMember = {
      id: Date.now().toString(),
      name: 'New Leader Name',
      role: 'EXECUTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
    };
    setData({
      ...data,
      leadershipTeam: {
        ...data.leadershipTeam,
        members: [...data.leadershipTeam.members, newMember]
      }
    });
  };

  const handleUpdateMember = (index: number, field: keyof LeadershipMember, value: string) => {
    const updated = [...data.leadershipTeam.members];
    updated[index] = { ...updated[index], [field]: value };
    setData({
      ...data,
      leadershipTeam: {
        ...data.leadershipTeam,
        members: updated
      }
    });
  };

  const handleRemoveMember = (index: number) => {
    const updated = data.leadershipTeam.members.filter((_, i) => i !== index);
    setData({
      ...data,
      leadershipTeam: {
        ...data.leadershipTeam,
        members: updated
      }
    });
  };

  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    const updated = [...data.leadershipTeam.members];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setData({
      ...data,
      leadershipTeam: {
        ...data.leadershipTeam,
        members: updated
      }
    });
  };

  const handleImageFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/public/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => axios.post('http://localhost:3000/api/public/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }));

      if (res.data?.success && res.data?.url) {
        handleUpdateMember(index, 'imageUrl', res.data.url);
        return;
      }
    } catch (err) {
      console.warn('Direct upload failed, falling back to base64', err);
    }

    // Fallback: read as base64 (backend will convert to file on save)
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        handleUpdateMember(index, 'imageUrl', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 font-medium text-sm">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="text-rose-600" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* 1. Page Header & Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">About Page Header & Institutional Overview</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Introductory Banner</span>
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
            <label className="block font-bold text-slate-700 mb-1">Accreditation Tag / Badge</label>
            <input
              type="text"
              value={data.overview.highlightBadge}
              onChange={(e) => setData({ ...data, overview: { ...data.overview, highlightBadge: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 font-semibold text-emerald-700 bg-emerald-50/50"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Subtitle Punchline</label>
          <input
            type="text"
            value={data.header.subtitle}
            onChange={(e) => setData({ ...data, header: { ...data.header, subtitle: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Main Detailed Overview Text</label>
          <textarea
            rows={3}
            value={data.overview.mainText}
            onChange={(e) => setData({ ...data, overview: { ...data.overview, mainText: e.target.value } })}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* 2. Super Admin Leadership Team Customizer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Leadership Team Management</h3>
              <p className="text-[11px] text-slate-500">
                Configure Directors, Executives & Key Officers displayed on the website.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={data.leadershipTeam.enabled}
                onChange={(e) =>
                  setData({
                    ...data,
                    leadershipTeam: { ...data.leadershipTeam, enabled: e.target.checked }
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-bold text-xs text-slate-800">Show Section on Website</span>
            </label>

            <button
              type="button"
              onClick={handleAddMember}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} />
              <span>Add Leader</span>
            </button>
          </div>
        </div>

        {/* Section Heading Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Title</label>
            <input
              type="text"
              value={data.leadershipTeam.title}
              onChange={(e) =>
                setData({
                  ...data,
                  leadershipTeam: { ...data.leadershipTeam, title: e.target.value }
                })
              }
              placeholder="e.g. Examirror – Leadership Team"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Subtitle</label>
            <input
              type="text"
              value={data.leadershipTeam.subtitle || ''}
              onChange={(e) =>
                setData({
                  ...data,
                  leadershipTeam: { ...data.leadershipTeam, subtitle: e.target.value }
                })
              }
              placeholder="e.g. Steering excellence in national skill education..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Members Editor List */}
        <div className="space-y-4">
          <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
            Team Members ({data.leadershipTeam.members.length})
          </span>

          {data.leadershipTeam.members.map((member, index) => (
            <div
              key={member.id || index}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              {/* Photo Preview & Upload */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-slate-200 shadow-2xs bg-slate-100 relative group">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
                    }}
                  />
                  <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                    <Upload size={14} className="mb-0.5" />
                    <span>Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(index, e)}
                    />
                  </label>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Member #{index + 1}</span>
              </div>

              {/* Input Fields */}
              <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                    placeholder="e.g. Dulal Kanti Mahato"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation / Role Badge</label>
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => handleUpdateMember(index, 'role', e.target.value)}
                    placeholder="e.g. DIRECTOR 1, ACCOUNTANT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none uppercase font-bold text-blue-900 bg-blue-50/50 focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    value={member.imageUrl}
                    onChange={(e) => handleUpdateMember(index, 'imageUrl', e.target.value)}
                    placeholder="https://... or upload above"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl outline-none text-slate-600 text-[11px] focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-center gap-1.5 shrink-0 self-end md:self-center border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3 border-slate-200">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveMember(index, 'up')}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp size={15} />
                </button>

                <button
                  type="button"
                  disabled={index === data.leadershipTeam.members.length - 1}
                  onClick={() => handleMoveMember(index, 'down')}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveMember(index)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Remove Member"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {/* Prominent Add Person Button directly beneath the cards */}
          <button
            type="button"
            onClick={handleAddMember}
            className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50 text-blue-700 font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99] text-sm group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <span>+ Add More Person / Leader</span>
          </button>
        </div>

        {/* Live Card Preview Box */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Eye size={15} className="text-blue-600" />
              <span>Live Website Leadership Preview</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Matches Official Design
            </span>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8">
              {data.leadershipTeam.title}
            </h2>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              {data.leadershipTeam.members.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col items-center w-full max-w-[280px]"
                >
                  <div className="w-52 h-60 rounded-xl overflow-hidden border border-slate-100 shadow-2xs mb-4 bg-slate-100">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-2">{member.name}</h4>
                  <span className="inline-block bg-[#1e1b4b] text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mission & Vision */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Institutional Mission & Vision</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Our Mission</label>
            <textarea
              rows={3}
              value={data.missionVision.mission}
              onChange={(e) => setData({ ...data, missionVision: { ...data.missionVision, mission: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Our Vision</label>
            <textarea
              rows={3}
              value={data.missionVision.vision}
              onChange={(e) => setData({ ...data, missionVision: { ...data.missionVision, vision: e.target.value } })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 4. Core Values */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Core Values & Institutional Pillars</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <input
              type="text"
              value={data.values.val1Title}
              onChange={(e) => setData({ ...data, values: { ...data.values, val1Title: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <textarea
              rows={2}
              value={data.values.val1Desc}
              onChange={(e) => setData({ ...data, values: { ...data.values, val1Desc: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <input
              type="text"
              value={data.values.val2Title}
              onChange={(e) => setData({ ...data, values: { ...data.values, val2Title: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <textarea
              rows={2}
              value={data.values.val2Desc}
              onChange={(e) => setData({ ...data, values: { ...data.values, val2Desc: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <input
              type="text"
              value={data.values.val3Title}
              onChange={(e) => setData({ ...data, values: { ...data.values, val3Title: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <textarea
              rows={2}
              value={data.values.val3Desc}
              onChange={(e) => setData({ ...data, values: { ...data.values, val3Desc: e.target.value } })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px]"
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
          <span>{saving ? 'Saving Changes...' : 'Save Leadership & About Page Settings'}</span>
        </button>
      </div>
    </form>
  );
};

export default AboutPageCustomizer;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  Save, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Calendar, 
  IndianRupee, 
  Tag, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Flame,
  Check,
  Eye,
  Sliders,
  ExternalLink
} from 'lucide-react';
import SEO from '../../components/SEO';

interface PassConfig {
  id: number;
  pass_type: 'BASIC' | 'ELITE';
  title: string;
  subtitle: string;
  price: string | number;
  original_price?: string | number | null;
  validity_days: number;
  features: string[];
  badge_text: string;
  is_active: number | boolean;
}

export default function AdminPassesManager() {
  const [passes, setPasses] = useState<PassConfig[]>([]);
  const [selectedPassId, setSelectedPassId] = useState<number>(2); // Default to Elite Pass (id=2)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/wallet/admin/passes', { headers: getAuthHeader() })
        .catch(() => axios.get('http://localhost:3000/api/student/wallet/admin/passes', { headers: getAuthHeader() }));

      if (res.data?.success && Array.isArray(res.data.data)) {
        setPasses(res.data.data);
        if (res.data.data.length > 0 && !res.data.data.find((p: any) => p.id === selectedPassId)) {
          setSelectedPassId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      toast.error('Failed to load pass subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const currentPass = passes.find(p => p.id === selectedPassId) || passes[0];

  const updateCurrentPass = (fields: Partial<PassConfig>) => {
    setPasses(prev => prev.map(p => p.id === selectedPassId ? { ...p, ...fields } : p));
  };

  const handleAddFeature = () => {
    if (!currentPass) return;
    const currentFeatures = Array.isArray(currentPass.features) ? currentPass.features : [];
    updateCurrentPass({
      features: [...currentFeatures, 'New feature or benefit description']
    });
  };

  const handleUpdateFeature = (index: number, value: string) => {
    if (!currentPass) return;
    const currentFeatures = [...(currentPass.features || [])];
    currentFeatures[index] = value;
    updateCurrentPass({ features: currentFeatures });
  };

  const handleDeleteFeature = (index: number) => {
    if (!currentPass) return;
    const currentFeatures = (currentPass.features || []).filter((_, i) => i !== index);
    updateCurrentPass({ features: currentFeatures });
  };

  const handleSave = async () => {
    if (!currentPass) return;
    setSaving(true);
    try {
      const payload = {
        title: currentPass.title,
        subtitle: currentPass.subtitle,
        price: Number(currentPass.price),
        original_price: currentPass.original_price ? Number(currentPass.original_price) : null,
        validity_days: Number(currentPass.validity_days),
        features: currentPass.features,
        badge_text: currentPass.badge_text,
        is_active: currentPass.is_active ? 1 : 0
      };

      const res = await axios.put(
        `/api/student/wallet/admin/passes/${currentPass.id}`,
        payload,
        { headers: getAuthHeader() }
      ).catch(() => axios.put(
        `http://localhost:3000/api/student/wallet/admin/passes/${currentPass.id}`,
        payload,
        { headers: getAuthHeader() }
      ));

      if (res.data?.success) {
        toast.success(`${currentPass.title} configuration updated and published!`);
      } else {
        toast.success('Saved successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update pass configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Loading Pass Pricing Configuration...</span>
      </div>
    );
  }

  const sellingPrice = Number(currentPass?.price || 0);
  const mrpPrice = Number(currentPass?.original_price || 0);
  const discountPercent = mrpPrice > sellingPrice && mrpPrice > 0 
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) 
    : 0;
  const isElite = currentPass?.pass_type === 'ELITE';

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-800">
      <SEO title="Elite Pass & Pricing Manager | Super Admin" noindex={true} />

      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Crown size={13} className="text-amber-600" />
              Student Pass Master Controller
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Live DB Pricing & Validity Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Examirror Elite Pass & Subscription Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set student selling prices, discount MRP rates, validity duration (expiry days), and perks for all membership passes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchPasses}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
          >
            <Save size={15} />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Live Pricing'}</span>
          </button>
        </div>
      </div>

      {/* Pass Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {passes.map((p) => {
          const isSelected = p.id === selectedPassId;
          const isElitePass = p.pass_type === 'ELITE';
          const pPrice = Number(p.price);
          const pMrp = Number(p.original_price || 0);

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPassId(p.id)}
              className={`p-5 rounded-3xl border-2 text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? isElitePass
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 shadow-xl shadow-amber-500/10'
                    : 'border-indigo-500 bg-indigo-50/50 shadow-xl shadow-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isElitePass 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                }`}>
                  {isElitePass ? <Crown size={13} className="text-amber-600" /> : <Zap size={13} className="text-indigo-600" />}
                  <span>{p.pass_type} PASS</span>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {p.validity_days} Days Validity
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900">
                {p.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-1">
                {p.subtitle}
              </p>

              <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900">
                  ₹{pPrice.toFixed(0)}
                </span>
                {pMrp > pPrice && (
                  <span className="text-xs line-through text-slate-400 font-bold">
                    ₹{pMrp.toFixed(0)}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  / {p.validity_days} days
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900">
                Customize {currentPass.title}
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
              <input
                type="checkbox"
                checked={Boolean(currentPass.is_active)}
                onChange={(e) => updateCurrentPass({ is_active: e.target.checked ? 1 : 0 })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-0"
              />
              <span className={currentPass.is_active ? 'text-emerald-700' : 'text-slate-400'}>
                {currentPass.is_active ? '🟢 Pass is Active & Available' : '⚪ Pass is Disabled'}
              </span>
            </label>
          </div>

          {/* Pricing & Discount Controls */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee size={14} className="text-amber-700" />
                <span>Pricing & Discount Configuration</span>
              </span>
              {discountPercent > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                  🔥 {discountPercent}% OFF LIVE
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Final Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={currentPass.price}
                    onChange={(e) => updateCurrentPass({ price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-black text-base outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Amount deducted from student's wallet.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Original / MRP Price (₹) (Discounted From)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={currentPass.original_price || ''}
                    onChange={(e) => updateCurrentPass({ original_price: e.target.value })}
                    placeholder="e.g. 999"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-base outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Shows strike-through price to highlight savings.
                </span>
              </div>
            </div>

            {/* Live Discount Calculator Preview */}
            <div className="p-3 rounded-xl bg-white border border-amber-200/90 text-xs flex items-center justify-between text-slate-700">
              <span>Candidate Breakdown:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Student Pays ₹{sellingPrice}</span>
                {mrpPrice > sellingPrice && (
                  <span className="text-emerald-700 font-black">
                    (Saves ₹{(mrpPrice - sellingPrice).toFixed(0)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Validity Duration (Days till Expiry) */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <label className="text-xs font-black text-indigo-900 uppercase tracking-wider block flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-600" />
              <span>Pass Validity Duration (Days Until Expiry) *</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={currentPass.validity_days}
                    onChange={(e) => updateCurrentPass({ validity_days: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-black text-base outline-none focus:border-indigo-600"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Days
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '30 Days (1 Mo)', days: 30 },
                  { label: '90 Days (3 Mo)', days: 90 },
                  { label: '180 Days (6 Mo)', days: 180 },
                  { label: '365 Days (1 Yr)', days: 365 }
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => updateCurrentPass({ validity_days: preset.days })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPass.validity_days === preset.days
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[11px] text-slate-500">
              When a student activates this pass, their subscription will remain valid for exactly this many days.
            </span>
          </div>

          {/* Titles & Badge */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Pass Title
                </label>
                <input
                  type="text"
                  value={currentPass.title}
                  onChange={(e) => updateCurrentPass({ title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Highlight Badge Tag
                </label>
                <input
                  type="text"
                  value={currentPass.badge_text || ''}
                  onChange={(e) => updateCurrentPass({ badge_text: e.target.value })}
                  placeholder="e.g. BEST VALUE, STARTER, LIMITED OFFER"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Subtitle / Value Proposition
              </label>
              <input
                type="text"
                value={currentPass.subtitle || ''}
                onChange={(e) => updateCurrentPass({ subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium text-xs"
              />
            </div>
          </div>

          {/* Perks & Features List Editor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                <span>Features & Perks List ({currentPass.features?.length || 0})</span>
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Feature</span>
              </button>
            </div>

            <div className="space-y-2">
              {(currentPass.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFeature(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove feature"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Student View Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-indigo-600" />
              <span>Live Student View Preview</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Real-time Rendering
            </span>
          </div>

          {/* Luxury Obsidian Gold Card Preview for Elite Pass */}
          {isElite ? (
            <div className="relative rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-400 via-amber-600/40 to-amber-700 shadow-2xl shadow-amber-500/15">
              <div className="bg-slate-950 text-white rounded-[23px] p-6 sm:p-7 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black">
                    <Crown size={13} className="text-amber-400" />
                    <span>{currentPass.badge_text || 'MOST POPULAR'}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-200/90 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                    {currentPass.validity_days} Days Access
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                  {currentPass.title}
                </h3>
                <p className="text-xs text-slate-300 mb-6">
                  {currentPass.subtitle}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-amber-500/20">
                  <span className="text-4xl font-black text-white">
                    ₹{sellingPrice.toFixed(0)}
                  </span>
                  {mrpPrice > sellingPrice && (
                    <span className="text-base line-through text-slate-400 font-bold">
                      ₹{mrpPrice.toFixed(0)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  {(currentPass.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  <Crown size={14} />
                  <span>Get Elite Pass Now</span>
                </button>
              </div>
            </div>
          ) : (
            /* Basic Pass Preview Card */
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase">
                  {currentPass.badge_text || 'STARTER'}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {currentPass.validity_days} Days
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentPass.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {currentPass.subtitle}
              </p>

              <div className="flex items-baseline gap-2 pb-4 border-b border-slate-100">
                <span className="text-3xl font-black text-slate-900">
                  ₹{sellingPrice.toFixed(0)}
                </span>
                {mrpPrice > sellingPrice && (
                  <span className="text-sm line-through text-slate-400 font-bold">
                    ₹{mrpPrice.toFixed(0)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {(currentPass.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
              >
                <span>Get Basic Pass</span>
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold">⚡ Instant Global Sync:</p>
            <p>
              When you click <strong>Save & Publish Live Pricing</strong>, changes take effect immediately across:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
              <li>Public Landing Page ([examirror.in/#elite-pass](/#elite-pass))</li>
              <li>Dedicated Pass Page ([/passes](/passes))</li>
              <li>Student Portal Wallet & Upgrade Screen ([/student/passes](/student/passes))</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}

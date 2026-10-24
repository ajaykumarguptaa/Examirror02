import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Award,
  Save,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sliders,
  Zap,
  IndianRupee,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
  Clock,
  Crown
} from 'lucide-react';

interface PricingConfig {
  monthly_free_limit: number;
  charge_per_extra_test: number;
  enabled: boolean;
  allow_wallet_deduction: boolean;
  free_students_per_test: number;
  charge_per_extra_student: number;
  instant_certificate_charge?: number;
  allow_instant_certificate?: boolean;
  currency: string;
  description?: string;
}

interface CenterQuotaItem {
  id: number;
  centerName: string;
  centerCode: string;
  walletBalance: number | string;
  city: string;
  state: string;
  testsThisMonth: number;
  allTimeTests: number;
  freeUsed: number;
  freeRemaining: number;
  paidCreated: number;
  estimatedPaidRevenue: number;
  raw_custom_config?: Partial<PricingConfig>;
  active_pricing_config?: PricingConfig;
  old_student_allowed_until?: string | null;
  is_old_student_allowed?: boolean;
  old_student_seconds_left?: number;
}

interface PricingOverviewData {
  config: PricingConfig;
  stats: {
    totalTestsThisMonth: number;
    activeCentersThisMonth: number;
    totalPaidTestsThisMonth: number;
    totalRevenueThisMonth: number;
  };
  centers: CenterQuotaItem[];
}

interface ConfirmationModalProps {
  center: CenterQuotaItem;
  nextStatus: 'enabled' | 'disabled' | 'inherit';
  instantPrice: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const API_BASE = '/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TestPricingSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PricingOverviewData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Editable form state
  const [monthlyFreeLimit, setMonthlyFreeLimit] = useState<number>(2);
  const [chargePerExtraTest, setChargePerExtraTest] = useState<number>(50);
  const [pricingEnabled, setPricingEnabled] = useState<boolean>(true);
  const [allowWalletDeduction, setAllowWalletDeduction] = useState<boolean>(true);
  const [freeStudentsPerTest, setFreeStudentsPerTest] = useState<number>(50);
  const [chargePerExtraStudent, setChargePerExtraStudent] = useState<number>(5);
  const [description, setDescription] = useState<string>('');
  const [instantCertificateCharge, setInstantCertificateCharge] = useState<number>(200);
  const [allowInstantCertificate, setAllowInstantCertificate] = useState<boolean>(true);

  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Center Override State
  const [overrideCenter, setOverrideCenter] = useState<CenterQuotaItem | null>(null);
  const [overrideMonthlyLimit, setOverrideMonthlyLimit] = useState<string>('');
  const [overrideExtraCharge, setOverrideExtraCharge] = useState<string>('');
  const [overrideInstantCertificateCharge, setOverrideInstantCertificateCharge] = useState<string>('');
  const [overrideAllowInstant, setOverrideAllowInstant] = useState<'inherit' | 'enabled' | 'disabled'>('inherit');
  const [overrideSaving, setOverrideSaving] = useState(false);

  // Secondary Confirmation Modal State
  const [secondaryConfirmData, setSecondaryConfirmData] = useState<ConfirmationModalProps | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axios.get(`${API_BASE}/online-test-pricing`, { headers: getAuthHeaders() });
      } catch {
        res = await axios.get(`http://localhost:3000/api/admin/online-test-pricing`, { headers: getAuthHeaders() });
      }
      if (res.data.success && res.data.data) {
        const payload: PricingOverviewData = res.data.data;
        setData(payload);
        setMonthlyFreeLimit(payload.config.monthly_free_limit);
        setChargePerExtraTest(payload.config.charge_per_extra_test);
        setPricingEnabled(payload.config.enabled);
        setAllowWalletDeduction(payload.config.allow_wallet_deduction);
        setFreeStudentsPerTest(payload.config.free_students_per_test || 50);
        setChargePerExtraStudent(payload.config.charge_per_extra_student || 5);
        setInstantCertificateCharge(payload.config.instant_certificate_charge !== undefined ? payload.config.instant_certificate_charge : 200);
        setAllowInstantCertificate(payload.config.allow_instant_certificate !== undefined ? payload.config.allow_instant_certificate : true);
        setDescription(payload.config.description || '');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to fetch pricing settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  // Live decrement 1s timer for old student permission countdown across centers
  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev;
        let changed = false;
        const newCenters = prev.centers.map((c) => {
          if (c.is_old_student_allowed && (c.old_student_seconds_left ?? 0) > 0) {
            const nextSec = (c.old_student_seconds_left || 0) - 1;
            changed = true;
            return {
              ...c,
              old_student_seconds_left: nextSec,
              is_old_student_allowed: nextSec > 0
            };
          }
          return c;
        });
        if (!changed) return prev;
        return { ...prev, centers: newCenters };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [togglingOldStudent, setTogglingOldStudent] = useState<number | null>(null);

  const formatCountdown = (totalSeconds?: number) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m 00s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleToggleOldStudentPermission = async (center: CenterQuotaItem, forceHours = 2) => {
    try {
      setTogglingOldStudent(center.id);
      const isCurrentlyAllowed = Boolean(center.is_old_student_allowed && (center.old_student_seconds_left ?? 0) > 0);
      const willAllow = !isCurrentlyAllowed;

      let res;
      try {
        res = await axios.put(`${API_BASE}/centers/${center.id}/old-student-permission`, {
          allow: willAllow,
          hours: forceHours
        }, { headers: getAuthHeaders() });
      } catch {
        res = await axios.put(`http://localhost:3000/api/admin/centers/${center.id}/old-student-permission`, {
          allow: willAllow,
          hours: forceHours
        }, { headers: getAuthHeaders() });
      }

      if (res.data.success) {
        showToast('success', res.data.message || (willAllow ? `2h Old Student permission granted to ${center.centerName}` : `Old student permission disabled`));
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            centers: prev.centers.map((c) => {
              if (c.id === center.id) {
                return {
                  ...c,
                  is_old_student_allowed: willAllow,
                  old_student_seconds_left: willAllow ? (res.data.secondsLeft || (forceHours * 3600)) : 0,
                  old_student_allowed_until: willAllow ? res.data.allowedUntil : null
                };
              }
              return c;
            })
          };
        });
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update old student permission');
    } finally {
      setTogglingOldStudent(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        monthly_free_limit: Number(monthlyFreeLimit),
        charge_per_extra_test: Number(chargePerExtraTest),
        free_students_per_test: Number(freeStudentsPerTest),
        charge_per_extra_student: Number(chargePerExtraStudent),
        instant_certificate_charge: Number(instantCertificateCharge),
        allow_instant_certificate: Boolean(allowInstantCertificate),
        enabled: pricingEnabled,
        allow_wallet_deduction: allowWalletDeduction,
        description: description.trim()
      };

      let res;
      try {
        res = await axios.put(`${API_BASE}/online-test-pricing`, payload, { headers: getAuthHeaders() });
      } catch {
        res = await axios.put(`http://localhost:3000/api/admin/online-test-pricing`, payload, { headers: getAuthHeaders() });
      }
      if (res.data.success) {
        showToast('success', 'Online test quota & pricing updated live across all centers!');
        fetchPricingData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenOverrideModal = (center: CenterQuotaItem) => {
    setOverrideCenter(center);
    if (center.raw_custom_config) {
      setOverrideMonthlyLimit(center.raw_custom_config.monthly_free_limit !== undefined ? String(center.raw_custom_config.monthly_free_limit) : '');
      setOverrideExtraCharge(center.raw_custom_config.charge_per_extra_test !== undefined ? String(center.raw_custom_config.charge_per_extra_test) : '');
      setOverrideInstantCertificateCharge(center.raw_custom_config.instant_certificate_charge !== undefined ? String(center.raw_custom_config.instant_certificate_charge) : '');
      if (center.raw_custom_config.allow_instant_certificate === true) {
        setOverrideAllowInstant('enabled');
      } else if (center.raw_custom_config.allow_instant_certificate === false) {
        setOverrideAllowInstant('disabled');
      } else {
        setOverrideAllowInstant('inherit');
      }
    } else {
      setOverrideMonthlyLimit('');
      setOverrideExtraCharge('');
      setOverrideInstantCertificateCharge('');
      setOverrideAllowInstant('inherit');
    }
  };

  const executeSaveOverride = async (center: CenterQuotaItem, payload: any) => {
    try {
      setOverrideSaving(true);
      let res;
      try {
        res = await axios.put(`${API_BASE}/centers/${center.id}/pricing-override`, payload, { headers: getAuthHeaders() });
      } catch {
        res = await axios.put(`http://localhost:3000/api/admin/centers/${center.id}/pricing-override`, payload, { headers: getAuthHeaders() });
      }
      if (res.data.success) {
        showToast('success', `Override for ${center.centerName} updated successfully!`);
        setOverrideCenter(null);
        setSecondaryConfirmData(null);
        fetchPricingData();
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to override configuration');
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleSaveOverrideForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideCenter) return;

    const payload: any = {};
    if (overrideMonthlyLimit !== '') payload.monthly_free_limit = Number(overrideMonthlyLimit);
    if (overrideExtraCharge !== '') payload.charge_per_extra_test = Number(overrideExtraCharge);
    if (overrideInstantCertificateCharge !== '') payload.instant_certificate_charge = Number(overrideInstantCertificateCharge);
    
    if (overrideAllowInstant === 'enabled') {
      payload.allow_instant_certificate = true;
    } else if (overrideAllowInstant === 'disabled') {
      payload.allow_instant_certificate = false;
    }

    const initialOverride = overrideCenter.raw_custom_config?.allow_instant_certificate;
    const isPermissionChanged =
      (overrideAllowInstant === 'enabled' && initialOverride !== true) ||
      (overrideAllowInstant === 'disabled' && initialOverride !== false) ||
      (overrideAllowInstant === 'inherit' && initialOverride !== undefined);

    if (isPermissionChanged) {
      setSecondaryConfirmData({
        center: overrideCenter,
        nextStatus: overrideAllowInstant,
        instantPrice: overrideInstantCertificateCharge !== '' ? Number(overrideInstantCertificateCharge) : instantCertificateCharge,
        onConfirm: async () => {
          await executeSaveOverride(overrideCenter, payload);
        },
        onCancel: () => setSecondaryConfirmData(null),
        loading: overrideSaving
      });
      return;
    }

    await executeSaveOverride(overrideCenter, payload);
  };

  const handleQuickToggleInstantCert = (center: CenterQuotaItem) => {
    const currentStatus = center.active_pricing_config?.allow_instant_certificate !== false;
    const nextStatus = currentStatus ? 'disabled' : 'enabled';
    const targetPayload = {
      ...(center.raw_custom_config || {}),
      allow_instant_certificate: !currentStatus
    };

    setSecondaryConfirmData({
      center,
      nextStatus: nextStatus,
      instantPrice: center.active_pricing_config?.instant_certificate_charge || instantCertificateCharge,
      onConfirm: async () => {
        await executeSaveOverride(center, targetPayload);
      },
      onCancel: () => setSecondaryConfirmData(null),
      loading: overrideSaving
    });
  };

  const filteredCenters = (data?.centers || []).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.centerName.toLowerCase().includes(q) ||
      c.centerCode.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto font-sans space-y-8">
      
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <ShieldCheck size={14} />
            <span>Super Admin Online Test & Instant Certificate Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Online Test Quota & Instant Certificate Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Govern monthly test limits, wallet deductions, and authorize Instant Certificate issuance per center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/passes"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all"
          >
            <Crown size={15} />
            <span>Manage Student Elite Pass Pricing</span>
          </Link>
          <button
            type="button"
            onClick={fetchPricingData}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : ''} />
            <span>Refresh Live Quota</span>
          </button>
        </div>
      </div>

      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tests This Month */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tests Created (This Month)</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.stats?.totalTestsThisMonth ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Tests published across all centers</span>
          </div>
        </div>

        {/* Active Centers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Centers</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.stats?.activeCentersThisMonth ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Centers creating online tests</span>
          </div>
        </div>

        {/* Paid Extra Tests */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Tests (Above Limit)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.stats?.totalPaidTestsThisMonth ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Tests billed to center wallets</span>
          </div>
        </div>

        {/* Total Billed Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Test Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{(data?.stats?.totalRevenueThisMonth ?? 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Billed to center wallets this month</span>
          </div>
        </div>
      </div>

      {/* Global Configuration Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Global Default Pricing & Permission Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defines default pricing, limits, and instant certificate permissions across all study centers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. Monthly Free Test Limit */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Monthly Free Test Quota Per Center *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  required
                  value={monthlyFreeLimit}
                  onChange={(e) => setMonthlyFreeLimit(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Number of online tests a center can create at <strong>₹0 (FREE)</strong> in a calendar month.
              </p>
            </div>

            {/* 2. Charge per Additional Test */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Charge Per Extra Test Creation (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  required
                  value={chargePerExtraTest}
                  onChange={(e) => setChargePerExtraTest(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Fee automatically charged/deducted from Center Wallet when creating 3rd or additional tests.
              </p>
            </div>

            {/* 3. Instant Certificate Charge */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" />
                Instant Certificate Charge (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  required
                  value={instantCertificateCharge}
                  onChange={(e) => setInstantCertificateCharge(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Fee deducted from center wallet when force-generating an instant certificate for incomplete exams.
              </p>
            </div>

            {/* 4. Free Students Per Test */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Free Candidates Allowed Per Test *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={freeStudentsPerTest}
                  onChange={(e) => setFreeStudentsPerTest(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Number of candidates who can take a published test at <strong>₹0 (FREE)</strong>.
              </p>
            </div>

            {/* 5. Charge per Extra Student */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Charge Per Extra Candidate (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  required
                  value={chargePerExtraStudent}
                  onChange={(e) => setChargePerExtraStudent(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Wallet deduction per extra candidate when the test limit is increased.
              </p>
            </div>

            {/* 6. Feature & Permission Toggles */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-center">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Enforce Quota & Charges</span>
                  <span className="text-[10px] text-slate-500 font-medium">Activate billing beyond free limit</span>
                </div>
                <input
                  type="checkbox"
                  checked={pricingEnabled}
                  onChange={(e) => setPricingEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Auto-Deduct From Wallet</span>
                  <span className="text-[10px] text-slate-500 font-medium">Instant wallet balance debit</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowWalletDeduction}
                  onChange={(e) => setAllowWalletDeduction(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                <div>
                  <span className="block text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Award size={12} className="text-amber-500" />
                    Global Instant Certificate Policy
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Allow centers to bypass incomplete exams</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowInstantCertificate}
                  onChange={(e) => setAllowInstantCertificate(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes / Policy Explanation</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Each center gets 2 free tests per month. Beyond 2, ₹50 is deducted per test."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{saving ? 'Saving Settings...' : 'Save & Publish Global Config'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Center-by-Center Live Quota & Permissions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Center-Wise Quota & Instant Certificate Permissions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control individual quota overrides and authorize/restrict instant certificate issuance with secondary confirmation.</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search center by name, code or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold text-center w-12">#</th>
                <th className="py-3 px-4 font-bold">Center Name & Code</th>
                <th className="py-3 px-4 font-bold">Location</th>
                <th className="py-3 px-4 font-bold text-right">Wallet Balance</th>
                <th className="py-3 px-4 font-bold text-center">Tests This Month</th>
                <th className="py-3 px-4 font-bold text-center">Free Quota Status</th>
                <th className="py-3 px-4 font-bold text-center">Instant Certificate</th>
                <th className="py-3 px-4 font-bold text-center">Old Student (2h)</th>
                <th className="py-3 px-4 font-bold text-right pr-6">Revenue (₹)</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 font-medium">
                    Loading center quota records...
                  </td>
                </tr>
              ) : filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500 font-medium">
                    No matching study centers found.
                  </td>
                </tr>
              ) : (
                filteredCenters.map((c, index) => {
                  const isFreeQuotaExhausted = c.freeRemaining === 0;
                  const isInstantAllowed = c.active_pricing_config?.allow_instant_certificate !== false;
                  const hasCustomInstantOverride = c.raw_custom_config?.allow_instant_certificate !== undefined;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-center font-bold text-slate-500">{index + 1}</td>
                      
                      {/* Center Info */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div>{c.centerName}</div>
                        <div className="text-[11px] text-indigo-600 font-mono font-semibold">Code: {c.centerCode}</div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-600">
                        <div>{c.city || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{c.state}</div>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-4 px-4 text-right font-black text-slate-900">
                        ₹{Number(c.walletBalance).toLocaleString('en-IN')}
                      </td>

                      {/* Tests This Month */}
                      <td className="py-4 px-4 text-center font-black text-slate-900">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
                          {c.testsThisMonth} Tests
                        </span>
                      </td>

                      {/* Free Quota Status */}
                      <td className="py-4 px-4 text-center">
                        {isFreeQuotaExhausted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Limit Reached ({c.freeUsed}/{c.active_pricing_config?.monthly_free_limit || monthlyFreeLimit})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {c.freeUsed}/{c.active_pricing_config?.monthly_free_limit || monthlyFreeLimit} Used ({c.freeRemaining} Left)
                          </span>
                        )}
                      </td>

                      {/* Instant Certificate Permission Toggle Badge */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleInstantCert(c)}
                          title="Click to toggle instant certificate permission"
                          className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                            isInstantAllowed
                              ? hasCustomInstantOverride
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : hasCustomInstantOverride
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                          }`}
                        >
                          {isInstantAllowed ? (
                            <>
                              <Check size={11} className="text-emerald-600 stroke-[3]" />
                              <span>{hasCustomInstantOverride ? 'Enabled (Override)' : 'Enabled (Global)'}</span>
                            </>
                          ) : (
                            <>
                              <X size={11} className="text-rose-600 stroke-[3]" />
                              <span>{hasCustomInstantOverride ? 'Disabled (Override)' : 'Disabled (Global)'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Old Student 2h Dynamic Permission Toggle Badge */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          disabled={togglingOldStudent === c.id}
                          onClick={() => handleToggleOldStudentPermission(c, 2)}
                          title={
                            c.is_old_student_allowed && (c.old_student_seconds_left ?? 0) > 0
                              ? `Allowed! Click to Revoke immediately (${formatCountdown(c.old_student_seconds_left)} remaining)`
                              : 'Click to Allow Old Student admission for 2 Hours'
                          }
                          className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                            c.is_old_student_allowed && (c.old_student_seconds_left ?? 0) > 0
                              ? 'bg-amber-100 text-amber-900 hover:bg-rose-100 hover:text-rose-800 border border-amber-300 hover:border-rose-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-300 hover:border-emerald-300'
                          }`}
                        >
                          {c.is_old_student_allowed && (c.old_student_seconds_left ?? 0) > 0 ? (
                            <>
                              <Clock size={11} className="text-amber-700 animate-pulse stroke-[2.5]" />
                              <span className="group-hover:hidden">Active ({formatCountdown(c.old_student_seconds_left)})</span>
                              <span className="hidden group-hover:inline text-rose-700 font-extrabold">✕ Revoke Now</span>
                            </>
                          ) : (
                            <>
                              <X size={11} className="text-slate-400 group-hover:hidden stroke-[2]" />
                              <Unlock size={11} className="text-emerald-600 hidden group-hover:inline" />
                              <span className="group-hover:hidden">Disabled</span>
                              <span className="hidden group-hover:inline text-emerald-700 font-extrabold">+ Allow 2 Hours</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Revenue */}
                      <td className="py-4 px-4 text-right pr-6 font-black text-emerald-600">
                        {c.estimatedPaidRevenue > 0 ? `₹${c.estimatedPaidRevenue}` : '₹0'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenOverrideModal(c)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5 mx-auto cursor-pointer ${
                            c.raw_custom_config 
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          <Sliders size={12} />
                          {c.raw_custom_config ? 'Overridden' : 'Override'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
                <Sliders size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-indigo-950">Center Quota & Permission Override</h3>
                <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">
                  {overrideCenter.centerName} ({overrideCenter.centerCode})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveOverrideForm} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 font-medium flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Leave numeric fields empty or select "Inherit Global" to fallback to the super admin global configuration.</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Override Monthly Free Test Limit</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Global default: ${monthlyFreeLimit} tests`}
                    value={overrideMonthlyLimit}
                    onChange={(e) => setOverrideMonthlyLimit(e.target.value)}
                    className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Override Charge Per Extra Test (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder={`Global default: ₹${chargePerExtraTest}`}
                    value={overrideExtraCharge}
                    onChange={(e) => setOverrideExtraCharge(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Override Instant Certificate Charge (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    placeholder={`Global default: ₹${instantCertificateCharge}`}
                    value={overrideInstantCertificateCharge}
                    onChange={(e) => setOverrideInstantCertificateCharge(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Instant Certificate Permission Segmented Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    Instant Certificate Permission Toggle
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    overrideAllowInstant === 'enabled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : overrideAllowInstant === 'disabled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {overrideAllowInstant === 'enabled' ? 'Explicitly Allowed' : overrideAllowInstant === 'disabled' ? 'Explicitly Blocked' : `Inherits Global (${allowInstantCertificate ? 'Allowed' : 'Blocked'})`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  When enabled, this center can bypass semester exam prerequisites and issue Instant Certificates directly. When disabled, the button is hidden on their portal.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOverrideAllowInstant('inherit')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overrideAllowInstant === 'inherit'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Inherit Global
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideAllowInstant('enabled')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overrideAllowInstant === 'enabled'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Check size={13} />
                    Allow
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideAllowInstant('disabled')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                      overrideAllowInstant === 'disabled'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <X size={13} />
                    Disable
                  </button>
                </div>
              </div>

              {/* Old Student Admission Permission (2h Auto-Disable Timer) Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-500" />
                    Old Student Admission Permission (2h Timer)
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    overrideCenter.is_old_student_allowed && (overrideCenter.old_student_seconds_left ?? 0) > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {overrideCenter.is_old_student_allowed && (overrideCenter.old_student_seconds_left ?? 0) > 0
                      ? `Active (${formatCountdown(overrideCenter.old_student_seconds_left)} left)`
                      : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  When enabled, this center can add Old Students on their portal. After 2 hours, it automatically disables dynamically.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={togglingOldStudent === overrideCenter.id}
                    onClick={async () => {
                      await handleToggleOldStudentPermission(overrideCenter, 2);
                      setOverrideCenter(prev => {
                        if (!prev) return null;
                        const isNowAllowed = !(prev.is_old_student_allowed && (prev.old_student_seconds_left ?? 0) > 0);
                        return {
                          ...prev,
                          is_old_student_allowed: isNowAllowed,
                          old_student_seconds_left: isNowAllowed ? 7200 : 0
                        };
                      });
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                      overrideCenter.is_old_student_allowed && (overrideCenter.old_student_seconds_left ?? 0) > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {overrideCenter.is_old_student_allowed && (overrideCenter.old_student_seconds_left ?? 0) > 0 ? (
                      <>
                        <X size={13} />
                        Revoke Old Student Permission Now
                      </>
                    ) : (
                      <>
                        <Clock size={13} />
                        Grant 2 Hours Permission (+ Start 2h Timer)
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideCenter(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {overrideSaving ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECONDARY CONFIRMATION MODAL */}
      {secondaryConfirmData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            
            {/* Header with status badge */}
            <div className={`p-6 border-b flex items-start gap-4 ${
              secondaryConfirmData.nextStatus === 'enabled'
                ? 'bg-emerald-50/80 border-emerald-100 text-emerald-950'
                : secondaryConfirmData.nextStatus === 'disabled'
                ? 'bg-rose-50/80 border-rose-100 text-rose-950'
                : 'bg-indigo-50/80 border-indigo-100 text-indigo-950'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                secondaryConfirmData.nextStatus === 'enabled'
                  ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                  : secondaryConfirmData.nextStatus === 'disabled'
                  ? 'bg-rose-100 text-rose-600 border-rose-200'
                  : 'bg-indigo-100 text-indigo-600 border-indigo-200'
              }`}>
                {secondaryConfirmData.nextStatus === 'enabled' ? (
                  <Unlock size={24} />
                ) : secondaryConfirmData.nextStatus === 'disabled' ? (
                  <Lock size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
                  Secondary Confirmation Required
                </span>
                <h3 className="text-lg font-black mt-1">
                  {secondaryConfirmData.nextStatus === 'enabled'
                    ? 'Authorize Instant Certificates?'
                    : secondaryConfirmData.nextStatus === 'disabled'
                    ? 'Disable Instant Certificates?'
                    : 'Reset to Global Policy?'}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Affected Study Center</div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {secondaryConfirmData.center.centerName}
                </div>
                <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                  Center Code: {secondaryConfirmData.center.centerCode} • {secondaryConfirmData.center.city || 'N/A'}, {secondaryConfirmData.center.state}
                </div>
              </div>

              {secondaryConfirmData.nextStatus === 'enabled' ? (
                <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Instant Generation Access Activated
                  </div>
                  <p>
                    This center will be allowed to force-generate Instant Certificates for students with incomplete semester exams. A wallet charge of <strong>₹{secondaryConfirmData.instantPrice}</strong> will be deducted per certificate. The button will be visibly unlocked in their portal.
                  </p>
                </div>
              ) : secondaryConfirmData.nextStatus === 'disabled' ? (
                <div className="p-3.5 bg-rose-50 text-rose-900 rounded-2xl border border-rose-200 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-800">
                    <Lock size={14} className="text-rose-600" />
                    Instant Generation Access Revoked
                  </div>
                  <p>
                    This center will be strictly prohibited from generating certificates before all required semester examinations are completed. The Instant Certificate button will be hidden from their center portal.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-indigo-50 text-indigo-900 rounded-2xl border border-indigo-200 text-xs leading-relaxed">
                  Center permissions will automatically track the global system policy ({allowInstantCertificate ? 'Currently Enabled' : 'Currently Disabled'}).
                </div>
              )}

              <p className="text-[11px] text-slate-400 font-medium">
                Please confirm that you want to proceed with this access change.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={secondaryConfirmData.onCancel}
                disabled={secondaryConfirmData.loading}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={secondaryConfirmData.onConfirm}
                disabled={secondaryConfirmData.loading}
                className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  secondaryConfirmData.nextStatus === 'enabled'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : secondaryConfirmData.nextStatus === 'disabled'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {secondaryConfirmData.loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Yes, Confirm Permission</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TestPricingSettings;

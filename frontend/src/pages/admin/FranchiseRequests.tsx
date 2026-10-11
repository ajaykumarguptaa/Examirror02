import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Image as ImageIcon,
  ShieldCheck,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Download,
  Printer,
  Trash2,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCheck,
  FolderDown,
  RotateCcw,
  ShieldAlert,
  Archive,
  Lock,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface FranchiseApplication {
  id: number;
  center_head_first_name: string;
  center_head_middle_name?: string;
  center_head_last_name: string;
  father_first_name: string;
  father_middle_name?: string;
  father_last_name: string;
  phone: string;
  email: string;
  aadhar_number: string;
  pan_number?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  center_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  photo_url?: string;
  signature_url?: string;
  marksheet_url?: string;
  aadhar_front_url?: string;
  aadhar_back_url?: string;
  center_photos_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Trash';
  created_at: string;
}

// Real-Time Zebtish Security Captcha Generator Utility
const generateZebtishWord = (): string => {
  const prefixes = ['ZEBT', 'ZEB', 'ZEBTISH', 'ZEBX', 'ZAP', 'ZT', 'ZOR', 'ZEV'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNum = Math.floor(100 + Math.random() * 900);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 2; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomNum}${suffix}`;
};

const FranchiseRequests = () => {
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<FranchiseApplication | null>(null);
  
  // Document Verification State (key: `${appId}_${docKey}`)
  const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});
  
  // Full screen document preview & inspector state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; docKey: string; appId: number } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);

  // Approval Modal & Action State
  const [approvingApp, setApprovingApp] = useState<FranchiseApplication | null>(null);
  const [customCenterCode, setCustomCenterCode] = useState('');
  const [initialWallet, setInitialWallet] = useState(500);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvalResult, setApprovalResult] = useState<any | null>(null);

  // Soft Delete & Real-Time Zebtish Captcha State
  const [deleteTargetApp, setDeleteTargetApp] = useState<FranchiseApplication | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'permanent'>('soft');
  const [zebtishCaptcha, setZebtishCaptcha] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [isCaptchaValid, setIsCaptchaValid] = useState<boolean>(false);
  const [deleteProcessing, setDeleteProcessing] = useState<boolean>(false);

  const refreshZebtishCaptcha = () => {
    const newWord = generateZebtishWord();
    setZebtishCaptcha(newWord);
    setCaptchaInput('');
    setIsCaptchaValid(false);
  };

  const openDeleteModal = (app: FranchiseApplication, defaultMode: 'soft' | 'permanent' = 'soft') => {
    setDeleteTargetApp(app);
    setDeleteMode(app.status === 'Trash' ? 'permanent' : defaultMode);
    refreshZebtishCaptcha();
  };

  const toggleDocVerification = (appId: number, docKey: string) => {
    const key = `${appId}_${docKey}`;
    setVerifiedDocs(prev => {
      const nextVal = !prev[key];
      setToast({
        type: 'success',
        text: nextVal ? `Document marked as Verified ✓` : `Document marked as In Review`
      });
      return { ...prev, [key]: nextVal };
    });
  };

  const handleDownloadFile = (url: string, filename: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url;
    
    if (fullUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      fetch(fullUrl)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          window.open(fullUrl, '_blank');
        });
    }
  };

  const getAppDocuments = (app: FranchiseApplication) => [
    { key: 'photo', label: 'Passport Photo', category: 'Biometric Headshot', url: app.photo_url, filename: `${app.center_head_first_name}_Photo.png` },
    { key: 'signature', label: 'Director Signature', category: 'Legal Signature', url: app.signature_url, filename: `${app.center_head_first_name}_Signature.png` },
    { key: 'marksheet', label: 'Qualification Marksheet', category: 'Academic Proof', url: app.marksheet_url, filename: `${app.center_head_first_name}_Qualification.png` },
    { key: 'aadhar_front', label: 'Aadhar Card (Front)', category: 'Identity Proof', url: app.aadhar_front_url, filename: `${app.center_head_first_name}_Aadhar_Front.png` },
    { key: 'aadhar_back', label: 'Aadhar Card (Back)', category: 'Address Proof', url: app.aadhar_back_url, filename: `${app.center_head_first_name}_Aadhar_Back.png` },
    { key: 'center_photos', label: 'Center Infrastructure', category: 'Premises Photos', url: app.center_photos_url, filename: `${app.center_head_first_name}_Center_Photos.png` },
  ];

  const handleDownloadAllDocs = (app: FranchiseApplication) => {
    const docs = getAppDocuments(app).filter(d => !!d.url);
    if (docs.length === 0) {
      alert('No uploaded documents available for download.');
      return;
    }
    docs.forEach((doc, idx) => {
      setTimeout(() => {
        handleDownloadFile(doc.url!, `${app.center_name.replace(/[^a-zA-Z0-9]/g, '_')}_${doc.filename}`);
      }, idx * 350);
    });
    setToast({ type: 'success', text: `Downloading ${docs.length} documents...` });
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/admin/franchise-requests');
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching franchise requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async () => {
    if (!approvingApp) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${approvingApp.id}/approve`, {
        centerCode: customCenterCode || undefined,
        initialWallet: Number(initialWallet) || 500
      });
      if (res.data?.success) {
        setApprovalResult(res.data.result);
        setToast({ type: 'success', text: `Franchise Approved! Center Code: ${res.data.result?.centerCode}` });
        fetchApplications();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to approve application' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${id}/reject`, {});
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Application marked as Rejected' });
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp({ ...selectedApp, status: 'Rejected' });
        }
        fetchApplications();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to reject application' });
    } finally {
      setActionLoading(false);
    }
  };

  // SOFT DELETE
  const handleSoftDelete = async (id: number) => {
    setDeleteProcessing(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${id}/soft-delete`);
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Application moved to Trash (Soft Deleted) ✓' });
        if (selectedApp?.id === id) setSelectedApp(null);
        setDeleteTargetApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: 'Failed to soft delete application' });
    } finally {
      setDeleteProcessing(false);
    }
  };

  // RESTORE FROM TRASH
  const handleRestore = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${id}/restore`);
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Application restored to Pending review ✓' });
        if (selectedApp?.id === id) setSelectedApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: 'Failed to restore application' });
    } finally {
      setActionLoading(false);
    }
  };

  // PERMANENT DELETE (Requires Zebtish Captcha Validation)
  const handlePermanentDelete = async (id: number) => {
    if (captchaInput.trim().toUpperCase() !== zebtishCaptcha.trim().toUpperCase()) {
      setToast({ type: 'error', text: 'Security Captcha word mismatch. Please type the exact code.' });
      return;
    }

    setDeleteProcessing(true);
    try {
      const res = await axios.delete(`http://localhost:3000/api/admin/franchise-requests/${id}`);
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Application permanently deleted from database' });
        if (selectedApp?.id === id) setSelectedApp(null);
        setDeleteTargetApp(null);
        fetchApplications();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: 'Failed to permanently delete application' });
    } finally {
      setDeleteProcessing(false);
    }
  };

  // Active vs Trash counts
  const activeApps = applications.filter((a) => a.status !== 'Trash');
  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;
  const trashCount = applications.filter((a) => a.status === 'Trash').length;

  // Filter & Search
  const filteredApplications = applications.filter((app) => {
    let matchesStatus = false;
    if (filterStatus === 'all') {
      matchesStatus = app.status !== 'Trash';
    } else if (filterStatus === 'trash') {
      matchesStatus = app.status === 'Trash';
    } else {
      matchesStatus = app.status?.toLowerCase() === filterStatus.toLowerCase();
    }

    const fullName = `${app.center_head_first_name} ${app.center_head_last_name}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      fullName.includes(q) ||
      (app.center_name || '').toLowerCase().includes(q) ||
      (app.phone || '').includes(q) ||
      (app.email || '').toLowerCase().includes(q) ||
      (app.district || '').toLowerCase().includes(q) ||
      (app.state || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Verify Captcha matching dynamically
  const captchaMatches = captchaInput.trim().toUpperCase() === zebtishCaptcha.trim().toUpperCase();

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border animate-in slide-in-from-top ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="text-indigo-600" size={26} />
            <span>Franchise Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, inspect biometric documents, soft-delete, and approve new study center franchise applications.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Total</span>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeApps.length}</div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending</span>
            {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{pendingCount}</div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Approved</span>
          <div className="text-2xl font-black text-emerald-900 mt-2">{approvedCount}</div>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Rejected</span>
          <div className="text-2xl font-black text-rose-900 mt-2">{rejectedCount}</div>
        </div>

        <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-300 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Archive size={12} />
            <span>Trash (Soft)</span>
          </span>
          <div className="text-2xl font-black text-slate-700 mt-2">{trashCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: `All Active (${activeApps.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'rejected', label: `Rejected (${rejectedCount})` },
            { key: 'trash', label: `Trash (${trashCount})`, icon: Trash2 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === tab.key
                  ? tab.key === 'trash'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.icon && <tab.icon size={13} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by center, head, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
          />
        </div>

      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading franchise requests...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Building2 size={36} className="mx-auto text-slate-300" />
            <div className="text-sm font-bold text-slate-700">No Franchise Requests Found</div>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Center Head</th>
                  <th className="py-3.5 px-4">Proposed Center & Location</th>
                  <th className="py-3.5 px-4">Contact Details</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApplications.map((app) => {
                  const headFullName = `${app.center_head_first_name} ${app.center_head_middle_name ? app.center_head_middle_name + ' ' : ''}${app.center_head_last_name}`.trim();
                  const appDate = new Date(app.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  const isTrash = app.status === 'Trash';

                  return (
                    <tr key={app.id} className={`hover:bg-slate-50/80 transition-colors ${isTrash ? 'bg-slate-50/60 opacity-85' : ''}`}>
                      
                      {/* Center Head */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {app.photo_url ? (
                              <img
                                src={app.photo_url.startsWith('/') ? `http://localhost:3000${app.photo_url}` : app.photo_url}
                                alt={headFullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={18} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{headFullName}</div>
                            <div className="text-[10px] text-slate-500">S/O {app.father_first_name} {app.father_last_name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Proposed Center & Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{app.center_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          <span>{app.city}, {app.district}, {app.state} - {app.pincode}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-bold">{app.phone}</div>
                        <div className="text-[11px] text-slate-500">{app.email}</div>
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {appDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          app.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : app.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : app.status === 'Trash'
                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {app.status === 'Approved' ? <CheckCircle2 size={11} /> : app.status === 'Rejected' ? <XCircle size={11} /> : app.status === 'Trash' ? <Archive size={11} /> : <AlertCircle size={11} />}
                          <span>{app.status === 'Trash' ? 'Trash (Soft Deleted)' : app.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Preview Dossier */}
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="View Full Application Dossier"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>

                          {/* If in Trash: Restore & Purge */}
                          {isTrash ? (
                            <>
                              <button
                                onClick={() => handleRestore(app.id)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                                title="Restore Application to Pending"
                              >
                                <RotateCcw size={13} />
                                <span>Restore</span>
                              </button>

                              <button
                                onClick={() => openDeleteModal(app, 'permanent')}
                                className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Permanent Purge with Zebtish Captcha"
                              >
                                <Trash2 size={13} />
                                <span>Purge</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {app.status === 'Pending' && (
                                <button
                                  onClick={() => {
                                    setApprovingApp(app);
                                    setCustomCenterCode(`EXAMc2026-${String(100 + app.id).padStart(3, '0')}`);
                                    setInitialWallet(500);
                                    setApprovalResult(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  title="Approve & Create Center"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Delete / Soft Delete Trigger Button */}
                              <button
                                onClick={() => openDeleteModal(app, 'soft')}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete / Move to Trash"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLETE APPLICATION DOSSIER PREVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] text-slate-800 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Franchise Application Dossier</h3>
                  <p className="text-[11px] text-slate-300">
                    Application ID: #{selectedApp.id} | Applied: {new Date(selectedApp.created_at).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Application Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    selectedApp.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : selectedApp.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : selectedApp.status === 'Trash'
                      ? 'bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {selectedApp.status === 'Trash' ? 'Trash (Soft Deleted)' : selectedApp.status}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {selectedApp.status === 'Approved'
                      ? 'This study center has been approved and activated in the portal.'
                      : selectedApp.status === 'Rejected'
                      ? 'This application was declined.'
                      : selectedApp.status === 'Trash'
                      ? 'This application is in Trash (Soft Deleted). Documents remain preserved.'
                      : 'Pending verification and center provisioning.'}
                  </span>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Dossier</span>
                </button>
              </div>

              {/* 1. Center Head Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={15} className="text-indigo-600" />
                  <span>Center Head Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Full Name</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedApp.center_head_first_name} {selectedApp.center_head_middle_name || ''} {selectedApp.center_head_last_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Father's Name</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedApp.father_first_name} {selectedApp.father_middle_name || ''} {selectedApp.father_last_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Phone / WhatsApp</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.phone}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Email Address</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.email}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Aadhar Number</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.aadhar_number}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">PAN Number</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.pan_number || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Date of Birth</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.dob || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Gender</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.gender || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Marital Status</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.marital_status || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* 2. Office & Center Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={15} className="text-indigo-600" />
                  <span>Proposed Center & Infrastructure</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Institute / Center Name</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.center_name}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Pin / Zip Code</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.pincode}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-500 font-medium">Office Street Address</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedApp.address_line1} {selectedApp.address_line2 ? `, ${selectedApp.address_line2}` : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">City & District</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.city}, {selectedApp.district}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">State / UT</span>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedApp.state}</div>
                  </div>
                </div>
              </div>

              {/* 3. Uploaded Documents Vault */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck size={16} className="text-indigo-600" />
                      <span>Uploaded KYC & Biometric Document Vault</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verify individual identity documents, qualification proofs, and infrastructure photos.
                    </p>
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadAllDocs(selectedApp)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200 shadow-xs"
                      title="Download all uploaded documents"
                    >
                      <FolderDown size={14} />
                      <span>Download All Files</span>
                    </button>
                  </div>
                </div>

                {/* 6-Document Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {getAppDocuments(selectedApp).map((doc) => {
                    const isVerified = !!verifiedDocs[`${selectedApp.id}_${doc.key}`];
                    const hasDoc = !!doc.url;
                    const fullDocUrl = hasDoc ? (doc.url!.startsWith('/') ? `http://localhost:3000${doc.url}` : doc.url!) : null;

                    return (
                      <div
                        key={doc.key}
                        className={`bg-slate-50/80 rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 ${
                          isVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Title & Category */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {doc.category}
                            </span>
                            <div className="font-bold text-slate-900 text-xs mt-0.5">{doc.label}</div>
                          </div>

                          {isVerified ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                              <Check size={11} className="stroke-[3]" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/70 text-slate-600 shrink-0">
                              Pending Check
                            </span>
                          )}
                        </div>

                        {/* Thumbnail Viewport */}
                        <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-white relative group flex items-center justify-center">
                          {hasDoc ? (
                            <>
                              <img
                                src={fullDocUrl!}
                                alt={doc.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewDoc({ url: fullDocUrl!, title: doc.label, docKey: doc.key, appId: selectedApp.id });
                                    setZoomScale(1);
                                    setRotationDeg(0);
                                  }}
                                  className="p-2 rounded-xl bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 shadow-md cursor-pointer transition-colors"
                                  title="Zoom & Inspect"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(doc.url!, `${selectedApp.center_name.replace(/[^a-zA-Z0-9]/g, '_')}_${doc.filename}`)}
                                  className="p-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 shadow-md cursor-pointer transition-colors"
                                  title="Download File"
                                >
                                  <Download size={15} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center text-slate-400 p-4 space-y-1">
                              <FileText size={22} className="mx-auto text-slate-300" />
                              <span className="text-[10px] font-medium block">Document Not Uploaded</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions: Verify Checkmark Toggle & Download Button */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                          {hasDoc ? (
                            <>
                              {/* Verify Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleDocVerification(selectedApp.id, doc.key)}
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  isVerified
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <CheckCircle2 size={13} className={isVerified ? 'text-white' : 'text-slate-400'} />
                                <span>{isVerified ? 'Verified ✓' : 'Verify'}</span>
                              </button>

                              {/* Download Icon Button */}
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(doc.url!, `${selectedApp.center_name.replace(/[^a-zA-Z0-9]/g, '_')}_${doc.filename}`)}
                                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                                title={`Download ${doc.label}`}
                              >
                                <Download size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic py-1 text-center w-full">No file attached</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedApp.status !== 'Trash' ? (
                  <button
                    onClick={() => {
                      const appToDel = selectedApp;
                      setSelectedApp(null);
                      openDeleteModal(appToDel, 'soft');
                    }}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Move to Trash</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleRestore(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Restore Application</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedApp.id)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      Reject Application
                    </button>

                    <button
                      onClick={() => {
                        setApprovingApp(selectedApp);
                        setCustomCenterCode(`EXAMc2026-${String(100 + selectedApp.id).padStart(3, '0')}`);
                        setInitialWallet(500);
                        setApprovalResult(null);
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Create Center</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL RESOLUTION DOCUMENT INSPECTOR & ZOOM MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full max-h-[95vh] flex flex-col bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
            
            {/* Inspector Top Controls Bar */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">{previewDoc.title}</span>
                {verifiedDocs[`${previewDoc.appId}_${previewDoc.docKey}`] && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check size={11} /> Verified
                  </span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 3))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotationDeg(prev => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw size={15} />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Verify toggle inside modal */}
                <button
                  type="button"
                  onClick={() => toggleDocVerification(previewDoc.appId, previewDoc.docKey)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    verifiedDocs[`${previewDoc.appId}_${previewDoc.docKey}`]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{verifiedDocs[`${previewDoc.appId}_${previewDoc.docKey}`] ? 'Verified' : 'Verify'}</span>
                </button>

                {/* Download in Inspector */}
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewDoc.url, `${previewDoc.title.replace(/\s+/g, '_')}.png`)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Document"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Image Zoom Area */}
            <div className="p-6 overflow-auto flex items-center justify-center flex-1 max-h-[80vh] bg-slate-950/40">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotationDeg}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Approve Franchise</h3>
                  <p className="text-xs text-slate-500">Provision login access & portal center</p>
                </div>
              </div>
              <button onClick={() => setApprovingApp(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            {approvalResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <Check size={16} /> Study Center Successfully Created!
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-emerald-800">
                    <div>
                      <span className="text-[10px] text-emerald-600 block">Center Code</span>
                      <span className="font-mono font-bold text-xs">{approvalResult.centerCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 block">Default Password</span>
                      <span className="font-mono font-bold text-xs">{approvalResult.defaultPassword}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setApprovingApp(null);
                    setApprovalResult(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Center Code</label>
                  <input
                    type="text"
                    value={customCenterCode}
                    onChange={(e) => setCustomCenterCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default auto-generated code for 2026 session</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Wallet Balance (INR)</label>
                  <input
                    type="number"
                    value={initialWallet}
                    onChange={(e) => setInitialWallet(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovingApp(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading && <RefreshCw size={13} className="animate-spin" />}
                    <span>Confirm & Activate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL-TIME ZEBTISH WORD CAPTCHA & SOFT DELETE MODAL */}
      {deleteTargetApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-800 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Application Deletion Shield</h3>
                  <p className="text-[11px] text-rose-200">
                    {deleteTargetApp.center_name} ({deleteTargetApp.center_head_first_name} {deleteTargetApp.center_head_last_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetApp(null)}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-5 space-y-4">
              
              {deleteTargetApp.status !== 'Trash' && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDeleteMode('soft')}
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      deleteMode === 'soft'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Archive size={14} />
                    <span>Soft Delete (Trash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteMode('permanent');
                      refreshZebtishCaptcha();
                    }}
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      deleteMode === 'permanent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    <ShieldAlert size={14} />
                    <span>Permanent Purge</span>
                  </button>
                </div>
              )}

              {/* Mode 1: SOFT DELETE OPTION */}
              {deleteMode === 'soft' && deleteTargetApp.status !== 'Trash' ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5 text-sm">
                      <Archive size={16} className="text-indigo-600" />
                      <span>Safe Soft Delete & Archive</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Moving this application to <strong>Trash</strong> deactivates review, but keeps all <strong>6 biometric documents and credentials safely preserved</strong>. You can restore this application at any time with 1 click.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <div>• <strong>Applicant:</strong> {deleteTargetApp.center_head_first_name} {deleteTargetApp.center_head_last_name}</div>
                    <div>• <strong>Center:</strong> {deleteTargetApp.center_name}</div>
                    <div>• <strong>Phone:</strong> {deleteTargetApp.phone}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetApp(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteProcessing}
                      onClick={() => handleSoftDelete(deleteTargetApp.id)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      {deleteProcessing ? <RefreshCw size={13} className="animate-spin" /> : <Archive size={14} />}
                      <span>Move to Trash (Soft Delete)</span>
                    </button>
                  </div>
                </div>
              ) : (
                
                /* Mode 2: PERMANENT PURGE WITH REAL-TIME ZEBTISH WORD CAPTCHA */
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-rose-900">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-rose-800">
                      <AlertCircle size={15} />
                      <span>Irreversible Permanent Action</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      This will permanently purge this application and remove all associated uploaded KYC images from the database.
                    </p>
                  </div>

                  {/* Real-time Zebtish Captcha Generator Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                        <Lock size={12} className="text-rose-600" />
                        <span>Real-Time Security Zebtish Captcha:</span>
                      </span>

                      <button
                        type="button"
                        onClick={refreshZebtishCaptcha}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Generate New Zebtish Captcha"
                      >
                        <RefreshCw size={11} />
                        <span>Refresh Code</span>
                      </button>
                    </div>

                    {/* Styled Visual Zebtish Captcha Canvas Card */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-between select-none shadow-inner">
                      
                      {/* Security Background Grid Pattern */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />
                      
                      {/* Distorted Wavy Security Line SVG Overlay */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none">
                        <path d="M0,20 Q60,5 120,25 T240,15 T360,30 T480,10" fill="none" stroke="#f43f5e" strokeWidth="2" />
                        <path d="M0,35 Q80,45 160,20 T320,38 T480,22" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      </svg>

                      {/* Stylized Zebtish Characters */}
                      <div className="relative z-10 flex items-center gap-2 font-mono font-black text-lg tracking-widest pl-2">
                        {zebtishCaptcha.split('').map((char, index) => {
                          const rotation = ((index % 3) - 1) * 7;
                          const colors = ['text-emerald-400', 'text-amber-300', 'text-cyan-400', 'text-rose-400', 'text-purple-300', 'text-indigo-300'];
                          const color = colors[index % colors.length];

                          return (
                            <span
                              key={index}
                              style={{
                                transform: `rotate(${rotation}deg) translateY(${index % 2 === 0 ? '-1px' : '1px'})`,
                                display: 'inline-block',
                                textShadow: '0 0 10px rgba(255,255,255,0.4)'
                              }}
                              className={`${color} text-base md:text-lg`}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>

                      <div className="relative z-10 text-[10px] uppercase font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-400" />
                        <span>Security Key</span>
                      </div>
                    </div>

                    {/* Live Captcha Verification Input */}
                    <div className="space-y-1.5 pt-1">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type security word above to unlock..."
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider outline-none transition-all ${
                            captchaMatches
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                              : captchaInput.length > 0
                              ? 'border-rose-300 bg-rose-50/30 text-rose-900'
                              : 'border-slate-300 bg-white text-slate-800 focus:border-indigo-500'
                          }`}
                        />

                        {captchaMatches && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">
                            <Check size={12} className="stroke-[3]" />
                            <span>Matched</span>
                          </div>
                        )}
                      </div>

                      {/* Live Feedback Prompt */}
                      <div className="text-[10px]">
                        {captchaMatches ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Captcha security verified! Ready to permanently delete.
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Type the exact code <strong className="text-slate-700">{zebtishCaptcha}</strong> to unlock permanent purge.
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetApp(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!captchaMatches || deleteProcessing}
                      onClick={() => handlePermanentDelete(deleteTargetApp.id)}
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all ${
                        captchaMatches && !deleteProcessing
                          ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-rose-600/30'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {deleteProcessing ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={14} />}
                      <span>Permanently Delete Application</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FranchiseRequests;

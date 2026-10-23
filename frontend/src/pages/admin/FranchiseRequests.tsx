import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAssetUrl } from '../../utils/axiosSetup';
import { useDebounce } from '../../hooks/useDebounce';
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
  HelpCircle,
  GraduationCap,
  Award,
  Share2,
  Copy,
  Send,
  UploadCloud,
  Plus,
  Key,
  Table
} from 'lucide-react';
import { downloadFranchiseDossierZip } from '../../utils/generateFranchiseDossierZip';
import { downloadFranchiseDossierPdf } from '../../utils/generateFranchiseDossierPdf';

const CenterCertificateModal = lazy(() =>
  import('../../components/CenterCertificateModal').then(m => ({ default: m.CenterCertificateModal }))
);

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
  qualification?: string;
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
  login_id?: string;
  proposed_password?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Trash';
  created_at: string;
  certificate_status?: 'unclaimed' | 'pending' | 'action_required' | 'approved';
  certificate_claim_date?: string;
  certificate_approved_date?: string;
  certificate_demand_notes?: string;
  certificate_demanded_docs?: string;
  certificate_uploaded_docs?: string;
  certificate_number?: string;
  center_id?: number;
  center_code?: string;
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

// Document MIME and Format Detector Utility
export const getDocTypeInfo = (url?: string | null) => {
  if (!url) return { type: 'unknown', ext: 'png', isImage: false, isPdf: false, isExcel: false, isWord: false, label: 'Document' };
  const lower = url.toLowerCase();

  if (lower.startsWith('data:application/pdf') || lower.endsWith('.pdf') || lower.includes('.pdf?')) {
    return { type: 'pdf', ext: 'pdf', isImage: false, isPdf: true, isExcel: false, isWord: false, label: 'PDF Document' };
  }
  if (
    lower.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml') ||
    lower.startsWith('data:application/vnd.ms-excel') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.csv')
  ) {
    return { type: 'excel', ext: 'xlsx', isImage: false, isPdf: false, isExcel: true, isWord: false, label: 'Excel Spreadsheet' };
  }
  if (
    lower.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    lower.startsWith('data:application/msword') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.doc')
  ) {
    return { type: 'word', ext: 'docx', isImage: false, isPdf: false, isExcel: false, isWord: true, label: 'Word Document' };
  }
  if (
    lower.startsWith('data:image/') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg')
  ) {
    let ext = 'png';
    if (lower.includes('jpeg') || lower.includes('jpg')) ext = 'jpg';
    else if (lower.includes('webp')) ext = 'webp';
    return { type: 'image', ext, isImage: true, isPdf: false, isExcel: false, isWord: false, label: 'Image File' };
  }

  return { type: 'file', ext: 'bin', isImage: false, isPdf: false, isExcel: false, isWord: false, label: 'Document File' };
};

// Resilient Image Thumbnail with Broken-Link Fallback
const DocImageThumbnail: React.FC<{ url: string; alt: string }> = ({ url, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-3 text-center">
        <FileText size={24} className="text-slate-400 mb-1" />
        <span className="text-[11px] font-bold text-slate-700 block truncate max-w-full">
          {alt}
        </span>
        <span className="text-[9.5px] font-medium text-slate-500 block">
          Document File (Click to Inspect)
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
    />
  );
};

const FranchiseRequests = () => {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>(() => searchParams.get('tab') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Sync with searchParams on navigation from notification clicks
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setFilterStatus(tabParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  const [selectedApp, setSelectedApp] = useState<FranchiseApplication | null>(null);

  // Document Verification State (key: `${appId}_${docKey}`)
  const [verifiedDocs, setVerifiedDocs] = useState<Record<string, boolean>>({});

  // Full screen document preview & inspector state
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; docKey: string; appId: number; typeInfo?: any } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);

  // Approval Modal & Action State
  const [approvingApp, setApprovingApp] = useState<FranchiseApplication | null>(null);
  const [customCenterCode, setCustomCenterCode] = useState('');
  const [customPassword, setCustomPassword] = useState('108@Ajaydev');
  const [initialWallet, setInitialWallet] = useState(500);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [approvalResult, setApprovalResult] = useState<any | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certCenterData, setCertCenterData] = useState<any | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [zippingAppId, setZippingAppId] = useState<number | null>(null);
  const [zipProgressText, setZipProgressText] = useState<string>('');

  // Certificate Governance: Secondary Confirmation & Demanding Documents
  const [certApprovalTarget, setCertApprovalTarget] = useState<FranchiseApplication | null>(null);
  const [secondaryConfirmed, setSecondaryConfirmed] = useState(false);
  const [certApprovalNotes, setCertApprovalNotes] = useState('');
  const [certApproving, setCertApproving] = useState(false);

  const [certDemandTarget, setCertDemandTarget] = useState<FranchiseApplication | null>(null);
  const [demandedDocList, setDemandedDocList] = useState<string[]>([]);
  const [customDemandDoc, setCustomDemandDoc] = useState('');
  const [demandNotes, setDemandNotes] = useState('');
  const [certDemanding, setCertDemanding] = useState(false);

  const handleConfirmCertificateApproval = async (appId: number) => {
    if (!secondaryConfirmed) {
      alert('Please check the secondary verification confirmation box before issuing certificate.');
      return;
    }
    setCertApproving(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${appId}/approve-certificate`, {
        notes: certApprovalNotes
      });
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Center Authorization Certificate officially approved & issued!' });
        setCertApprovalTarget(null);
        setSecondaryConfirmed(false);
        setCertApprovalNotes('');
        fetchApplications();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve certificate.');
    } finally {
      setCertApproving(false);
    }
  };

  const handleSendDemandNotice = async (appId: number) => {
    if (demandedDocList.length === 0 && !demandNotes.trim()) {
      alert('Please select at least one demanded document or provide instructions in the demand notes.');
      return;
    }
    setCertDemanding(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${appId}/demand-certificate-docs`, {
        notes: demandNotes,
        demandedDocs: demandedDocList
      });
      if (res.data?.success) {
        setToast({ type: 'success', text: 'Document demand notice sent to Center Head successfully!' });
        setCertDemandTarget(null);
        setDemandedDocList([]);
        setDemandNotes('');
        fetchApplications();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send demand notice.');
    } finally {
      setCertDemanding(false);
    }
  };

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
    const fullUrl = getAssetUrl(url);
    const typeInfo = getDocTypeInfo(url);
    
    // Ensure filename ends with proper extension
    let finalFilename = filename;
    if (!finalFilename.includes('.')) {
      finalFilename = `${finalFilename}.${typeInfo.ext}`;
    }

    if (fullUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = finalFilename;
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
          a.download = finalFilename;
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

  const getAppDocuments = (app: FranchiseApplication) => {
    const getDocFilename = (firstName: string, label: string, url?: string | null) => {
      const safeName = (firstName || 'Applicant').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
      const typeInfo = getDocTypeInfo(url);
      return `${safeName}_${safeLabel}.${typeInfo.ext}`;
    };

    const list: Array<{ key: string; label: string; category: string; url?: string; filename: string }> = [
      { key: 'photo', label: 'Center Head Photo', category: 'Biometric Headshot', url: app.photo_url, filename: getDocFilename(app.center_head_first_name, 'Photo', app.photo_url) },
      { key: 'signature', label: 'Center Head Signature', category: 'Legal Signature', url: app.signature_url, filename: getDocFilename(app.center_head_first_name, 'Signature', app.signature_url) },
      { key: 'marksheet', label: 'Graduation Marksheet / Degree', category: 'Degree (Min. Graduate)', url: app.marksheet_url, filename: getDocFilename(app.center_head_first_name, 'Graduation_Marksheet', app.marksheet_url) },
      { key: 'aadhar_front', label: 'Aadhar Card (Front)', category: 'Identity Proof', url: app.aadhar_front_url, filename: getDocFilename(app.center_head_first_name, 'Aadhar_Front', app.aadhar_front_url) },
      { key: 'aadhar_back', label: 'Aadhar Card (Back)', category: 'Address Proof', url: app.aadhar_back_url, filename: getDocFilename(app.center_head_first_name, 'Aadhar_Back', app.aadhar_back_url) },
    ];

    let centerPhotos: string[] = [];
    if (app.center_photos_url) {
      if (app.center_photos_url.startsWith('[')) {
        try {
          const parsed = JSON.parse(app.center_photos_url);
          if (Array.isArray(parsed)) centerPhotos = parsed;
        } catch (_) { }
      } else if (!app.center_photos_url.includes('photos uploaded')) {
        centerPhotos = [app.center_photos_url];
      }
    }

    if (centerPhotos.length > 0) {
      centerPhotos.forEach((photoUrl, idx) => {
        list.push({
          key: `center_photo_${idx + 1}`,
          label: `Center Photo #${idx + 1}`,
          category: 'Premises Photos',
          url: photoUrl,
          filename: getDocFilename(app.center_head_first_name, `Center_Photo_${idx + 1}`, photoUrl)
        });
      });
    } else {
      list.push({
        key: 'center_photos',
        label: 'Center Infrastructure',
        category: 'Premises Photos',
        url: app.center_photos_url && !app.center_photos_url.includes('uploaded') ? app.center_photos_url : undefined,
        filename: getDocFilename(app.center_head_first_name, 'Center_Photos', app.center_photos_url)
      });
    }

    return list;
  };

  const handleDownloadAllDocs = async (app: FranchiseApplication) => {
    const docs = getAppDocuments(app);
    const uploadedDocs = docs.filter(d => !!d.url);
    if (uploadedDocs.length === 0) {
      alert('No uploaded KYC documents found for this application.');
      return;
    }

    setZippingAppId(app.id);
    setZipProgressText('Packaging Dossier ZIP...');
    try {
      await downloadFranchiseDossierZip(app, docs, verifiedDocs, (msg) => {
        setZipProgressText(msg);
      });
      setToast({
        type: 'success',
        text: `ZIP Archive created! Contains Dossier PDF & ${uploadedDocs.length} KYC documents.`
      });
    } catch (err: any) {
      console.error('Failed to create ZIP dossier:', err);
      setToast({
        type: 'error',
        text: 'Failed to create ZIP archive. Please try again.'
      });
    } finally {
      setZippingAppId(null);
      setZipProgressText('');
    }
  };

  const handleDownloadDossierPdfOnly = (app: FranchiseApplication) => {
    const docs = getAppDocuments(app);
    try {
      downloadFranchiseDossierPdf({
        id: app.id,
        center_head_first_name: app.center_head_first_name,
        center_head_middle_name: app.center_head_middle_name,
        center_head_last_name: app.center_head_last_name,
        father_first_name: app.father_first_name,
        father_middle_name: app.father_middle_name,
        father_last_name: app.father_last_name,
        phone: app.phone,
        email: app.email,
        aadhar_number: app.aadhar_number,
        pan_number: app.pan_number,
        dob: app.dob,
        gender: app.gender,
        marital_status: app.marital_status,
        qualification: app.qualification,
        center_name: app.center_name,
        address_line1: app.address_line1,
        address_line2: app.address_line2,
        city: app.city,
        district: app.district,
        state: app.state,
        pincode: app.pincode,
        status: app.status,
        created_at: app.created_at,
        documents: docs.map(d => ({
          key: d.key,
          label: d.label,
          category: d.category,
          isUploaded: !!d.url,
          isVerified: !!verifiedDocs[`${app.id}_${d.key}`],
          filename: d.filename
        }))
      });
      setToast({ type: 'success', text: `Downloaded Franchise Application Summary PDF for #${app.id}` });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setToast({ type: 'error', text: 'Failed to generate PDF dossier.' });
    }
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

    // Auto-sync instantly when a new franchise application arrives or certificate status changes
    const handleFranchiseSync = () => {
      fetchApplications();
    };
    window.addEventListener('franchise-updated', handleFranchiseSync);
    window.addEventListener('certificate-updated', handleFranchiseSync);

    return () => {
      window.removeEventListener('franchise-updated', handleFranchiseSync);
      window.removeEventListener('certificate-updated', handleFranchiseSync);
    };
  }, []);

  const handleApprove = async () => {
    if (!approvingApp) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/api/admin/franchise-requests/${approvingApp.id}/approve`, {
        centerCode: customCenterCode || undefined,
        initialWallet: Number(initialWallet) || 500,
        password: customPassword || undefined
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

  // Active vs Trash counts (memoized)
  const { activeApps, pendingCount, certClaimsCount, approvedCount, rejectedCount, trashCount } = useMemo(() => {
    const active = applications.filter((a) => a.status !== 'Trash');
    let pending = 0;
    let certClaims = 0;
    let approved = 0;
    let rejected = 0;
    let trash = 0;

    for (const a of applications) {
      if (a.status === 'Pending') pending++;
      else if (a.status === 'Approved') approved++;
      else if (a.status === 'Rejected') rejected++;
      else if (a.status === 'Trash') trash++;

      if (a.certificate_status === 'pending' || a.certificate_status === 'action_required') {
        certClaims++;
      }
    }

    return {
      activeApps: active,
      pendingCount: pending,
      certClaimsCount: certClaims,
      approvedCount: approved,
      rejectedCount: rejected,
      trashCount: trash
    };
  }, [applications]);

  // Filter & Search with debounced query (memoized)
  const filteredApplications = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();

    return applications.filter((app) => {
      let matchesStatus = false;
      if (filterStatus === 'all') {
        matchesStatus = app.status !== 'Trash';
      } else if (filterStatus === 'trash') {
        matchesStatus = app.status === 'Trash';
      } else if (filterStatus === 'cert_claims') {
        matchesStatus = app.certificate_status === 'pending' || app.certificate_status === 'action_required';
      } else {
        matchesStatus = app.status?.toLowerCase() === filterStatus.toLowerCase();
      }

      if (!matchesStatus) return false;
      if (!q) return true;

      const fullName = `${app.center_head_first_name} ${app.center_head_last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (app.center_code || '').toLowerCase().includes(q) ||
        (app.center_name || '').toLowerCase().includes(q) ||
        (app.phone || '').includes(q) ||
        (app.email || '').toLowerCase().includes(q) ||
        (app.district || '').toLowerCase().includes(q) ||
        (app.state || '').toLowerCase().includes(q)
      );
    });
  }, [applications, filterStatus, debouncedSearchQuery]);

  // Verify Captcha matching dynamically
  const captchaMatches = captchaInput.trim().toUpperCase() === zebtishCaptcha.trim().toUpperCase();

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border animate-in slide-in-from-top ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
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

        <div 
          onClick={() => setFilterStatus('cert_claims')}
          className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterStatus === 'cert_claims'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Award size={12} className="text-amber-600" />
              <span>Cert Claims</span>
            </span>
            {certClaimsCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{certClaimsCount}</div>
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
            { key: 'cert_claims', label: `Cert Claims (${certClaimsCount})`, icon: Award, highlight: certClaimsCount > 0 },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'rejected', label: `Rejected (${rejectedCount})` },
            { key: 'trash', label: `Trash (${trashCount})`, icon: Trash2 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${filterStatus === tab.key
                  ? tab.key === 'trash'
                    ? 'bg-rose-900 text-white shadow-xs'
                    : tab.key === 'cert_claims'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-indigo-900 text-white shadow-xs'
                  : tab.key === 'cert_claims' && certClaimsCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {tab.icon && <tab.icon size={13} />}
              <span>{tab.label}</span>
              {tab.key === 'cert_claims' && certClaimsCount > 0 && filterStatus !== 'cert_claims' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
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
                                src={getAssetUrl(app.photo_url)}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{app.center_name}</span>
                          {app.center_code && (
                            <span className="font-mono text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                              {app.center_code}
                            </span>
                          )}
                        </div>
                        {app.login_id && !app.center_code && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                              <Key size={10} className="text-amber-600" /> Desired ID: {app.login_id}
                            </span>
                          </div>
                        )}
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
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${app.status === 'Approved'
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

                          {app.status === 'Approved' && (
                            <>
                              {app.certificate_status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-xs animate-pulse">
                                  <Award size={10} /> Cert Claimed
                                </span>
                              )}
                              {app.certificate_status === 'action_required' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs">
                                  <AlertCircle size={10} /> Docs Demanded
                                </span>
                              )}
                              {app.certificate_status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                                  <ShieldCheck size={10} /> Cert Issued
                                </span>
                              )}
                              {(!app.certificate_status || app.certificate_status === 'unclaimed') && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  Unclaimed
                                </span>
                              )}
                            </>
                          )}
                        </div>
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
                                    setCustomCenterCode(app.login_id?.trim() || `EXAMc2026-${String(100 + app.id).padStart(3, '0')}`);
                                    if (app.proposed_password?.trim()) {
                                      setCustomPassword(app.proposed_password.trim());
                                    } else {
                                      setCustomPassword('108@Ajaydev');
                                    }
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

                              {app.status === 'Approved' && (
                                <>
                                  {app.certificate_status !== 'approved' ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setCertApprovalTarget(app);
                                          setSecondaryConfirmed(false);
                                          setCertApprovalNotes('');
                                        }}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                        title="Approve Center Authorization Certificate (Requires Secondary Confirmation)"
                                      >
                                        <Award size={13} />
                                        <span>Approve Cert</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setCertDemandTarget(app);
                                          setDemandedDocList([]);
                                          setDemandNotes(app.certificate_demand_notes || '');
                                        }}
                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                        title="Demand Additional Documents from Center"
                                      >
                                        <FileCheck size={13} />
                                        <span>Demand Docs</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setCertCenterData({
                                          id: app.center_id || app.id,
                                          centerName: app.center_name,
                                          centerCode: app.center_code || `EXAMc2026-${String(100 + app.id).padStart(3, '0')}`,
                                          headName: `${app.center_head_first_name} ${app.center_head_last_name}`,
                                          headPhoto: app.photo_url,
                                          email: app.email,
                                          phone: app.phone,
                                          address: app.address_line1,
                                          addressLine2: app.address_line2,
                                          city: app.city,
                                          district: app.district,
                                          state: app.state,
                                          pincode: app.pincode,
                                          certificateNumber: app.certificate_number || `EXAM-ATC-2026-${String(100 + app.id).padStart(4, '0')}`,
                                          issueDate: app.certificate_approved_date || app.created_at,
                                          validUntil: '2027-03-31'
                                        });
                                        setCertModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                      title="View Center Certificate"
                                    >
                                      <Award size={13} className="text-amber-600" />
                                      <span>Certificate</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Quick ZIP Dossier Download */}
                              <button
                                type="button"
                                onClick={() => handleDownloadAllDocs(app)}
                                disabled={zippingAppId === app.id}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Download Dossier Archive (ZIP containing PDF + all uploaded documents)"
                              >
                                {zippingAppId === app.id ? (
                                  <RefreshCw size={14} className="animate-spin text-amber-600" />
                                ) : (
                                  <FolderDown size={14} />
                                )}
                              </button>

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
            <div className="p-4 sm:p-5 bg-[#1e1b4b] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold shrink-0">
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
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">

              {/* Application Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${selectedApp.status === 'Approved'
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

              {/* Certificate Governance Status Card (for Approved Centers) */}
              {selectedApp.status === 'Approved' && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedApp.certificate_status === 'approved'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : selectedApp.certificate_status === 'pending'
                      ? 'bg-amber-50/80 border-amber-300'
                      : selectedApp.certificate_status === 'action_required'
                        ? 'bg-rose-50/80 border-rose-300'
                        : 'bg-indigo-50/60 border-indigo-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      selectedApp.certificate_status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selectedApp.certificate_status === 'pending'
                          ? 'bg-amber-100 text-amber-700 animate-pulse'
                          : selectedApp.certificate_status === 'action_required'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Award size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          Center Authorization & Affiliation Certificate
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          selectedApp.certificate_status === 'approved'
                            ? 'bg-emerald-200 text-emerald-900'
                            : selectedApp.certificate_status === 'pending'
                              ? 'bg-amber-200 text-amber-900'
                              : selectedApp.certificate_status === 'action_required'
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-slate-200 text-slate-700'
                        }`}>
                          {selectedApp.certificate_status === 'approved'
                            ? 'Approved & Issued'
                            : selectedApp.certificate_status === 'pending'
                              ? 'Claim Pending Super Admin Approval'
                              : selectedApp.certificate_status === 'action_required'
                                ? 'Documents Demanded'
                                : 'Unclaimed'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1">
                        {selectedApp.certificate_status === 'approved' ? (
                          <span>Official Certificate No: <strong className="font-mono text-emerald-800">{selectedApp.certificate_number || `EXAM-ATC-2026-${String(100 + selectedApp.id).padStart(4, '0')}`}</strong> • Approved on {selectedApp.certificate_approved_date ? new Date(selectedApp.certificate_approved_date).toLocaleDateString() : 'N/A'}.</span>
                        ) : selectedApp.certificate_status === 'pending' ? (
                          <span>Center Head requested certificate claim on {selectedApp.certificate_claim_date ? new Date(selectedApp.certificate_claim_date).toLocaleString() : 'recently'}. Please perform secondary confirmation or demand required documents.</span>
                        ) : selectedApp.certificate_status === 'action_required' ? (
                          <span>Super Admin has demanded documents from center. Notes: <em className="text-rose-800">"{selectedApp.certificate_demand_notes || 'Pending required documents'}"</em></span>
                        ) : (
                          <span>Center has not yet submitted an affiliation certificate claim request. Super Admin can still approve directly.</span>
                        )}
                      </p>

                      {/* If documents demanded, show pill list */}
                      {selectedApp.certificate_demanded_docs && (
                        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Demanded:</span>
                          {(() => {
                            try {
                              const list = JSON.parse(selectedApp.certificate_demanded_docs);
                              if (Array.isArray(list)) {
                                return list.map((doc: string, idx: number) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200">
                                    {doc}
                                  </span>
                                ));
                              }
                            } catch (e) {}
                            return <span className="text-[10px] text-rose-700">{selectedApp.certificate_demanded_docs}</span>;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action buttons right in the card */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedApp.certificate_status !== 'approved' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCertApprovalTarget(selectedApp);
                            setSecondaryConfirmed(false);
                            setCertApprovalNotes('');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Award size={14} />
                          <span>Approve Cert</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCertDemandTarget(selectedApp);
                            setDemandedDocList([]);
                            setDemandNotes(selectedApp.certificate_demand_notes || '');
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileCheck size={14} />
                          <span>Demand Docs</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCertCenterData({
                            id: selectedApp.center_id || selectedApp.id,
                            centerName: selectedApp.center_name,
                            centerCode: selectedApp.center_code || `EXAMc2026-${String(100 + selectedApp.id).padStart(3, '0')}`,
                            headName: `${selectedApp.center_head_first_name} ${selectedApp.center_head_last_name}`,
                            headPhoto: selectedApp.photo_url,
                            email: selectedApp.email,
                            phone: selectedApp.phone,
                            address: selectedApp.address_line1,
                            addressLine2: selectedApp.address_line2,
                            city: selectedApp.city,
                            district: selectedApp.district,
                            state: selectedApp.state,
                            pincode: selectedApp.pincode,
                            certificateNumber: selectedApp.certificate_number || `EXAM-ATC-2026-${String(100 + selectedApp.id).padStart(4, '0')}`,
                            issueDate: selectedApp.certificate_approved_date || selectedApp.created_at,
                            validUntil: '2027-03-31'
                          });
                          setCertModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Award size={14} />
                        <span>View Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Qualification</span>
                    <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <GraduationCap size={13} className="text-emerald-600" />
                      <span>{selectedApp.qualification || 'Graduate'}</span>
                    </div>
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

              {/* Requested Portal Login Credentials */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={15} className="text-amber-600" />
                  <span>Applicant's Requested Portal Credentials</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs">
                  <div>
                    <span className="text-[10px] text-amber-800 font-semibold block">Requested Center Login ID</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5 text-sm flex items-center gap-2">
                      <span>{selectedApp.login_id || 'Not specified (auto-assigned)'}</span>
                      {selectedApp.login_id && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Ready for Approval
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-800 font-semibold block">Requested Login Password</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                      {selectedApp.proposed_password || 'Not specified (auto-assigned)'}
                    </div>
                  </div>
                  <div className="sm:col-span-2 text-[11px] text-amber-900/90 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/60">
                    ℹ️ <strong>Super Admin Note:</strong> These credentials were submitted by the applicant. When you approve this application, the center account will be provisioned with this ID and password, allowing the center director to log in immediately.
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
                      onClick={() => handleDownloadDossierPdfOnly(selectedApp)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-xs"
                      title="Download Official Application Summary PDF"
                    >
                      <FileText size={14} className="text-rose-600" />
                      <span>Dossier PDF</span>
                    </button>

                    <button
                      type="button"
                      disabled={zippingAppId === selectedApp.id}
                      onClick={() => handleDownloadAllDocs(selectedApp)}
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
                        zippingAppId === selectedApp.id
                          ? 'bg-amber-50 border-amber-300 text-amber-800 cursor-wait'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}
                      title="Download complete ZIP archive containing application PDF and all uploaded documents"
                    >
                      {zippingAppId === selectedApp.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-amber-600" />
                          <span>{zipProgressText || 'Packaging ZIP...'}</span>
                        </>
                      ) : (
                        <>
                          <FolderDown size={14} className="text-indigo-600" />
                          <span>Download All Files (ZIP + PDF)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 6-Document Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {getAppDocuments(selectedApp).map((doc) => {
                    const isVerified = !!verifiedDocs[`${selectedApp.id}_${doc.key}`];
                    const hasDoc = !!doc.url;
                    const fullDocUrl = hasDoc ? getAssetUrl(doc.url) : null;

                    return (
                      <div
                        key={doc.key}
                        className={`bg-slate-50/80 rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 ${isVerified ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
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
                            (() => {
                              const typeInfo = getDocTypeInfo(doc.url);
                              if (typeInfo.isPdf) {
                                return (
                                  <div className="w-full h-full bg-rose-50/90 flex flex-col items-center justify-center p-3 text-center transition-all group-hover:scale-102">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-rose-200 flex items-center justify-center text-rose-600 mb-1.5">
                                      <FileText size={22} className="stroke-[2.2]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-rose-900 block truncate max-w-full">
                                      PDF Document
                                    </span>
                                    <span className="text-[9.5px] font-medium text-rose-600 block mt-0.5">
                                      Click to View / Read
                                    </span>
                                  </div>
                                );
                              }
                              if (typeInfo.isExcel) {
                                return (
                                  <div className="w-full h-full bg-emerald-50/90 flex flex-col items-center justify-center p-3 text-center transition-all group-hover:scale-102">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-emerald-200 flex items-center justify-center text-emerald-600 mb-1.5">
                                      <Table size={22} className="stroke-[2.2]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-900 block truncate max-w-full">
                                      Excel Spreadsheet
                                    </span>
                                    <span className="text-[9.5px] font-medium text-emerald-600 block mt-0.5">
                                      .xlsx Document File
                                    </span>
                                  </div>
                                );
                              }
                              if (typeInfo.isWord) {
                                return (
                                  <div className="w-full h-full bg-blue-50/90 flex flex-col items-center justify-center p-3 text-center transition-all group-hover:scale-102">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-blue-200 flex items-center justify-center text-blue-600 mb-1.5">
                                      <FileText size={22} className="stroke-[2.2]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-900 block truncate max-w-full">
                                      Word Document
                                    </span>
                                    <span className="text-[9.5px] font-medium text-blue-600 block mt-0.5">
                                      .docx Document File
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <DocImageThumbnail
                                  url={fullDocUrl!}
                                  alt={doc.label}
                                />
                              );
                            })()
                          ) : (
                            <div className="text-center text-slate-400 p-4 space-y-1">
                              <FileText size={22} className="mx-auto text-slate-300" />
                              <span className="text-[10px] font-medium block">Document Not Uploaded</span>
                            </div>
                          )}

                          {/* Hover Action Overlay */}
                          {hasDoc && (
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10 backdrop-blur-[1px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewDoc({ url: fullDocUrl!, title: doc.label, docKey: doc.key, appId: selectedApp.id, typeInfo: getDocTypeInfo(doc.url) });
                                  setZoomScale(1);
                                  setRotationDeg(0);
                                }}
                                className="p-2 rounded-xl bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 shadow-md cursor-pointer transition-colors"
                                title="Zoom & Inspect Document"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(doc.url!, doc.filename)}
                                className="p-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 shadow-md cursor-pointer transition-colors"
                                title="Download File"
                              >
                                <Download size={15} />
                              </button>
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
                                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${isVerified
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
                                onClick={() => handleDownloadFile(doc.url!, doc.filename)}
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

              {/* 4. Center Resubmitted Verification Documents (Response to Demand Notice) */}
              {selectedApp.certificate_uploaded_docs && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <UploadCloud size={16} className="text-amber-600" />
                        <span>Center Resubmitted Verification Documents (Response to Demand)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Documents uploaded directly by Center Head to fulfill accreditation requirements.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <FileCheck size={11} className="text-amber-700" />
                      <span>Resubmitted Files</span>
                    </span>
                  </div>

                  {/* Resubmitted Documents Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {(() => {
                      let docsArray: { key: string; label: string; url: string }[] = [];
                      try {
                        const parsed = typeof selectedApp.certificate_uploaded_docs === 'string'
                          ? JSON.parse(selectedApp.certificate_uploaded_docs)
                          : selectedApp.certificate_uploaded_docs;
                        if (Array.isArray(parsed)) {
                          docsArray = parsed.map((item: any, idx: number) => ({
                            key: item.key || `doc_${idx}`,
                            label: item.label || item.name || `Document #${idx + 1}`,
                            url: item.url || item
                          }));
                        } else if (typeof parsed === 'object' && parsed !== null) {
                          docsArray = Object.entries(parsed).map(([key, val]: [string, any]) => ({
                            key,
                            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            url: typeof val === 'string' ? val : val?.url || ''
                          }));
                        }
                      } catch (e) {}

                      if (docsArray.length === 0) {
                        return <div className="text-xs text-slate-500 italic p-3">No files parsed.</div>;
                      }

                      return docsArray.map((rdoc, idx) => {
                        const fullUrl = getAssetUrl(rdoc.url);
                        const isPdf = (rdoc.url || '').toLowerCase().endsWith('.pdf');

                        return (
                          <div key={idx} className="bg-amber-50/50 rounded-2xl p-3.5 border border-amber-200 flex flex-col justify-between gap-3 shadow-xs">
                            <div>
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                                Demanded Upload #{idx + 1}
                              </span>
                              <div className="font-bold text-slate-900 text-xs mt-0.5">{rdoc.label}</div>
                            </div>

                            <div className="w-full h-32 rounded-xl overflow-hidden border border-amber-200 bg-white relative group flex items-center justify-center">
                              {isPdf ? (
                                <div className="text-center p-3">
                                  <FileText size={32} className="mx-auto text-rose-500 mb-1" />
                                  <span className="text-[10px] font-bold text-slate-700 block">PDF Document</span>
                                </div>
                              ) : (
                                <img src={fullUrl} alt={rdoc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              )}
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewDoc({ url: fullUrl, title: rdoc.label, docKey: rdoc.key, appId: selectedApp.id });
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
                                  onClick={() => handleDownloadFile(rdoc.url, `${selectedApp.center_name}_${rdoc.key}`)}
                                  className="p-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 shadow-md cursor-pointer transition-colors"
                                  title="Download File"
                                >
                                  <Download size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
                              <span className="text-[10px] text-amber-900 font-medium">Uploaded by Center</span>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(rdoc.url, `${selectedApp.center_name}_${rdoc.key}`)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Download size={11} />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  Close
                </button>

                {selectedApp.status !== 'Trash' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const appToDel = selectedApp;
                      setSelectedApp(null);
                      openDeleteModal(appToDel, 'soft');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 size={13} className="shrink-0" />
                    <span>Move to Trash</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleRestore(selectedApp.id);
                      setSelectedApp(null);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw size={13} className="shrink-0" />
                    <span>Restore Application</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {selectedApp.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer text-center whitespace-nowrap"
                    >
                      Reject Application
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApprovingApp(selectedApp);
                        setCustomCenterCode(selectedApp.login_id?.trim() || `EXAMc2026-${String(100 + selectedApp.id).padStart(3, '0')}`);
                        if (selectedApp.proposed_password?.trim()) {
                          setCustomPassword(selectedApp.proposed_password.trim());
                        } else {
                          setCustomPassword('108@Ajaydev');
                        }
                        setInitialWallet(500);
                        setApprovalResult(null);
                      }}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>Approve & Create Center</span>
                    </button>
                  </>
                )}

                {selectedApp.status === 'Approved' && (
                  <>
                    {selectedApp.certificate_status !== 'approved' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCertDemandTarget(selectedApp);
                            setDemandedDocList([]);
                            setDemandNotes(selectedApp.certificate_demand_notes || '');
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileCheck size={14} className="shrink-0" />
                          <span>Demand Documents</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCertApprovalTarget(selectedApp);
                            setSecondaryConfirmed(false);
                            setCertApprovalNotes('');
                          }}
                          className="w-full sm:w-auto justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Award size={14} className="shrink-0" />
                          <span>Approve Certificate</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCertCenterData({
                            id: selectedApp.center_id || selectedApp.id,
                            centerName: selectedApp.center_name,
                            centerCode: selectedApp.center_code || `EXAMc2026-${String(100 + selectedApp.id).padStart(3, '0')}`,
                            headName: `${selectedApp.center_head_first_name} ${selectedApp.center_head_last_name}`,
                            headPhoto: selectedApp.photo_url,
                            email: selectedApp.email,
                            phone: selectedApp.phone,
                            address: selectedApp.address_line1,
                            addressLine2: selectedApp.address_line2,
                            city: selectedApp.city,
                            district: selectedApp.district,
                            state: selectedApp.state,
                            pincode: selectedApp.pincode,
                            certificateNumber: selectedApp.certificate_number || `EXAM-ATC-2026-${String(100 + selectedApp.id).padStart(4, '0')}`,
                            issueDate: selectedApp.certificate_approved_date || selectedApp.created_at,
                            validUntil: '2027-03-31'
                          });
                          setCertModalOpen(true);
                        }}
                        className="w-full sm:w-auto justify-center px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Award size={14} className="shrink-0" />
                        <span>View Center Certificate</span>
                      </button>
                    )}
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
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${verifiedDocs[`${previewDoc.appId}_${previewDoc.docKey}`]
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
                  onClick={() => {
                    const docType = previewDoc.typeInfo || getDocTypeInfo(previewDoc.url);
                    handleDownloadFile(previewDoc.url, `${previewDoc.title.replace(/\s+/g, '_')}.${docType.ext}`);
                  }}
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

            {/* Document Image Zoom / PDF Iframe / Doc Card Area */}
            <div className="p-6 overflow-auto flex items-center justify-center flex-1 min-h-[50vh] max-h-[85vh] bg-slate-950/60">
              {(() => {
                const typeInfo = previewDoc.typeInfo || getDocTypeInfo(previewDoc.url);
                if (typeInfo.isPdf) {
                  return (
                    <div className="w-full h-[75vh] flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                      <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                          <FileText size={15} className="text-rose-400" />
                          <span>Interactive PDF Viewer</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(previewDoc.url, `${previewDoc.title.replace(/\s+/g, '_')}.pdf`)}
                          className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Download size={13} /> Open / Download Original PDF
                        </button>
                      </div>
                      <iframe
                        src={previewDoc.url}
                        title={previewDoc.title}
                        className="w-full flex-1 bg-white border-0"
                      />
                    </div>
                  );
                }
                if (typeInfo.isExcel || typeInfo.isWord || !typeInfo.isImage) {
                  return (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center space-y-4 shadow-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center shadow-inner">
                        {typeInfo.isExcel ? (
                          <Table size={32} className="text-emerald-400" />
                        ) : typeInfo.isWord ? (
                          <FileText size={32} className="text-blue-400" />
                        ) : (
                          <FileText size={32} className="text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-base">{previewDoc.title}</h5>
                        <p className="text-xs text-slate-400 mt-1">
                          {typeInfo.label} • Uploaded Document Proof
                        </p>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed text-left">
                        This file is formatted as an <strong>{typeInfo.label} ({typeInfo.ext.toUpperCase()})</strong>. You can download and open it directly with Microsoft Office / Excel / document reader to inspect the complete content.
                      </p>
                      <div className="pt-2 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(previewDoc.url, `${previewDoc.title.replace(/\s+/g, '_')}.${typeInfo.ext}`)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download size={15} />
                          <span>Download &amp; Open {typeInfo.ext.toUpperCase()} File</span>
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    style={{
                      transform: `scale(${zoomScale}) rotate(${rotationDeg}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                  />
                );
              })()}
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
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <Check size={18} className="text-emerald-600 stroke-[3]" />
                    <span>Study Center Successfully Created & Activated!</span>
                  </div>

                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Accreditation and Login credentials for <strong>{approvalResult.centerName}</strong> have been generated. You can share these credentials directly with the Center Director.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-emerald-200 text-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Center Code (Login ID)</span>
                      <span className="font-mono font-black text-xs text-indigo-950">{approvalResult.centerCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Portal Password</span>
                      <span className="font-mono font-black text-xs text-emerald-800">{approvalResult.plainPassword || approvalResult.defaultPassword}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Director Name</span>
                      <span className="font-bold text-xs truncate block">{approvalResult.headName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Certificate No</span>
                      <span className="font-mono font-bold text-[11px] text-slate-700 truncate block">{approvalResult.certificateNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Sharing and Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `*EXAMIRROR EDUTECH - STUDY CENTER ACTIVATION*\n\n` +
                        `Dear ${approvalResult.headName},\n` +
                        `Congratulations! Your center *${approvalResult.centerName}* has been officially approved & accredited by Examirror Edutech Private Limited.\n\n` +
                        `🔑 *Center Login ID:* ${approvalResult.centerCode}\n` +
                        `🔐 *Password:* ${approvalResult.plainPassword || approvalResult.defaultPassword}\n` +
                        `📜 *Certificate ID:* ${approvalResult.certificateNumber}\n\n` +
                        `👉 *Login Portal URL:*\n${window.location.origin}/login\n\n` +
                        `You can login to your Center Dashboard and download your Official Center Affiliation Certificate anytime!`;
                      navigator.clipboard.writeText(text);
                      setCopiedCreds(true);
                      setTimeout(() => setCopiedCreds(false), 2500);
                    }}
                    className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCreds ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedCreds ? 'Copied Details!' : 'Copy Credentials'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `*EXAMIRROR EDUTECH - STUDY CENTER ACTIVATION*\n\n` +
                        `Dear ${approvalResult.headName},\n` +
                        `Congratulations! Your center *${approvalResult.centerName}* has been officially approved & accredited by Examirror Edutech Private Limited.\n\n` +
                        `🔑 *Center Login ID:* ${approvalResult.centerCode}\n` +
                        `🔐 *Password:* ${approvalResult.plainPassword || approvalResult.defaultPassword}\n` +
                        `📜 *Certificate ID:* ${approvalResult.certificateNumber}\n\n` +
                        `👉 *Login Portal URL:*\n${window.location.origin}/login\n\n` +
                        `Please login to your Center Dashboard to claim your Affiliation Certificate.`;
                      const phoneClean = (approvalResult.phone || '').replace(/[^0-9]/g, '');
                      const targetPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
                      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Share2 size={14} />
                    <span>WhatsApp Share</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCertCenterData(approvalResult);
                    setCertModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Award size={15} />
                  <span>View & Download Center Certificate</span>
                </button>

                <button
                  onClick={() => {
                    setApprovingApp(null);
                    setApprovalResult(null);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {approvingApp && (approvingApp.login_id || approvingApp.proposed_password) && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-amber-900 flex items-center gap-1.5">
                        <Key size={13} className="text-amber-600" />
                        Applicant's Requested Credentials
                      </span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                        Pre-filled
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2 rounded-lg border border-amber-100">
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Desired ID</span>
                        <span className="font-mono font-bold text-slate-800">{approvingApp.login_id || 'Auto-code'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Desired Password</span>
                        <span className="font-mono font-bold text-slate-800">{approvingApp.proposed_password || 'System-default'}</span>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-amber-800 leading-snug">
                      Approving will provision and activate this study center with these credentials.
                    </p>
                  </div>
                )}

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
                  <label className="font-bold text-slate-700 block mb-1">Center Login Password</label>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter password (e.g. Exam@2026)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Secure credentials for Center Admin portal login</span>
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

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovingApp(null)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full sm:w-auto justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {actionLoading && <RefreshCw size={13} className="animate-spin shrink-0" />}
                    <span>Confirm & Activate Center</span>
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
            <div className="p-4 sm:p-5 bg-[#0f172a] border-b border-rose-900 text-white flex items-center justify-between">
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
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${deleteMode === 'soft'
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
                    className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${deleteMode === 'permanent'
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
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider outline-none transition-all ${captchaMatches
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
                      className={`px-5 py-2.5 font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all ${captchaMatches && !deleteProcessing
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

      {/* SECONDARY CERTIFICATE APPROVAL MODAL */}
      {certApprovalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#0f172a] border-b border-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Secondary Confirmation Required</h3>
                  <p className="text-[11px] text-emerald-300">
                    Center Authorization & Affiliation Certificate Issue
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCertApprovalTarget(null);
                  setSecondaryConfirmed(false);
                }}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Center Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Center</span>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    EXAMc2026-{String(100 + certApprovalTarget.id).padStart(3, '0')}
                  </span>
                </div>
                <div className="font-black text-base text-slate-900">{certApprovalTarget.center_name}</div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                  <span>Head: <strong>{certApprovalTarget.center_head_first_name} {certApprovalTarget.center_head_last_name}</strong></span>
                  <span>•</span>
                  <span>{certApprovalTarget.city}, {certApprovalTarget.state}</span>
                  <span>•</span>
                  <span>{certApprovalTarget.phone}</span>
                </div>
              </div>

              {/* Security Audit Verification Points */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Mandatory Compliance Audit Verification
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Center head biometric KYC & identity proof authenticated</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Center physical infrastructure & computer lab capacity audited</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Examirror National Accreditation terms & regulations accepted</span>
                  </div>
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Approval Notes / Verification Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={certApprovalNotes}
                  onChange={(e) => setCertApprovalNotes(e.target.value)}
                  placeholder="e.g., Physical site audit completed, lease deed and lab photos validated. Authorized for official affiliation."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              {/* Secondary Confirmation Checkbox */}
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secondaryConfirmed}
                    onChange={(e) => setSecondaryConfirmed(e.target.checked)}
                    className="w-5 h-5 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <div className="text-xs text-amber-950 font-medium leading-relaxed">
                    <strong className="font-bold text-amber-900 block mb-0.5">
                      Secondary Super Admin Confirmation
                    </strong>
                    I formally certify that I have reviewed the franchise dossier, verified the center's credentials, and officially authorize the release of the <strong>Center Authorization & Affiliation Certificate</strong> for public and center display.
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCertApprovalTarget(null);
                  setSecondaryConfirmed(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!secondaryConfirmed || certApproving}
                onClick={() => handleConfirmCertificateApproval(certApprovalTarget.id)}
                className={`w-full sm:w-auto justify-center px-5 py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all whitespace-nowrap ${
                  secondaryConfirmed && !certApproving
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {certApproving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Issuing Certificate...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Confirm & Issue Affiliation Certificate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEMAND DOCUMENTS MODAL */}
      {certDemandTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#0f172a] border-b border-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <FileCheck size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Demand Required Documents</h3>
                  <p className="text-[11px] text-amber-300">
                    Request missing or clearer verification documents before issuing certificate
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCertDemandTarget(null);
                  setDemandedDocList([]);
                }}
                className="text-slate-400 hover:text-white text-2xl font-bold cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Target Center Info */}
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Target Center</span>
                  <span className="font-bold text-slate-900">{certDemandTarget.center_name}</span>
                  <span className="text-slate-500 ml-2">({certDemandTarget.center_head_first_name} {certDemandTarget.center_head_last_name})</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  EXAMc2026-{String(100 + certDemandTarget.id).padStart(3, '0')}
                </span>
              </div>

              {/* Preset Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Select Demanded Documents (Center Head will see this checklist to upload)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    'Electricity / Utility Bill for Center Premises',
                    'Clear / Higher Resolution Head Marksheet',
                    'Commercial Rent Agreement / Lease Deed',
                    'Police Verification / NOC Document',
                    'Clear Aadhar Card (Both Sides HD Scan)',
                    'Classroom & Computer Lab Geo-tagged Photos',
                    'Fire & Safety Clearance Certificate',
                    'Bank Passbook / Cancelled Cheque'
                  ].map((presetDoc) => {
                    const isSelected = demandedDocList.includes(presetDoc);
                    return (
                      <button
                        key={presetDoc}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDemandedDocList(demandedDocList.filter(d => d !== presetDoc));
                          } else {
                            setDemandedDocList([...demandedDocList, presetDoc]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isSelected ? 'bg-amber-500 border-amber-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-[11px] leading-tight">{presetDoc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Document Requirement */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Add Custom Document Requirement (Optional)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Trade License, Affidavit, Stamp Paper..."
                    value={customDemandDoc}
                    onChange={(e) => setCustomDemandDoc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customDemandDoc.trim()) {
                        e.preventDefault();
                        if (!demandedDocList.includes(customDemandDoc.trim())) {
                          setDemandedDocList([...demandedDocList, customDemandDoc.trim()]);
                        }
                        setCustomDemandDoc('');
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customDemandDoc.trim()) {
                        if (!demandedDocList.includes(customDemandDoc.trim())) {
                          setDemandedDocList([...demandedDocList, customDemandDoc.trim()]);
                        }
                        setCustomDemandDoc('');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Instructions & Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Instructions for Center Head (Visible Prominently on Center Dashboard)
                </label>
                <textarea
                  rows={3}
                  value={demandNotes}
                  onChange={(e) => setDemandNotes(e.target.value)}
                  placeholder="e.g., Please upload clear color scans of your commercial lease deed and recent electricity bill showing center name for affiliation clearance."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              {/* Selected Summary Pill */}
              {demandedDocList.length > 0 && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase">Selected Demanded Checklist ({demandedDocList.length}):</span>
                  <div className="flex flex-wrap gap-1">
                    {demandedDocList.map((doc, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-amber-300 text-amber-900 flex items-center gap-1">
                        <span>{doc}</span>
                        <button
                          type="button"
                          onClick={() => setDemandedDocList(demandedDocList.filter((_, i) => i !== idx))}
                          className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                ℹ️ When sent, this will immediately flag the center as <strong>"Action Required"</strong>. The Center Head's dashboard will display an urgent alert and unlock the document upload portal.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCertDemandTarget(null);
                  setDemandedDocList([]);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={certDemanding || (demandedDocList.length === 0 && !demandNotes.trim())}
                onClick={() => handleSendDemandNotice(certDemandTarget.id)}
                className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                  !certDemanding && (demandedDocList.length > 0 || demandNotes.trim())
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-amber-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {certDemanding ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sending Demand Notice...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Document Demand Notice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTER AFFILIATION CERTIFICATE MODAL */}
      {certModalOpen && (
        <Suspense fallback={null}>
          <CenterCertificateModal
            center={certCenterData}
            isOpen={certModalOpen}
            onClose={() => setCertModalOpen(false)}
          />
        </Suspense>
      )}

    </div>
  );
};

export default FranchiseRequests;

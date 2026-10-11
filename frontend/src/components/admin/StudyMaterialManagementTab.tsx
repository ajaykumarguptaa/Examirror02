import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  BookOpen, Plus, Search, Filter, CheckCircle2, XCircle, AlertCircle,
  IndianRupee, Calendar, Clock, Award, Layers, Check, X, Upload, Eye,
  Trash2, Edit, RotateCcw, ShieldCheck, Building2, UserCheck, Sparkles,
  ArrowRight, CalendarClock, Send, FileEdit, Clock3, FileText, QrCode,
  Lock, Download, CheckSquare, Square, Share2, Users, ShoppingBag,
  Code, FileCode, Globe, File
} from 'lucide-react';
import { AntiPiracyStudyMaterialModal } from '../AntiPiracyStudyMaterialModal';

export const StudyMaterialManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [subTab, setSubTab] = useState<'materials' | 'purchases'>('materials');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED'>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'CENTER_PURCHASE' | 'STUDENT_DIRECT' | 'BOTH'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewMaterialId, setPreviewMaterialId] = useState<number | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<any | null>(null);
  const [htmlEditorTab, setHtmlEditorTab] = useState<'editor' | 'preview'>('editor');

  // Center search in modal
  const [centerSearch, setCenterSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'IT & Computer',
    description: '',
    file_type: 'PDF',
    file_size: '2.5 MB',
    file_url: '',
    content_text: '',
    is_free: 1,
    price: 0,
    center_price: 0,
    student_price: 0,
    center_distribute_price: 20,
    payment_qr_id: '',
    target_audience: 'CENTER_PURCHASE' as 'CENTER_PURCHASE' | 'STUDENT_DIRECT' | 'BOTH',
    publish_scope: 'ALL_CENTRES',
    course_id: '',
    allowed_centre_ids: [] as number[],
    status: 'PUBLISHED',
    scheduled_publish_time: '',
    watermark_enabled: 1
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Queries
  const { data: materials = [], isLoading: isMatLoading } = useQuery({
    queryKey: ['admin-study-materials', statusFilter, categoryFilter],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:3000/api/study-materials/admin/all?status=${statusFilter}&category=${categoryFilter}`);
      return res.data?.data || [];
    }
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['admin-study-purchases'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/api/study-materials/admin/purchases');
      return res.data?.data || [];
    }
  });

  const { data: centers = [] } = useQuery({
    queryKey: ['all-centers-list'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/api/center/all');
      return res.data?.data || [];
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['all-courses-list'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/api/public/courses');
      return res.data?.data || [];
    }
  });

  const { data: qrs = [] } = useQuery({
    queryKey: ['admin-payment-qrs'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:3000/api/admin/payment-qrs');
      return res.data?.data || [];
    }
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const cleanPayload = {
        ...payload,
        course_id: payload.course_id && Number(payload.course_id) > 0 ? Number(payload.course_id) : null,
        payment_qr_id: payload.payment_qr_id && Number(payload.payment_qr_id) > 0 ? Number(payload.payment_qr_id) : null,
        price: Number(payload.price || 0),
        center_price: Number(payload.center_price || 0),
        student_price: Number(payload.student_price || 0),
        center_distribute_price: Number(payload.center_distribute_price || 20),
        is_free: Number(payload.is_free) === 1 ? 1 : 0
      };
      if (editingItem?.id) {
        return axios.put(`http://localhost:3000/api/study-materials/admin/${editingItem.id}`, cleanPayload);
      }
      return axios.post('http://localhost:3000/api/study-materials/admin/create', cleanPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-study-materials'] });
      setIsModalOpen(false);
      setEditingItem(null);
      showToast('success', editingItem ? 'Study material updated successfully!' : 'Study material created successfully!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to save material.');
    }
  });

  const publishNowMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.post(`http://localhost:3000/api/study-materials/admin/publish-now/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-study-materials'] });
      showToast('success', 'Study material is now live!');
    }
  });

  const draftMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.post(`http://localhost:3000/api/study-materials/admin/move-to-draft/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-study-materials'] });
      showToast('success', 'Material moved to draft (hidden).');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`http://localhost:3000/api/study-materials/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-study-materials'] });
      setDeletingTarget(null);
      showToast('success', 'Material deleted successfully.');
    }
  });

  const verifyPurchaseMutation = useMutation({
    mutationFn: async ({ id, status, reason, buyerType }: { id: number; status: 'APPROVED' | 'REJECTED'; reason?: string; buyerType: string }) => {
      return axios.put(`http://localhost:3000/api/study-materials/admin/purchases/${id}/verify`, {
        status,
        rejectionReason: reason,
        buyerType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-study-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-study-materials'] });
      showToast('success', 'Purchase status updated.');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isDoc = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

    const determinedType = isHtml ? 'HTML' : isPdf ? 'PDF' : isDoc ? 'DOCX' : 'PDF';

    if (isHtml) {
      // Read HTML file as raw HTML text into content_text for direct live rendering and editing
      const textReader = new FileReader();
      textReader.onload = (event) => {
        const htmlText = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          content_text: htmlText || prev.content_text,
          file_type: 'HTML',
          file_size: sizeInMb,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "")
        }));
      };
      textReader.readAsText(file);
    }

    const dataReader = new FileReader();
    dataReader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        file_url: base64,
        file_size: sizeInMb,
        file_type: determinedType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    };
    dataReader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'IT & Computer',
      description: '',
      file_type: 'PDF',
      file_size: '2.5 MB',
      file_url: '',
      content_text: '',
      is_free: 1,
      price: 0,
      center_price: 0,
      student_price: 0,
      center_distribute_price: 20,
      payment_qr_id: qrs[0]?.id ? String(qrs[0].id) : '',
      target_audience: 'CENTER_PURCHASE',
      publish_scope: 'ALL_CENTRES',
      course_id: '',
      allowed_centre_ids: [],
      status: 'PUBLISHED',
      scheduled_publish_time: '',
      watermark_enabled: 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'IT & Computer',
      description: item.description || '',
      file_type: item.file_type || 'PDF',
      file_size: item.file_size || '2.5 MB',
      file_url: item.file_url || '',
      content_text: item.content_text || '',
      is_free: Number(item.is_free) === 1 ? 1 : 0,
      price: Number(item.price || 0),
      center_price: Number(item.center_price || item.price || 0),
      student_price: Number(item.student_price || item.price || 0),
      center_distribute_price: Number(item.center_distribute_price || 20),
      payment_qr_id: item.payment_qr_id ? String(item.payment_qr_id) : '',
      target_audience: item.target_audience || 'CENTER_PURCHASE',
      publish_scope: item.publish_scope || 'ALL_CENTRES',
      course_id: item.course_id ? String(item.course_id) : '',
      allowed_centre_ids: item.allowed_centre_ids || [],
      status: item.status || 'PUBLISHED',
      scheduled_publish_time: item.scheduled_publish_time ? new Date(item.scheduled_publish_time).toISOString().slice(0, 16) : '',
      watermark_enabled: Number(item.watermark_enabled) === 1 ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const toggleCenter = (centerId: number) => {
    setFormData((prev) => {
      const exists = prev.allowed_centre_ids.includes(centerId);
      return {
        ...prev,
        allowed_centre_ids: exists
          ? prev.allowed_centre_ids.filter((id) => id !== centerId)
          : [...prev.allowed_centre_ids, centerId]
      };
    });
  };

  const selectAllCenters = () => {
    setFormData((prev) => ({
      ...prev,
      allowed_centre_ids: centers.map((c: any) => c.id)
    }));
  };

  const deselectAllCenters = () => {
    setFormData((prev) => ({
      ...prev,
      allowed_centre_ids: []
    }));
  };

  const filteredMaterials = materials.filter((m: any) => {
    if (audienceFilter !== 'ALL' && m.target_audience !== audienceFilter) return false;
    if (!search.trim()) return true;
    return (
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.category?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredCenters = centers.filter((c: any) => {
    if (!centerSearch.trim()) return true;
    return (
      c.name?.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.center_code?.toLowerCase().includes(centerSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(centerSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-800' : 'bg-rose-950 text-rose-100 border-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100">
              Examirror E-Notes Suite
            </span>
            <span className="text-xs text-slate-500 font-medium">Split Publishing (Centers vs Particular Center Students)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Study Materials & E-Notes Publishing Hub
          </h2>
          <p className="text-xs text-slate-500">
            Publish notes for Study Centers (B2B bulk purchase & student distribution) or publish directly to particular Center Students.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
          >
            <Plus size={15} />
            <span>Create & Publish Note</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('materials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'materials'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Study Materials ({materials.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'purchases'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Purchase & Distribution Logs</span>
          {purchases.filter((p: any) => p.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full">
              {purchases.filter((p: any) => p.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'materials' ? (
        <>
          {/* Status Filter Tabs & Publishing Mode Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'All Notes', count: materials.length },
                { id: 'PUBLISHED', label: 'Published (Live)', count: materials.filter((s: any) => s.status === 'PUBLISHED').length, badgeColor: 'bg-emerald-100 text-emerald-800' },
                { id: 'DRAFT', label: 'Drafts (Hidden)', count: materials.filter((s: any) => s.status === 'DRAFT').length, badgeColor: 'bg-amber-100 text-amber-800' },
                { id: 'SCHEDULED', label: 'Scheduled Auto-Publish', count: materials.filter((s: any) => s.status === 'SCHEDULED').length, badgeColor: 'bg-purple-100 text-purple-800' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    statusFilter === st.id ? 'bg-white/20 text-white' : st.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}>
                    {st.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Target Audience Pill Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAudienceFilter('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  audienceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All Audiences
              </button>
              <button
                type="button"
                onClick={() => setAudienceFilter('CENTER_PURCHASE')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  audienceFilter === 'CENTER_PURCHASE' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Building2 size={12} />
                <span>For Centers</span>
              </button>
              <button
                type="button"
                onClick={() => setAudienceFilter('STUDENT_DIRECT')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  audienceFilter === 'STUDENT_DIRECT' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                <Users size={12} />
                <span>To Students</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes by title or subject..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="IT & Computer">IT & Computer</option>
                <option value="Aptitude">Aptitude</option>
                <option value="Accounting">Accounting</option>
                <option value="Banking">Banking</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Materials Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((m: any) => {
              const isFree = Number(m.is_free) === 1;
              const isPublished = m.status === 'PUBLISHED';
              const isScheduled = m.status === 'SCHEDULED';
              const isDraft = m.status === 'DRAFT';
              const isForCenter = m.target_audience === 'CENTER_PURCHASE' || m.target_audience === 'BOTH';
              const isForStudent = m.target_audience === 'STUDENT_DIRECT' || m.target_audience === 'BOTH';

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {m.category || 'General'}
                      </span>

                      {isPublished && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <CheckCircle2 size={11} /> Published
                        </span>
                      )}
                      {isScheduled && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Clock size={11} /> Auto-Publish
                        </span>
                      )}
                      {isDraft && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <FileEdit size={11} /> Draft
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{m.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{m.description || 'No summary description provided.'}</p>
                    </div>

                    {/* Publishing Mode Tag */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-500 uppercase">Publishing Mode:</span>
                        {m.target_audience === 'CENTER_PURCHASE' && (
                          <span className="font-bold text-indigo-700 flex items-center gap-1">
                            <Building2 size={12} /> For Study Centers
                          </span>
                        )}
                        {m.target_audience === 'STUDENT_DIRECT' && (
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <Users size={12} /> Direct to Students
                          </span>
                        )}
                        {m.target_audience === 'BOTH' && (
                          <span className="font-bold text-blue-700 flex items-center gap-1">
                            <Share2 size={12} /> Dual (Centers & Students)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 pt-1 border-t border-slate-200/60">
                        <span>Target Scope:</span>
                        <span className="font-bold text-slate-900">
                          {m.publish_scope === 'ALL_CENTRES' ? 'All Centers' : m.publish_scope === 'SELECTED_CENTRES' ? `${m.allowed_centre_ids?.length || 0} Specific Centers` : 'Course Students'}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {isForCenter && (
                        <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <span className="text-indigo-600 block text-[9px] uppercase font-bold">Center Buy Price</span>
                          <span className="font-extrabold text-indigo-950">
                            {isFree ? 'FREE' : `₹${Number(m.center_price || m.price || 0).toFixed(0)}`}
                          </span>
                        </div>
                      )}

                      {isForStudent && (
                        <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          <span className="text-emerald-700 block text-[9px] uppercase font-bold">Student Price</span>
                          <span className="font-extrabold text-emerald-950">
                            {isFree ? 'FREE' : `₹${Number(m.student_price || m.price || 0).toFixed(0)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {isScheduled && m.scheduled_publish_time && (
                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-[10px] text-purple-800 flex items-center gap-1.5">
                        <CalendarClock size={12} className="shrink-0" />
                        <span>Publishes: {new Date(m.scheduled_publish_time).toLocaleString('en-GB')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                    {!isPublished ? (
                      <button
                        type="button"
                        onClick={() => publishNowMutation.mutate(m.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Publish Live Immediately"
                      >
                        <Send size={12} />
                        <span>Publish Live</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => draftMutation.mutate(m.id)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Hide Note and Move to Draft"
                      >
                        <RotateCcw size={12} />
                        <span>Move to Draft</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewMaterialId(m.id)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Preview Anti-Piracy Student Reader"
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(m)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingTarget(m)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Purchase Requests Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Study Note Purchase & Distribution Logs</h3>
              <p className="text-xs text-slate-500 font-medium">Student and Study Center note access verification</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
              Total: {purchases.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Candidate / Center</th>
                  <th className="p-3.5">Study Material</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">UTR / Ref</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      {p.buyer_type === 'CENTER' ? (
                        <>
                          <div className="font-bold text-slate-900">{p.center_name}</div>
                          <div className="text-[10px] text-slate-400">{p.center_code || 'CENTER'}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-slate-900">{p.firstName} {p.lastName}</div>
                          <div className="text-[10px] text-slate-400">{p.enrollment_no || p.center_name || p.student_email}</div>
                        </>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{p.material_title}</td>
                    <td className="p-3.5 font-bold font-mono text-slate-900">₹{Number(p.amount || 0).toFixed(2)}</td>
                    <td className="p-3.5 font-mono text-indigo-700 font-bold">{p.utr_number || 'N/A'}</td>
                    <td className="p-3.5">
                      {p.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                          Approved
                        </span>
                      )}
                      {p.status === 'PENDING' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-200">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {p.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => verifyPurchaseMutation.mutate({ id: p.id, status: 'APPROVED', buyerType: p.buyer_type })}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => verifyPurchaseMutation.mutate({ id: p.id, status: 'REJECTED', reason: 'Invalid UTR reference', buyerType: p.buyer_type })}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & PUBLISH STUDY NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[170] flex items-start justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 sm:my-12 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
                    Curriculum Master
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Split Publishing (Centers vs Students)</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  {editingItem ? 'Edit Study Material / E-Note' : 'Create & Publish Study Material / E-Note'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="space-y-5 text-xs"
            >
              {/* 1. Basic Note Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <BookOpen size={14} />
                  <span>1. Note Identification & Subject</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Note Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. MS Office & Word Master Shortcuts 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Subject / Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="IT & Computer, Banking, Aptitude"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800">Linked Course (Optional)</label>
                    <select
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="">General (Applies to all courses)</option>
                      {courses.map((crs: any) => (
                        <option key={crs.id} value={crs.id}>
                          {crs.name || crs.course_name} ({crs.code || crs.course_code || 'Course'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Short Summary & Learning Objectives</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of key concepts covered..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 2. File Upload or Rich Note Content */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>2. E-Note Content & File Attachment (HTML & PDF Supported)</span>
                  </h4>

                  {/* Format Selector Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file_type: 'PDF' })}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        formData.file_type === 'PDF' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText size={11} />
                      <span>PDF Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file_type: 'HTML' })}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        formData.file_type === 'HTML' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCode size={11} />
                      <span>HTML E-Note</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file_type: 'NOTE' })}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        formData.file_type === 'NOTE' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code size={11} />
                      <span>Rich Lecture Note</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">
                      Upload {formData.file_type === 'HTML' ? 'HTML Web Note (.html, .htm)' : formData.file_type === 'PDF' ? 'PDF Document (.pdf)' : 'Note Document (.pdf, .html, .docx)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-slate-700 font-bold transition-all shadow-2xs">
                        <Upload size={14} className="text-indigo-600" />
                        <span>{formData.file_url ? 'Change File' : `Upload ${formData.file_type === 'HTML' ? 'HTML File (.html)' : 'PDF / File'}`}</span>
                        <input 
                          type="file" 
                          accept=".html,.htm,.pdf,.doc,.docx,.txt" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                      {formData.file_url && (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold rounded-lg shrink-0">
                          {formData.file_type}: {formData.file_size}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Document Format Type</label>
                    <select
                      value={formData.file_type}
                      onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white"
                    >
                      <option value="PDF">PDF Document (.pdf)</option>
                      <option value="HTML">HTML E-Note (.html / Web Page)</option>
                      <option value="DOCX">Word Document (.docx)</option>
                      <option value="NOTE">Rich Text & Formula Lecture Note</option>
                    </select>
                  </div>
                </div>

                {/* Rich HTML / Text Content Editor with Live Preview */}
                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-slate-900 text-xs">
                        {formData.file_type === 'HTML' ? 'HTML E-Note Code & Layout (Rendered in Anti-Piracy Reader)' : 'Lecture Note Text, Formulas & Code'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formData.content_text.length} chars
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setHtmlEditorTab('editor')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          htmlEditorTab === 'editor' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Code Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setHtmlEditorTab('preview')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          htmlEditorTab === 'preview' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Eye size={11} />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* HTML Quick Snippet Bar */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase mr-1">Insert:</span>
                    {[
                      { label: '+ Heading', tag: '<h3>Chapter Title</h3>\n' },
                      { label: '+ Bold Text', tag: '<strong>Important Concept:</strong> ' },
                      { label: '+ Formula Box', tag: '<div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl my-2"><strong>Formula:</strong> <code>x = (-b ± √(b² - 4ac)) / 2a</code></div>\n' },
                      { label: '+ Highlight Box', tag: '<div class="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl my-2 text-amber-950 font-medium">⚠️ <strong>Exam Note:</strong> Remember this shortcut.</div>\n' },
                      { label: '+ Bullet List', tag: '<ul>\n  <li>Key Point 1</li>\n  <li>Key Point 2</li>\n</ul>\n' },
                      { label: '+ Table', tag: '<table class="w-full border-collapse border border-slate-300 my-2">\n  <tr class="bg-slate-100 font-bold">\n    <th class="border p-2">Topic</th>\n    <th class="border p-2">Summary</th>\n  </tr>\n  <tr>\n    <td class="border p-2">Example</td>\n    <td class="border p-2">Description</td>\n  </tr>\n</table>\n' },
                      { label: '+ Code Block', tag: '<pre class="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs my-2 overflow-x-auto"><code>// Sample code block\nconsole.log("Examirror Notes");</code></pre>\n' }
                    ].map((snippet) => (
                      <button
                        key={snippet.label}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, content_text: prev.content_text + snippet.tag }));
                        }}
                        className="text-[9.5px] px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-md font-medium text-slate-700 cursor-pointer transition-colors shadow-2xs"
                      >
                        {snippet.label}
                      </button>
                    ))}
                  </div>

                  {/* Code Editor vs Live Preview View */}
                  {htmlEditorTab === 'editor' ? (
                    <textarea
                      rows={6}
                      value={formData.content_text}
                      onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                      placeholder={formData.file_type === 'HTML' ? "Type or paste HTML tags (e.g. <h3>Unit 1: Introduction</h3><p>Content...</p>) or upload an .html file above..." : "Type or paste study text, syllabus units, or formula sheets..."}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-hidden shadow-2xs leading-relaxed"
                    />
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs h-80">
                      {formData.content_text ? (
                        <iframe 
                          srcDoc={formData.content_text}
                          className="w-full h-full border-none bg-white"
                          title="Live Preview"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No HTML content entered yet. Type code or upload an .html note to preview.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SPLIT PUBLISHING TARGET AUDIENCE (THE 2-PART FEATURE) */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200 space-y-3">
                <div>
                  <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 size={14} className="text-indigo-600" />
                    <span>3. Choose Publishing Target Mode</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Select whether this note is published for Center distribution or directly to Center Students.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* OPTION 1: PUBLISH FOR CENTER */}
                  <div
                    onClick={() => setFormData({ ...formData, target_audience: 'CENTER_PURCHASE' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.target_audience === 'CENTER_PURCHASE'
                        ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Building2 size={16} />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        formData.target_audience === 'CENTER_PURCHASE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Center B2B
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Publish for Study Center</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Notes are visible in the Center Portal. Study Centers buy/unlock and distribute to their students.
                    </p>
                  </div>

                  {/* OPTION 2: PUBLISH TO PARTICULAR CENTER'S STUDENTS */}
                  <div
                    onClick={() => setFormData({ ...formData, target_audience: 'STUDENT_DIRECT' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.target_audience === 'STUDENT_DIRECT'
                        ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Users size={16} />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        formData.target_audience === 'STUDENT_DIRECT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Direct to Students
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">Publish to Particular Center Students</div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Notes appear directly on the Student Dashboard of students enrolled in the selected center(s).
                    </p>
                  </div>
                </div>

                {/* Target Centers Selector */}
                <div className="pt-2 space-y-2">
                  <label className="font-bold text-slate-800 text-[11px] block">
                    Target Center Scope
                  </label>
                  <select
                    value={formData.publish_scope}
                    onChange={(e) => setFormData({ ...formData, publish_scope: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs"
                  >
                    <option value="ALL_CENTRES">All Study Centers (Nationwide)</option>
                    <option value="SELECTED_CENTRES">Particular Selected Centers Only</option>
                  </select>

                  {formData.publish_scope === 'SELECTED_CENTRES' && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[10px]">
                          Select Study Centers ({formData.allowed_centre_ids.length} selected)
                        </span>
                        <div className="flex gap-2 text-[10px] font-bold text-indigo-600">
                          <button type="button" onClick={selectAllCenters} className="hover:underline cursor-pointer">Select All</button>
                          <span>•</span>
                          <button type="button" onClick={deselectAllCenters} className="text-slate-500 hover:underline cursor-pointer">Clear</button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={centerSearch}
                        onChange={(e) => setCenterSearch(e.target.value)}
                        placeholder="Filter centers by name or code..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />

                      <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                        {filteredCenters.map((c: any) => {
                          const checked = formData.allowed_centre_ids.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => toggleCenter(c.id)}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                checked ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'bg-white border-slate-100 text-slate-700'
                              }`}
                            >
                              <span>{c.name} ({c.center_code || `Code #${c.id}`})</span>
                              {checked ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-slate-300" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Pricing & Payment QR */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Pricing Model</div>
                    <div className="text-[10px] text-slate-500">Free note or paid via UPI QR / Center Wallet</div>
                  </div>

                  <div className="flex bg-white rounded-xl p-1 border border-slate-200 self-stretch sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_free: 1, price: 0, center_price: 0, student_price: 0, center_distribute_price: 0 })}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        formData.is_free === 1 ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      FREE Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_free: 0, price: formData.price || 49, center_price: formData.center_price || 49, student_price: formData.student_price || 49, center_distribute_price: formData.center_distribute_price || 20 })}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        formData.is_free === 0 ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      Paid Pass (₹)
                    </button>
                  </div>
                </div>

                {formData.is_free === 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    {formData.target_audience === 'CENTER_PURCHASE' ? (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Center Purchase Price (INR)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.center_price}
                          onChange={(e) => setFormData({ ...formData, center_price: Number(e.target.value), price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Student Purchase Price (INR)</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.student_price}
                          onChange={(e) => setFormData({ ...formData, student_price: Number(e.target.value), price: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="font-bold text-slate-800">Payment QR Code</label>
                      <select
                        value={formData.payment_qr_id}
                        onChange={(e) => setFormData({ ...formData, payment_qr_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="">Default Examirror QR</option>
                        {qrs.map((q: any) => (
                          <option key={q.id} value={q.id}>
                            {q.title} ({q.upi_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Publishing Status & Scheduling */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <CalendarClock size={14} />
                  <span>5. Publishing Lifecycle & Status</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setFormData({ ...formData, status: 'PUBLISHED', scheduled_publish_time: '' })}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      formData.status === 'PUBLISHED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Send size={16} className="mx-auto mb-1 text-emerald-600" />
                    <div>Publish Live Now</div>
                    <div className="text-[9px] text-slate-500 font-normal">Immediate visibility</div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, status: 'DRAFT', scheduled_publish_time: '' })}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      formData.status === 'DRAFT'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <FileEdit size={16} className="mx-auto mb-1 text-amber-600" />
                    <div>Save as Draft</div>
                    <div className="text-[9px] text-slate-500 font-normal">Hidden from centers/students</div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, status: 'SCHEDULED' })}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      formData.status === 'SCHEDULED'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock3 size={16} className="mx-auto mb-1 text-purple-600" />
                    <div>Schedule Auto-Publish</div>
                    <div className="text-[9px] text-slate-500 font-normal">Auto-publish on date/time</div>
                  </div>
                </div>

                {formData.status === 'SCHEDULED' && (
                  <div className="space-y-1 p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <label className="font-bold text-purple-900">Auto-Publish Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.scheduled_publish_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_publish_time: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* 6. Anti-Piracy Watermark Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">Dynamic Anti-Piracy Examirror Watermark</div>
                    <div className="text-[10px] text-slate-500">Overlays Candidate Name, Roll Number, Center Code, and blocks screen captures</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={formData.watermark_enabled === 1}
                  onChange={(e) => setFormData({ ...formData, watermark_enabled: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {saveMutation.isPending ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>{editingItem ? 'Save Changes' : formData.status === 'PUBLISHED' ? 'Publish Note Live' : formData.status === 'SCHEDULED' ? 'Schedule Note' : 'Save Draft'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Study Note?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800">"{deletingTarget.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingTarget.id)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Live Preview Modal with Anti-Piracy Watermark */}
      {previewMaterialId && (
        <AntiPiracyStudyMaterialModal
          materialId={previewMaterialId}
          student={{
            firstName: 'Super Admin',
            lastName: 'Preview Mode',
            roll_no: 'ADMIN-MASTER-01',
            enrollment_no: 'EXM-ROOT-001',
            centerName: 'Examirror National Head Office',
            centerCode: 'HQ-99'
          }}
          onClose={() => setPreviewMaterialId(null)}
        />
      )}

    </div>
  );
};

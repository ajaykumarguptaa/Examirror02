import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Megaphone,
  Send,
  AlertCircle,
  Users,
  GraduationCap,
  Building2,
  Bold,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Bell,
  Clock,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  Volume2,
  Copy,
  RefreshCw,
  Radio,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  ArrowRight,
  Zap,
  Check,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { playNotificationSound } from '../../context/RealtimeNotificationContext';

type TargetAudience = 'center' | 'student' | 'both';
type NotificationType = 'announcement' | 'success' | 'warning' | 'info';

interface BroadcastItem {
  id: number;
  title: string;
  message: string;
  type: string;
  target?: string;
  link_url?: string;
  expiry_date?: string | null;
  created_at: string;
}

const TEMPLATES = [
  {
    label: '🚀 Platform Update',
    title: 'Important Examirror Platform Update',
    message: 'We have updated the portal with <strong>faster test evaluation</strong> and enhanced certificate export features. Please refresh your dashboard.',
    type: 'info' as NotificationType,
    target: 'both' as TargetAudience
  },
  {
    label: '🎓 New Test Series',
    title: 'New Grand Mock Test Series Published!',
    message: 'A brand-new <strong>All-India Online Mock Test</strong> is now live for all enrolled students. Check your <em>Test Series</em> section to attempt now!',
    type: 'success' as NotificationType,
    target: 'student' as TargetAudience,
    linkUrl: '/student/test-series'
  },
  {
    label: '🏛️ Center Compliance',
    title: 'Center Affiliation Notice & Compliance Audit',
    message: 'All authorized training centers are advised to verify and upload their <strong>annual infrastructure audit proofs</strong> to maintain ISO accreditation.',
    type: 'warning' as NotificationType,
    target: 'center' as TargetAudience,
    linkUrl: '/center'
  },
  {
    label: '⚡ Maintenance Alert',
    title: 'Scheduled System Maintenance Notice',
    message: 'Examirror portal will undergo scheduled cloud maintenance on <strong>Sunday from 01:00 AM to 03:00 AM IST</strong>. Tests will resume normally thereafter.',
    type: 'announcement' as NotificationType,
    target: 'both' as TargetAudience
  }
];

const Broadcast = () => {
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    expiryDate: '',
    target: 'both' as TargetAudience,
    type: 'announcement' as NotificationType,
    linkUrl: ''
  });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [history, setHistory] = useState<BroadcastItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('all');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview simulator view mode: 'dropdown' or 'popup'
  const [previewTab, setPreviewTab] = useState<'dropdown' | 'popup'>('dropdown');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/admin/announcements');
      if (res.data?.success) {
        setHistory(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch broadcast history', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setToastMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    try {
      setAnnouncementSubmitting(true);

      const payload = {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        expiryDate: announcementForm.expiryDate || null,
        target: announcementForm.target,
        type: announcementForm.type,
        linkUrl: announcementForm.linkUrl ? announcementForm.linkUrl.trim() : null
      };

      if (editingId) {
        const res = await axios.put(`http://localhost:3000/api/admin/announcements/${editingId}`, payload);
        if (res.data?.success) {
          setToastMessage({ type: 'success', text: 'Broadcast updated successfully!' });
          setAnnouncementForm({ title: '', message: '', expiryDate: '', target: 'both', type: 'announcement', linkUrl: '' });
          setEditingId(null);
          fetchHistory();
        }
      } else {
        const res = await axios.post('http://localhost:3000/api/admin/announcements', payload);
        if (res.data?.success) {
          setToastMessage({ type: 'success', text: res.data.message || 'Announcement broadcasted successfully!' });
          // Play confirmation chime
          playNotificationSound();
          setAnnouncementForm({ ...announcementForm, title: '', message: '', expiryDate: '', linkUrl: '' });
          fetchHistory();
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process request' });
    } finally {
      setAnnouncementSubmitting(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleEdit = (item: BroadcastItem) => {
    setEditingId(item.id);
    setAnnouncementForm({
      title: item.title,
      message: item.message,
      type: (item.type as NotificationType) || 'announcement',
      target: (item.target as TargetAudience) || 'both',
      linkUrl: item.link_url || '',
      expiryDate: item.expiry_date
        ? new Date(new Date(item.expiry_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
        : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setAnnouncementForm({
      ...announcementForm,
      title: tmpl.title,
      message: tmpl.message,
      type: tmpl.type,
      target: tmpl.target,
      linkUrl: (tmpl as any).linkUrl || ''
    });
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await axios.delete(`http://localhost:3000/api/admin/announcements/${deleteTargetId}`);
      fetchHistory();
      setToastMessage({ type: 'success', text: 'Broadcast deleted successfully' });
      setTimeout(() => setToastMessage(null), 3000);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
      setToastMessage({ type: 'error', text: 'Failed to delete broadcast' });
    } finally {
      setIsDeleting(false);
    }
  };

  const insertTag = (tagStart: string, tagEnd: string) => {
    const textarea = document.getElementById('message-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = announcementForm.message;

    const before = text.substring(0, start);
    const selected = text.substring(start, end) || 'text';
    const after = text.substring(end);

    setAnnouncementForm({
      ...announcementForm,
      message: `${before}${tagStart}${selected}${tagEnd}${after}`
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selected.length);
    }, 0);
  };

  const setExpiryPreset = (days: number | null) => {
    if (days === null) {
      setAnnouncementForm(prev => ({ ...prev, expiryDate: '' }));
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setAnnouncementForm(prev => ({ ...prev, expiryDate: isoString }));
  };

  // Helper for notification type colors
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          pill: 'bg-emerald-600 text-white shadow-emerald-500/20',
          icon: <CheckCircle2 size={16} className="text-emerald-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          pill: 'bg-amber-600 text-white shadow-amber-500/20',
          icon: <AlertTriangle size={16} className="text-amber-400" />
        };
      case 'info':
        return {
          bg: 'bg-sky-500/10',
          border: 'border-sky-500/30',
          text: 'text-sky-400',
          badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          pill: 'bg-sky-600 text-white shadow-sky-500/20',
          icon: <Info size={16} className="text-sky-400" />
        };
      default:
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          pill: 'bg-rose-600 text-white shadow-rose-500/20',
          icon: <Bell size={16} className="text-rose-400" />
        };
    }
  };

  const previewStyle = getTypeMeta(announcementForm.type);

  // Filtered broadcast history
  const filteredHistory = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    return history.filter(item => {
      const matchesSearch = !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q);

      const matchesType = historyFilterType === 'all' || item.type === historyFilterType;
      return matchesSearch && matchesType;
    });
  }, [history, historySearch, historyFilterType]);

  const charCount = announcementForm.message.length;
  const wordCount = announcementForm.message.trim() ? announcementForm.message.trim().split(/\s+/).length : 0;

  return (
    <div className="p-4 sm:p-7 bg-[#f8fafc] min-h-screen">
      <SEO title="Advanced Broadcast Studio | Examirror Super Admin" />

      <div className="max-w-7xl mx-auto space-y-7">
        
        {/* ============================================================== */}
        {/* HEADER & METRIC SUMMARY STRIP */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 p-3.5 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <Megaphone size={28} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    Real-time Event Stream
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    SSE Channel Live
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Advanced Broadcast Studio
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Compose and dispatch high-priority announcements, instant audio alerts, and targeted notifications to Study Centers and Student portals in real time.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Broadcasts</p>
                <p className="text-xl font-black text-white mt-0.5">{history.length}</p>
              </div>
              <button
                type="button"
                onClick={playNotificationSound}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                title="Click to test the real-time notification chime"
              >
                <Volume2 size={16} className="text-indigo-400" />
                <span>Test Chime</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN COMPOSER + LIVE SIMULATOR GRID */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

          {/* LEFT: COMPOSE MESSAGE STUDIO (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden flex flex-col relative">
            {editingId && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 z-20 animate-pulse"></div>
            )}

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${editingId ? 'bg-amber-500 animate-ping' : 'bg-indigo-600'}`}></div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {editingId ? 'Edit Broadcast Announcement' : 'Compose New Announcement'}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setAnnouncementForm({ title: '', message: '', expiryDate: '', target: 'both', type: 'announcement', linkUrl: '' });
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  Cancel Edit Mode
                </button>
              )}
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="p-6 sm:p-7 flex flex-col gap-6">

              {/* 1. Quick Template Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>Quick Fill Template</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">1-click draft</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 transition-all cursor-pointer active:scale-95"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Target Audience Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  <span>Target Portal Audience</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Centers Only */}
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, target: 'center' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      announcementForm.target === 'center'
                        ? 'border-indigo-600 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 size={22} className={announcementForm.target === 'center' ? 'text-white' : 'text-indigo-600'} />
                    <span className="text-xs font-black mt-2">Centers Only</span>
                    <span className={`text-[10px] mt-0.5 ${announcementForm.target === 'center' ? 'text-indigo-100' : 'text-slate-400'}`}>Study Center Heads</span>
                  </button>

                  {/* Students Only */}
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, target: 'student' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      announcementForm.target === 'student'
                        ? 'border-purple-600 bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/20'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap size={22} className={announcementForm.target === 'student' ? 'text-white' : 'text-purple-600'} />
                    <span className="text-xs font-black mt-2">Students Only</span>
                    <span className={`text-[10px] mt-0.5 ${announcementForm.target === 'student' ? 'text-purple-100' : 'text-slate-400'}`}>Candidates Portal</span>
                  </button>

                  {/* Everyone */}
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({ ...announcementForm, target: 'both' })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      announcementForm.target === 'both'
                        ? 'border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/30'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Radio size={22} className={announcementForm.target === 'both' ? 'text-white' : 'text-slate-700'} />
                    <span className="text-xs font-black mt-2">Everyone</span>
                    <span className={`text-[10px] mt-0.5 ${announcementForm.target === 'both' ? 'text-slate-300' : 'text-slate-400'}`}>All Connected Users</span>
                  </button>
                </div>
              </div>

              {/* 3. Notification Type */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={14} className="text-indigo-600" />
                  <span>Notification Severity & Visual Type</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'announcement', label: 'Alert', icon: Bell, activeStyle: 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/25', iconColor: 'text-rose-500' },
                    { id: 'info', label: 'Info', icon: Info, activeStyle: 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/25', iconColor: 'text-sky-500' },
                    { id: 'success', label: 'Success', icon: CheckCircle2, activeStyle: 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25', iconColor: 'text-emerald-500' },
                    { id: 'warning', label: 'Warning', icon: AlertTriangle, activeStyle: 'bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/25', iconColor: 'text-amber-500' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAnnouncementForm({ ...announcementForm, type: item.id as NotificationType })}
                      className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        announcementForm.type === item.id
                          ? item.activeStyle
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={20} className={announcementForm.type === item.id ? 'text-white' : item.iconColor} />
                      <span className="text-xs font-black mt-1.5">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Notification Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Headline / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g., Important Platform Update & Exam Schedule Announcement"
                />
              </div>

              {/* 5. Rich Content Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Message Content (HTML Supported) <span className="text-rose-500">*</span>
                  </label>

                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => insertTag('<strong>', '</strong>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-slate-700 hover:text-indigo-600 font-bold transition-all text-xs"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('<em>', '</em>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-slate-700 hover:text-indigo-600 transition-all text-xs"
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('<a href="/center" class="text-indigo-600 underline font-bold">', '</a>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-slate-700 hover:text-indigo-600 transition-all text-xs"
                      title="Insert Link"
                    >
                      <LinkIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('<ul class="list-disc pl-4 my-1 space-y-0.5"><li>', '</li></ul>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-slate-700 hover:text-indigo-600 transition-all text-xs"
                      title="Unordered List"
                    >
                      <ListIcon size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('<span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">', '</span>')}
                      className="px-2 py-1 hover:bg-white rounded-lg text-slate-700 hover:text-amber-700 transition-all text-xs font-mono"
                      title="Highlight Chip"
                    >
                      Highlight
                    </button>
                  </div>
                </div>

                <textarea
                  id="message-editor"
                  required
                  rows={6}
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-mono leading-relaxed outline-none transition-all placeholder:text-slate-400"
                  placeholder="Enter detailed message... Supports <strong>bold</strong>, <em>italic</em>, lists, and links."
                ></textarea>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                  <span>Markdown & HTML supported</span>
                  <span>{charCount} characters • {wordCount} words</span>
                </div>
              </div>

              {/* 6. Action Link / Redirection URL (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ExternalLink size={13} className="text-indigo-600" />
                    <span>Click Redirection URL</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">(optional link on click)</span>
                </label>
                <input
                  type="text"
                  value={announcementForm.linkUrl}
                  onChange={e => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs font-mono outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g., /center/wallet or /student/test-series or https://..."
                />
              </div>

              {/* 7. Expiry Date & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>Auto-Expiry Date & Time</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(1)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      +24h
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(7)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiryPreset(null)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={announcementForm.expiryDate}
                  onChange={e => setAnnouncementForm({ ...announcementForm, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs font-semibold outline-none transition-all"
                />
              </div>

              {/* Toast Status feedback */}
              {toastMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all animate-in fade-in ${
                    toastMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {toastMessage.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                  <span>{toastMessage.text}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={announcementSubmitting}
                  className={`w-full py-4 disabled:opacity-50 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                    editingId
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-xl shadow-amber-600/30'
                      : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 shadow-xl shadow-indigo-600/30'
                  }`}
                >
                  {announcementSubmitting ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>{editingId ? 'Updating Broadcast...' : 'Broadcasting Across Portals...'}</span>
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      <span>{editingId ? 'Save & Push Updates' : 'Broadcast Now to Selected Audience'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT: INTERACTIVE DUAL LIVE SIMULATOR (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-[#0a0f1d] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col relative overflow-hidden">
            
            {/* Simulator Header & Tab Switcher */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Interactive Live Simulator
                </h3>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setPreviewTab('dropdown')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    previewTab === 'dropdown'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bell Dropdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('popup')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    previewTab === 'popup'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Top Pop-up
                </button>
              </div>
            </div>

            {/* Active Audience Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulating for:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {announcementForm.target === 'center' ? 'Study Centers Only' : announcementForm.target === 'student' ? 'Students Portal' : 'All Portals'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${previewStyle.badge}`}>
                {announcementForm.type}
              </span>
            </div>

            {/* SIMULATOR CANVAS */}
            <div className="flex-1 flex items-center justify-center py-4">
              
              {previewTab === 'dropdown' ? (
                /* 1. NOTIFICATION BELL DROPDOWN SIMULATOR */
                <div className="w-full max-w-sm bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      Notifications <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">1 New</span>
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 cursor-pointer">
                      <CheckCircle2 size={12} /> Mark all read
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* The Broadcast Announcement Card */}
                    <div className="p-4 bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${previewStyle.bg} ${previewStyle.border}`}>
                          {previewStyle.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-bold text-slate-900 break-words line-clamp-1">
                              {announcementForm.title || 'Notification Headline'}
                            </h5>
                            <ArrowRight size={13} className="text-gray-300 group-hover:text-indigo-600 transition-all shrink-0" />
                          </div>
                          <div
                            className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-3 prose-sm max-w-none prose-p:my-0.5 prose-strong:text-slate-900"
                            dangerouslySetInnerHTML={{
                              __html: announcementForm.message || 'The rich HTML formatted broadcast notification message will be displayed cleanly here...'
                            }}
                          />
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={11} /> Just now
                            </span>
                            {announcementForm.linkUrl && (
                              <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                                Has Link <ExternalLink size={10} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dummy Older Card for Realistic Contrast */}
                    <div className="p-4 bg-white opacity-55">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-400">
                          <Bell size={14} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-700">Examirror System Welcome</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">Your center account has been provisioned.</p>
                          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                            <Clock size={10} /> 2 days ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 2. REALTIME TOP-MIDDLE FLOATING POPUP SIMULATOR */
                <div className="w-full max-w-sm bg-[#0a0f1d] text-white backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(99,102,241,0.35)] border border-indigo-500/40 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                      {previewStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            Live Notification
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-0.5">
                          Open <ArrowRight size={10} />
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-100 tracking-tight mt-1 truncate">
                        {announcementForm.title || 'Notification Headline'}
                      </h5>
                      <div
                        className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2 prose-sm prose-p:my-0 prose-strong:text-amber-300"
                        dangerouslySetInnerHTML={{
                          __html: announcementForm.message || 'Notification content will pop up from the top-middle of the user screen in real-time.'
                        }}
                      />
                      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800">
                        <span className="text-[9.5px] text-slate-400">Chime plays instantly</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]">
                          View Details
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom info helper */}
            <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed text-center">
              💡 <strong>Instant Synchronization:</strong> Broadcasting immediately triggers browser Server-Sent Events (SSE) and plays the chime sound for all targeted connected devices.
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* BROADCAST HISTORY SECTION */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Broadcast History Ledger</span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {filteredHistory.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, duplicate, or withdraw previously broadcasted announcements from user portals.
              </p>
            </div>

            {/* Search & Type Filter Strip */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search announcements..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 transition-all"
                />
              </div>

              <select
                value={historyFilterType}
                onChange={e => setHistoryFilterType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="announcement">Alerts</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={historyLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* History List Table / Cards */}
          {historyLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
              <RefreshCw size={22} className="animate-spin text-indigo-600" />
              <span>Loading broadcast announcements...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <Megaphone size={24} className="text-slate-300" />
              <span>No matching broadcasts found. Use the composer above to publish your first announcement.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredHistory.map((item) => {
                const typeInfo = getTypeMeta(item.type);
                return (
                  <div
                    key={item.id}
                    className="py-4.5 px-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 rounded-2xl transition-all group"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeInfo.bg} ${typeInfo.border} mt-0.5`}>
                        {typeInfo.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${typeInfo.badge}`}>
                            {item.type || 'Alert'}
                          </span>
                          
                          <h4 className="font-black text-slate-900 text-sm truncate">
                            {item.title}
                          </h4>

                          {item.link_url && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <ExternalLink size={10} /> {item.link_url}
                            </span>
                          )}
                        </div>

                        <div
                          className="text-xs text-slate-600 mb-2 leading-relaxed line-clamp-2 prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.message }}
                        />

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] font-semibold text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(item.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {item.expiry_date && (
                            <span className="flex items-center gap-1 text-rose-500 font-bold">
                              • Expires: {new Date(item.expiry_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate({
                          label: item.title,
                          title: item.title,
                          message: item.message,
                          type: (item.type as NotificationType) || 'announcement',
                          target: (item.target as TargetAudience) || 'both',
                          linkUrl: item.link_url || ''
                        })}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Duplicate as new draft"
                      >
                        <Copy size={13} />
                        <span className="hidden md:inline">Reuse</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                        title="Edit announcement"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Withdraw & Delete Broadcast?"
        message="Are you sure you want to delete this broadcast? It will be permanently removed from all student and center notification bells immediately."
        confirmText="Yes, Delete Announcement"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTargetId(null);
        }}
      />
    </div>
  );
};

export default Broadcast;

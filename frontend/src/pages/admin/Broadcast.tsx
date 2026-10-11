import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Send, AlertCircle, Users, GraduationCap, Building2, Bold, Italic, Link as LinkIcon, List as ListIcon, CheckCircle2, AlertTriangle, Info, Bell, Clock, Eye, Trash2, Edit } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { ConfirmModal } from '../../components/common/ConfirmModal';

type TargetAudience = 'center' | 'student' | 'both';
type NotificationType = 'announcement' | 'success' | 'warning' | 'info';

const Broadcast = () => {
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', expiryDate: '', target: 'both' as TargetAudience, type: 'announcement' as NotificationType });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/announcements');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch broadcast history', error);
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
        title: announcementForm.title,
        message: announcementForm.message,
        expiryDate: announcementForm.expiryDate || null,
        target: announcementForm.target,
        type: announcementForm.type
      };

      if (editingId) {
        const res = await axios.put(`http://localhost:3000/api/admin/announcements/${editingId}`, payload);
        if (res.data.success) {
          setToastMessage({ type: 'success', text: 'Broadcast updated successfully!' });
          setAnnouncementForm({ title: '', message: '', expiryDate: '', target: 'both', type: 'announcement' });
          setEditingId(null);
          fetchHistory();
        }
      } else {
        const res = await axios.post('http://localhost:3000/api/admin/announcements', payload);
        if (res.data.success) {
          setToastMessage({ type: 'success', text: res.data.message || 'Announcement broadcasted successfully!' });
          setAnnouncementForm({ ...announcementForm, title: '', message: '', expiryDate: '' });
          fetchHistory();
        }
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process request' });
    } finally {
      setAnnouncementSubmitting(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setAnnouncementForm({
      title: item.title,
      message: item.message,
      type: (item.type as NotificationType) || 'announcement',
      target: 'both',
      expiryDate: item.expiry_date ? new Date(new Date(item.expiry_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const selected = text.substring(start, end);
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

  // Helper for notification type colors in preview
  const getTypeColors = (type: string) => {
    switch (type) {
      case 'success': return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 size={16} className="text-emerald-600" /> };
      case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertTriangle size={16} className="text-amber-600" /> };
      case 'info': return { bg: 'bg-sky-50', text: 'text-sky-700', icon: <Info size={16} className="text-sky-600" /> };
      default: return { bg: 'bg-indigo-50/50', text: 'text-indigo-900', icon: <Bell size={16} className="text-indigo-600" /> };
    }
  };

  const previewStyle = getTypeColors(announcementForm.type);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <SEO title="Advanced Broadcast Tool | Admin" />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Megaphone className="text-indigo-600" />
              Advanced Broadcast Center
            </h1>
            <p className="text-sm text-slate-500 mt-1">Send rich-text announcements directly to student and center portals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: EDITOR FORM */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
            {editingId && (
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
            )}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? 'Edit Broadcast' : 'Compose Message'}
              </h2>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setAnnouncementForm({ title: '', message: '', expiryDate: '', target: 'both', type: 'announcement' }); }} className="text-xs font-bold text-amber-600 hover:text-amber-800">
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleBroadcastAnnouncement} className="p-5 flex flex-col gap-5">
              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Audience</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({...announcementForm, target: 'center'})}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      announcementForm.target === 'center' ? 'border-black bg-black text-white shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 size={20} className="mb-2" />
                    <span className="text-xs font-bold">Centers Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({...announcementForm, target: 'student'})}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      announcementForm.target === 'student' ? 'border-black bg-black text-white shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap size={20} className="mb-2" />
                    <span className="text-xs font-bold">Students Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnnouncementForm({...announcementForm, target: 'both'})}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      announcementForm.target === 'both' ? 'border-black bg-black text-white shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={20} className="mb-2" />
                    <span className="text-xs font-bold">Everyone</span>
                  </button>
                </div>
              </div>

              {/* Notification Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notification Type</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'announcement', label: 'Alert', icon: Bell, activeColor: 'bg-black border-black text-white shadow-sm', inactiveColor: 'text-slate-500' },
                    { id: 'info', label: 'Info', icon: Info, activeColor: 'bg-black border-black text-white shadow-sm', inactiveColor: 'text-slate-500' },
                    { id: 'success', label: 'Success', icon: CheckCircle2, activeColor: 'bg-black border-black text-white shadow-sm', inactiveColor: 'text-slate-500' },
                    { id: 'warning', label: 'Warning', icon: AlertTriangle, activeColor: 'bg-black border-black text-white shadow-sm', inactiveColor: 'text-slate-500' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAnnouncementForm({...announcementForm, type: type.id as NotificationType})}
                      className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-200 ${
                        announcementForm.type === type.id ? type.activeColor : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <type.icon size={18} className={`mb-1.5 ${announcementForm.type === type.id ? 'text-white' : type.inactiveColor}`} />
                      <span className="text-[11px] font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-lg text-sm outline-none transition-all"
                  placeholder="e.g., Important Platform Update!"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content Editor</label>
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                    <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-black transition-all" title="Bold">
                      <Bold size={14} />
                    </button>
                    <button type="button" onClick={() => insertTag('<em>', '</em>')} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-black transition-all" title="Italic">
                      <Italic size={14} />
                    </button>
                    <button type="button" onClick={() => insertTag('<a href="#" target="_blank" class="text-black underline">', '</a>')} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-black transition-all" title="Link">
                      <LinkIcon size={14} />
                    </button>
                    <button type="button" onClick={() => insertTag('<ul class="list-disc pl-4 my-1"><li>', '</li></ul>')} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-black transition-all" title="List">
                      <ListIcon size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  id="message-editor"
                  required
                  rows={6}
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-lg text-sm outline-none font-mono transition-all"
                  placeholder="Type your message here..."
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex justify-between uppercase tracking-wider">
                  <span>Expiry Date & Time</span>
                  <span className="font-normal text-slate-400 normal-case">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={announcementForm.expiryDate}
                  onChange={e => setAnnouncementForm({...announcementForm, expiryDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-lg text-sm outline-none transition-all"
                />
              </div>

              {toastMessage && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  {toastMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={announcementSubmitting}
                  className={`w-full py-3 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                    editingId 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-sm' 
                      : 'bg-black hover:bg-slate-800 shadow-sm'
                  }`}
                >
                  {announcementSubmitting ? (editingId ? 'Updating...' : 'Broadcasting...') : (
                    <><Send size={16} /> {editingId ? 'Save Changes' : 'Broadcast Now'}</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-8 uppercase tracking-wider relative z-10">
              <Eye size={14} className="text-slate-500" /> Live UI Preview
            </h3>
            
            <div className="flex-1 flex items-center justify-center relative z-10">
              {/* Fake dropdown UI container */}
              <div className="w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden transform scale-100 transition-all">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Notifications <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] rounded-sm font-bold">1 New</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 cursor-pointer hover:text-black">
                    <CheckCircle2 size={12} /> Mark all read
                  </span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {/* The Preview Notification Item */}
                  <div className={`p-4 transition-colors ${previewStyle.bg}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-slate-100 ${previewStyle.text}`}>
                        {previewStyle.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 break-words">
                          {announcementForm.title || 'Notification Title'}
                        </h4>
                        <div 
                          className="text-[11px] text-slate-600 mt-1 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-a:text-black prose-a:underline hover:prose-a:text-slate-800 prose-strong:font-bold prose-strong:text-black prose-ul:pl-4 prose-ul:my-1 break-words"
                          dangerouslySetInnerHTML={{ __html: announcementForm.message || 'The notification content will appear here and support rich HTML formatting...' }}
                        />
                        <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                          <Clock size={10} /> Just now
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dummy item for context */}
                  <div className="p-4 hover:bg-slate-50 transition-colors border-t border-slate-50">
                    <div className="flex items-start gap-3 opacity-60">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 border border-slate-100">
                        <Bell size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-600">Welcome to Examirror</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Your account has been setup.</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-2 flex items-center gap-1">
                          <Clock size={10} /> 2 days ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700 leading-relaxed text-center">
              This preview shows exactly how the notification will look inside the user's notification bell dropdown. The style changes based on the <strong>Notification Type</strong> selected.
            </div>
          </div>
        </div>

        {/* BROADCAST HISTORY SECTION */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-slate-800">Broadcast History</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No previous broadcasts found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                          item.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          item.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          item.type === 'info' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.type || 'Alert'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.title}</h4>
                      </div>
                      
                      <div className="text-xs text-slate-500 mb-2 line-clamp-1 opacity-80" dangerouslySetInnerHTML={{ __html: item.message }} />
                      
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.created_at).toLocaleString()}</span>
                        {item.expiry_date && (
                          <span className="flex items-center gap-1 text-rose-500">
                            Expires: {new Date(item.expiry_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-all cursor-pointer">
                        <Edit size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDeleteTargetId(item.id)} 
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete Broadcast"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Styled Confirmation Dialog replacing browser window.confirm */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Broadcast?"
        message="Are you sure you want to delete this broadcast? It will be removed from all notification bells immediately."
        confirmText="Delete Broadcast"
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

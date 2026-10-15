import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MessageCircle,
  Eye,
  BookOpen,
  Building2,
  Award,
  HelpCircle,
  Save,
  X,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface ContactQuery {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  inquiry_type: string;
  course: string | null;
  message: string | null;
  status: 'Pending' | 'Contacted' | 'Resolved' | string;
  admin_notes: string | null;
  created_at: string;
}

const ContactQueries = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeModalQuery, setActiveModalQuery] = useState<ContactQuery | null>(null);
  const [modalAdminNotes, setModalAdminNotes] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteTargetQuery, setDeleteTargetQuery] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingQuery, setIsDeletingQuery] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/admin/contact-queries');
      if (res.data?.success) {
        setQueries(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching contact queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();

    const handleSync = () => fetchQueries();
    window.addEventListener('contact-updated', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchQueries();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('contact-updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string, notes?: string) => {
    try {
      const res = await axios.put(`http://localhost:3000/api/admin/contact-queries/${id}/status`, {
        status: newStatus,
        adminNotes: notes !== undefined ? notes : undefined
      });

      if (res.data?.success) {
        setQueries(prev =>
          prev.map(q => (q.id === id ? { ...q, status: newStatus, ...(notes !== undefined ? { admin_notes: notes } : {}) } : q))
        );
        if (activeModalQuery && activeModalQuery.id === id) {
          setActiveModalQuery(prev => prev ? { ...prev, status: newStatus, ...(notes !== undefined ? { admin_notes: notes } : {}) } : null);
        }
        showToast('success', `Status updated to ${newStatus}`);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('error', 'Failed to update status');
    }
  };

  const handleSaveModalDetails = async () => {
    if (!activeModalQuery) return;
    setIsUpdatingNotes(true);
    try {
      await handleUpdateStatus(activeModalQuery.id, modalStatus, modalAdminNotes);
      setIsUpdatingNotes(false);
      showToast('success', 'Changes saved successfully');
    } catch {
      setIsUpdatingNotes(false);
    }
  };

  const confirmDeleteQuery = async () => {
    if (!deleteTargetQuery) return;

    try {
      setIsDeletingQuery(true);
      const res = await axios.delete(`http://localhost:3000/api/admin/contact-queries/${deleteTargetQuery.id}`);
      if (res.data?.success) {
        setQueries(prev => prev.filter(q => q.id !== deleteTargetQuery.id));
        if (activeModalQuery?.id === deleteTargetQuery.id) {
          setActiveModalQuery(null);
        }
        showToast('success', 'Inquiry deleted successfully');
        setDeleteTargetQuery(null);
      }
    } catch (err: any) {
      console.error('Error deleting query:', err);
      showToast('error', 'Failed to delete inquiry');
    } finally {
      setIsDeletingQuery(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const openQueryModal = (query: ContactQuery) => {
    setActiveModalQuery(query);
    setModalAdminNotes(query.admin_notes || '');
    setModalStatus(query.status || 'Pending');
  };

  // Filter queries
  const filteredQueries = queries.filter(q => {
    const matchesStatus = selectedStatus === 'all' || q.status.toLowerCase() === selectedStatus.toLowerCase();
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (q.full_name && q.full_name.toLowerCase().includes(searchLower)) ||
      (q.phone && q.phone.includes(searchLower)) ||
      (q.email && q.email.toLowerCase().includes(searchLower)) ||
      (q.course && q.course.toLowerCase().includes(searchLower)) ||
      (q.message && q.message.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  const pendingCount = queries.filter(q => q.status.toLowerCase() === 'pending').length;
  const contactedCount = queries.filter(q => q.status.toLowerCase() === 'contacted').length;
  const resolvedCount = queries.filter(q => q.status.toLowerCase() === 'resolved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold text-white transition-all transform animate-in fade-in ${
          notification.type === 'success' ? 'bg-slate-900 border border-slate-700' : 'bg-rose-600 border border-rose-500'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertCircle size={14} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Contact Queries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Incoming prospective student inquiries, center leads, and helpdesk messages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQueries}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-slate-400' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Minimal KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Received</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{queries.length}</div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Pending Action</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>

        {/* Contacted */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Contacted</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{contactedCount}</div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Resolved</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Minimal Search & Segmented Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, course..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          {[
            { id: 'all', label: 'All', count: queries.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'contacted', label: 'Contacted', count: contactedCount },
            { id: 'resolved', label: 'Resolved', count: resolvedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === tab.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clean Minimal Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading && queries.length === 0 ? (
          <div className="py-16 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-slate-400" size={16} />
            <span>Loading inquiries...</span>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No Inquiries Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedStatus !== 'all' ? 'Try adjusting your search or filters.' : 'No contact queries received yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 sm:px-5">Applicant</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredQueries.map((item) => {
                  const isPending = item.status.toLowerCase() === 'pending';
                  const isContacted = item.status.toLowerCase() === 'contacted';
                  const isResolved = item.status.toLowerCase() === 'resolved';

                  const createdDate = new Date(item.created_at);
                  const formattedDate = createdDate.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  const formattedTime = createdDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0">
                            {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {item.full_name}
                            </div>
                            {item.course && (
                              <span className="text-[10px] font-medium text-slate-500 block">
                                Course: {item.course}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${item.phone}`}
                              className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                            >
                              {item.phone}
                            </a>
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(item.full_name)},%20regarding%20your%20inquiry%20at%20Examirror`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="WhatsApp"
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>
                          {item.email && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {item.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.inquiry_type}
                        </span>
                      </td>

                      {/* Message Preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 text-xs truncate max-w-[200px]" title={item.message || ''}>
                          {item.message || <span className="text-slate-400 italic">—</span>}
                        </p>
                        {item.admin_notes && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                            Note: {item.admin_notes}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="font-medium text-slate-700">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400">{formattedTime}</div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-colors ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isContacted
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openQueryModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetQuery({ id: item.id, name: item.full_name })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Minimal Clean Detail Modal */}
      {activeModalQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{activeModalQuery.full_name}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Inquiry #{activeModalQuery.id} • {new Date(activeModalQuery.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setActiveModalQuery(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Contact strip */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Phone</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <span>{activeModalQuery.phone}</span>
                    <a
                      href={`https://wa.me/${activeModalQuery.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(activeModalQuery.full_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Email</span>
                  <div className="font-semibold text-slate-900 mt-0.5 truncate">
                    {activeModalQuery.email || '—'}
                  </div>
                </div>
              </div>

              {/* Category & Course */}
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase block">Category</span>
                  <span className="font-semibold text-slate-800">{activeModalQuery.inquiry_type}</span>
                </div>
                {activeModalQuery.course && (
                  <div className="text-right">
                    <span className="text-[10px] font-medium text-slate-400 uppercase block">Preferred Course</span>
                    <span className="font-semibold text-indigo-600">{activeModalQuery.course}</span>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block mb-1">Message</span>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed min-h-[70px]">
                  {activeModalQuery.message || <span className="text-slate-400 italic">No message provided</span>}
                </div>
              </div>

              {/* Status & Notes */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none focus:border-slate-400"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Counseling Notes
                  </label>
                  <textarea
                    rows={2}
                    value={modalAdminNotes}
                    onChange={(e) => setModalAdminNotes(e.target.value)}
                    placeholder="Add follow-up notes..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteTargetQuery({ id: activeModalQuery.id, name: activeModalQuery.full_name })}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalQuery(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalDetails}
                  disabled={isUpdatingNotes}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingNotes ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTargetQuery !== null}
        title="Delete Inquiry?"
        message={deleteTargetQuery ? `Are you sure you want to delete the inquiry from "${deleteTargetQuery.name}"? This action cannot be undone.` : ''}
        confirmText="Delete Inquiry"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingQuery}
        onConfirm={confirmDeleteQuery}
        onClose={() => {
          if (!isDeletingQuery) setDeleteTargetQuery(null);
        }}
      />

    </div>
  );
};

export default ContactQueries;

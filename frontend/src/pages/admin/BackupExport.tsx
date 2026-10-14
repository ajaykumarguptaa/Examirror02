import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  Database,
  Building2,
  Users,
  BookOpen,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowDownToLine,
  CheckSquare,
  Square,
  Clock,
  HardDriveDownload,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

interface CenterSummary {
  id: number;
  center_code: string;
  name: string;
  email: string;
  wallet_balance: number;
  studentsCount: number;
  created_at: string;
}

interface StatsData {
  totalCenters: number;
  totalStudents: number;
  totalCourses: number;
  pendingWalletRequests: number;
  totalWalletsSum: number;
}

const BackupExport = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [centers, setCenters] = useState<CenterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingMaster, setDownloadingMaster] = useState(false);
  const [downloadingCenterId, setDownloadingCenterId] = useState<number | null>(null);
  const [selectedCenterIds, setSelectedCenterIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, centersRes] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/stats'),
        axios.get('http://localhost:3000/api/admin/centers')
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (centersRes.data?.success) setCenters(centersRes.data.data);
    } catch (err: any) {
      setToast({ type: 'error', text: 'Failed to load backup stats: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Master system backup download
  const handleDownloadMaster = async () => {
    setDownloadingMaster(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const res = await axios.get('http://localhost:3000/api/admin/export/master', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Academy_Master_Backup_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: 'success', text: 'Complete Master System Backup (.xlsx) downloaded successfully!' });
    } catch (err: any) {
      setToast({ type: 'error', text: 'Error generating master backup: ' + err.message });
    } finally {
      setDownloadingMaster(false);
    }
  };

  // Center-specific backup download
  const handleDownloadCenter = async (centerId: number, centerCode: string, centerName: string) => {
    setDownloadingCenterId(centerId);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const res = await axios.get(`http://localhost:3000/api/admin/export/center/${centerId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Center_${centerCode}_Backup_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: 'success', text: `Center backup for ${centerName} (${centerCode}) downloaded!` });
    } catch (err: any) {
      setToast({ type: 'error', text: 'Error downloading center backup: ' + err.message });
    } finally {
      setDownloadingCenterId(null);
    }
  };

  // Batch download selected centers
  const handleBatchDownload = async () => {
    if (selectedCenterIds.length === 0) return;
    setBatchDownloading(true);

    let successCount = 0;
    for (const cId of selectedCenterIds) {
      const c = centers.find((x) => x.id === cId);
      if (c) {
        try {
          const dateStr = new Date().toISOString().slice(0, 10);
          const res = await axios.get(`http://localhost:3000/api/admin/export/center/${cId}`, {
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Center_${c.center_code}_Backup_${dateStr}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          successCount++;
          // Small pause between multiple downloads to avoid browser throttle
          await new Promise((r) => setTimeout(r, 400));
        } catch (e) {
          console.error(`Failed to export center ${c.center_code}:`, e);
        }
      }
    }

    setToast({
      type: 'success',
      text: `Batch export completed! Downloaded ${successCount} center Excel backups.`
    });
    setBatchDownloading(false);
  };

  const toggleSelectAll = () => {
    if (selectedCenterIds.length === filteredCenters.length) {
      setSelectedCenterIds([]);
    } else {
      setSelectedCenterIds(filteredCenters.map((c) => c.id));
    }
  };

  const toggleSelectCenter = (id: number) => {
    setSelectedCenterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredCenters = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.center_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-100 shadow-emerald-950/40'
              : 'bg-rose-950 border-rose-500 text-rose-100 shadow-rose-950/40'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="text-emerald-400" size={18} /> : <AlertCircle className="text-rose-400" size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e1b4b] p-5 sm:p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-900">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-800/60 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Database size={13} />
            <span>Super Admin Central Backup Vault</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Data Backup & Center-Wise Excel Export
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm max-w-2xl font-normal leading-relaxed">
            Export comprehensive multi-sheet Microsoft Excel (.xlsx) workbooks containing center directories, student registries, and individual dedicated sheets for every study center.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Hero 1-Click Master System Backup Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 shadow-xs">
                <FileSpreadsheet size={24} />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
                  Complete Master Multi-Sheet Backup
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Exports Master Overview, All Centers, All Students, plus <strong>separate sheets for each center's students</strong>, courses, KYC franchise requests, and financial ledgers.
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Centers</div>
                <div className="text-base font-semibold text-slate-800 mt-0.5">{stats?.totalCenters ?? '...'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Students</div>
                <div className="text-base font-semibold text-slate-800 mt-0.5">{stats?.totalStudents ?? '...'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Courses</div>
                <div className="text-base font-semibold text-slate-800 mt-0.5">{stats?.totalCourses ?? '...'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Reserves</div>
                <div className="text-base font-semibold text-emerald-600 mt-0.5">
                  ₹{Number(stats?.totalWalletsSum || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Sheet Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'System Summary',
                'Centers Master',
                'All Students Master',
                'Center-Wise Separate Sheets',
                'Courses Directory',
                'Franchise Requests (KYC)',
                'Contact Queries',
                'Wallet Ledgers',
                'Token Recharges'
              ].map((sheet, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-indigo-50/80 text-indigo-700 border border-indigo-200/60 rounded-lg text-[11px] font-medium flex items-center gap-1"
                >
                  <FileCheck2 size={12} />
                  <span>{sheet}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 sm:p-6 bg-indigo-50/60 rounded-3xl border border-indigo-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <HardDriveDownload size={32} />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900">Ready for Instant Download</div>
              <div className="text-[11px] text-slate-500 font-normal">Standard .xlsx format compatible with Microsoft Excel & Google Sheets</div>
            </div>

            <button
              onClick={handleDownloadMaster}
              disabled={downloadingMaster}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingMaster ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Generating Master Backup...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download Master Backup (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Center-Wise Backup Station */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Controls */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 size={18} className="text-indigo-600" />
              <span>Center-Wise Dedicated Backups</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Export standalone backup workbooks for any individual center or batch-download selected centers.
            </p>
          </div>

          {/* Search & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search center name, code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            {selectedCenterIds.length > 0 && (
              <button
                onClick={handleBatchDownload}
                disabled={batchDownloading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {batchDownloading ? <RefreshCw size={13} className="animate-spin" /> : <ArrowDownToLine size={13} />}
                <span>Export Selected ({selectedCenterIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Table of Centers */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    {selectedCenterIds.length === filteredCenters.length && filteredCenters.length > 0 ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Center Code</th>
                <th className="py-3 px-4">Center Name & Email</th>
                <th className="py-3 px-4">Students Enrolled</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Excel Backup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading centers directory...
                  </td>
                </tr>
              ) : filteredCenters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No centers found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredCenters.map((c) => {
                  const isSelected = selectedCenterIds.includes(c.id);
                  const isDownloadingThis = downloadingCenterId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-indigo-50/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectCenter(c.id)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-indigo-600" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {c.center_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.email || 'No email provided'}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-black">
                          <Users size={11} className="text-slate-500" />
                          <span>{c.studentsCount || 0} Students</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        ₹{Number(c.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownloadCenter(c.id, c.center_code, c.name)}
                          disabled={isDownloadingThis}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isDownloadingThis ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Exporting...</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet size={13} className="text-emerald-600" />
                              <span>Export Excel</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-semibold flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Showing {filteredCenters.length} authorized center(s)</span>
          <span className="text-[11px] text-slate-400">
            Center backups include: Profile, Enrolled Students, Assigned Courses, Wallet Ledgers, and Topup History.
          </span>
        </div>
      </div>
    </div>
  );
};

export default BackupExport;

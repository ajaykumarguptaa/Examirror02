import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  BookOpen, Search, Filter, CheckCircle2, IndianRupee,
  Share2, Users, Download, Eye, FileText, Sparkles, Check,
  AlertCircle, ShieldCheck, Wallet, ArrowRight, Lock, QrCode, Clock
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const AntiPiracyStudyMaterialModal = lazy(() =>
  import('../../components/AntiPiracyStudyMaterialModal').then(m => ({ default: m.AntiPiracyStudyMaterialModal }))
);
const StudyMaterialPaymentModal = lazy(() =>
  import('../../components/StudyMaterialPaymentModal').then(m => ({ default: m.StudyMaterialPaymentModal }))
);

export const CenterStudyMaterials: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [previewMaterialId, setPreviewMaterialId] = useState<number | null>(null);
  const [distributingItem, setDistributingItem] = useState<any | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<any | null>(null);
  const [upiPurchasingItem, setUpiPurchasingItem] = useState<any | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const centerId = localStorage.getItem('centerId') || localStorage.getItem('userId');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('centerToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Queries
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['center-study-materials', centerId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:3000/api/study-materials/center/list?centerId=${centerId}`, {
        headers: getHeaders()
      });
      return res.data?.data || [];
    }
  });

  const { data: students = [] } = useQuery({
    queryKey: ['center-students', centerId],
    queryFn: async () => {
      if (!centerId) return [];
      const res = await axios.get(`http://localhost:3000/api/center/${centerId}/students`, {
        headers: getHeaders()
      });
      return res.data?.data || [];
    },
    enabled: !!distributingItem
  });

  // Distribute Mutation
  const distributeMutation = useMutation({
    mutationFn: async ({ materialId, distributionType, studentIds }: { materialId: number; distributionType: string; studentIds?: number[] }) => {
      return axios.post(`http://localhost:3000/api/study-materials/center/${materialId}/distribute`, {
        distributionType,
        studentIds,
        centerId
      }, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-study-materials', centerId] });
      setDistributingItem(null);
      setSelectedStudentIds([]);
      window.dispatchEvent(new Event('center-stats-updated'));
      showToast('success', 'Study material successfully distributed!');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to distribute material.');
    }
  });

  // Purchase Mutation
  const purchaseMutation = useMutation({
    mutationFn: async (materialId: number) => {
      return axios.post(`http://localhost:3000/api/study-materials/center/${materialId}/purchase`, {
        payment_mode: 'WALLET',
        centerId
      }, { headers: getHeaders() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-study-materials', centerId] });
      setPurchasingItem(null);
      window.dispatchEvent(new Event('center-stats-updated'));
      showToast('success', 'Purchased and unlocked for your center! Students can now access.');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Failed to purchase material.');
    }
  });

  const filteredMaterials = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return materials.filter((m: any) => {
      if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        m.title?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.category?.toLowerCase().includes(term)
      );
    });
  }, [materials, categoryFilter, debouncedSearch]);

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-800' : 'bg-rose-950 text-rose-100 border-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
              Center Repository
            </span>
            <span className="text-xs text-slate-500 font-medium">Curriculum E-Notes & Study Passes</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Study Materials & E-Notes Repository
          </h1>
          <p className="text-xs text-slate-500">
            Access authorized study materials, acquire course packs, and distribute e-notes to all your enrolled students.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search curriculum notes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
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

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((item: any) => {
          const actualPrice = item.center_price != null ? Number(item.center_price) : Number(item.price || 0);
          const isFree = Number(item.is_free) === 1 || actualPrice <= 0;
          const isUnlocked = isFree || item.is_unlocked_for_center;
          const isDistributed = item.is_distributed;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-indigo-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">
                    {item.category || 'General'}
                  </span>

                  {item.status === 'PENDING_APPROVAL' ? (
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Clock size={11} /> Pending Approval
                    </span>
                  ) : isDistributed ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <CheckCircle2 size={11} /> Distributed to Students
                    </span>
                  ) : isUnlocked ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Sparkles size={11} /> Ready to Distribute
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Lock size={11} /> Center Pass Required
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || 'Verified curriculum resource and lecture notes.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Eligible Students</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Users size={12} className="text-indigo-600" />
                      <span>{item.center_eligible_students_count || 0} Students</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Center Pricing</span>
                    <span className={`font-bold ${isFree ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {isFree ? 'FREE Pass' : `₹${actualPrice.toFixed(0)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewMaterialId(item.id)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Preview Anti-Piracy Watermarked Reader"
                >
                  <Eye size={15} />
                </button>

                {item.status === 'PENDING_APPROVAL' ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Clock size={13} />
                    <span>Pending Super Admin Approval</span>
                  </button>
                ) : isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => setDistributingItem(item)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Share2 size={13} />
                    <span>{isDistributed ? 'Re-Distribute to Students' : 'Distribute to Students'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPurchasingItem(item)}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Wallet size={13} />
                    <span>Unlock for Center (₹{actualPrice.toFixed(0)})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribute Confirmation Modal */}
      {distributingItem && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-4 shrink-0">
              <Share2 size={22} />
            </div>
            <div className="text-center space-y-1 mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Distribute Note</h3>
              <p className="text-xs text-slate-500">
                Select students to forward <strong className="text-slate-800">"{distributingItem.title}"</strong>.
              </p>
              <div className="text-xs font-bold text-indigo-600 mt-1 bg-indigo-50 inline-block px-2 py-0.5 rounded-full">
                Fee: {Number(distributingItem.center_distribute_price || 0)} tokens per student
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-xl mb-4 p-2">
              {students.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">No active students found.</div>
              ) : (
                <div className="space-y-1">
                  {students.map((student: any) => {
                    const isAlreadyDistributed = distributingItem?.distributed_student_ids?.includes(student.id);
                    return (
                      <label key={student.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors border ${isAlreadyDistributed ? 'bg-indigo-50/50 border-indigo-100 opacity-75' : 'hover:bg-slate-50 border-transparent hover:border-slate-100 cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={isAlreadyDistributed || selectedStudentIds.includes(student.id)}
                          disabled={isAlreadyDistributed}
                          onChange={(e) => {
                            if (isAlreadyDistributed) return;
                            if (e.target.checked) {
                              setSelectedStudentIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className={`w-4 h-4 rounded-md focus:ring-indigo-600 ${isAlreadyDistributed ? 'text-indigo-400 border-indigo-200 cursor-not-allowed' : 'text-indigo-600 border-slate-300'}`}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-semibold text-slate-800">{student.firstName} {student.lastName}</span>
                          <span className="text-[10px] text-slate-500">{student.enrollment_no}</span>
                        </div>
                        {isAlreadyDistributed && (
                          <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-md shrink-0">
                            Distributed
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 mb-4 shrink-0">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Cost:</span>
                <span className="text-indigo-700">{selectedStudentIds.length * Number(distributingItem.center_distribute_price || 0)} Tokens</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDistributingItem(null);
                  setSelectedStudentIds([]);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => distributeMutation.mutate({ materialId: distributingItem.id, distributionType: 'SELECTED_STUDENTS', studentIds: selectedStudentIds })}
                disabled={distributeMutation.isPending || selectedStudentIds.length === 0}
                className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {distributeMutation.isPending ? 'Distributing...' : `Distribute (${selectedStudentIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Purchase Modal */}
      {purchasingItem && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto">
              <Wallet size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Unlock Study Material for Center</h3>
              <p className="text-xs text-slate-500">
                Pay <strong className="text-slate-900 font-bold">₹{(purchasingItem.center_price != null ? Number(purchasingItem.center_price) : Number(purchasingItem.price || 0)).toFixed(2)}</strong> from your Center Wallet to unlock full distribution rights for your students.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => purchaseMutation.mutate(purchasingItem.id)}
                disabled={purchaseMutation.isPending}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Wallet size={16} />
                {purchaseMutation.isPending ? 'Processing...' : `Pay ₹${(purchasingItem.center_price != null ? Number(purchasingItem.center_price) : Number(purchasingItem.price || 0)).toFixed(0)} from Wallet`}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setUpiPurchasingItem(purchasingItem);
                  setPurchasingItem(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <QrCode size={16} />
                Pay via UPI (QR Code)
              </button>

              <button
                type="button"
                onClick={() => setPurchasingItem(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center UPI Purchase Modal */}
      {upiPurchasingItem && (
        <Suspense fallback={null}>
          <StudyMaterialPaymentModal
            material={upiPurchasingItem}
            student={{}}
            userType="center"
            onClose={() => setUpiPurchasingItem(null)}
            onSuccess={() => {
              setUpiPurchasingItem(null);
              queryClient.invalidateQueries({ queryKey: ['center-study-materials'] });
              showToast('success', 'Payment submitted for verification. It will be unlocked once approved.');
            }}
          />
        </Suspense>
      )}

      {/* Reader Preview Modal */}
      {previewMaterialId && (
        <Suspense fallback={null}>
          <AntiPiracyStudyMaterialModal
            materialId={previewMaterialId}
            student={{
              centerId: centerId,
              firstName: 'Study Center',
              lastName: 'Admin Review',
              roll_no: 'CENTER-ADMIN-01',
              enrollment_no: 'CENTER-EXM-001',
              centerName: 'Your Authorized Center',
              centerCode: 'CTR-01'
            }}
            onClose={() => setPreviewMaterialId(null)}
            onUnlockClick={(matId) => {
              const mat = materials.find((m: any) => String(m.id) === String(matId));
              setPreviewMaterialId(null);
              if (mat) {
                setPurchasingItem(mat);
              }
            }}
          />
        </Suspense>
      )}

    </div>
  );
};

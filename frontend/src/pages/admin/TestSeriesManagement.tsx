import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  QrCode,
  IndianRupee,
  Calendar,
  Clock,
  Award,
  Trophy,
  Layers,
  Check,
  X,
  Upload,
  Eye,
  Trash2,
  Edit,
  RotateCcw,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Building2,
  UserCheck,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  CalendarClock,
  Send,
  FileEdit,
  Clock3,
  ListOrdered,
  FileText,
  Image as ImageIcon,
  FolderTree,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { StudyMaterialManagementTab } from '../../components/admin/StudyMaterialManagementTab';
import { BulkQuestionJsonImportModal } from '../../components/admin/BulkQuestionJsonImportModal';

export const TestSeriesManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'series' | 'materials' | 'payments' | 'categories' | 'qrs' | 'attempts' | 'analytics'>('series');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Series Filter
  const [seriesSearch, setSeriesSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState('ALL');
  const [seriesStatusFilter, setSeriesStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED'>('ALL');

  // Modals
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any | null>(null);
  const [activeTestsSeries, setActiveTestsSeries] = useState<any | null>(null);

  // Test / Question Modals
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [activeTestForQuestions, setActiveTestForQuestions] = useState<any | null>(null);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [isBulkJsonModalOpen, setIsBulkJsonModalOpen] = useState(false);
  const [previewLightbox, setPreviewLightbox] = useState<{ url: string; title?: string } | null>(null);
  const [previewLightboxZoom, setPreviewLightboxZoom] = useState<number>(1);

  // Payment Verification Modals
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Attempt Reset Modal
  const [resettingAttemptId, setResettingAttemptId] = useState<number | null>(null);
  const [resetReason, setResetReason] = useState('Student reported network interruption');

  // Categories & QR Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatThumbnail, setNewCatThumbnail] = useState('');
  const [isUploadingCatThumb, setIsUploadingCatThumb] = useState(false);

  // Sub-Categories Modals & Form
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<any | null>(null);
  const [newSubCatParentId, setNewSubCatParentId] = useState<string>('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatDesc, setNewSubCatDesc] = useState('');
  const [deletingSubCategoryTarget, setDeletingSubCategoryTarget] = useState<any | null>(null);
  const [isDeletingSubCategoryLoading, setIsDeletingSubCategoryLoading] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<any | null>(null);
  const [deletingQr, setDeletingQr] = useState<any | null>(null);
  const [isDeletingQrLoading, setIsDeletingQrLoading] = useState(false);

  // Secondary Confirmation: Move Published Series to Draft
  const [confirmDraftSeries, setConfirmDraftSeries] = useState<any | null>(null);
  const [isMovingDraftLoading, setIsMovingDraftLoading] = useState(false);

  // Secondary Confirmation: Deletions
  const [deletingSeriesTarget, setDeletingSeriesTarget] = useState<any | null>(null);
  const [isDeletingSeriesLoading, setIsDeletingSeriesLoading] = useState(false);

  const [deletingCategoryTarget, setDeletingCategoryTarget] = useState<any | null>(null);
  const [isDeletingCategoryLoading, setIsDeletingCategoryLoading] = useState(false);

  const [deletingTestTarget, setDeletingTestTarget] = useState<any | null>(null);
  const [isDeletingTestLoading, setIsDeletingTestLoading] = useState(false);

  const [deletingQuestionTarget, setDeletingQuestionTarget] = useState<any | null>(null);
  const [isDeletingQuestionLoading, setIsDeletingQuestionLoading] = useState(false);

  const [newQrTitle, setNewQrTitle] = useState('');
  const [newQrAmount, setNewQrAmount] = useState<number | string>('');
  const [newQrUpi, setNewQrUpi] = useState('');
  const [newQrAccount, setNewQrAccount] = useState('EXAMIRROR SKILL COUNCIL');
  const [newQrImage, setNewQrImage] = useState('');
  const [newQrInstructions, setNewQrInstructions] = useState('');
  const [newQrIsDefault, setNewQrIsDefault] = useState(false);

  // Form State for Test Series
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    slug: '',
    category_id: '',
    sub_category_id: '',
    category_ids: [] as number[],
    description: '',
    thumbnail_url: '',
    instructions: '• Do not refresh or switch tabs during test\n• Negative marking applies for incorrect attempts\n• Detailed scorecard generated upon submission',
    exam_type: 'National Mock Assessment',
    language: 'English + Hindi',
    difficulty: 'ALL_LEVELS',
    total_tests: 10,
    price: 499,
    is_free: false,
    duration_minutes: 60,
    validity_days: 90,
    publish_scope: 'ALL_CENTRES',
    payment_qr_id: '',
    allowed_centre_ids: [] as number[],
    scheduled_publish_time: '',
    status: 'PUBLISHED'
  });

  // Form State for Test
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    total_marks: 100,
    negative_marks: 0.5,
    passing_marks: 40,
    release_type: 'IMMEDIATE',
    release_week: 1,
    status: 'LIVE',
    qr_mode: 'INHERIT' as 'INHERIT' | 'CUSTOM',
    payment_qr_id: '',
    price: 0,
    is_free: true
  });

  // Form State for Question
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    section_name: 'General Assessment',
    question_type: 'SINGLE_CHOICE',
    explanation: '',
    marks: 2.0,
    negative_marks: 0.5,
    image_url: '',
    options: [
      { option_key: 'A', option_text: '', image_url: '', is_correct: true },
      { option_key: 'B', option_text: '', image_url: '', is_correct: false },
      { option_key: 'C', option_text: '', image_url: '', is_correct: false },
      { option_key: 'D', option_text: '', image_url: '', is_correct: false }
    ],
    columnA: ['', '', '', ''],
    columnB: ['', '', '', ''],
    itemsToOrder: ['', '', '', ''],
    imageUrls: [] as string[]
  });
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState(false);
  const [uploadingOptionKey, setUploadingOptionKey] = useState<string | null>(null);

  // Queries
  const { data: seriesList = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ['adminTestSeries'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/series');
      return res.data?.data || [];
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/categories');
      return res.data?.data || [];
    }
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ['adminSubCategories'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/sub-categories');
      return res.data?.data || [];
    }
  });

  const { data: paymentQrs = [] } = useQuery({
    queryKey: ['adminPaymentQrs'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/payment-qrs');
      return res.data?.data || [];
    }
  });

  const { data: centresList = [] } = useQuery({
    queryKey: ['adminCentresListForScope'],
    queryFn: async () => {
      const res = await axios.get('/api/public/centers/public');
      return res.data?.data || [];
    }
  });

  const { data: paymentRequests = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['adminTestPayments', paymentFilter],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/payments?status=${paymentFilter}`);
      return res.data?.data || [];
    }
  });

  const { data: attemptsList = [], isLoading: isLoadingAttempts } = useQuery({
    queryKey: ['adminTestAttempts'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/attempts');
      return res.data?.data || [];
    }
  });

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['adminTestAnalytics'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/test-series/analytics');
      return res.data?.data || null;
    }
  });

  // Tests query for active series
  const { data: activeTests = [], refetch: refetchActiveTests } = useQuery({
    queryKey: ['adminSeriesTests', activeTestsSeries?.id],
    enabled: !!activeTestsSeries?.id,
    queryFn: async () => {
      const res = await axios.get(`/api/admin/series/${activeTestsSeries.id}/tests`);
      return res.data?.data || [];
    }
  });

  // Questions query for active test
  const { data: activeQuestions = [], refetch: refetchActiveQuestions } = useQuery({
    queryKey: ['adminTestQuestions', activeTestForQuestions?.id],
    enabled: !!activeTestForQuestions?.id,
    queryFn: async () => {
      const res = await axios.get(`/api/admin/tests/${activeTestForQuestions.id}/questions`);
      return res.data?.data || [];
    }
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Handlers
  const handleOpenCreateSeries = () => {
    setEditingSeries(null);
    const defaultCatId = categories[0]?.id || '';
    setSeriesForm({
      title: '',
      slug: '',
      category_id: defaultCatId,
      sub_category_id: '',
      category_ids: defaultCatId ? [Number(defaultCatId)] : [],
      description: '',
      thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
      instructions: '• Total questions indicated inside\n• Negative marking applies for incorrect attempts\n• Do not switch browser tabs during test',
      exam_type: 'National Mock Assessment',
      language: 'English + Hindi',
      difficulty: 'ALL_LEVELS',
      total_tests: 10,
      price: 499,
      is_free: false,
      duration_minutes: 60,
      validity_days: 90,
      publish_scope: 'ALL_CENTRES',
      payment_qr_id: paymentQrs[0]?.id || '',
      allowed_centre_ids: [],
      scheduled_publish_time: '',
      status: 'DRAFT'
    });
    setIsSeriesModalOpen(true);
  };

  const handleOpenEditSeries = (series: any) => {
    setEditingSeries(series);
    let formattedSchedTime = '';
    if (series.scheduled_publish_time) {
      try {
        const d = new Date(series.scheduled_publish_time);
        formattedSchedTime = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch (e) {
        formattedSchedTime = '';
      }
    }

    const assignedCats = Array.isArray(series.category_ids) && series.category_ids.length > 0
      ? series.category_ids.map(Number)
      : (series.category_id ? [Number(series.category_id)] : []);

    setSeriesForm({
      title: series.title,
      slug: series.slug,
      category_id: series.category_id || '',
      sub_category_id: series.sub_category_id ? String(series.sub_category_id) : '',
      category_ids: assignedCats,
      description: series.description || '',
      thumbnail_url: series.thumbnail_url || '',
      instructions: series.instructions || '',
      exam_type: series.exam_type || 'Mock Assessment',
      language: series.language || 'English + Hindi',
      difficulty: series.difficulty || 'ALL_LEVELS',
      total_tests: series.total_tests || 1,
      price: Number(series.price) || 0,
      is_free: Boolean(series.is_free),
      duration_minutes: series.duration_minutes || 60,
      validity_days: series.validity_days || 90,
      publish_scope: series.publish_scope || 'ALL_CENTRES',
      payment_qr_id: series.payment_qr_id ? String(series.payment_qr_id) : '',
      allowed_centre_ids: series.allowed_centre_ids || [],
      scheduled_publish_time: formattedSchedTime,
      status: series.status || 'DRAFT'
    });
    setIsSeriesModalOpen(true);
  };

  const handleCloneSeries = async (seriesId: number) => {
    try {
      const res = await axios.post(`/api/admin/series/${seriesId}/clone`);
      showToast('success', res.data?.message || 'Duplicated as draft copy successfully');
      queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to duplicate test series');
    }
  };

  const handleQuickStatusChange = async (series: any, newStatus: string) => {
    try {
      await axios.put(`/api/admin/series/${series.id}`, {
        ...series,
        status: newStatus
      });
      showToast('success', `Test series moved to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to change status');
    }
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allSelectedCats = new Set<number>();
      if (seriesForm.category_id && Number(seriesForm.category_id) > 0) {
        allSelectedCats.add(Number(seriesForm.category_id));
      }
      if (Array.isArray(seriesForm.category_ids)) {
        seriesForm.category_ids.forEach((cId: any) => {
          if (Number(cId) > 0) allSelectedCats.add(Number(cId));
        });
      }

      const payload = {
        ...seriesForm,
        category_id: seriesForm.category_id && Number(seriesForm.category_id) > 0 ? Number(seriesForm.category_id) : null,
        sub_category_id: seriesForm.sub_category_id && Number(seriesForm.sub_category_id) > 0 ? Number(seriesForm.sub_category_id) : null,
        category_ids: Array.from(allSelectedCats),
        payment_qr_id: seriesForm.payment_qr_id && Number(seriesForm.payment_qr_id) > 0 ? Number(seriesForm.payment_qr_id) : null,
        price: Number(seriesForm.price) || 0,
        duration_minutes: Number(seriesForm.duration_minutes) || 60,
        validity_days: Number(seriesForm.validity_days) || 90,
        total_tests: Number(seriesForm.total_tests) || 1
      };
      if (editingSeries) {
        await axios.put(`/api/admin/series/${editingSeries.id}`, payload);
        showToast('success', 'Test Series updated successfully');
      } else {
        await axios.post('/api/admin/series', payload);
        showToast('success', 'New Test Series saved successfully');
      }
      setIsSeriesModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save Test Series');
    }
  };

  const handleDeleteSeries = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this Test Series and all its tests?')) return;
    try {
      await axios.delete(`/api/admin/series/${id}`);
      showToast('success', 'Test Series deleted');
      queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete');
    }
  };

  // Payment Verification Handlers
  const handleApprovePayment = async (paymentId: number) => {
    try {
      const res = await axios.post(`/api/admin/payments/${paymentId}/approve`);
      showToast('success', res.data?.message || 'Payment approved and student enrolled!');
      queryClient.invalidateQueries({ queryKey: ['adminTestPayments'] });
      queryClient.invalidateQueries({ queryKey: ['adminTestAnalytics'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectingPaymentId) return;
    try {
      const res = await axios.post(`/api/admin/payments/${rejectingPaymentId}/reject`, { reason: rejectionReason });
      showToast('success', res.data?.message || 'Payment marked as rejected');
      setRejectingPaymentId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminTestPayments'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Rejection failed');
    }
  };

  // Attempt Reset Handler
  const handleResetAttempt = async () => {
    if (!resettingAttemptId) return;
    try {
      const res = await axios.post(`/api/admin/attempts/${resettingAttemptId}/reset`, { reason: resetReason });
      showToast('success', res.data?.message || 'Attempt reset successfully');
      setResettingAttemptId(null);
      queryClient.invalidateQueries({ queryKey: ['adminTestAttempts'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Reset failed');
    }
  };

  // Open Add Test Modal
  const handleOpenAddTest = () => {
    setEditingTest(null);
    setTestForm({
      title: `Mock Test ${(activeTests?.length || 0) + 1}`,
      description: 'Comprehensive practice assessment module',
      duration_minutes: 60,
      total_marks: 100,
      negative_marks: 0.5,
      passing_marks: 40,
      release_type: 'IMMEDIATE',
      release_week: (activeTests?.length || 0) + 1,
      status: 'LIVE',
      qr_mode: 'INHERIT',
      payment_qr_id: '',
      price: 0,
      is_free: true
    });
    setIsAddTestModalOpen(true);
  };

  // Open Edit Test Modal
  const handleOpenEditTest = (test: any) => {
    setEditingTest(test);
    setTestForm({
      title: test.title || '',
      description: test.description || '',
      duration_minutes: test.duration_minutes || 60,
      total_marks: Number(test.total_marks) || 100,
      negative_marks: Number(test.negative_marks) || 0.5,
      passing_marks: Number(test.passing_marks) || 40,
      release_type: test.release_type || 'IMMEDIATE',
      release_week: test.release_week || 1,
      status: test.status || 'LIVE',
      qr_mode: test.payment_qr_id ? 'CUSTOM' : 'INHERIT',
      payment_qr_id: test.payment_qr_id ? String(test.payment_qr_id) : '',
      price: Number(test.price) || 0,
      is_free: test.is_free !== undefined ? Boolean(test.is_free) : true
    });
    setIsAddTestModalOpen(true);
  };

  // Save Test inside Series (Create / Edit)
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTestsSeries) return;
    try {
      const payload = {
        title: testForm.title,
        description: testForm.description,
        duration_minutes: Number(testForm.duration_minutes),
        total_marks: Number(testForm.total_marks),
        negative_marks: Number(testForm.negative_marks),
        passing_marks: Number(testForm.passing_marks),
        release_type: testForm.release_type,
        release_week: Number(testForm.release_week),
        status: testForm.status,
        test_series_id: activeTestsSeries.id,
        payment_qr_id: testForm.qr_mode === 'CUSTOM' && testForm.payment_qr_id ? Number(testForm.payment_qr_id) : null,
        price: testForm.qr_mode === 'CUSTOM' && !testForm.is_free ? Number(testForm.price) : 0.00,
        is_free: testForm.qr_mode === 'CUSTOM' ? testForm.is_free : true
      };

      if (editingTest) {
        await axios.put(`/api/admin/tests/${editingTest.id}`, payload);
        showToast('success', 'Test details & QR code updated successfully');
      } else {
        await axios.post('/api/admin/tests', payload);
        showToast('success', 'Test added to series');
      }
      setIsAddTestModalOpen(false);
      setEditingTest(null);
      refetchActiveTests();
      queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save test');
    }
  };

  // Open Question Modal in Add Mode
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      section_name: 'General Assessment',
      question_type: 'SINGLE_CHOICE',
      explanation: '',
      marks: 2.0,
      negative_marks: 0.5,
      image_url: '',
      options: [
        { option_key: 'A', option_text: '', image_url: '', is_correct: true },
        { option_key: 'B', option_text: '', image_url: '', is_correct: false },
        { option_key: 'C', option_text: '', image_url: '', is_correct: false },
        { option_key: 'D', option_text: '', image_url: '', is_correct: false }
      ],
      columnA: ['', '', '', ''],
      columnB: ['', '', '', ''],
      itemsToOrder: ['', '', '', ''],
      imageUrls: []
    });
    setIsAddQuestionModalOpen(true);
  };

  // Open Question Modal in Edit Mode
  const handleOpenEditQuestion = (q: any) => {
    let meta: any = {};
    try {
      meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata || '{}') : (q.metadata || {});
    } catch (_) {
      meta = {};
    }

    const questionImages: string[] = Array.isArray(meta?.imageUrls)
      ? meta.imageUrls
      : (q.image_url ? [q.image_url] : []);

    let parsedOptions: any[] = [];
    if (Array.isArray(q.options) && q.options.length > 0) {
      parsedOptions = q.options.map((opt: any) => ({
        option_key: opt.option_key || 'A',
        option_text: opt.option_text || '',
        image_url: opt.image_url || '',
        is_correct: opt.is_correct === 1 || opt.is_correct === true
      }));
    } else {
      parsedOptions = [
        { option_key: 'A', option_text: '', image_url: '', is_correct: true },
        { option_key: 'B', option_text: '', image_url: '', is_correct: false },
        { option_key: 'C', option_text: '', image_url: '', is_correct: false },
        { option_key: 'D', option_text: '', image_url: '', is_correct: false }
      ];
    }

    const columnA = Array.isArray(meta?.columnA) && meta.columnA.length > 0 ? [...meta.columnA] : ['', '', '', ''];
    while (columnA.length < 4) columnA.push('');
    const columnB = Array.isArray(meta?.columnB) && meta.columnB.length > 0 ? [...meta.columnB] : ['', '', '', ''];
    while (columnB.length < 4) columnB.push('');
    const itemsToOrder = Array.isArray(meta?.itemsToOrder) && meta.itemsToOrder.length > 0 ? [...meta.itemsToOrder] : ['', '', '', ''];
    while (itemsToOrder.length < 4) itemsToOrder.push('');

    setEditingQuestion(q);
    setQuestionForm({
      question_text: q.question_text || '',
      section_name: q.section_name || 'General Assessment',
      question_type: q.question_type || 'SINGLE_CHOICE',
      explanation: q.explanation || '',
      marks: Number(q.marks) || 2.0,
      negative_marks: Number(q.negative_marks) || 0.5,
      image_url: q.image_url || '',
      options: parsedOptions,
      columnA,
      columnB,
      itemsToOrder,
      imageUrls: questionImages
    });
    setIsAddQuestionModalOpen(true);
  };

  // Upload Question Figure / Diagram
  const handleUploadQuestionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingQuestionImage(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/admin/questions/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setQuestionForm((prev) => ({
          ...prev,
          image_url: res.data.url,
          imageUrls: prev.imageUrls.length > 0 ? [...prev.imageUrls, res.data.url] : [res.data.url]
        }));
        showToast('success', 'Question diagram uploaded');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingQuestionImage(false);
      e.target.value = '';
    }
  };

  // Upload Option Diagram
  const handleUploadOptionImage = async (optKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingOptionKey(optKey);
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/admin/questions/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        setQuestionForm((prev) => ({
          ...prev,
          options: prev.options.map((opt) =>
            opt.option_key === optKey ? { ...opt, image_url: res.data.url } : opt
          )
        }));
        showToast('success', `Option ${optKey} diagram uploaded`);
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingOptionKey(null);
      e.target.value = '';
    }
  };

  // Create or Update Question inside Test
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTestForQuestions) return;
    try {
      const isMatch = questionForm.question_type === 'MATCH_FOLLOWING';
      const isSequence = questionForm.question_type === 'SEQUENCE_ORDER' || questionForm.question_type === 'ARRANGE_ORDER';
      const cleanMetadata: any = {};
      if (questionForm.imageUrls.length > 0) {
        cleanMetadata.imageUrls = questionForm.imageUrls;
      }
      if (isMatch) {
        cleanMetadata.columnA = questionForm.columnA.filter((x: string) => x && x.trim());
        cleanMetadata.columnB = questionForm.columnB.filter((x: string) => x && x.trim());
      }
      if (isSequence) {
        cleanMetadata.itemsToOrder = questionForm.itemsToOrder.filter((x: string) => x && x.trim());
      }

      const payload = {
        ...questionForm,
        test_id: activeTestForQuestions.id,
        metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null
      };

      if (editingQuestion) {
        await axios.put(`/api/admin/questions/${editingQuestion.id}`, payload);
        showToast('success', 'Question updated successfully');
      } else {
        await axios.post('/api/admin/questions', payload);
        showToast('success', 'Question added successfully');
      }
      setIsAddQuestionModalOpen(false);
      setEditingQuestion(null);
      refetchActiveQuestions();
      refetchActiveTests();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save question');
    }
  };

  // Filtered Series
  const filteredSeries = seriesList.filter((s: any) => {
    const matchesSearch = !seriesSearch || s.title.toLowerCase().includes(seriesSearch.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'ALL' ||
      String(s.category_id) === String(selectedCategoryFilter) ||
      (Array.isArray(s.category_ids) && s.category_ids.includes(Number(selectedCategoryFilter)));
    const matchesSubCat = selectedSubCategoryFilter === 'ALL' || String(s.sub_category_id) === String(selectedSubCategoryFilter);
    const matchesStatus = seriesStatusFilter === 'ALL' || s.status === seriesStatusFilter;
    return matchesSearch && matchesCat && matchesSubCat && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <ShieldCheck size={14} />
            <span>Super Admin Centralized Test Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Test Series & Online Examination Management
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Create free & paid test series, configure center publishing scope, verify student UPI payments, monitor attempts, and analyze results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingQr(null);
              setNewQrTitle('');
              setNewQrUpi('');
              setNewQrAccount('EXAMIRROR SKILL COUNCIL');
              setNewQrImage('');
              setNewQrInstructions('');
              setNewQrIsDefault(false);
              setIsQrModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <QrCode size={14} />
            <span>+ New QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateSeries}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Create Test Series</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 no-scrollbar">
        {[
          { id: 'series', label: 'Test Series Master', icon: BookOpen, count: seriesList.length },
          { id: 'materials', label: 'E-Notes & Study Materials', icon: FileText },
          { id: 'payments', label: 'Payment Approvals', icon: IndianRupee, count: paymentRequests.filter((p: any) => p.status === 'PENDING').length },
          { id: 'categories', label: 'Categories', icon: Layers, count: categories.length },
          { id: 'qrs', label: 'UPI Payment QRs', icon: QrCode, count: paymentQrs.length },
          { id: 'attempts', label: 'Student Attempts & Resets', icon: RotateCcw, count: attemptsList.length },
          { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB: E-NOTES & STUDY MATERIALS */}
      {/* ========================================== */}
      {activeTab === 'materials' && (
        <StudyMaterialManagementTab />
      )}

      {/* ========================================== */}
      {/* TAB 1: TEST SERIES MASTER */}
      {/* ========================================== */}
      {activeTab === 'series' && (
        <div className="space-y-4">
          {/* Status Filter Tabs & Counts */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Series', count: seriesList.length },
              { id: 'PUBLISHED', label: 'Published (Live)', count: seriesList.filter((s: any) => s.status === 'PUBLISHED').length, badgeColor: 'bg-emerald-100 text-emerald-800' },
              { id: 'DRAFT', label: 'Drafts (Hidden)', count: seriesList.filter((s: any) => s.status === 'DRAFT').length, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'SCHEDULED', label: 'Scheduled Auto-Publish', count: seriesList.filter((s: any) => s.status === 'SCHEDULED').length, badgeColor: 'bg-purple-100 text-purple-800' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSeriesStatusFilter(st.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${seriesStatusFilter === st.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                <span>{st.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${seriesStatusFilter === st.id ? 'bg-white/20 text-white' : st.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search test series by title..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                value={seriesSearch}
                onChange={(e) => setSeriesSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Category:</span>
              <select
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white outline-none cursor-pointer"
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setSelectedSubCategoryFilter('ALL');
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {selectedCategoryFilter !== 'ALL' && (
                <>
                  <span className="text-xs font-semibold text-slate-500 ml-1">Sub-Category:</span>
                  <select
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white outline-none cursor-pointer"
                    value={selectedSubCategoryFilter}
                    onChange={(e) => setSelectedSubCategoryFilter(e.target.value)}
                  >
                    <option value="ALL">All Sub-Categories</option>
                    {subCategories
                      .filter((sc: any) => String(sc.category_id) === String(selectedCategoryFilter))
                      .map((sc: any) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Series Cards Grid */}
          {isLoadingSeries ? (
            <div className="py-20 text-center text-slate-400">Loading test series...</div>
          ) : filteredSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSeries.map((series: any) => {
                const isDraft = series.status === 'DRAFT';
                const isScheduled = series.status === 'SCHEDULED';
                const isPublished = series.status === 'PUBLISHED';

                return (
                  <div
                    key={series.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Thumbnail & Tags */}
                    <div className="h-40 relative bg-slate-100 overflow-hidden">
                      <img
                        src={series.thumbnail_url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600'}
                        alt={series.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${series.is_free ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}>
                          {series.is_free ? 'FREE TEST' : `₹${series.price}`}
                        </span>
                        <span className="bg-slate-900/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {series.publish_scope === 'ALL_CENTRES' ? 'All Centers' : `${series.allowed_centre_ids?.length || 0} Centers`}
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                        {isPublished && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-xs">
                            <CheckCircle2 size={11} /> LIVE
                          </span>
                        )}
                        {isDraft && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1 shadow-xs border border-amber-300">
                            <FileEdit size={11} /> DRAFT
                          </span>
                        )}
                        {isScheduled && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 flex items-center gap-1 shadow-xs border border-purple-300">
                            <CalendarClock size={11} /> SCHEDULED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-grow space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                            {series.category_name || 'General Mock'}
                          </span>
                          {Array.isArray(series.assigned_categories) && series.assigned_categories.length > 1 && (
                            <span
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs cursor-help"
                              title={`Also placed in: ${series.assigned_categories.map((c: any) => c.name).join(', ')}`}
                            >
                              +{series.assigned_categories.length - 1} more
                            </span>
                          )}
                          {series.sub_category_name && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <FolderTree size={10} className="text-indigo-500" />
                              {series.sub_category_name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-slate-900 line-clamp-2 mt-0.5">
                          {series.title}
                        </h3>
                        {isScheduled && series.scheduled_publish_time && (
                          <div className="mt-1 p-2 bg-purple-50 text-purple-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-purple-200">
                            <Clock3 size={13} className="text-purple-600 shrink-0" />
                            <span>Auto-publishes: <b>{new Date(series.scheduled_publish_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tests Included:</span>
                          <span className="font-bold text-slate-800">{series.tests_count || 0} Tests</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Active Enrolled:</span>
                          <span className="font-bold text-emerald-700">{series.active_enrollments || 0} Students</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 space-y-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTestsSeries(series);
                          }}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                        >
                          <Layers size={13} />
                          <span>Manage Tests & Questions ({series.tests_count || 0})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(series, 'PUBLISHED')}
                              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
                              title="Publish Now for Students"
                            >
                              <Send size={12} /> Publish Live
                            </button>
                          )}

                          {isScheduled && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(series, 'PUBLISHED')}
                              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
                              title="Publish Now Immediately"
                            >
                              <Send size={12} /> Publish Now
                            </button>
                          )}

                          {isPublished && (
                            <button
                              type="button"
                              onClick={() => setConfirmDraftSeries(series)}
                              className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 border border-amber-300 transition-colors cursor-pointer"
                              title="Revert to Draft"
                            >
                              <FileEdit size={12} /> Move to Draft
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCloneSeries(series.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Duplicate as Draft Copy"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditSeries(series)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Test Series"
                          >
                            <Edit size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingSeriesTarget(series)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Series"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              No test series found under this status filter. Click "Create New Test Series" to save a draft or publish a test pack.
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: PAYMENT APPROVALS & UTR VERIFY */}
      {/* ========================================== */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Student UPI Payment Verification</h3>
              <p className="text-xs text-slate-500">
                Review UTR transaction references, examine payment screenshots, and approve test access.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPaymentFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${paymentFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {isLoadingPayments ? (
            <div className="py-16 text-center text-slate-400">Loading payment requests...</div>
          ) : paymentRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Student</th>
                    <th className="py-3 px-4 font-bold">Centre</th>
                    <th className="py-3 px-4 font-bold">Test Series</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">UTR Reference</th>
                    <th className="py-3 px-4 font-bold">Proof</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentRequests.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{pay.student_first_name} {pay.student_last_name}</span>
                        <span className="text-[11px] font-mono text-slate-500">{pay.enrollment_no || pay.roll_no}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{pay.centre_name}</span>
                        <span className="text-[11px] text-slate-500">{pay.centre_code}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px] truncate">
                        {pay.test_series_title}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{pay.amount}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                          {pay.utr_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {pay.payment_screenshot ? (
                          <button
                            type="button"
                            onClick={() => setViewingScreenshot(pay.payment_screenshot)}
                            className="text-blue-600 hover:underline font-bold text-[11px] flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Screenshot</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${pay.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          pay.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {pay.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprovePayment(pay.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingPaymentId(pay.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">No payment records under this filter.</div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: CATEGORIES */}
      {/* ========================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Test Series Categories</h3>
              <p className="text-xs text-slate-500">Manage categories displayed on student discovery tabs.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSubCategory(null);
                  setNewSubCatParentId(categories[0]?.id ? String(categories[0].id) : '');
                  setNewSubCatName('');
                  setNewSubCatDesc('');
                  setIsSubCategoryModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-indigo-200 transition-colors"
              >
                <FolderTree size={14} /> Add Sub-Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCatName('');
                  setNewCatDesc('');
                  setNewCatThumbnail('');
                  setIsCategoryModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat: any) => (
              <div key={cat.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {cat.thumbnail_url ? (
                      <img
                        src={cat.thumbnail_url}
                        alt={cat.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 font-bold text-base">
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{cat.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{cat.description || 'No description provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCatName(cat.name || '');
                        setNewCatDesc(cat.description || '');
                        setNewCatThumbnail(cat.thumbnail_url || '');
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategoryTarget(cat)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Sub Categories inside Category Card */}
                <div className="pt-3 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FolderTree size={12} className="text-indigo-600" />
                      Sub-Categories ({subCategories.filter((sc: any) => sc.category_id === cat.id).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubCategory(null);
                        setNewSubCatParentId(String(cat.id));
                        setNewSubCatName('');
                        setNewSubCatDesc('');
                        setIsSubCategoryModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subCategories.filter((sc: any) => sc.category_id === cat.id).map((sc: any) => (
                      <span
                        key={sc.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs shadow-2xs group/sub"
                      >
                        <span className="font-medium">{sc.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubCategory(sc);
                            setNewSubCatParentId(String(sc.category_id));
                            setNewSubCatName(sc.name || '');
                            setNewSubCatDesc(sc.description || '');
                            setIsSubCategoryModalOpen(true);
                          }}
                          className="hover:text-blue-600 cursor-pointer ml-0.5 text-slate-400 hover:text-blue-600"
                          title="Edit Sub-Category"
                        >
                          <Edit size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSubCategoryTarget(sc)}
                          className="hover:text-rose-600 cursor-pointer text-slate-400 hover:text-rose-600"
                          title="Delete Sub-Category"
                        >
                          <Trash2 size={10} />
                        </button>
                      </span>
                    ))}
                    {subCategories.filter((sc: any) => sc.category_id === cat.id).length === 0 && (
                      <span className="text-[11px] text-slate-400 italic">No sub-categories yet</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: PAYMENT QRS */}
      {/* ========================================== */}
      {activeTab === 'qrs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">UPI Payment QR Configurations</h3>
              <p className="text-xs text-slate-500">Configure global, series-level, or test-specific payment QRs with exact fees for UPI student payments.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingQr(null);
                setNewQrTitle('');
                setNewQrAmount('');
                setNewQrUpi('');
                setNewQrAccount('EXAMIRROR SKILL COUNCIL');
                setNewQrImage('');
                setNewQrInstructions('');
                setNewQrIsDefault(false);
                setIsQrModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Payment QR
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {paymentQrs.map((qr: any) => (
              <div key={qr.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center text-center relative hover:border-slate-300 transition-colors shadow-2xs">
                {qr.is_global_default ? (
                  <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    Global Default
                  </span>
                ) : null}

                {/* QR Code Container */}
                <div className="w-36 h-36 bg-white p-2.5 rounded-2xl border border-slate-200 mb-3 shadow-xs flex items-center justify-center">
                  <img src={qr.qr_image_url} alt="QR Code" className="w-full h-full object-contain" />
                </div>

                <h4 className="font-black text-sm text-slate-900 leading-tight">{qr.title}</h4>

                {/* Amount Tag */}
                {Number(qr.amount) > 0 ? (
                  <span className="mt-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-200 flex items-center gap-1">
                    <IndianRupee size={11} />
                    <span>{Number(qr.amount).toLocaleString()} Fixed Amount</span>
                  </span>
                ) : (
                  <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                    Flexible / Any Amount
                  </span>
                )}

                <div className="flex items-center gap-1 font-mono text-xs font-bold text-purple-700 mt-2 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  <span>{qr.upi_id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(qr.upi_id);
                      showToast('success', 'UPI ID copied to clipboard');
                    }}
                    className="text-purple-500 hover:text-purple-800 ml-1 p-0.5"
                    title="Copy UPI ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">{qr.account_name}</span>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQr(qr);
                      setNewQrTitle(qr.title || '');
                      setNewQrAmount(qr.amount !== undefined && qr.amount !== null && Number(qr.amount) > 0 ? qr.amount : '');
                      setNewQrUpi(qr.upi_id || '');
                      setNewQrAccount(qr.account_name || '');
                      setNewQrImage(qr.qr_image_url || '');
                      setNewQrInstructions(qr.instructions || '');
                      setNewQrIsDefault(Boolean(qr.is_global_default));
                      setIsQrModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingQr(qr)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl cursor-pointer transition-colors"
                    title="Delete QR"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: STUDENT ATTEMPTS & RESET */}
      {/* ========================================== */}
      {activeTab === 'attempts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-bold text-base text-slate-900">Student Attempts & Audit Trail</h3>
            <p className="text-xs text-slate-500">Monitor exam submissions, accuracy, and reset attempts with reason audit logging.</p>
          </div>

          {isLoadingAttempts ? (
            <div className="py-16 text-center text-slate-400">Loading attempts...</div>
          ) : attemptsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Student</th>
                    <th className="py-3 px-4 font-bold">Test Name</th>
                    <th className="py-3 px-4 font-bold">Series</th>
                    <th className="py-3 px-4 font-bold">Score</th>
                    <th className="py-3 px-4 font-bold">Accuracy</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Reset Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attemptsList.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{att.student_first_name} {att.student_last_name}</span>
                        <span className="text-[11px] font-mono text-slate-500">{att.enrollment_no}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{att.test_title}</td>
                      <td className="py-3 px-4 text-slate-600">{att.test_series_title}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {att.final_score} <span className="text-[10px] text-slate-400">({att.percentage}%)</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">{att.accuracy}%</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${att.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' :
                          att.status === 'RESET' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {att.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => setResettingAttemptId(att.id)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">No attempts recorded yet.</div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: ANALYTICS & KPIS */}
      {/* ========================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {isLoadingAnalytics ? (
            <div className="py-20 text-center text-slate-400">Loading platform KPIs and analytics data...</div>
          ) : analyticsData?.kpis ? (
            <>
              {/* Primary KPI Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <IndianRupee size={12} className="text-emerald-600" /> Total Verified Revenue
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      ₹{analyticsData.kpis.totalRevenue?.toLocaleString() || 0}
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold mt-2 self-start">
                    Approved Payments
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <UserCheck size={12} className="text-blue-600" /> Active Student Enrollments
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                      {analyticsData.kpis.totalEnrollments || 0}
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold mt-2 self-start">
                    Enrolled Candidates
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Clock size={12} className="text-amber-600" /> Pending UTR Verifications
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                      {analyticsData.kpis.pendingPayments || 0}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold mt-2 self-start ${analyticsData.kpis.pendingPayments > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {analyticsData.kpis.pendingPayments > 0 ? 'Requires Action' : 'All Clear'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Award size={12} className="text-indigo-600" /> Tests Completed
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                      {analyticsData.kpis.testsCompleted || 0}
                    </div>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold mt-2 self-start">
                    Avg Score: {analyticsData.kpis.averagePercentage || 0}%
                  </span>
                </div>
              </div>

              {/* Digital Products Monetization & Sales Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                      Test Series Bought
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {analyticsData.kpis.testSeriesPurchases || 0} Packs Bought
                    </div>
                    <div className="text-xs font-bold text-indigo-600 mt-1">
                      Total Earnings: ₹{(analyticsData.kpis.testSeriesRevenue || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Trophy size={18} />
                  </div>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Notes / Study Materials Bought
                    </span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {analyticsData.kpis.notesPurchases || 0} Notes Unlocked
                    </div>
                    <div className="text-xs font-bold text-amber-600 mt-1">
                      Total Earnings: ₹{(analyticsData.kpis.notesRevenue || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                      Combined Digital Products Earnings
                    </span>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">
                      ₹{(analyticsData.kpis.combinedDigitalRevenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-1">
                      Test Series + Study Notes Collections
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>

              {/* Secondary Series Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Test Series Distribution</span>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800 pt-1">
                    <span>Total Created</span>
                    <span className="text-slate-900">{analyticsData.kpis.totalSeries || 0} Packs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Published</span>
                    <span className="font-bold text-emerald-700">{analyticsData.kpis.publishedSeries || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Draft / Scheduled</span>
                    <span className="font-bold text-amber-700">{(analyticsData.kpis.totalSeries || 0) - (analyticsData.kpis.publishedSeries || 0)}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Monetization Model</span>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800 pt-1">
                    <span>Paid Mock Packs</span>
                    <span className="text-purple-700">{analyticsData.kpis.paidSeries || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Free Practice Series</span>
                    <span className="font-bold text-slate-800">{analyticsData.kpis.freeSeries || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex mt-2">
                    <div
                      className="bg-purple-600 h-full"
                      style={{ width: `${((analyticsData.kpis.paidSeries || 0) / Math.max(1, analyticsData.kpis.totalSeries || 1)) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${((analyticsData.kpis.freeSeries || 0) / Math.max(1, analyticsData.kpis.totalSeries || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Candidate Performance</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {analyticsData.kpis.averagePercentage || 0}%
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Average overall accuracy score across all completed submissions.</p>
                  </div>
                  <div className="text-[11px] font-bold text-blue-700 bg-blue-50 p-2 rounded-xl border border-blue-100">
                    ✨ High-yield automated negative scoring active.
                  </div>
                </div>
              </div>

              {/* Recent Payment Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Recent Payment Transactions</h3>
                    <p className="text-[11px] text-slate-500">Latest UPI transactions submitted by candidates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('payments')}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View All Approvals <ArrowRight size={13} />
                  </button>
                </div>

                {analyticsData.recentPayments && analyticsData.recentPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="py-2.5 px-3 font-bold">Student</th>
                          <th className="py-2.5 px-3 font-bold">Series</th>
                          <th className="py-2.5 px-3 font-bold">Amount</th>
                          <th className="py-2.5 px-3 font-bold">UTR Reference</th>
                          <th className="py-2.5 px-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analyticsData.recentPayments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.student_first_name} {p.student_last_name}</td>
                            <td className="py-2.5 px-3 text-slate-700 truncate max-w-[200px]">{p.test_series_title}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">₹{p.amount}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700">{p.utr_number}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                p.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">No recent transactions recorded yet.</div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">No analytics data available.</div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CREATE / EDIT TEST SERIES */}
      {/* ========================================== */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">{editingSeries ? 'Edit Test Series' : 'Create Test Series'}</h3>
                <p className="text-xs text-slate-300">Set title, pricing, center publication scope and duration.</p>
              </div>
              <button onClick={() => setIsSeriesModalOpen(false)} className="text-slate-400 hover:text-white p-1.5">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Test Series Title *</label>
                  <input
                    type="text"
                    required
                    value={seriesForm.title}
                    onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                    placeholder="e.g. SSC CGL Complete Mock Test Series 2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none focus:border-blue-600 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Category *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCatName('');
                        setNewCatDesc('');
                        setNewCatThumbnail('');
                        setIsCategoryModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> New Category
                    </button>
                  </div>
                  <select
                    required
                    value={seriesForm.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setSeriesForm({ ...seriesForm, category_id: newCatId, sub_category_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Sub-Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubCategory(null);
                        setNewSubCatParentId(seriesForm.category_id ? String(seriesForm.category_id) : (categories[0]?.id ? String(categories[0].id) : ''));
                        setNewSubCatName('');
                        setNewSubCatDesc('');
                        setIsSubCategoryModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> New Sub-Category
                    </button>
                  </div>
                  <select
                    value={seriesForm.sub_category_id || ''}
                    onChange={(e) => setSeriesForm({ ...seriesForm, sub_category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none"
                  >
                    <option value="">None / General</option>
                    {subCategories
                      .filter((sc: any) => !seriesForm.category_id || String(sc.category_id) === String(seriesForm.category_id))
                      .map((sc: any) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Type</label>
                  <input
                    type="text"
                    value={seriesForm.exam_type}
                    onChange={(e) => setSeriesForm({ ...seriesForm, exam_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                {/* Multi-Category Cross-Listing Selector */}
                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="block font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <FolderTree size={14} className="text-indigo-600" />
                        Place in Multiple Categories (Cross-Listing)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Check all categories where this test series should be listed so students can discover it in any category.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {(Array.isArray(seriesForm.category_ids) && seriesForm.category_ids.length > 0 ? seriesForm.category_ids.length : (seriesForm.category_id ? 1 : 0))} Categories Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {categories.map((c: any) => {
                      const isPrimary = String(c.id) === String(seriesForm.category_id);
                      const isSelected = isPrimary || (Array.isArray(seriesForm.category_ids) && seriesForm.category_ids.includes(Number(c.id)));

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const cur = Array.isArray(seriesForm.category_ids) ? [...seriesForm.category_ids] : [];
                            const cNum = Number(c.id);
                            if (isPrimary) {
                              return; // Primary category is fixed via the primary dropdown above
                            }
                            if (cur.includes(cNum)) {
                              setSeriesForm({ ...seriesForm, category_ids: cur.filter(id => id !== cNum) });
                            } else {
                              setSeriesForm({ ...seriesForm, category_ids: [...cur, cNum] });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${isPrimary
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                              : isSelected
                                ? 'bg-indigo-100/90 text-indigo-800 border-indigo-300 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] font-bold ${isSelected
                              ? (isPrimary ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white')
                              : 'border border-slate-300'
                            }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{c.name}</span>
                          {isPrimary && (
                            <span className="text-[9px] uppercase font-mono tracking-wider opacity-90 px-1 py-0.2 rounded bg-indigo-700/80">
                              Primary
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={seriesForm.description}
                    onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                {/* Test Series Thumbnail Upload */}
                <div className="sm:col-span-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <ImageIcon size={15} className="text-blue-600" />
                      <span>Test Series Cover Thumbnail Image</span>
                    </label>
                    {seriesForm.thumbnail_url && (
                      <button
                        type="button"
                        onClick={() => setSeriesForm({ ...seriesForm, thumbnail_url: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove Thumbnail
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Preview Box */}
                    <div className="md:col-span-5 relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-white flex items-center justify-center group shadow-xs">
                      {seriesForm.thumbnail_url ? (
                        <>
                          <img
                            src={seriesForm.thumbnail_url}
                            alt="Thumbnail Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-[10px] text-white font-bold bg-slate-900/80 px-2 py-1 rounded">
                              Current Cover
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-slate-400">
                          <ImageIcon size={28} className="mx-auto mb-1 text-slate-300" />
                          <span className="text-[10.5px] font-bold block">No Thumbnail Set</span>
                          <span className="text-[9.5px]">Upload or select a preset</span>
                        </div>
                      )}
                    </div>

                    {/* Upload / URL Controls */}
                    <div className="md:col-span-7 space-y-2.5">
                      {/* File Upload Button */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                          <Upload size={14} className="text-blue-600" />
                          <span>Upload Image (JPG/PNG/WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 8 * 1024 * 1024) {
                                showToast('error', 'Image size must be under 8MB');
                                return;
                              }
                              try {
                                const fd = new FormData();
                                fd.append('file', file);
                                const res = await axios.post('http://localhost:3000/api/public/upload', fd, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                if (res.data?.url || res.data?.s3Url) {
                                  setSeriesForm({ ...seriesForm, thumbnail_url: res.data.url || res.data.s3Url });
                                  showToast('success', 'Thumbnail uploaded successfully!');
                                  return;
                                }
                              } catch (_) { }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSeriesForm({ ...seriesForm, thumbnail_url: reader.result as string });
                                showToast('success', 'Thumbnail loaded from file!');
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>

                      {/* Direct URL input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={seriesForm.thumbnail_url}
                          onChange={(e) => setSeriesForm({ ...seriesForm, thumbnail_url: e.target.value })}
                          placeholder="Or paste direct image URL (https://...)"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white outline-none text-[11px] text-slate-800"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">Quick Category Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '🎓 Mock Test', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600' },
                            { label: '💻 Computer', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600' },
                            { label: '📈 Banking', url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600' },
                            { label: '⚡ Reasoning', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600' }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setSeriesForm({ ...seriesForm, thumbnail_url: preset.url })}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-all cursor-pointer ${seriesForm.thumbnail_url === preset.url
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free vs Paid & Price */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seriesForm.is_free}
                      onChange={(e) => setSeriesForm({ ...seriesForm, is_free: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Free Test Series (No Payment Required)</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    disabled={seriesForm.is_free}
                    value={seriesForm.price}
                    onChange={(e) => setSeriesForm({ ...seriesForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold outline-none disabled:bg-slate-100"
                  />
                </div>

                {/* Center Scope */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publish Scope *</label>
                  <select
                    value={seriesForm.publish_scope}
                    onChange={(e) => setSeriesForm({ ...seriesForm, publish_scope: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-bold"
                  >
                    <option value="ALL_CENTRES">All Centres (Visible Everywhere)</option>
                    <option value="SELECTED_CENTRES">Selected Centres Only (Center Isolation)</option>
                  </select>
                </div>

                {/* Payment QR Selector for Paid */}
                {!seriesForm.is_free && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">Attached Payment QR</label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQr(null);
                          setNewQrTitle('');
                          setNewQrUpi('');
                          setNewQrAccount('EXAMIRROR SKILL COUNCIL');
                          setNewQrImage('');
                          setNewQrInstructions('');
                          setNewQrIsDefault(false);
                          setIsQrModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Plus size={12} /> New QR
                      </button>
                    </div>
                    <select
                      value={seriesForm.payment_qr_id}
                      onChange={(e) => setSeriesForm({ ...seriesForm, payment_qr_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-semibold text-slate-800"
                    >
                      <option value="">-- Use Global Default QR --</option>
                      {paymentQrs.map((qr: any) => (
                        <option key={qr.id} value={String(qr.id)}>{qr.title} ({qr.upi_id})</option>
                      ))}
                    </select>

                    {/* LIVE SELECTED QR PREVIEW CARD */}
                    {(() => {
                      const selectedQrObj = seriesForm.payment_qr_id
                        ? paymentQrs.find((q: any) => String(q.id) === String(seriesForm.payment_qr_id))
                        : paymentQrs.find((q: any) => q.is_global_default) || paymentQrs[0];

                      if (!selectedQrObj) return null;

                      return (
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center gap-3">
                          <div className="w-14 h-14 bg-white rounded-xl p-1 border border-purple-200 shadow-xs shrink-0 flex items-center justify-center">
                            <img
                              src={selectedQrObj.qr_image_url}
                              alt="QR Preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{selectedQrObj.title}</span>
                              {Number(selectedQrObj.amount) > 0 ? (
                                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                  ₹{Number(selectedQrObj.amount).toLocaleString()} Fixed Amount
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                                  Flexible Amount
                                </span>
                              )}
                              {!seriesForm.payment_qr_id && selectedQrObj.is_global_default ? (
                                <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                                  Global Default
                                </span>
                              ) : null}
                            </div>
                            <span className="font-mono text-[11px] text-purple-700 font-bold block truncate mt-0.5">{selectedQrObj.upi_id}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{selectedQrObj.account_name}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Center Checklist if SELECTED_CENTRES */}
                {seriesForm.publish_scope === 'SELECTED_CENTRES' && (
                  <div className="sm:col-span-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <span className="font-bold text-amber-900 block">Select Authorized Centres:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                      {centresList.map((cntr: any) => {
                        const isChecked = seriesForm.allowed_centre_ids.includes(cntr.id);
                        return (
                          <label key={cntr.id} className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSeriesForm({ ...seriesForm, allowed_centre_ids: [...seriesForm.allowed_centre_ids, cntr.id] });
                                } else {
                                  setSeriesForm({ ...seriesForm, allowed_centre_ids: seriesForm.allowed_centre_ids.filter(cid => cid !== cntr.id) });
                                }
                              }}
                            />
                            <span className="truncate">{cntr.instituteName || cntr.name} ({cntr.city})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={seriesForm.validity_days}
                    onChange={(e) => setSeriesForm({ ...seriesForm, validity_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publication Mode & Status *</label>
                  <select
                    value={seriesForm.status}
                    onChange={(e) => setSeriesForm({ ...seriesForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-bold"
                  >
                    <option value="DRAFT">DRAFT (Save in DB, hidden from students)</option>
                    <option value="SCHEDULED">SCHEDULE AUTO-PUBLISH (Auto-release on date/time)</option>
                    <option value="PUBLISHED">PUBLISHED (Live immediately for eligible students)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED / ARCHIVED</option>
                  </select>
                </div>

                {/* Scheduled Date & Time Picker */}
                {seriesForm.status === 'SCHEDULED' && (
                  <div className="sm:col-span-2 p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                    <label className="block font-bold text-purple-900 text-xs flex items-center gap-1.5">
                      <CalendarClock size={14} className="text-purple-600" />
                      <span>Scheduled Auto-Publish Date & Time *</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={seriesForm.scheduled_publish_time}
                      onChange={(e) => setSeriesForm({ ...seriesForm, scheduled_publish_time: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-bold text-purple-900 outline-none focus:border-purple-600"
                    />
                    <p className="text-[11px] text-purple-700 leading-relaxed">
                      💡 The platform's automated engine will keep this test series in draft mode until this time arrives, then automatically publish it to all eligible centres and students.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsSeriesModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      setSeriesForm(prev => ({ ...prev, status: 'DRAFT' }));
                      setTimeout(() => {
                        handleSaveSeries(e);
                      }, 50);
                    }}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl shadow-2xs cursor-pointer text-xs flex items-center gap-1"
                  >
                    <FileEdit size={13} /> Save as Draft
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs"
                  >
                    {editingSeries ? 'Save Changes' : 'Create & Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: MANAGE TESTS INSIDE SERIES */}
      {/* ========================================== */}
      {activeTestsSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-300 font-bold uppercase">{activeTestsSeries.exam_type}</span>
                <h3 className="text-lg font-black">{activeTestsSeries.title}</h3>
                <p className="text-xs text-slate-300">Tests inside this series with weekly release schedules.</p>
              </div>
              <button onClick={() => setActiveTestsSeries(null)} className="text-slate-400 hover:text-white p-1.5">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Tests in Series ({activeTests.length})</h4>
                  <p className="text-[11px] text-slate-500">Each test can have its own customized UPI payment QR code or inherit the series default.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddTest}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Add Test
                </button>
              </div>

              <div className="space-y-3">
                {activeTests.map((t: any) => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Week {t.release_week}
                        </span>
                        {t.payment_qr_id ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[10px] flex items-center gap-1">
                            <QrCode size={11} className="text-purple-600" /> Custom QR: {t.qr_title || t.qr_upi_id}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium text-[10px] flex items-center gap-1">
                            <QrCode size={11} className="text-slate-400" /> Inherits Series QR
                          </span>
                        )}
                        {!t.is_free && Number(t.price) > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                            ₹{t.price}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-slate-500 text-[11px] mt-1.5">
                        <span>Duration: {t.duration_minutes} Mins</span>
                        <span>Marks: {t.total_marks}</span>
                        <span>Neg: -{t.negative_marks}</span>
                        <span className="font-bold text-slate-800">Questions: {t.real_question_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTest(t)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-200 cursor-pointer shadow-2xs"
                        title="Edit Test & QR Code"
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTestForQuestions(t)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <ListOrdered size={13} /> Questions ({t.real_question_count || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTestTarget(t)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: MANAGE QUESTIONS INSIDE TEST */}
      {/* ========================================== */}
      {activeTestForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">{activeTestForQuestions.title} — Questions Bank</h3>
                <p className="text-xs text-slate-300">Add question texts, 4 options, marks, negative marking, and explanations.</p>
              </div>
              <button onClick={() => setActiveTestForQuestions(null)} className="text-slate-400 hover:text-white p-1.5">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm">Questions in this Test ({activeQuestions.length})</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkJsonModalOpen(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-amber-300" />
                    <span>Bulk JSON Import</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} /> Add Single Question
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeQuestions.map((q: any, qIdx: number) => {
                  let meta: any = {};
                  try {
                    meta = typeof q.metadata === 'string' ? JSON.parse(q.metadata || '{}') : (q.metadata || {});
                  } catch (_) {
                    meta = {};
                  }

                  const questionImages: string[] = Array.isArray(meta?.imageUrls)
                    ? meta.imageUrls
                    : (q.image_url ? [q.image_url] : []);
                  const columnA = meta?.columnA || [];
                  const columnB = meta?.columnB || [];
                  const correctMatches = meta?.correctMatches || '';
                  const itemsToOrder = meta?.itemsToOrder || [];
                  const correctOrder = meta?.correctOrder || '';
                  const isMatchFollowing = q.question_type === 'MATCH_FOLLOWING' || columnA.length > 0;
                  const isSequenceOrder = q.question_type === 'SEQUENCE_ORDER' || q.question_type === 'ARRANGE_ORDER' || itemsToOrder.length > 0;
                  const isTrueFalse = q.question_type === 'TRUE_FALSE';

                  return (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      {/* Question Header & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="font-bold text-slate-900 text-sm flex gap-2">
                            <span className="text-indigo-600 font-extrabold">Q{qIdx + 1}.</span>
                            <span>{q.question_text}</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                              {q.question_type || 'SINGLE_CHOICE'}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">
                              +{q.marks || 2} / -{q.negative_marks || 0.5}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                              {q.section_name || 'General Assessment'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title="Edit Question"
                          >
                            <Edit size={14} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingQuestionTarget(q)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title="Delete Question"
                          >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Supporting Question Figures / Diagrams */}
                      {questionImages.length > 0 && (
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <ImageIcon size={12} className="text-indigo-600" />
                            <span>Question Figure(s) ({questionImages.length}):</span>
                          </span>
                          <div className={`grid gap-2.5 ${questionImages.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {questionImages.map((imgUrl: string, imgIdx: number) => (
                              <div
                                key={imgIdx}
                                className="relative group bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center overflow-hidden"
                              >
                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 text-white rounded text-[9px] font-bold z-10">
                                  Figure {imgIdx + 1}
                                </span>
                                <img
                                  src={imgUrl}
                                  alt={`Figure ${imgIdx + 1}`}
                                  className="max-h-44 object-contain rounded cursor-pointer transition-transform group-hover:scale-102"
                                  onClick={() => setPreviewLightbox({ url: imgUrl, title: `Q${qIdx + 1} - Figure ${imgIdx + 1}` })}
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewLightbox({ url: imgUrl, title: `Q${qIdx + 1} - Figure ${imgIdx + 1}` })}
                                  className="absolute bottom-1.5 right-1.5 px-2 py-1 bg-white/95 text-slate-700 rounded shadow-xs border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Maximize2 size={11} />
                                  <span>Zoom</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 1. MATCH THE FOLLOWING TABLE */}
                      {isMatchFollowing && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="space-y-1 border-r border-slate-100 pr-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Column A (Items)</span>
                              {columnA.map((item: string, i: number) => (
                                <div key={i} className="p-1 bg-slate-50 rounded text-slate-800 text-[11px] font-medium">{item}</div>
                              ))}
                            </div>
                            <div className="space-y-1 pl-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Column B (Matches)</span>
                              {columnB.map((item: string, i: number) => (
                                <div key={i} className="p-1 bg-slate-50 rounded text-slate-800 text-[11px] font-medium">{item}</div>
                              ))}
                            </div>
                          </div>
                          {correctMatches && (
                            <div className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                              Correct Pairing: <span className="font-mono text-amber-800">{correctMatches}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. SEQUENCE / ARRANGE IN CORRECT ORDER */}
                      {isSequenceOrder && (
                        <div className="bg-white p-3 rounded-xl border border-sky-200 space-y-2">
                          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
                            <ListOrdered size={12} className="text-sky-600" />
                            <span>Sequence Items to Arrange:</span>
                          </span>
                          <div className="space-y-1">
                            {itemsToOrder.map((item: string, i: number) => (
                              <div key={i} className="p-1.5 bg-sky-50/70 border border-sky-100 rounded-lg flex items-center gap-2 text-[11px] font-medium text-slate-800">
                                <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                          {correctOrder && (
                            <div className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5">
                              <span className="text-emerald-700 text-[10px] uppercase">Correct Sequence:</span>
                              <span className="font-mono text-emerald-800">{correctOrder}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. TRUE / FALSE CARDS */}
                      {isTrueFalse && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options?.map((opt: any) => {
                            const isCorr = Boolean(opt.is_correct);
                            return (
                              <div
                                key={opt.id || opt.option_key}
                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                                  isCorr
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span>{opt.option_text}</span>
                                {isCorr ? (
                                  <span className="text-[10px] uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-extrabold">
                                    ✓ Correct
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. STANDARD & IMAGE MCQ OPTIONS */}
                      {!isTrueFalse && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options?.map((opt: any) => {
                            const isCorr = Boolean(opt.is_correct);
                            return (
                              <div
                                key={opt.id || opt.option_key}
                                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col justify-between gap-2 transition-all ${
                                  isCorr
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{opt.option_key}. {opt.option_text}</span>
                                  {isCorr ? <Check size={14} className="text-emerald-600 font-extrabold" /> : null}
                                </div>

                                {opt.image_url && (
                                  <div className="relative group bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex justify-center items-center">
                                    <img
                                      src={opt.image_url}
                                      alt={`Option ${opt.option_key}`}
                                      className="max-h-24 object-contain rounded cursor-pointer transition-transform group-hover:scale-102"
                                      onClick={() => setPreviewLightbox({ url: opt.image_url, title: `Option ${opt.option_key} - ${opt.option_text}` })}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLightbox({ url: opt.image_url, title: `Option ${opt.option_key} - ${opt.option_text}` })}
                                      className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/95 text-slate-700 rounded border border-slate-200 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Maximize2 size={9} />
                                      <span>Zoom</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-2 leading-relaxed">
                          <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* LIGHTBOX ZOOM MODAL FOR QUESTIONS BANK */}
      {/* ========================================== */}
      {previewLightbox && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between text-white text-xs px-2">
              <span className="font-bold truncate max-w-[400px]">
                {previewLightbox.title || 'Image Preview'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-mono px-1">{Math.round(previewLightboxZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewLightboxZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLightboxZoom(1)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLightbox(null)}
                  className="p-1.5 bg-white/10 hover:bg-rose-500/80 rounded-lg cursor-pointer transition-colors ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex items-center justify-center">
              <img
                src={previewLightbox.url}
                alt={previewLightbox.title || 'Preview'}
                style={{ transform: `scale(${previewLightboxZoom})`, transformOrigin: 'center center' }}
                className="max-h-[70vh] object-contain transition-transform duration-150 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: AI / JSON BULK IMPORT QUESTIONS */}
      {/* ========================================== */}
      {isBulkJsonModalOpen && activeTestForQuestions && (
        <BulkQuestionJsonImportModal
          testId={activeTestForQuestions.id}
          testTitle={activeTestForQuestions.title}
          onClose={() => setIsBulkJsonModalOpen(false)}
          onSuccess={() => {
            setIsBulkJsonModalOpen(false);
            showToast('success', 'Questions successfully imported via JSON!');
            refetchActiveQuestions();
            refetchActiveTests();
          }}
        />
      )}

      {/* ========================================== */}
      {/* ========================================== */}
      {/* MODAL: ADD / EDIT QUESTION FORM */}
      {/* ========================================== */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  {editingQuestion ? (
                    <>
                      <FileEdit size={16} className="text-amber-400" />
                      <span>Edit Question</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                        ID #{editingQuestion.id}
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="text-emerald-400" />
                      <span>Add New Question</span>
                    </>
                  )}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {editingQuestion
                    ? 'Modify question text, diagrams, options, marks and detailed solution.'
                    : `Create a question inside "${activeTestForQuestions?.title || 'Current Test'}".`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddQuestionModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
              {/* Question Type, Section, and Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium outline-none focus:border-indigo-600"
                  >
                    <option value="SINGLE_CHOICE">Single Choice MCQ</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Multiple Correct)</option>
                    <option value="IMAGE_MCQ">Image / Diagram MCQ</option>
                    <option value="MATCH_FOLLOWING">Match The Following</option>
                    <option value="SEQUENCE_ORDER">Sequence / Arrange Order</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section / Subject</label>
                  <input
                    type="text"
                    value={questionForm.section_name}
                    onChange={(e) => setQuestionForm({ ...questionForm, section_name: e.target.value })}
                    placeholder="e.g. General Science, Math"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marks (+Correct / -Negative)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.25"
                      value={questionForm.marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl text-center font-bold text-emerald-600 outline-none focus:border-indigo-600"
                      placeholder="+Marks"
                    />
                    <input
                      type="number"
                      step="0.25"
                      value={questionForm.negative_marks}
                      onChange={(e) => setQuestionForm({ ...questionForm, negative_marks: Number(e.target.value) })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl text-center font-bold text-rose-500 outline-none focus:border-indigo-600"
                      placeholder="-Neg"
                    />
                  </div>
                </div>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Statement / Text *</label>
                <textarea
                  rows={3}
                  required
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  placeholder="Enter complete question text, equations, or prompt statement..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-sm font-semibold"
                />
              </div>

              {/* Question Diagram / Image Upload & URL */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-600" />
                    <span>Question Diagram / Supporting Figure (Optional)</span>
                  </span>
                  <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-2xs">
                    <Upload size={12} />
                    <span>{isUploadingQuestionImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingQuestionImage}
                      onChange={handleUploadQuestionImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={questionForm.image_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setQuestionForm((prev) => ({
                        ...prev,
                        image_url: url,
                        imageUrls: url ? (prev.imageUrls.includes(url) ? prev.imageUrls : [url, ...prev.imageUrls]) : prev.imageUrls
                      }));
                    }}
                    placeholder="Paste direct Image URL (e.g. /uploads/questions/... or https://...)"
                    className="flex-grow px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white outline-none focus:border-indigo-600"
                  />
                  {questionForm.image_url && (
                    <button
                      type="button"
                      onClick={() => setQuestionForm({ ...questionForm, image_url: '' })}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Thumbnail Preview */}
                {questionForm.image_url && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative group w-20 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shadow-2xs">
                      <img
                        src={questionForm.image_url}
                        alt="Question Figure"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">Diagram will be presented above options to students.</span>
                  </div>
                )}
              </div>

              {/* Match The Following Columns (If question_type === 'MATCH_FOLLOWING') */}
              {questionForm.question_type === 'MATCH_FOLLOWING' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <span className="font-bold text-amber-900 block text-xs">Match The Following Columns:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <span className="font-semibold text-slate-600 block text-[11px]">Column A (1, 2, 3, 4)</span>
                      {questionForm.columnA.map((item, idx) => (
                        <input
                          key={`colA-${idx}`}
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...questionForm.columnA];
                            updated[idx] = e.target.value;
                            setQuestionForm({ ...questionForm, columnA: updated });
                          }}
                          placeholder={`Item ${idx + 1}`}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-semibold text-slate-600 block text-[11px]">Column B (P, Q, R, S)</span>
                      {questionForm.columnB.map((item, idx) => (
                        <input
                          key={`colB-${idx}`}
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...questionForm.columnB];
                            updated[idx] = e.target.value;
                            setQuestionForm({ ...questionForm, columnB: updated });
                          }}
                          placeholder={`Item ${String.fromCharCode(80 + idx)}`}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sequence Ordering (If question_type === 'SEQUENCE_ORDER') */}
              {questionForm.question_type === 'SEQUENCE_ORDER' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                  <span className="font-bold text-indigo-900 block text-xs">Steps / Events to Arrange:</span>
                  <div className="space-y-1.5">
                    {questionForm.itemsToOrder.map((item, idx) => (
                      <div key={`seq-${idx}`} className="flex items-center gap-2">
                        <span className="w-5 font-bold text-indigo-700 text-center">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...questionForm.itemsToOrder];
                            updated[idx] = e.target.value;
                            setQuestionForm({ ...questionForm, itemsToOrder: updated });
                          }}
                          placeholder={`Event / Process Step ${idx + 1}`}
                          className="flex-grow px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options Management */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">
                    Answer Options ({questionForm.question_type === 'MULTIPLE_CHOICE' ? 'Check all that are correct' : 'Select Radio for Correct Answer'}):
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Click radio/checkbox to set correct answer</span>
                </div>

                <div className="space-y-2">
                  {questionForm.options.map((opt, idx) => {
                    const isMultiple = questionForm.question_type === 'MULTIPLE_CHOICE';

                    return (
                      <div
                        key={opt.option_key}
                        className={`p-2.5 rounded-xl border transition-all ${
                          opt.is_correct
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isMultiple ? (
                            <input
                              type="checkbox"
                              checked={opt.is_correct}
                              onChange={(e) => {
                                const updated = [...questionForm.options];
                                updated[idx].is_correct = e.target.checked;
                                setQuestionForm({ ...questionForm, options: updated });
                              }}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                            />
                          ) : (
                            <input
                              type="radio"
                              name="correct_option"
                              checked={opt.is_correct}
                              onChange={() => {
                                const updated = questionForm.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                                setQuestionForm({ ...questionForm, options: updated });
                              }}
                              className="w-4 h-4 text-emerald-600 cursor-pointer accent-emerald-600"
                            />
                          )}

                          <span className={`font-extrabold w-6 text-center text-xs ${opt.is_correct ? 'text-emerald-700 font-mono' : 'text-slate-700'}`}>
                            {opt.option_key}.
                          </span>

                          <input
                            type="text"
                            required
                            value={opt.option_text}
                            onChange={(e) => {
                              const updated = [...questionForm.options];
                              updated[idx].option_text = e.target.value;
                              setQuestionForm({ ...questionForm, options: updated });
                            }}
                            placeholder={`Option ${opt.option_key} statement...`}
                            className="flex-grow px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-indigo-600 font-medium"
                          />

                          {/* Option Image Upload Button */}
                          <label
                            className="p-1.5 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors shrink-0"
                            title="Attach Diagram to this Option"
                          >
                            <ImageIcon size={14} />
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingOptionKey === opt.option_key}
                              onChange={(e) => handleUploadOptionImage(opt.option_key, e)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Optional Option Image Thumbnail */}
                        {opt.image_url && (
                          <div className="flex items-center gap-2 mt-2 ml-8 pl-1">
                            <div className="w-14 h-10 rounded border border-slate-300 overflow-hidden bg-white shadow-2xs">
                              <img src={opt.image_url} alt={`Option ${opt.option_key}`} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] text-slate-500">Option image attached</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...questionForm.options];
                                updated[idx].image_url = '';
                                setQuestionForm({ ...questionForm, options: updated });
                              }}
                              className="text-rose-500 hover:text-rose-700 text-[10px] font-bold hover:underline cursor-pointer ml-auto"
                            >
                              Remove Image
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Solution / Answer Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Answer Explanation (Shown to Student in Scorecard & Solutions)</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Provide step-by-step reasoning, mathematical solution or formula derivation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddQuestionModalOpen(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  {editingQuestion ? (
                    <>
                      <Check size={14} />
                      <span>Update Question</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Save Question</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT TEST MODAL */}
      {/* ========================================== */}
      {isAddTestModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{editingTest ? 'Edit Test & Payment QR' : 'Add Test inside Series'}</h3>
                <p className="text-[11px] text-slate-300">Configure duration, marks, and specific custom UPI QR code for this test.</p>
              </div>
              <button onClick={() => { setIsAddTestModalOpen(false); setEditingTest(null); }} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="e.g. Quantitative Aptitude Mock 01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Description / Instructions</label>
                <textarea
                  rows={2}
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  placeholder="Specific topics covered or exam guidelines..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={testForm.duration_minutes}
                    onChange={(e) => setTestForm({ ...testForm, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Release Week #</label>
                  <input
                    type="number"
                    value={testForm.release_week}
                    onChange={(e) => setTestForm({ ...testForm, release_week: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={testForm.status}
                    onChange={(e) => setTestForm({ ...testForm, status: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-xl bg-white font-bold"
                  >
                    <option value="LIVE">LIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={testForm.total_marks}
                    onChange={(e) => setTestForm({ ...testForm, total_marks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={testForm.negative_marks}
                    onChange={(e) => setTestForm({ ...testForm, negative_marks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border rounded-xl text-rose-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={testForm.passing_marks}
                    onChange={(e) => setTestForm({ ...testForm, passing_marks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* SPECIFIC TEST PAYMENT QR CONFIGURATION */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs">
                    <QrCode size={15} className="text-purple-600" />
                    <span>Payment QR for this Test</span>
                  </div>
                  <span className="text-[10px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full">
                    Custom QR Option
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${testForm.qr_mode === 'INHERIT'
                    ? 'bg-white border-purple-600 shadow-xs'
                    : 'bg-white/50 border-purple-200 hover:bg-white'
                    }`}>
                    <input
                      type="radio"
                      name="test_qr_mode"
                      checked={testForm.qr_mode === 'INHERIT'}
                      onChange={() => setTestForm({ ...testForm, qr_mode: 'INHERIT', payment_qr_id: '' })}
                      className="text-purple-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Series Default QR</span>
                      <span className="text-[10px] text-slate-500 block">Inherit series / platform QR</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${testForm.qr_mode === 'CUSTOM'
                    ? 'bg-white border-purple-600 shadow-xs'
                    : 'bg-white/50 border-purple-200 hover:bg-white'
                    }`}>
                    <input
                      type="radio"
                      name="test_qr_mode"
                      checked={testForm.qr_mode === 'CUSTOM'}
                      onChange={() => setTestForm({ ...testForm, qr_mode: 'CUSTOM', payment_qr_id: testForm.payment_qr_id || (paymentQrs[0]?.id ? String(paymentQrs[0].id) : '') })}
                      className="text-purple-600"
                    />
                    <div>
                      <span className="font-bold text-purple-900 block text-[11px]">Specific Custom QR</span>
                      <span className="text-[10px] text-purple-700 block">Unique QR for this test</span>
                    </div>
                  </label>
                </div>

                {/* If Custom QR is Selected */}
                {testForm.qr_mode === 'CUSTOM' && (
                  <div className="space-y-2 pt-1 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-purple-900 text-[11px]">Select Assigned Payment QR:</label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQr(null);
                          setNewQrTitle(`QR for ${testForm.title || 'Test'}`);
                          setNewQrUpi('');
                          setNewQrAccount('EXAMIRROR SKILL COUNCIL');
                          setNewQrImage('');
                          setNewQrInstructions('');
                          setNewQrIsDefault(false);
                          setIsQrModalOpen(true);
                        }}
                        className="text-purple-700 hover:text-purple-900 font-bold text-[10px] flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Plus size={11} /> + New QR
                      </button>
                    </div>

                    <select
                      value={testForm.payment_qr_id}
                      onChange={(e) => setTestForm({ ...testForm, payment_qr_id: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">-- Choose QR Code --</option>
                      {paymentQrs.map((qr: any) => (
                        <option key={qr.id} value={qr.id}>
                          {qr.title} — {qr.upi_id} ({qr.account_name})
                        </option>
                      ))}
                    </select>

                    {/* QR Details Preview Card */}
                    {testForm.payment_qr_id && (
                      (() => {
                        const selectedQrObj = paymentQrs.find((q: any) => String(q.id) === String(testForm.payment_qr_id));
                        if (!selectedQrObj) return null;
                        return (
                          <div className="p-2.5 bg-white rounded-xl border border-purple-200 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg p-0.5 border border-purple-200 shrink-0">
                              <img src={selectedQrObj.qr_image_url} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-slate-900 block truncate">{selectedQrObj.title}</span>
                              <span className="font-mono text-[10px] text-purple-700 font-bold block">{selectedQrObj.upi_id}</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setIsAddTestModalOpen(false); setEditingTest(null); }}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingTest ? 'Save Test Changes' : 'Add Test to Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: REJECT PAYMENT REASON */}
      {/* ========================================== */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Reject Payment Reference</h3>
            <p className="text-xs text-slate-500">Provide a clear reason that will be sent to the student.</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid UTR reference / Amount mismatch / Payment not credited"
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-600"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectingPaymentId(null)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button onClick={handleRejectPayment} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RESET ATTEMPT */}
      {/* ========================================== */}
      {resettingAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900">Reset Student Test Attempt</h3>
            <p className="text-xs text-slate-500">
              Resetting allows the student to retake the test. This action is permanently audited.
            </p>
            <textarea
              rows={3}
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="Enter reason for reset..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-amber-600"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setResettingAttemptId(null)} className="px-4 py-2 border rounded-xl text-xs font-semibold">Cancel</button>
              <button onClick={handleResetAttempt} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">Confirm Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SCREENSHOT PREVIEW */}
      {/* ========================================== */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-xl max-h-[85vh]">
            <img src={viewingScreenshot} alt="Payment Proof" className="w-full h-full object-contain rounded-2xl" />
            <button onClick={() => setViewingScreenshot(null)} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ========================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCategory ? 'Edit Test Category' : 'Create New Category'}
              </h3>
              <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. UPSC Prelims, Reasoning Skills, Banking"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Brief category description..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
              />
            </div>

            {/* Category Thumbnail Upload / Cover Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Category Thumbnail Banner</span>
                <span className="text-[10px] text-slate-400 font-normal">Shown on Home Page &amp; Student Discovery</span>
              </label>

              {newCatThumbnail ? (
                <div className="relative mb-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video max-h-36 group">
                  <img
                    src={newCatThumbnail}
                    alt="Category Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => setNewCatThumbnail('')}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-md cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3 text-center bg-slate-50/70 mb-2 transition-colors">
                  <ImageIcon size={22} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-[11px] text-slate-600 font-medium">Upload thumbnail image (JPG, PNG, WebP)</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className={`flex-1 py-1.5 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${isUploadingCatThumb ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Upload size={13} className="text-blue-600" />
                  <span>{isUploadingCatThumb ? 'Uploading...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingCatThumb(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await axios.post('/api/public/upload', formData);
                        if (res.data?.url) {
                          setNewCatThumbnail(res.data.url);
                          showToast('success', 'Thumbnail uploaded successfully');
                        }
                      } catch {
                        // Fallback to base64
                        const reader = new FileReader();
                        reader.onload = () => {
                          setNewCatThumbnail(reader.result as string);
                          showToast('success', 'Thumbnail loaded');
                        };
                        reader.readAsDataURL(file);
                      } finally {
                        setIsUploadingCatThumb(false);
                      }
                    }}
                  />
                </label>
                {newCatThumbnail && (
                  <button
                    type="button"
                    onClick={() => setNewCatThumbnail('')}
                    className="px-2.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Direct Image URL input */}
              <div className="mt-2">
                <input
                  type="url"
                  value={newCatThumbnail}
                  onChange={(e) => setNewCatThumbnail(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] text-slate-700 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              {/* Curated Presets */}
              <div className="mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Aptitude & Reasoning', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600' },
                    { label: 'SSC & Govt', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600' },
                    { label: 'Banking & PO', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600' },
                    { label: 'Railways & RRB', url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=600' },
                    { label: 'IT & Computer', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewCatThumbnail(preset.url)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[10px] font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newCatName.trim()) {
                    showToast('error', 'Category name is required');
                    return;
                  }
                  try {
                    if (editingCategory) {
                      await axios.put(`/api/admin/categories/${editingCategory.id}`, {
                        name: newCatName.trim(),
                        description: newCatDesc.trim(),
                        thumbnail_url: newCatThumbnail.trim()
                      });
                      showToast('success', 'Category updated successfully');
                    } else {
                      const res = await axios.post('/api/admin/categories', {
                        name: newCatName.trim(),
                        description: newCatDesc.trim(),
                        thumbnail_url: newCatThumbnail.trim()
                      });
                      showToast('success', `Category "${newCatName.trim()}" created`);
                      if (res.data?.data?.id) {
                        setSeriesForm(prev => ({ ...prev, category_id: String(res.data.data.id) }));
                      }
                    }
                    await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                    setNewCatName('');
                    setNewCatDesc('');
                    setNewCatThumbnail('');
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to save category');
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT SUB-CATEGORY */}
      {/* ========================================== */}
      {isSubCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingSubCategory ? 'Edit Sub-Category' : 'Create Sub-Category'}
                </h3>
                <p className="text-slate-500 text-xs">Organize tests under a parent category.</p>
              </div>
              <button
                type="button"
                onClick={() => { setIsSubCategoryModalOpen(false); setEditingSubCategory(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={newSubCatParentId}
                  onChange={(e) => setNewSubCatParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Category Name *</label>
                <input
                  type="text"
                  value={newSubCatName}
                  onChange={(e) => setNewSubCatName(e.target.value)}
                  placeholder="e.g. SSC CGL (Tier 1 & 2), ADCA Diploma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={newSubCatDesc}
                  onChange={(e) => setNewSubCatDesc(e.target.value)}
                  placeholder="Brief summary of syllabus or target audience..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => { setIsSubCategoryModalOpen(false); setEditingSubCategory(null); }}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newSubCatParentId) {
                    showToast('error', 'Please select a parent category');
                    return;
                  }
                  if (!newSubCatName.trim()) {
                    showToast('error', 'Sub-category name is required');
                    return;
                  }
                  try {
                    if (editingSubCategory) {
                      await axios.put(`/api/admin/sub-categories/${editingSubCategory.id}`, {
                        category_id: Number(newSubCatParentId),
                        name: newSubCatName.trim(),
                        description: newSubCatDesc.trim()
                      });
                      showToast('success', 'Sub-category updated successfully');
                    } else {
                      const res = await axios.post('/api/admin/sub-categories', {
                        category_id: Number(newSubCatParentId),
                        name: newSubCatName.trim(),
                        description: newSubCatDesc.trim()
                      });
                      showToast('success', `Sub-category "${newSubCatName.trim()}" created`);
                      if (res.data?.data?.id) {
                        setSeriesForm(prev => ({
                          ...prev,
                          category_id: String(newSubCatParentId),
                          sub_category_id: String(res.data.data.id)
                        }));
                      }
                    }
                    await queryClient.invalidateQueries({ queryKey: ['adminSubCategories'] });
                    setIsSubCategoryModalOpen(false);
                    setEditingSubCategory(null);
                    setNewSubCatName('');
                    setNewSubCatDesc('');
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to save sub-category');
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                {editingSubCategory ? 'Save Changes' : 'Create Sub-Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT PAYMENT QR */}
      {/* ========================================== */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingQr ? 'Edit UPI Payment QR' : 'Add UPI Payment QR'}
                </h3>
                <p className="text-[11px] text-slate-500">Upload direct QR screenshot or auto-generate with fixed fee amount.</p>
              </div>
              <button onClick={() => { setIsQrModalOpen(false); setEditingQr(null); }} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">QR Title *</label>
                <input
                  type="text"
                  required
                  value={newQrTitle}
                  onChange={(e) => setNewQrTitle(e.target.value)}
                  placeholder="e.g. HDFC Mock Test Series QR"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fixed Fee Amount (₹)</label>
                <input
                  type="number"
                  value={newQrAmount}
                  onChange={(e) => setNewQrAmount(e.target.value)}
                  placeholder="e.g. 299 (0 = Any Amount)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI ID *</label>
                <input
                  type="text"
                  required
                  value={newQrUpi}
                  onChange={(e) => setNewQrUpi(e.target.value)}
                  placeholder="e.g. examirror@okhdfcbank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-purple-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account / Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  value={newQrAccount}
                  onChange={(e) => setNewQrAccount(e.target.value)}
                  placeholder="e.g. EXAMIRROR SKILL COUNCIL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>
            </div>

            {/* DIRECT QR IMAGE UPLOAD & LIVE PREVIEW BOX */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">QR Code Image (Direct Upload or Auto-Generate)</label>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                {/* Live QR Image Preview */}
                <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center relative">
                  {newQrImage ? (
                    <>
                      <img src={newQrImage} alt="Uploaded QR" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setNewQrImage('')}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 cursor-pointer"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : newQrUpi ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${newQrUpi.trim()}&pn=${encodeURIComponent(newQrAccount.trim() || 'EXAMIRROR')}${newQrAmount && Number(newQrAmount) > 0 ? `&am=${newQrAmount}` : ''}&cu=INR`)}`}
                      alt="Auto Generated QR"
                      className="w-full h-full object-contain opacity-90"
                    />
                  ) : (
                    <div className="text-center text-slate-300">
                      <QrCode size={36} className="mx-auto text-slate-300 mb-1" />
                      <span className="text-[9px] text-slate-400 font-bold block">No QR Yet</span>
                    </div>
                  )}
                </div>

                {/* Upload Button & Guidance */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors">
                    <Upload size={14} />
                    <span>Upload QR Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewQrImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Upload your direct QR screenshot (GPay / PhonePe / PayTM / Bank). If no file is chosen, a UPI QR with your amount will be auto-generated.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={newQrIsDefault}
                onChange={(e) => setNewQrIsDefault(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 block text-xs">Set as Global Default QR</span>
                <span className="text-[10px] text-slate-500 block">Use automatically when no specific QR is assigned</span>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => { setIsQrModalOpen(false); setEditingQr(null); }}
                className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!newQrTitle.trim() || !newQrUpi.trim()) {
                    showToast('error', 'QR Title and UPI ID are required');
                    return;
                  }
                  try {
                    const fallbackQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${newQrUpi.trim()}&pn=${encodeURIComponent(newQrAccount.trim() || 'EXAMIRROR')}${newQrAmount && Number(newQrAmount) > 0 ? `&am=${newQrAmount}` : ''}&cu=INR`)}`;
                    const qrUrl = newQrImage.trim() || fallbackQrImage;
                    const amountVal = newQrAmount !== '' && newQrAmount !== null ? Number(newQrAmount) : 0.00;

                    if (editingQr) {
                      await axios.put(`/api/admin/payment-qrs/${editingQr.id}`, {
                        title: newQrTitle.trim(),
                        amount: amountVal,
                        upi_id: newQrUpi.trim(),
                        account_name: newQrAccount.trim(),
                        qr_image_url: qrUrl,
                        instructions: newQrInstructions.trim(),
                        is_global_default: newQrIsDefault
                      });
                      showToast('success', 'Payment QR updated successfully');
                    } else {
                      const res = await axios.post('/api/admin/payment-qrs', {
                        title: newQrTitle.trim(),
                        amount: amountVal,
                        upi_id: newQrUpi.trim(),
                        account_name: newQrAccount.trim(),
                        qr_image_url: qrUrl,
                        instructions: newQrInstructions.trim(),
                        is_global_default: newQrIsDefault
                      });
                      showToast('success', `Payment QR "${newQrTitle.trim()}" created`);
                      const createdId = res.data?.data?.id;
                      if (createdId) {
                        if (isAddTestModalOpen) {
                          setTestForm(prev => ({ ...prev, payment_qr_id: String(createdId), qr_mode: 'CUSTOM' }));
                        } else if (isSeriesModalOpen) {
                          setSeriesForm(prev => ({ ...prev, payment_qr_id: String(createdId) }));
                        }
                      }
                    }

                    await queryClient.invalidateQueries({ queryKey: ['adminPaymentQrs'] });
                    setIsQrModalOpen(false);
                    setEditingQr(null);
                    setNewQrTitle('');
                    setNewQrAmount('');
                    setNewQrUpi('');
                    setNewQrImage('');
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to save payment QR');
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {editingQr ? 'Save Changes' : 'Save Payment QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE QR */}
      {/* ========================================== */}
      {deletingQr && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-snug">Delete Payment QR?</h3>
                <p className="text-xs text-slate-500">This action will permanently remove this UPI QR configuration.</p>
              </div>
            </div>

            {/* Target QR Info Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                <img src={deletingQr.qr_image_url} alt="QR Thumbnail" className="w-full h-full object-contain" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs truncate">{deletingQr.title}</span>
                  {Number(deletingQr.amount) > 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md shrink-0">
                      ₹{Number(deletingQr.amount).toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-purple-700 block truncate font-bold">{deletingQr.upi_id}</span>
                <span className="text-[10px] text-slate-400 block truncate">{deletingQr.account_name}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-tight">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Tests or series actively using this QR will automatically fallback to the platform default QR code.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingQrLoading}
                onClick={() => setDeletingQr(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingQrLoading}
                onClick={async () => {
                  try {
                    setIsDeletingQrLoading(true);
                    await axios.delete(`/api/admin/payment-qrs/${deletingQr.id}`);
                    showToast('success', `Payment QR "${deletingQr.title}" deleted successfully`);
                    await queryClient.invalidateQueries({ queryKey: ['adminPaymentQrs'] });
                    setDeletingQr(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete payment QR');
                  } finally {
                    setIsDeletingQrLoading(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingQrLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION MOVE TO DRAFT */}
      {/* ========================================== */}
      {confirmDraftSeries && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Live Series Protection
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 leading-tight">
                  Move Published Series to Draft?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This series is currently <span className="text-emerald-600 font-bold">LIVE</span> on the student portal.
                </p>
              </div>
            </div>

            {/* Target Series Info Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 truncate max-w-[280px]">
                  {confirmDraftSeries.title}
                </h4>
                <span className="text-xs font-bold text-slate-700">
                  {confirmDraftSeries.is_free ? 'FREE' : `₹${confirmDraftSeries.price}`}
                </span>
              </div>

              {/* Impact Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Students</div>
                  <div className={`text-base font-black ${Number(confirmDraftSeries.active_enrollments) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {confirmDraftSeries.active_enrollments || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Included Tests</div>
                  <div className="text-base font-black text-slate-800">
                    {confirmDraftSeries.tests_count || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Payments</div>
                  <div className="text-base font-black text-slate-800">
                    {confirmDraftSeries.pending_payments || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Details Callout */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle size={14} className="text-amber-600" />
                <span>Immediate Student Access Impact:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 pl-1">
                <li>
                  <span className="font-semibold">Test Access Blocked:</span> Enrolled students will immediately be unable to start or view tests in this pack.
                </li>
                <li>
                  <span className="font-semibold">Hidden from Portal:</span> This series will instantly disappear from the student discovery catalog.
                </li>
                <li>
                  <span className="font-semibold">New Enrollments Disabled:</span> Students will not be able to enroll or submit UPI payments.
                </li>
              </ul>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isMovingDraftLoading}
                onClick={() => setConfirmDraftSeries(null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel (Keep Live)
              </button>
              <button
                type="button"
                disabled={isMovingDraftLoading}
                onClick={async () => {
                  try {
                    setIsMovingDraftLoading(true);
                    await axios.put(`/api/admin/series/${confirmDraftSeries.id}`, {
                      ...confirmDraftSeries,
                      status: 'DRAFT'
                    });
                    showToast('success', `"${confirmDraftSeries.title}" moved to Draft successfully.`);
                    await queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
                    setConfirmDraftSeries(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to move series to draft');
                  } finally {
                    setIsMovingDraftLoading(false);
                  }
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileEdit size={13} />
                {isMovingDraftLoading ? 'Moving to Draft...' : 'Confirm & Move to Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE TEST SERIES */}
      {/* ========================================== */}
      {deletingSeriesTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                <Trash2 size={24} />
              </div>
              <div className="flex-1">
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Permanent Deletion
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 leading-tight">
                  Permanently Delete Test Series?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this Test Series and all its tests?
                </p>
              </div>
            </div>

            {/* Target Series Info Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 truncate max-w-[280px]">
                  {deletingSeriesTarget.title}
                </h4>
                <span className="text-xs font-bold text-slate-700">
                  {deletingSeriesTarget.is_free ? 'FREE' : `₹${deletingSeriesTarget.price}`}
                </span>
              </div>

              {/* Impact Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Students</div>
                  <div className="text-base font-black text-rose-600">
                    {deletingSeriesTarget.active_enrollments || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Included Tests</div>
                  <div className="text-base font-black text-slate-800">
                    {deletingSeriesTarget.tests_count || 0}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Payments</div>
                  <div className="text-base font-black text-slate-800">
                    {deletingSeriesTarget.pending_payments || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Details Callout */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-950">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle size={14} className="text-rose-600" />
                <span>Irreversible Destruction Notice:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-900/90 pl-1">
                <li>
                  <span className="font-semibold">Complete Purge:</span> All tests, question banks, student scorecards, and audit logs will be permanently deleted.
                </li>
                <li>
                  <span className="font-semibold">Student Access Loss:</span> Enrolled students will immediately lose access and historical scorecard access.
                </li>
              </ul>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingSeriesLoading}
                onClick={() => setDeletingSeriesTarget(null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSeriesLoading}
                onClick={async () => {
                  try {
                    setIsDeletingSeriesLoading(true);
                    await axios.delete(`/api/admin/series/${deletingSeriesTarget.id}`);
                    showToast('success', `Test Series "${deletingSeriesTarget.title}" deleted successfully.`);
                    await queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
                    setDeletingSeriesTarget(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete test series');
                  } finally {
                    setIsDeletingSeriesLoading(false);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingSeriesLoading ? 'Deleting Series...' : 'Confirm & Delete Series'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE TEST */}
      {/* ========================================== */}
      {deletingTestTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Test Deletion
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 leading-snug">
                  Delete Test & Question Bank?
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">{deletingTestTarget.title}</div>
              <div className="text-slate-500">{deletingTestTarget.duration_minutes} Mins • {deletingTestTarget.total_marks} Total Marks</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All questions, choices, student attempts, and answer logs for this test will be permanently removed.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingTestLoading}
                onClick={() => setDeletingTestTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingTestLoading}
                onClick={async () => {
                  try {
                    setIsDeletingTestLoading(true);
                    await axios.delete(`/api/admin/tests/${deletingTestTarget.id}`);
                    showToast('success', `Test "${deletingTestTarget.title}" deleted.`);
                    refetchActiveTests();
                    await queryClient.invalidateQueries({ queryKey: ['adminTestSeries'] });
                    setDeletingTestTarget(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete test');
                  } finally {
                    setIsDeletingTestLoading(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingTestLoading ? 'Deleting...' : 'Delete Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE CATEGORY */}
      {/* ========================================== */}
      {deletingCategoryTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Delete Category?
                </h3>
                <p className="text-xs text-slate-500">Remove category "{deletingCategoryTarget.name}".</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingCategoryLoading}
                onClick={() => setDeletingCategoryTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCategoryLoading}
                onClick={async () => {
                  try {
                    setIsDeletingCategoryLoading(true);
                    await axios.delete(`/api/admin/categories/${deletingCategoryTarget.id}`);
                    showToast('success', `Category "${deletingCategoryTarget.name}" deleted.`);
                    await queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
                    setDeletingCategoryTarget(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete category');
                  } finally {
                    setIsDeletingCategoryLoading(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingCategoryLoading ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE SUB-CATEGORY */}
      {/* ========================================== */}
      {deletingSubCategoryTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Delete Sub-Category?
                </h3>
                <p className="text-xs text-slate-500">Remove sub-category classification permanently.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-xs">{deletingSubCategoryTarget.name}</div>
              <div className="text-[11px] text-slate-500">
                Associated test series will be set to general (category preserved).
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingSubCategoryLoading}
                onClick={() => setDeletingSubCategoryTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSubCategoryLoading}
                onClick={async () => {
                  try {
                    setIsDeletingSubCategoryLoading(true);
                    await axios.delete(`/api/admin/sub-categories/${deletingSubCategoryTarget.id}`);
                    showToast('success', `Sub-Category "${deletingSubCategoryTarget.name}" deleted.`);
                    await queryClient.invalidateQueries({ queryKey: ['adminSubCategories'] });
                    setDeletingSubCategoryTarget(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete sub-category');
                  } finally {
                    setIsDeletingSubCategoryLoading(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingSubCategoryLoading ? 'Deleting...' : 'Delete Sub-Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: SECONDARY CONFIRMATION DELETE QUESTION */}
      {/* ========================================== */}
      {deletingQuestionTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  Delete Question?
                </h3>
                <p className="text-xs text-slate-500">Remove question and all 4 options permanently.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 line-clamp-3 leading-relaxed font-medium">
              "{deletingQuestionTarget.question_text}"
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingQuestionLoading}
                onClick={() => setDeletingQuestionTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingQuestionLoading}
                onClick={async () => {
                  try {
                    setIsDeletingQuestionLoading(true);
                    await axios.delete(`/api/admin/questions/${deletingQuestionTarget.id}`);
                    showToast('success', 'Question deleted.');
                    refetchActiveQuestions();
                    refetchActiveTests();
                    setDeletingQuestionTarget(null);
                  } catch (err: any) {
                    showToast('error', err.response?.data?.message || 'Failed to delete question');
                  } finally {
                    setIsDeletingQuestionLoading(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingQuestionLoading ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSeriesManagement;


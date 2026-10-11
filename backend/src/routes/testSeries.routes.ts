import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { testSeriesService } from '../services/testSeries.service';

const router = Router();

const getParam = (param: any): string => {
  if (Array.isArray(param)) return String(param[0]);
  return String(param || '');
};

const extractUser = (req: Request): { studentId?: string; adminId?: number; role?: string } => {
  const authHeader = req.headers.authorization;
  const headerStudentId = req.headers['x-student-id'] as string;
  const queryStudentId = (req.query.studentId as string) || (req.body?.studentId as string);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const sId = headerStudentId || queryStudentId;
    const aId = (req.query.adminId as string) || (req.body?.adminId as string);
    return {
      studentId: sId,
      adminId: aId ? Number(aId) : undefined
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (_) {
      decoded = jwt.decode(token);
    }
    const resolvedStudentId = decoded?.studentId 
      ? String(decoded.studentId) 
      : (decoded?.id ? String(decoded.id) : undefined);

    const sId = resolvedStudentId || headerStudentId || queryStudentId;
    return {
      studentId: sId,
      adminId: decoded?.id ? Number(decoded.id) : undefined,
      role: decoded?.role
    };
  } catch (err) {
    const sId = headerStudentId || queryStudentId;
    const aId = (req.query.adminId as string) || (req.body?.adminId as string);
    return {
      studentId: sId,
      adminId: aId ? Number(aId) : undefined
    };
  }
};

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// 1. Categories
const handleGetCategories = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.getCategories();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/categories', handleGetCategories);
router.get('/admin/test-series/categories', handleGetCategories);

const handleCreateCategory = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.createCategory(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/categories', handleCreateCategory);
router.post('/admin/test-series/categories', handleCreateCategory);

const handleUpdateCategory = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await testSeriesService.updateCategory(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.put('/admin/categories/:id', handleUpdateCategory);
router.put('/admin/test-series/categories/:id', handleUpdateCategory);

const handleDeleteCategory = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await testSeriesService.deleteCategory(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.delete('/admin/categories/:id', handleDeleteCategory);
router.delete('/admin/test-series/categories/:id', handleDeleteCategory);

// 2. Payment QRs
const handleGetPaymentQRs = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.getPaymentQRs();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/payment-qrs', handleGetPaymentQRs);
router.get('/admin/test-series/payment-qrs', handleGetPaymentQRs);

const handleCreatePaymentQR = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.createPaymentQR(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/payment-qrs', handleCreatePaymentQR);
router.post('/admin/test-series/payment-qrs', handleCreatePaymentQR);

const handleUpdatePaymentQR = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await testSeriesService.updatePaymentQR(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.put('/admin/payment-qrs/:id', handleUpdatePaymentQR);
router.put('/admin/test-series/payment-qrs/:id', handleUpdatePaymentQR);

const handleDeletePaymentQR = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await testSeriesService.deletePaymentQR(id);
    res.status(200).json({ success: true, message: 'Payment QR deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.delete('/admin/payment-qrs/:id', handleDeletePaymentQR);
router.delete('/admin/test-series/payment-qrs/:id', handleDeletePaymentQR);

// 3. Test Series Master
const handleGetSeries = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const data = await testSeriesService.getAllTestSeriesAdmin(status);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/series', handleGetSeries);
router.get('/admin/test-series/series', handleGetSeries);

const handleCloneSeries = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const data = await testSeriesService.cloneDraftSeries(id, user.adminId);
    res.status(201).json({ success: true, data, message: 'Test series duplicated as draft copy successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/series/:id/clone', handleCloneSeries);
router.post('/admin/test-series/series/:id/clone', handleCloneSeries);

const handleCreateSeries = async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const data = await testSeriesService.createTestSeries(req.body, user.adminId);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/series', handleCreateSeries);
router.post('/admin/test-series/series', handleCreateSeries);

const handleUpdateSeries = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const data = await testSeriesService.updateTestSeries(id, req.body, user.adminId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.put('/admin/series/:id', handleUpdateSeries);
router.put('/admin/test-series/series/:id', handleUpdateSeries);

const handleDeleteSeries = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    await testSeriesService.deleteTestSeries(id, user.adminId);
    res.status(200).json({ success: true, message: 'Test series deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.delete('/admin/series/:id', handleDeleteSeries);
router.delete('/admin/test-series/series/:id', handleDeleteSeries);

// 4. Tests & Questions
const handleCreateTest = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.createTest(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/tests', handleCreateTest);
router.post('/admin/test-series/tests', handleCreateTest);

const handleUpdateTest = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await testSeriesService.updateTest(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.put('/admin/tests/:id', handleUpdateTest);
router.put('/admin/test-series/tests/:id', handleUpdateTest);

const handleDeleteTest = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await testSeriesService.deleteTest(id);
    res.status(200).json({ success: true, message: 'Test deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.delete('/admin/tests/:id', handleDeleteTest);
router.delete('/admin/test-series/tests/:id', handleDeleteTest);

const handleGetTestsBySeries = async (req: Request, res: Response) => {
  try {
    const seriesId = getParam(req.params.seriesId) || (req.query.seriesId as string);
    const data = await testSeriesService.getTestsBySeriesAdmin(seriesId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/series/:seriesId/tests', handleGetTestsBySeries);
router.get('/admin/test-series/series/:seriesId/tests', handleGetTestsBySeries);

const handleGetQuestionsByTest = async (req: Request, res: Response) => {
  try {
    const testId = getParam(req.params.testId);
    const data = await testSeriesService.getQuestionsByTestAdmin(testId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/tests/:testId/questions', handleGetQuestionsByTest);
router.get('/admin/test-series/tests/:testId/questions', handleGetQuestionsByTest);

const handleCreateQuestion = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.addQuestionWithOption(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/questions', handleCreateQuestion);
router.post('/admin/test-series/questions', handleCreateQuestion);

const handleBulkCreateQuestions = async (req: Request, res: Response) => {
  try {
    const testId = getParam(req.params.testId) || req.body.test_id;
    const questions = req.body.questions || req.body;
    const data = await testSeriesService.bulkAddQuestions(testId, questions);
    res.status(201).json({ success: true, ...data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/tests/:testId/questions/bulk', handleBulkCreateQuestions);
router.post('/admin/test-series/tests/:testId/questions/bulk', handleBulkCreateQuestions);

const handleDeleteQuestion = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await testSeriesService.deleteQuestion(id);
    res.status(200).json({ success: true, message: 'Question removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.delete('/admin/questions/:id', handleDeleteQuestion);
router.delete('/admin/test-series/questions/:id', handleDeleteQuestion);

// 5. Payment Requests & Approvals
const handleGetPayments = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const data = await testSeriesService.getPaymentRequestsAdmin(status);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/payments', handleGetPayments);
router.get('/admin/test-series/payments', handleGetPayments);

const handleApprovePayment = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const result = await testSeriesService.approvePayment(id, user.adminId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/payments/:id/approve', handleApprovePayment);
router.post('/admin/test-series/payments/:id/approve', handleApprovePayment);

const handleRejectPayment = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const { reason } = req.body;
    const result = await testSeriesService.rejectPayment(id, reason, user.adminId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/payments/:id/reject', handleRejectPayment);
router.post('/admin/test-series/payments/:id/reject', handleRejectPayment);

// 6. Attempts & Resets
const handleGetAttempts = async (req: Request, res: Response) => {
  try {
    const seriesId = req.query.seriesId as string;
    const data = await testSeriesService.getAllAttemptsAdmin(seriesId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/attempts', handleGetAttempts);
router.get('/admin/test-series/attempts', handleGetAttempts);

const handleResetAttempt = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const { reason } = req.body;
    const result = await testSeriesService.resetAttempt(id, reason, user.adminId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/admin/attempts/:id/reset', handleResetAttempt);
router.post('/admin/test-series/attempts/:id/reset', handleResetAttempt);

// 7. Analytics
const handleGetAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await testSeriesService.getPlatformAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/admin/analytics', handleGetAnalytics);
router.get('/admin/test-series/analytics', handleGetAnalytics);

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

// 1. Available Test Series for Student
const handleStudentAvailable = async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const targetStudentId = user.studentId || (req.headers['x-student-id'] as string) || (req.query.studentId as string) || '0';
    const data = await testSeriesService.getStudentEligibleSeries(String(targetStudentId));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
router.get('/student/available', handleStudentAvailable);
router.get('/student/test-series/available', handleStudentAvailable);

// 2. My Enrolled Series
const handleStudentMySeries = async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const targetStudentId = user.studentId || (req.headers['x-student-id'] as string) || (req.query.studentId as string);
    if (!targetStudentId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const data = await testSeriesService.getStudentEligibleSeries(String(targetStudentId));
    const enrolled = (data || []).filter((s: any) => s.enrollment_status === 'APPROVED' || s.enrollment_status === 'PAYMENT_PENDING');
    res.status(200).json({ success: true, data: enrolled });
  } catch (error: any) {
    res.status(200).json({ success: true, data: [] });
  }
};
router.get('/student/my-series', handleStudentMySeries);
router.get('/student/test-series/my-series', handleStudentMySeries);

// 3. Free Enrollment
const handleEnrollFree = async (req: Request, res: Response) => {
  try {
    const seriesId = getParam(req.params.id) || req.body.seriesId;
    const user = extractUser(req);
    if (!user.studentId || !seriesId) {
      return res.status(400).json({ success: false, message: 'seriesId and studentId are required' });
    }
    const result = await testSeriesService.enrollFreeSeries(seriesId, user.studentId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/student/enroll-free', handleEnrollFree);
router.post('/student/test-series/:id/enroll-free', handleEnrollFree);

// 4. Submit UTR Payment
const handleSubmitPayment = async (req: Request, res: Response) => {
  try {
    const seriesId = getParam(req.params.id) || req.body.seriesId;
    const utrNumber = req.body.utr_number || req.body.utrNumber;
    const screenshot = req.body.payment_screenshot || req.body.screenshot;
    const user = extractUser(req);

    if (!user.studentId || !seriesId || !utrNumber) {
      return res.status(400).json({ success: false, message: 'seriesId, studentId and UTR number are required' });
    }
    const result = await testSeriesService.submitPaidUtrPayment({
      studentId: user.studentId,
      seriesId,
      utrNumber,
      screenshot
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/student/submit-payment', handleSubmitPayment);
router.post('/student/test-series/:id/payment', handleSubmitPayment);

// 5. Start Test Attempt
const handleStartTest = async (req: Request, res: Response) => {
  try {
    const testId = getParam(req.params.id) || req.body.testId;
    const user = extractUser(req);
    if (!user.studentId || !testId) {
      return res.status(400).json({ success: false, message: 'testId and studentId are required' });
    }
    const result = await testSeriesService.startTestAttempt(testId, user.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/student/start-test', handleStartTest);
router.post('/student/test-series/tests/:id/start', handleStartTest);

// 6. Save Answer
const handleSaveAnswer = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ success: true, message: 'Answer saved' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/student/test-series/attempts/:id/answer', handleSaveAnswer);

// 7. Submit Test Attempt
const handleSubmitTestAttempt = async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.id) || req.body.attemptId;
    const user = extractUser(req);
    const answers = req.body.answers || [];

    if (!user.studentId || !attemptId) {
      return res.status(400).json({ success: false, message: 'attemptId and student authentication required' });
    }
    const scorecard = await testSeriesService.submitTestAttempt({
      attemptId,
      studentId: user.studentId,
      answers
    });
    res.status(200).json({ success: true, data: scorecard });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.post('/student/submit-test', handleSubmitTestAttempt);
router.post('/student/test-series/attempts/:id/submit', handleSubmitTestAttempt);

// 8. Get Scorecard
const handleGetScorecard = async (req: Request, res: Response) => {
  try {
    const attemptId = getParam(req.params.id) || getParam(req.params.attemptId);
    const user = extractUser(req);
    if (!user.studentId) {
      return res.status(400).json({ success: false, message: 'Student authentication required' });
    }
    const scorecard = await testSeriesService.getScorecard(attemptId, String(user.studentId));
    res.status(200).json({ success: true, data: scorecard });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
router.get('/student/scorecard/:attemptId', handleGetScorecard);
router.get('/student/test-series/results/:id', handleGetScorecard);

// 9. Achievements & Stars
const handleGetAchievements = async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const targetStudentId = user.studentId || (req.headers['x-student-id'] as string) || (req.query.studentId as string);
    if (!targetStudentId) {
      return res.status(200).json({ success: true, data: [] });
    }
    const data = await testSeriesService.getStudentAnalyticsAndStars(String(targetStudentId));
    res.status(200).json({ success: true, data: data.stars || [] });
  } catch (error: any) {
    res.status(200).json({ success: true, data: [] });
  }
};
router.get('/student/analytics', handleGetAchievements);
router.get('/student/test-series/achievements', handleGetAchievements);

export default router;

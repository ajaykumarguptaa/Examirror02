import { Router } from 'express';
import { centerService } from '../services/center.service';
import db from '../db';
import { verifyCenterOrAdmin, verifyAdmin } from '../middleware/auth.middleware';
import { validateBody, walletRequestSchema } from '../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC TRAINING & TUTORIAL VIDEOS FOR CENTERS
// ==========================================
router.get('/training-videos', async (req, res) => {
  try {
    const rows = await centerService.getTrainingVideos();
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enforce center or admin authentication and IDOR protection across center routes
router.use(verifyCenterOrAdmin);

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/:centerId/dashboard', async (req, res) => {
  try {
    const data = await centerService.getDashboardData(req.params.centerId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/certificate', async (req, res) => {
  try {
    const data = await centerService.getCenterCertificate(req.params.centerId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/:centerId/claim-certificate', async (req, res) => {
  try {
    const result = await centerService.claimCenterCertificate(req.params.centerId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:centerId/submit-demanded-docs', async (req, res) => {
  const { notes, docs } = req.body;
  try {
    const result = await centerService.submitDemandedDocs(req.params.centerId, notes, docs);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/stats', async (req, res) => {
  try {
    const data = await centerService.getStats(req.params.centerId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. WALLET & RECHARGE
// ==========================================
router.get('/:centerId/wallet', async (req, res) => {
  try {
    const data = await centerService.getWalletInfo(req.params.centerId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wallet/request', validateBody(walletRequestSchema), async (req, res) => {
  const { centerId, amount, utrNumber, narration, requestId } = req.body;
  try {
    const result = await centerService.submitWalletRequest(centerId, Number(amount), utrNumber, narration, requestId);
    res.status(201).json({ success: true, message: 'Wallet recharge request submitted successfully. Awaiting Super Admin verification.', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Direct wallet recharge requires Super Admin verification
router.post('/wallet/recharge', verifyAdmin, async (req, res) => {
  const { centerId, amount, description } = req.body;
  try {
    await centerService.submitWalletRequest(centerId, amount, 'DIRECT_' + Date.now(), description);
    res.status(200).json({ success: true, message: 'Wallet recharged successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. COURSES & EXAM QUESTIONS
// ==========================================
router.get('/courses', async (req, res) => {
  try {
    const centerId = req.query.centerId as string;
    const courses = await centerService.getCourses(centerId);
    res.status(200).json({ success: true, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Center's own assigned courses
router.get('/:centerId/courses', async (req, res) => {
  try {
    const courses = await centerService.getCenterCourses(req.params.centerId);
    res.status(200).json({ success: true, data: courses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Center's assigned course IDs
router.get('/:centerId/course-ids', async (req, res) => {
  try {
    const ids = await centerService.getCenterCourseIds(req.params.centerId);
    res.status(200).json({ success: true, data: ids });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add course to center's list (with duplicate check & message)
router.post('/:centerId/courses/add', async (req, res) => {
  const { courseId } = req.body;
  try {
    const result = await centerService.addCourseToCenter(req.params.centerId, courseId);
    if (result.alreadyAdded) {
      return res.status(200).json({
        success: false,
        alreadyAdded: true,
        message: result.message
      });
    }
    res.status(200).json({
      success: true,
      alreadyAdded: false,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove course from center
router.delete('/:centerId/courses/:courseId', async (req, res) => {
  try {
    await centerService.removeCourseFromCenter(req.params.centerId, req.params.courseId);
    res.status(200).json({ success: true, message: 'Course removed from center successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/courses', async (req, res) => {
  const { code, name, categoryId, fee, shortDescription, duration, semesters, createdByType, createdById, is_published, is_draft, image_url, imageUrl, eligibility } = req.body;
  try {
    const type = createdByType || 'center';
    const id = createdById || null;
    const isPub = is_published !== undefined ? Number(is_published) : (type === 'admin' ? 1 : 1);
    const isDrf = is_draft !== undefined ? Number(is_draft) : 0;
    const img = image_url || imageUrl || '';
    const insertId = await centerService.addCourse(code, name, categoryId, fee, shortDescription, duration, semesters, type, id, isPub, isDrf, img, eligibility);
    res.status(201).json({ 
      success: true, 
      courseId: insertId, 
      is_published: isPub === 1,
      is_draft: isDrf === 1,
      message: isDrf === 1 ? 'Course saved as Draft in database!' : 'Course created successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  const { code, name, categoryId, fee, shortDescription, duration, semesters, image_url, imageUrl, eligibility } = req.body;
  try {
    const img = image_url || imageUrl || undefined;
    await centerService.updateCourse(req.params.id, code, name, categoryId, fee, shortDescription, duration, semesters, img, eligibility);
    res.status(200).json({ success: true, message: 'Course updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await centerService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Question routes for course exam
router.get('/courses/:courseId/questions', async (req, res) => {
  try {
    const questions = await centerService.getCourseQuestions(req.params.courseId);
    res.status(200).json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/courses/:courseId/questions', async (req, res) => {
  const { question, optA, optB, optC, optD, correct, semester, marks } = req.body;
  try {
    const insertId = await centerService.addCourseQuestion(req.params.courseId, question, optA, optB, optC, optD, correct, semester, marks);
    res.status(201).json({ success: true, questionId: insertId, message: 'Exam question added successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/courses/questions/:id', async (req, res) => {
  const { question, optA, optB, optC, optD, correct, marks } = req.body;
  try {
    await centerService.updateCourseQuestion(req.params.id, question, optA, optB, optC, optD, correct, marks !== undefined ? Number(marks) : 1);
    res.status(200).json({ success: true, message: 'Exam question updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/courses/questions/:id', async (req, res) => {
  try {
    await centerService.deleteCourseQuestion(req.params.id);
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. STUDENTS (Add, List, Cancel, Certificate)
// ==========================================
router.get('/:centerId/students', async (req, res) => {
  try {
    const rows = await centerService.getStudentsByCenter(req.params.centerId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/students/:id', async (req, res) => {
  try {
    const student = await centerService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const result = await centerService.addStudent(req.body);
    res.status(201).json({ success: true, ...result, message: 'Student registered successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    await centerService.updateStudent(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Student details updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/students/:id/academic-status', async (req, res) => {
  const { academicStatus } = req.body;
  try {
    const result = await centerService.updateStudentAcademicStatus(req.params.id, academicStatus);
    res.status(200).json({ success: true, message: 'Academic status updated successfully', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/students/cancel', async (req, res) => {
  const { studentId, centerId } = req.body;
  try {
    const result = await centerService.cancelStudentAdmission(studentId, centerId);
    res.status(200).json({ success: true, message: 'Admission cancelled successfully. Tokens refunded to wallet.', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/settings/certificate-charge', async (req, res) => {
  try {
    const centerId = req.query.centerId as string;
    const { charge, allowed } = await centerService.getInstantCertificateCharge(centerId);
    res.status(200).json({ success: true, charge, allowed, allow_instant_certificate: allowed });
  } catch (error: any) {
    res.status(200).json({ success: true, charge: 200, allowed: true, allow_instant_certificate: true });
  }
});

router.get('/:centerId/old-student-permission', async (req, res) => {
  try {
    const centerId = req.params.centerId;
    const [rows]: any = await db.query(
      `SELECT 
        old_student_allowed_until,
        (old_student_allowed_until IS NOT NULL AND old_student_allowed_until > NOW()) as is_allowed,
        GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), old_student_allowed_until)) as seconds_left
      FROM centers 
      WHERE id = ? OR center_code = ?`,
      [centerId, centerId]
    );
    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, allowed: false, seconds_left: 0 });
    }
    const row = rows[0];
    const isAllowed = Boolean(row.is_allowed);
    const secondsLeft = isAllowed ? Number(row.seconds_left) || 0 : 0;
    res.status(200).json({
      success: true,
      allowed: isAllowed,
      expires_at: isAllowed ? row.old_student_allowed_until : null,
      seconds_left: secondsLeft
    });
  } catch (error: any) {
    res.status(200).json({ success: true, allowed: false, seconds_left: 0 });
  }
});

router.post('/students/:id/certificate', async (req, res) => {
  try {
    const { isInstant } = req.body;
    const result = await centerService.generateStudentCertificate(req.params.id, Boolean(isInstant));
    res.status(200).json({
      success: true,
      message: `Certificate generated & wallet fee of ₹${result.charged} deducted successfully!`,
      data: result,
      result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/students/:id/instant-certificate', async (req, res) => {
  try {
    const result = await centerService.generateStudentCertificate(req.params.id, true);
    res.status(200).json({
      success: true,
      message: `Instant certificate generated & wallet fee of ₹${result.charged} deducted successfully!`,
      data: result,
      result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/students/:id/generate-certificate', async (req, res) => {
  try {
    const result = await centerService.generateStudentCertificate(req.params.id, false);
    res.status(200).json({
      success: true,
      message: `Certificate generated & wallet fee of ₹${result.charged} deducted successfully!`,
      data: result,
      result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. SETTED EXAMS LIST
// ==========================================
router.get('/:centerId/exams', async (req, res) => {
  try {
    const rows = await centerService.getExams(req.params.centerId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/exams', async (req, res) => {
  const { centerId, title, date } = req.body;
  try {
    const insertId = await centerService.createExam(centerId, title, date);
    res.status(201).json({ success: true, examId: insertId, message: 'Exam scheduled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/exams/:id', async (req, res) => {
  try {
    await centerService.deleteExam(req.params.id);
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. FREE TEST MANAGER & DYNAMIC QUOTA
// ==========================================
router.get('/:centerId/online-test-quota', async (req, res) => {
  try {
    const quota = await centerService.getCenterOnlineTestQuota(req.params.centerId);
    res.status(200).json({ success: true, data: quota });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/online-test-quota/:centerId', async (req, res) => {
  try {
    const quota = await centerService.getCenterOnlineTestQuota(req.params.centerId);
    res.status(200).json({ success: true, data: quota });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/free-tests', async (req, res) => {
  try {
    const rows = await centerService.getFreeTests(req.params.centerId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/free-tests', async (req, res) => {
  const { centerId } = req.body;
  try {
    const result = await centerService.createFreeTest(centerId, req.body);
    const msg = result.is_free
      ? `Online Test created successfully! (Free test ${result.tests_created_this_month}/${result.monthly_free_limit} used this month)`
      : `Online Test created! ₹${result.charge_applied} deducted from Center Wallet. (Remaining Balance: ₹${result.remaining_balance})`;

    res.status(201).json({
      success: true,
      testId: result.insertId,
      test_uid: result.test_uid,
      chargeApplied: result.charge_applied,
      isFree: result.is_free,
      remainingBalance: result.remaining_balance,
      testsCreatedThisMonth: result.tests_created_this_month,
      monthlyFreeLimit: result.monthly_free_limit,
      message: msg
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/free-tests/:id', async (req, res) => {
  try {
    await centerService.deleteFreeTest(req.params.id);
    res.status(200).json({ success: true, message: 'Free test moved to recycle bin successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/free-tests/:id/permanent', async (req, res) => {
  try {
    await centerService.permanentDeleteFreeTest(req.params.id);
    res.status(200).json({ success: true, message: 'Free test permanently deleted from database' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/free-tests/:id/recover', async (req, res) => {
  try {
    const result = await centerService.recoverFreeTest(req.params.id);
    const msg = result.is_free
      ? 'Online Test recovered successfully! 72 hours validity renewed and added to active quota.'
      : `Online Test recovered! ₹${result.charge_applied} deducted from Center Wallet. (Remaining Balance: ₹${result.remaining_balance})`;
    res.status(200).json({ success: true, message: msg, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/free-tests/:id/publish', async (req, res) => {
  try {
    const result = await centerService.togglePublishFreeTest(req.params.id);
    res.status(200).json({ success: true, data: result, message: 'Publish status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/free-tests/:id/publish-settings', async (req, res) => {
  try {
    const result = await centerService.updatePublishSettings(req.params.id, req.body);
    res.status(200).json({ success: true, data: result, message: 'Test settings updated & link generated successfully' });
  } catch (error: any) {
    console.error('Publish settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/free-tests/:testId/submissions', async (req, res) => {
  try {
    const rows = await centerService.getFreeTestSubmissions(req.params.testId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/all-test-submissions', async (req, res) => {
  try {
    const rows = await centerService.getCenterAllTestSubmissions(req.params.centerId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Free test questions
router.get('/free-tests/:testId/questions', async (req, res) => {
  try {
    const rows = await centerService.getFreeTestQuestions(req.params.testId);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/free-tests/:testId/questions', async (req, res) => {
  const { question, optA, optB, optC, optD, correct, marks } = req.body;
  try {
    const insertId = await centerService.addFreeTestQuestion(
      req.params.testId,
      question,
      optA,
      optB,
      optC,
      optD,
      correct,
      marks !== undefined ? Number(marks) : 1
    );
    res.status(201).json({ success: true, questionId: insertId, message: 'Question added successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/free-tests/:testId/questions/bulk', async (req, res) => {
  const questions = req.body.questions || req.body;
  try {
    const data = await centerService.bulkAddFreeTestQuestions(req.params.testId, questions);
    res.status(201).json({ success: true, ...data, message: 'Questions imported successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/free-tests/questions/:id', async (req, res) => {
  const { question, optA, optB, optC, optD, correct, marks } = req.body;
  try {
    await centerService.updateFreeTestQuestion(
      req.params.id,
      question,
      optA,
      optB,
      optC,
      optD,
      correct,
      marks !== undefined ? Number(marks) : 1
    );
    res.status(200).json({ success: true, message: 'Question updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/free-tests/questions/:id', async (req, res) => {
  try {
    await centerService.deleteFreeTestQuestion(req.params.id);
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. TRAINING VIDEOS (Center Actions)
// ==========================================

router.post('/training-videos', async (req, res) => {
  const { title, url, description, duration, thumbnail } = req.body;
  try {
    const insertId = await centerService.addTrainingVideo(title, url, description, duration, thumbnail);
    res.status(201).json({ success: true, videoId: insertId, message: 'Training video added successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/training-videos/:id', async (req, res) => {
  try {
    await centerService.deleteTrainingVideo(req.params.id);
    res.status(200).json({ success: true, message: 'Training video removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Student Marks (Exams) ---
router.get('/students/:id/marks', async (req, res) => {
  try {
    const marks = await centerService.getStudentMarks(req.params.id);
    res.status(200).json({ success: true, marks });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/students/:id/marks', async (req, res) => {
  try {
    const centerId = req.body.centerId;
    await centerService.saveStudentMarks(req.params.id, req.body.marks, centerId, req.body.isDateChangeCharge);
    res.status(200).json({ success: true, message: 'Marks updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/setted-exams', async (req, res) => {
  try {
    const centerId = req.params.centerId;
    const exams = await centerService.getSettedExams(centerId);
    res.status(200).json({ success: true, exams });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/student-marks/:markId/viva', async (req, res) => {
  try {
    const { vivaMarks } = req.body;
    await centerService.updateVivaMarks(req.params.markId, Number(vivaMarks) || 0);
    res.status(200).json({ success: true, message: 'Viva marks updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/student-marks/:markId/generate-marksheet', async (req, res) => {
  try {
    const { studentId, semester, publishToStudent = true, duesCleared = true, holdReason = '' } = req.body;
    await centerService.generateMarksheet(req.params.markId, studentId, semester, Boolean(publishToStudent), Boolean(duesCleared), String(holdReason || ''));
    res.status(200).json({ success: true, message: 'Marksheet generated and finalized successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/student-marks/:markId/publish-toggle', async (req, res) => {
  try {
    const { isPublished, duesCleared = true, holdReason = '', studentId, semester } = req.body;
    const result = await centerService.toggleMarksheetPublish(req.params.markId, Boolean(isPublished), Boolean(duesCleared), String(holdReason || ''), studentId, semester);
    res.status(200).json({
      success: true,
      message: isPublished ? 'Marksheet published to Student Portal' : 'Marksheet hidden from Student Portal',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/student-marks/:markId/reset', async (req, res) => {
  try {
    const centerId = req.body.centerId || (req as any).user?.centerId || (req as any).user?.id;
    const result = await centerService.resetExam(req.params.markId, req.body.studentId, req.body.semester, centerId);
    res.status(200).json({ success: true, message: result?.message || 'Exam reset successfully', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:centerId/signature-stamp', async (req, res) => {
  try {
    const data = await centerService.getCenterSignatureAndStamp(req.params.centerId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/:centerId/signature-stamp', async (req, res) => {
  try {
    const result = await centerService.updateCenterSignatureAndStamp(req.params.centerId, req.body);
    res.status(200).json({ success: true, message: 'Center digital signature & stamp updated successfully', data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;



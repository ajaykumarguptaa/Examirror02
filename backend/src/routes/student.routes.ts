import express from 'express';
import db from '../db';
import jwt from 'jsonwebtoken';
import { generateAdmitCardPdfBuffer } from '../utils/pdfEngine';
import { sendStudentRegistrationOtpEmail } from '../utils/emailService';

const router = express.Router();

import { authRateLimiter } from '../middleware/rateLimiter';

/**
 * 1. Send OTP for Direct Student Registration (Brevo SMTP Relay)
 */
router.post('/send-registration-otp', authRateLimiter, async (req, res) => {
  try {
    const { email, firstName, lastName, phone } = req.body;

    if (!firstName || typeof firstName !== 'string' || !/^[a-zA-Z\s'-]{2,50}$/.test(firstName.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid first name (minimum 2 letters, no special characters).'
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanLastName = typeof lastName === 'string' && lastName.trim() ? lastName.trim() : undefined;
    const cleanPhone = phone ? phone.toString().trim().replace(/\D/g, '') : undefined;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
    }

    // Check if email already registered
    const [existing]: any = await db.query('SELECT id FROM students WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in directly.'
      });
    }

    // If mobile number passed, validate and check uniqueness
    if (cleanPhone) {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        });
      }
      const [phoneExists]: any = await db.query('SELECT id FROM students WHERE phone = ?', [cleanPhone]);
      if (phoneExists && phoneExists.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'This mobile number is already registered to an account. Please log in.'
        });
      }
    }

    // Rate limiting: 45-second cooldown per email (prevents timer drift blocking)
    const [recent]: any = await db.query(
      'SELECT id FROM student_email_otps WHERE email = ? AND purpose = "STUDENT_REGISTRATION" AND created_at > DATE_SUB(NOW(), INTERVAL 45 SECOND)',
      [cleanEmail]
    );
    if (recent && recent.length > 0) {
      return res.status(429).json({
        success: false,
        message: 'A verification code was just sent. Please wait a few seconds before requesting another.'
      });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any old unused OTPs for this email
    await db.query(
      'UPDATE student_email_otps SET is_used = 1 WHERE email = ? AND purpose = "STUDENT_REGISTRATION" AND is_used = 0',
      [cleanEmail]
    );

    // Save new OTP with 10-minute validity
    await db.query(`
      INSERT INTO student_email_otps (email, otp_code, purpose, expires_at)
      VALUES (?, ?, 'STUDENT_REGISTRATION', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `, [cleanEmail, otpCode]);

    // Send email via Brevo SMTP (with development fallback)
    await sendStudentRegistrationOtpEmail(
      cleanEmail,
      otpCode,
      firstName.trim(),
      cleanLastName,
      cleanPhone
    );

    res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (error: any) {
    console.error('Error in send-registration-otp:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP.' });
  }
});

/**
 * 2. Verify OTP & Create Direct Student Account
 */
router.post('/verify-and-register', authRateLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, otp } = req.body;

    if (!firstName || !email || !password || !otp || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name, email, mobile number, password, and OTP code are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const cleanFirstName = firstName.trim();
    const cleanLastName = (lastName || '').trim();
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    const cleanPassword = password.toString();

    if (!/^[a-zA-Z\s'-]{2,50}$/.test(cleanFirstName)) {
      return res.status(400).json({
        success: false,
        message: 'First name must contain only letters and be at least 2 characters.'
      });
    }

    if (cleanLastName && !/^[a-zA-Z\s'-]{1,50}$/.test(cleanLastName)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must contain only letters.'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'A valid 10-digit mobile number starting with 6, 7, 8, or 9 is required.'
      });
    }

    const [phoneExists]: any = await db.query('SELECT id FROM students WHERE phone = ?', [cleanPhone]);
    if (phoneExists && phoneExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered to another account. Please log in.'
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Verification code must be 6 digits.' });
    }

    // Verify OTP record with MySQL native clock
    const [otpRows]: any = await db.query(`
      SELECT id, otp_code, attempts, (expires_at < NOW()) as is_expired
      FROM student_email_otps
      WHERE email = ? AND purpose = 'STUDENT_REGISTRATION' AND is_used = 0
      ORDER BY id DESC LIMIT 1
    `, [cleanEmail]);

    if (!otpRows || otpRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active verification code found for this email. Please request a new code.'
      });
    }

    const otpRecord = otpRows[0];
    if (Number(otpRecord.is_expired) === 1) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (otpRecord.attempts >= 5) {
      await db.query('UPDATE student_email_otps SET is_used = 1 WHERE id = ?', [otpRecord.id]);
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    if (otpRecord.otp_code !== cleanOtp) {
      await db.query('UPDATE student_email_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.'
      });
    }

    // Mark OTP as successfully used
    await db.query('UPDATE student_email_otps SET is_used = 1 WHERE id = ?', [otpRecord.id]);

    // Check again if already registered
    const [existing]: any = await db.query('SELECT id FROM students WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered. Please log in.'
      });
    }

    // Generate unique Online Candidate IDs
    const timestampSuffix = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const rollNo = `EXM-${timestampSuffix}${randomSuffix}`;
    const enrollmentNo = `TS-${timestampSuffix}${randomSuffix}`;

    const [insertResult]: any = await db.query(`
      INSERT INTO students (
        firstName, lastName, email, phone, password,
        centerId, courseId, is_direct_student, email_verified,
        status, student_type, roll_no, enrollment_no
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, 1, 1, 'active', 'direct_online', ?, ?)
    `, [
      cleanFirstName,
      cleanLastName,
      cleanEmail,
      cleanPhone,
      cleanPassword,
      rollNo,
      enrollmentNo
    ]);

    const newStudentId = insertResult.insertId;
    const [studentData]: any = await db.query('SELECT * FROM students WHERE id = ?', [newStudentId]);
    const student = studentData[0];

    const token = jwt.sign(
      { studentId: student.id, role: 'student', isDirect: true },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Examirror.',
      token,
      student
    });
  } catch (error: any) {
    console.error('Error in verify-and-register:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to register account.' });
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows]: any = await db.query(
      'SELECT * FROM students WHERE email = ? AND password = ? AND status = "active"',
      [email, password]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const student = rows[0];

    const token = jwt.sign(
      { studentId: student.id, role: 'student' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      student
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Authentication Middleware - strictly verifies signature and prevents ID spoofing
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const verifiedUser: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!verifiedUser || (!verifiedUser.studentId && !verifiedUser.id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Invalid student token.' });
    }
    req.user = verifiedUser;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired student token.' });
  }
};

router.get('/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const studentId = req.user.studentId || req.user.id || req.query.studentId;

    // 0. Get fresh student data with course & center metadata
    const [studentRows]: any = await db.query(`
      SELECT s.*, 
             c.name as courseName, c.code as courseCode, c.duration as courseDuration, c.semesters as courseSemesters,
             cntr.name as centerName, cntr.center_code as centerCode, cntr.address as centerAddress, cntr.city as centerCity, cntr.state as centerState, cntr.pincode as centerPincode,
             cntr.phone as centerPhone, cntr.email as centerEmail,
             cntr.signature_url as centerSignatureUrl, cntr.stamp_url as centerStampUrl, cntr.head_name as centerHeadName
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.id = ?
    `, [studentId]);
    const studentData = studentRows[0];

    // 1. Get Scheduled Exams for this student
    let [examRows]: any = await db.query(`
      SELECT sm.id, sm.semester, sm.exam_date, sm.written_marks, sm.viva_marks, sm.status, sm.reattempts, sm.is_marksheet_generated,
             sm.is_published_to_student, sm.dues_cleared, sm.hold_reason,
             c.id as courseId, c.name as courseName, c.code as courseCode, c.semesters as courseSemesters
      FROM student_marks sm
      JOIN students s ON sm.studentId = s.id
      LEFT JOIN courses c ON s.courseId = c.id
      WHERE sm.studentId = ?
      ORDER BY sm.semester ASC, sm.id ASC
    `, [studentId]);

    // Ensure all course semesters are represented for this student
    if (studentData && studentData.courseSemesters) {
      let semList: any[] = [];
      try {
        semList = typeof studentData.courseSemesters === 'string'
          ? JSON.parse(studentData.courseSemesters)
          : studentData.courseSemesters;
      } catch (_) {}

      if (Array.isArray(semList) && semList.length > 0) {
        for (let i = 0; i < semList.length; i++) {
          const semObj = semList[i];
          const semName = `SEM ${semObj.num || (i + 1)}`;
          const exists = examRows.some((r: any) => 
            String(r.semester).toUpperCase().trim() === semName.toUpperCase().trim() ||
            String(r.semester).toUpperCase().trim() === String(semObj.num)
          );
          if (!exists) {
            const [insRes]: any = await db.query(`
              INSERT INTO student_marks (studentId, semester, status, exam_date, written_marks, viva_marks, is_marksheet_generated)
              VALUES (?, ?, 'scheduled', DATE_ADD(NOW(), INTERVAL ? DAY), NULL, NULL, 0)
            `, [studentId, semName, (i + 1) * 7]);

            examRows.push({
              id: insRes.insertId,
              semester: semName,
              exam_date: new Date(Date.now() + (i + 1) * 7 * 86400000).toISOString(),
              written_marks: null,
              viva_marks: null,
              status: 'scheduled',
              reattempts: 0,
              is_marksheet_generated: 0,
              courseId: studentData.courseId,
              courseName: studentData.courseName,
              courseCode: studentData.courseCode,
              courseSemesters: studentData.courseSemesters
            });
          }
        }
      }
    }

    // Sort exams logically (SEM 1, SEM 2, etc.)
    examRows.sort((a: any, b: any) => {
      const numA = parseInt((String(a.semester).match(/\d+/) || ['0'])[0], 10);
      const numB = parseInt((String(b.semester).match(/\d+/) || ['0'])[0], 10);
      return numA - numB || (a.id - b.id);
    });

    const totalRequiredSemesters = examRows.length;
    const completedSemesters = examRows.filter((e: any) => e.status === 'completed').length;
    const allExamsCompleted = totalRequiredSemesters > 0 && completedSemesters === totalRequiredSemesters;
    const isCertificateReady = allExamsCompleted || studentData?.certificate_status === 'generated' || studentData?.certificate_status === 'issued';

    // 2. Get Test Series Attempts & Performance Metrics
    const [rawAttemptRows]: any = await db.query(`
      SELECT ta.id, ta.test_id, ta.status, ta.final_score, ta.percentage, ta.duration_seconds as time_taken_seconds, ta.submitted_at,
             ta.correct_answers, ta.incorrect_answers, ta.unanswered, ta.accuracy,
             t.title as test_title, t.total_marks, t.passing_marks, t.question_count,
             ts.id as series_id, ts.title as series_title
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN test_series ts ON t.test_series_id = ts.id
      WHERE ta.student_id = ? AND ta.status = 'SUBMITTED'
      ORDER BY ta.submitted_at DESC
      LIMIT 10
    `, [studentId]);

    const attemptRows = (rawAttemptRows || []).map((a: any) => ({
      ...a,
      passed: Number(a.final_score || 0) >= Number(a.passing_marks || 0),
      pass_status: Number(a.final_score || 0) >= Number(a.passing_marks || 0) ? 'PASSED' : 'FAILED'
    }));

    // 3. Compute Analytics & Stats
    const totalAttempted = attemptRows.length;
    let avgScore = 0;
    let bestScore = 0;
    let totalMinutes = 0;

    if (totalAttempted > 0) {
      const sumPercentage = attemptRows.reduce((acc: number, cur: any) => acc + (Number(cur.percentage) || 0), 0);
      avgScore = Math.round(sumPercentage / totalAttempted);
      bestScore = Math.round(Math.max(...attemptRows.map((a: any) => Number(a.percentage) || 0)));
      totalMinutes = Math.round(attemptRows.reduce((acc: number, cur: any) => acc + (Number(cur.time_taken_seconds || cur.duration_seconds) || 0), 0) / 60);
    }

    // 4. Center Rank Calculation
    let centerRank = 1;
    if (studentData?.centerId) {
      const [rankRows]: any = await db.query(`
        SELECT ta.student_id, AVG(ta.percentage) as avg_p
        FROM test_attempts ta
        JOIN students s ON ta.student_id = s.id
        WHERE s.centerId = ? AND ta.status = 'SUBMITTED'
        GROUP BY ta.student_id
        ORDER BY avg_p DESC
      `, [studentData.centerId]);

      const idx = rankRows.findIndex((r: any) => String(r.student_id) === String(studentId));
      centerRank = idx >= 0 ? idx + 1 : 1;
    }

    // 5. Active Enrolled Series count
    const [enrolledSeriesRows]: any = await db.query(`
      SELECT ts.id, ts.title, ts.thumbnail_url, ts.is_free, ts.price, ts.exam_type as target_exam,
             (SELECT COUNT(*) FROM tests t WHERE t.test_series_id = ts.id AND t.status = 'LIVE') as tests_count
      FROM test_series_enrollments tse
      JOIN test_series ts ON tse.test_series_id = ts.id
      WHERE tse.student_id = ? AND tse.status = 'ACTIVE' AND ts.status = 'PUBLISHED'
      ORDER BY tse.enrolled_at DESC, tse.id DESC
      LIMIT 8
    `, [studentId]);

    // 5b. Explore Featured Test Series
    const [featuredSeriesRows]: any = await db.query(`
      SELECT ts.id, ts.title, ts.thumbnail_url, ts.is_free, ts.price, ts.exam_type as target_exam,
             (SELECT COUNT(*) FROM tests t WHERE t.test_series_id = ts.id AND t.status = 'LIVE') as tests_count
      FROM test_series ts
      WHERE ts.status = 'PUBLISHED'
      ORDER BY ts.is_free DESC, ts.id DESC
      LIMIT 8
    `);

    // 6. Dynamic Badges
    const badges = [
      { id: 'first_test', title: 'First Step', desc: 'Completed your first mock test', icon: 'Award', unlocked: totalAttempted >= 1 },
      { id: 'score_90', title: 'Sharpshooter', desc: 'Scored 90%+ in a mock test', icon: 'Star', unlocked: bestScore >= 90 },
      { id: 'master_5', title: 'Exam Ready', desc: 'Attempted 5+ mock exams', icon: 'ShieldCheck', unlocked: totalAttempted >= 5 },
      { id: 'top_rank', title: 'Center Topper', desc: 'Achieved Top 3 Rank in your center', icon: 'Crown', unlocked: centerRank <= 3 && totalAttempted >= 1 }
    ];

    // 7. Curated Downloadable PDF Resources
    const studyMaterials = [
      { id: 1, title: 'Computer Fundamentals & MS Office Master Cheat Sheet', type: 'PDF', size: '2.4 MB', category: 'IT & Computer', icon: 'FileText' },
      { id: 2, title: 'Speed Maths & Vedic Arithmetic 50 Quick Tricks', type: 'PDF', size: '1.8 MB', category: 'Aptitude', icon: 'Zap' },
      { id: 3, title: 'Tally Prime Voucher Shortcuts & GST Tax Chart', type: 'PDF', size: '3.1 MB', category: 'Accounting', icon: 'BookOpen' },
      { id: 4, title: 'Banking Awareness & RBI Monetary Policy Handbook 2026', type: 'PDF', size: '4.2 MB', category: 'Banking', icon: 'Building2' }
    ];

    res.json({
      success: true,
      data: {
        student: {
          ...studentData,
          marks: examRows
        },
        exams: examRows,
        recentAttempts: attemptRows,
        enrolledSeries: enrolledSeriesRows,
        featuredSeries: featuredSeriesRows,
        studyMaterials,
        badges,
        certificateInfo: {
          isReady: isCertificateReady,
          totalRequiredSemesters,
          completedSemesters,
          allExamsCompleted,
          status: studentData?.certificate_status || (allExamsCompleted ? 'eligible' : 'in_progress'),
          certificateNumber: studentData?.certificate_number || null,
          courseFee: Number(studentData?.course_fee || 0),
          feeStatus: 'cleared'
        },
        analytics: {
          totalAttempted,
          avgScore,
          bestScore,
          totalMinutes,
          centerRank,
          streakDays: totalAttempted > 0 ? 5 : 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/exams/:examId/start', authenticateToken, async (req: any, res: any) => {
  try {
    const studentId = req.user.studentId;
    const { examId } = req.params;

    // 1. Verify the exam belongs to the student and is valid
    const [examRows]: any = await db.query(`
      SELECT sm.*, s.courseId, c.name as courseName, c.code as courseCode, c.semesters as courseSemesters
      FROM student_marks sm
      JOIN students s ON sm.studentId = s.id
      LEFT JOIN courses c ON s.courseId = c.id
      WHERE sm.id = ? AND sm.studentId = ?
    `, [examId, studentId]);

    if (!examRows || examRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found or unauthorized' });
    }

    const exam = examRows[0];

    if (exam.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Exam already completed' });
    }

    // Optional: Validate exam_date is today. But for testing, maybe we just allow if it's not completed.

    // 2. Fetch questions for the specific course and EXACT semester
    const [questions]: any = await db.query(`
      SELECT id, question, optA, optB, optC, optD, marks
      FROM course_questions
      WHERE courseId = ? AND semester = ?
      ORDER BY RAND()
    `, [exam.courseId, exam.semester]);

    let semWrittenMax = 80;
    let marksPerQuestion = 1;

    let rawSem = exam.courseSemesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) { }
    }
    if (Array.isArray(rawSem)) {
      const semStr = String(exam.semester || 'SEM 1').toUpperCase().trim();
      const semMatch = semStr.match(/\d+/);
      const semNum = semMatch ? semMatch[0] : '1';

      const found = rawSem.find((s: any) => {
        const sNumStr = String(s.num ?? '').toUpperCase().trim();
        const sMatch = sNumStr.match(/\d+/);
        const sVal = sMatch ? sMatch[0] : sNumStr;
        return (
          sNumStr === semStr ||
          `SEM ${sNumStr}` === semStr ||
          `SEMESTER ${sNumStr}` === semStr ||
          sVal === semNum
        );
      });
      if (found) {
        if (found.marks !== undefined && found.marks !== null) {
          semWrittenMax = Number(found.marks) || 80;
        }
        if (found.marks_per_question !== undefined && found.marks_per_question !== null) {
          marksPerQuestion = Number(found.marks_per_question) || 1;
        }
      }
    }

    let requiredQuestionsCount = Math.ceil(semWrittenMax / marksPerQuestion);
    const MINIMUM_QUESTIONS_REQUIRED = 16;

    if (!questions || questions.length < MINIMUM_QUESTIONS_REQUIRED) {
      return res.status(404).json({ success: false, message: `Minimum 16 questions criteria not met. Currently found ${questions ? questions.length : 0} questions for this syllabus.` });
    }

    // Limit questions to the exact required count if we have enough, otherwise use all available (which is >= 16)
    const finalQuestions = questions.slice(0, Math.min(requiredQuestionsCount, questions.length));

    // 3. Mark exam as "in_progress" (optional, but good for state tracking)
    await db.query('UPDATE student_marks SET status = "in_progress" WHERE id = ?', [examId]);

    res.json({
      success: true,
      data: {
        exam,
        questions: finalQuestions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/exams/:examId/submit', authenticateToken, async (req: any, res: any) => {
  try {
    const studentId = req.user.studentId;
    const { examId } = req.params;
    const { answers } = req.body; // { questionId: "optA", ... }

    // 1. Verify exam and fetch course config
    const [examRows]: any = await db.query(`
      SELECT sm.*, s.courseId, c.semesters as courseSemesters
      FROM student_marks sm
      JOIN students s ON sm.studentId = s.id
      LEFT JOIN courses c ON s.courseId = c.id
      WHERE sm.id = ? AND sm.studentId = ?
    `, [examId, studentId]);

    if (!examRows || examRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const exam = examRows[0];
    if (exam.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    let semWrittenMax = 80;
    let semOralMax = 20;
    let marksPerQuestion = 1;
    let negativeMarksPerWrong = 0;

    let rawSem = exam.courseSemesters;
    if (typeof rawSem === 'string') {
      try { rawSem = JSON.parse(rawSem); } catch (_) { }
    }
    if (Array.isArray(rawSem)) {
      const semStr = String(exam.semester || 'SEM 1').toUpperCase().trim();
      const semMatch = semStr.match(/\d+/);
      const semNum = semMatch ? semMatch[0] : '1';

      const found = rawSem.find((s: any) => {
        const sNumStr = String(s.num ?? '').toUpperCase().trim();
        const sMatch = sNumStr.match(/\d+/);
        const sVal = sMatch ? sMatch[0] : sNumStr;
        return (
          sNumStr === semStr ||
          `SEM ${sNumStr}` === semStr ||
          `SEMESTER ${sNumStr}` === semStr ||
          sVal === semNum
        );
      });
      if (found) {
        if (found.marks !== undefined && found.marks !== null) {
          semWrittenMax = Number(found.marks) || 80;
        }
        if (found.oral !== undefined && found.oral !== null) {
          semOralMax = Number(found.oral) || 20;
        }
        if (found.marks_per_question !== undefined && found.marks_per_question !== null) {
          marksPerQuestion = Number(found.marks_per_question) || 1;
        }
        if (found.negative_marks !== undefined && found.negative_marks !== null) {
          negativeMarksPerWrong = Number(found.negative_marks) || 0;
        }
      }
    }

    // 3. Fetch correct answers for scoring
    const [questions]: any = await db.query(`
      SELECT id, correct, marks
      FROM course_questions
      WHERE courseId = ? AND semester = ?
    `, [exam.courseId, exam.semester]);

    const normalizeAnswer = (val: any): string => {
      if (!val) return '';
      return String(val).trim().toUpperCase().replace(/^OPT_?/, '');
    };

    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    questions.forEach((q: any) => {
      const qMark = (marksPerQuestion && marksPerQuestion > 0)
        ? marksPerQuestion
        : (Number(q.marks) || 1);
      totalMaxMarks += qMark;
      const studentAns = answers ? (answers[q.id] || answers[String(q.id)]) : null;
      if (studentAns && String(studentAns).trim().length > 0) {
        if (normalizeAnswer(studentAns) === normalizeAnswer(q.correct)) {
          correctCount++;
          totalMarksObtained += qMark;
        } else {
          wrongCount++;
          if (negativeMarksPerWrong > 0) {
            totalMarksObtained -= negativeMarksPerWrong;
          }
        }
      } else {
        unattemptedCount++;
      }
    });

    totalMarksObtained = Math.max(0, Math.round(totalMarksObtained * 100) / 100);

    // Scale or cap to semWrittenMax (e.g. 80 when viva is 20)
    let finalWrittenScore = totalMarksObtained;
    if (totalMaxMarks > 0 && totalMarksObtained > semWrittenMax) {
      finalWrittenScore = Math.min(semWrittenMax, Math.round((totalMarksObtained / totalMaxMarks) * semWrittenMax * 100) / 100);
    } else {
      finalWrittenScore = Math.min(semWrittenMax, totalMarksObtained);
    }
    finalWrittenScore = Math.max(0, finalWrittenScore);

    const totalQuestions = questions.length;

    // 3. Update exam record
    await db.query(`
      UPDATE student_marks 
      SET status = 'completed', 
          written_marks = ?, 
          responses_json = ?, 
          total_questions = ?, 
          correct_answers = ?, 
          wrong_answers = ?
      WHERE id = ?
    `, [
      finalWrittenScore,
      JSON.stringify(answers),
      totalQuestions,
      correctCount,
      wrongCount,
      examId
    ]);

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        score: finalWrittenScore,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/student/admit-card
 * Allows authenticated student to download their official Admit Card PDF
 */
router.get('/admit-card', authenticateToken, async (req: any, res: any) => {
  try {
    const studentId = req.user.studentId || req.user.id;
    const [rows]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.father_name, s.roll_no, s.enrollment_no, s.photo_url,
             c.name as course_name, cntr.name as center_name, cntr.center_code, cntr.address as center_address
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.id = ?
      LIMIT 1
    `, [studentId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const st = rows[0];
    const pdfBuf = await generateAdmitCardPdfBuffer({
      id: st.id,
      name: `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student',
      father_name: st.father_name,
      roll_no: st.roll_no,
      enrollment_no: st.enrollment_no,
      course_name: st.course_name,
      photo_url: st.photo_url,
      center_name: st.center_name,
      center_code: st.center_code,
      center_address: st.center_address
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admit-card-${st.roll_no || st.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuf.length);
    res.send(pdfBuf);
  } catch (error: any) {
    console.error('Admit card generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

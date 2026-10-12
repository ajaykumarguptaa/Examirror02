import db from '../db';
import { notificationService } from './notification.service';
import { saveBase64File } from '../utils/fileStorage';

export const centerService = {
  // --- COURSES ---
  addCourse: async (
    code: string,
    name: string,
    categoryId: string = 'General',
    fee: number = 0,
    shortDescription: string = '',
    duration: string = '3 Month(s)',
    semesters: any = null,
    createdByType: 'admin' | 'center' = 'admin',
    createdById: number | null = null,
    isPublished: number = 0,
    isDraft: number = 0
  ) => {
    const finalCode = code && code.trim().length > 0
      ? code.trim()
      : 'CRS-' + (name ? name.substring(0, 3).toUpperCase() : 'GEN') + '-' + Math.floor(100 + Math.random() * 900);

    const semJson = semesters ? (typeof semesters === 'string' ? semesters : JSON.stringify(semesters)) : null;

    const [result]: any = await db.query(
      'INSERT INTO courses (code, name, categoryId, fee, shortDescription, duration, semesters, created_by_type, created_by_id, is_published, is_draft) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, name, categoryId || 'General', fee || 0, shortDescription || '', duration || '3 Month(s)', semJson, createdByType, createdById, isPublished, isDraft]
    );
    return result.insertId;
  },

  getCourses: async (centerId?: string | number) => {
    let sql = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM course_questions cq WHERE cq.courseId = c.id) as questionsCount
      FROM courses c
    `;
    const params: any[] = [];
    if (centerId) {
      sql += ` WHERE ((c.created_by_type = 'admin' OR c.created_by_type IS NULL) AND c.is_published = 1 AND (c.is_draft = 0 OR c.is_draft IS NULL)) OR (c.created_by_type = 'center' AND c.created_by_id = ?)`;
      params.push(centerId);
    } else {
      sql += ` WHERE (c.created_by_type = 'admin' OR c.created_by_type IS NULL)`;
    }
    sql += ` ORDER BY c.created_at DESC`;

    const [courses]: any = await db.query(sql, params);

    const [breakdownRows]: any = await db.query(`
      SELECT courseId, semester, COUNT(*) as count 
      FROM course_questions 
      GROUP BY courseId, semester
    `);

    const breakdownMap: Record<number, Record<string, number>> = {};
    for (const row of breakdownRows) {
      if (!breakdownMap[row.courseId]) breakdownMap[row.courseId] = {};
      const semKey = (row.semester || 'SEM 1').trim().toUpperCase();
      breakdownMap[row.courseId][semKey] = (breakdownMap[row.courseId][semKey] || 0) + Number(row.count);
    }

    return courses.map((c: any) => {
      let sems = [];
      if (typeof c.semesters === 'string') {
        try { sems = JSON.parse(c.semesters); } catch (e) { }
      } else {
        sems = c.semesters || [];
      }

      // If fetching for a center, filter out unpublished semesters
      if (centerId) {
        sems = sems.filter((s: any) => s.is_published !== false);
        c.semesters = JSON.stringify(sems);
      }

      return {
        ...c,
        semesterQuestions: breakdownMap[c.id] || {}
      };
    });
  },

  getCenterCourses: async (centerId: string | number = 1) => {
    const [courses]: any = await db.query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM course_questions cq WHERE cq.courseId = c.id) as questionsCount
      FROM center_courses cc
      JOIN courses c ON cc.courseId = c.id
      WHERE cc.centerId = ? AND (c.created_by_type = 'center' OR ((c.created_by_type = 'admin' OR c.created_by_type IS NULL) AND c.is_published = 1 AND (c.is_draft = 0 OR c.is_draft IS NULL)))
      ORDER BY cc.added_at DESC
    `, [centerId]);

    const [breakdownRows]: any = await db.query(`
      SELECT courseId, semester, COUNT(*) as count 
      FROM course_questions 
      GROUP BY courseId, semester
    `);

    const breakdownMap: Record<number, Record<string, number>> = {};
    for (const row of breakdownRows) {
      if (!breakdownMap[row.courseId]) breakdownMap[row.courseId] = {};
      const semKey = (row.semester || 'SEM 1').trim().toUpperCase();
      breakdownMap[row.courseId][semKey] = (breakdownMap[row.courseId][semKey] || 0) + Number(row.count);
    }

    return courses.map((c: any) => {
      let sems = [];
      if (typeof c.semesters === 'string') {
        try { sems = JSON.parse(c.semesters); } catch (e) { }
      } else {
        sems = c.semesters || [];
      }

      // Filter out unpublished semesters
      sems = sems.filter((s: any) => s.is_published !== false);
      c.semesters = JSON.stringify(sems);

      return {
        ...c,
        semesterQuestions: breakdownMap[c.id] || {}
      };
    });
  },

  getCenterCourseIds: async (centerId: string | number = 1) => {
    const [rows]: any = await db.query(`
      SELECT courseId FROM center_courses WHERE centerId = ?
    `, [centerId]);
    return rows.map((r: any) => Number(r.courseId));
  },

  addCourseToCenter: async (centerId: string | number = 1, courseId: string | number) => {
    const [courseRows]: any = await db.query(
      'SELECT id, name, is_published, is_draft, created_by_type FROM courses WHERE id = ?',
      [courseId]
    );

    if (!courseRows || courseRows.length === 0) {
      return {
        alreadyAdded: false,
        success: false,
        message: 'Course not found.'
      };
    }

    const crs = courseRows[0];
    if ((crs.created_by_type === 'admin' || !crs.created_by_type) && (crs.is_published !== 1 || crs.is_draft === 1)) {
      return {
        alreadyAdded: false,
        success: false,
        message: `Cannot add "${crs.name}" because it is currently unpublished or saved as a draft by Super Admin.`
      };
    }

    const [existing]: any = await db.query(
      'SELECT id FROM center_courses WHERE centerId = ? AND courseId = ?',
      [centerId, courseId]
    );

    if (existing && existing.length > 0) {
      return {
        alreadyAdded: true,
        message: 'The course is already been added in course list. Will not add duplicate course in course list.'
      };
    }

    await db.query(
      'INSERT INTO center_courses (centerId, courseId) VALUES (?, ?)',
      [centerId, courseId]
    );

    return {
      alreadyAdded: false,
      success: true,
      message: 'Course has been successfully added to your course list!'
    };
  },

  removeCourseFromCenter: async (centerId: string | number = 1, courseId: string | number) => {
    await db.query(
      'DELETE FROM center_courses WHERE centerId = ? AND courseId = ?',
      [centerId, courseId]
    );
  },

  getCourseById: async (id: string | number) => {
    const [rows]: any = await db.query('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0];
  },

  updateCourse: async (
    id: string | number,
    code: string,
    name: string,
    categoryId: string,
    fee: number,
    shortDescription: string,
    duration?: string,
    semesters?: any
  ) => {
    const semJson = semesters ? (typeof semesters === 'string' ? semesters : JSON.stringify(semesters)) : null;
    await db.query(
      'UPDATE courses SET code = COALESCE(?, code), name = COALESCE(?, name), categoryId = COALESCE(?, categoryId), fee = COALESCE(?, fee), shortDescription = COALESCE(?, shortDescription), duration = COALESCE(?, duration), semesters = COALESCE(?, semesters) WHERE id = ?',
      [code || null, name || null, categoryId || null, fee !== undefined ? fee : null, shortDescription || null, duration || null, semJson, id]
    );
  },

  deleteCourse: async (id: string | number) => {
    await db.query('DELETE FROM courses WHERE id = ?', [id]);
  },

  // --- COURSE QUESTIONS (Exam setup) ---
  getCourseQuestions: async (courseId: string | number) => {
    const [rows] = await db.query('SELECT * FROM course_questions WHERE courseId = ? ORDER BY id ASC', [courseId]);
    return rows;
  },

  addCourseQuestion: async (courseId: string | number, question: string, optA: string, optB: string, optC: string, optD: string, correct: string, semester = 'SEM 1', marks = 1) => {
    const [result]: any = await db.query(
      'INSERT INTO course_questions (courseId, semester, question, optA, optB, optC, optD, correct, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [courseId, semester, question, optA, optB, optC, optD, correct, marks]
    );
    return result.insertId;
  },

  updateCourseQuestion: async (id: string | number, question: string, optA: string, optB: string, optC: string, optD: string, correct: string, marks = 1) => {
    await db.query(
      'UPDATE course_questions SET question = ?, optA = ?, optB = ?, optC = ?, optD = ?, correct = ?, marks = ? WHERE id = ?',
      [question, optA, optB, optC, optD, correct, marks, id]
    );
  },

  deleteCourseQuestion: async (id: string | number) => {
    await db.query('DELETE FROM course_questions WHERE id = ?', [id]);
  },

  // --- STUDENTS & ADMISSION LOGIC ---
  calculateAdmissionFee: (_courseFee: number = 0) => {
    // Admission platform fee removed; required fee is deducted upon certificate generation
    return 0;
  },

  addStudent: async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    courseId: number;
    centerId: number;
    studentType?: string;
    duration?: string;
    dob?: string;
    gender?: string;
    maritalStatus?: string;
    phone?: string;
    fatherName?: string;
    motherName?: string;
    qualification?: string;
    address?: string;
    pincode?: string;
    city?: string;
    state?: string;
    courseFee?: number;
    sessionStart?: string;
    sessionEnd?: string;
    idType?: string;
    idNumber?: string;
    photoUrl?: string;
    idCardUrl?: string;
    marksheetUrl?: string;
    academicStatus?: string;
  }) => {
    // 1. Check if course has questions configured (EXAM REQUIREMENT)
    const [qRows]: any = await db.query(
      'SELECT COUNT(*) as questionsCount FROM course_questions WHERE courseId = ?',
      [data.courseId]
    );
    const questionsCount = qRows && qRows[0] ? Number(qRows[0].questionsCount) : 0;

    if (questionsCount === 0) {
      throw new Error('Exam questions have not been set for this course yet. Please configure questions in Courses List (+ icon) before enrolling students.');
    }

    // 2. Student type and duration validation
    const courseFee = data.courseFee ? Number(data.courseFee) : 0;
    const studentType = data.studentType || 'new';
    if (studentType === 'old') {
      const [centerPerm]: any = await db.query(
        'SELECT (old_student_allowed_until IS NOT NULL AND old_student_allowed_until > NOW()) as is_allowed FROM centers WHERE id = ?',
        [data.centerId]
      );
      const isAllowed = Boolean(centerPerm && centerPerm[0] && centerPerm[0].is_allowed);
      if (!isAllowed) {
        throw new Error('Old student admission permission has expired or is not granted for your center (2-hour limit). Please request Super Admin authorization.');
      }
    }
    const duration = data.duration || '1-3 months';
    // Zero enrollment fee deduction at admission time (fee deduction occurs upon certificate generation)
    const tokensRequired = 0;

    // Strict Input Validations
    if (!data.firstName || !data.firstName.trim()) {
      throw new Error('Student first name is required.');
    }

    if (data.phone && !/^[6-9]\d{9}$/.test(String(data.phone).trim())) {
      throw new Error('Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    }

    if (data.pincode && !/^\d{6}$/.test(String(data.pincode).trim())) {
      throw new Error('Please provide a valid 6-digit postal Pincode.');
    }

    if (data.idType === 'Aadhaar Card' && data.idNumber && !/^\d{12}$/.test(String(data.idNumber).trim())) {
      throw new Error('Aadhaar Card number must be exactly 12 digits.');
    }

    if (data.idType === 'PAN Card' && data.idNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(data.idNumber).trim().toUpperCase())) {
      throw new Error('PAN Card number must be a valid 10-character alphanumeric code (e.g. ABCDE1234F).');
    }

    // Save images/documents locally to disk in uploads/students/
    const savedPhotoUrl = saveBase64File(data.photoUrl, 'photo');
    const savedIdCardUrl = saveBase64File(data.idCardUrl, 'idcard');
    const savedMarksheetUrl = saveBase64File(data.marksheetUrl, 'marksheet');

    // 5. Insert Student
    const academicStatus = data.academicStatus === 'passout' ? 'passout' : 'pursuing';
    const password = Math.random().toString(36).substring(2, 8).toLowerCase();

    const [result]: any = await db.query(`
      INSERT INTO students (
        firstName, lastName, email, courseId, centerId, student_type, duration, tokens_deducted,
        certificate_status, dob, gender, marital_status, phone, father_name, mother_name,
        qualification, address, pincode, city, state, course_fee, session_start, session_end,
        id_type, id_number, photo_url, id_card_url, marksheet_url, academic_status, status, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'not_generated', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `, [
      data.firstName,
      data.lastName,
      data.email || `${data.firstName.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}@examirror.com`,
      data.courseId,
      data.centerId,
      studentType,
      duration,
      tokensRequired,
      data.dob || null,
      data.gender || 'Male',
      data.maritalStatus || 'Single',
      data.phone || '',
      data.fatherName || '',
      data.motherName || '',
      data.qualification || '',
      data.address || '',
      data.pincode || '',
      data.city || '',
      data.state || '',
      data.courseFee || 0,
      data.sessionStart || '',
      data.sessionEnd || '',
      data.idType || 'AADHAAR CARD',
      data.idNumber || '',
      savedPhotoUrl,
      savedIdCardUrl,
      savedMarksheetUrl,
      academicStatus,
      password,
    ]);

    const studentId = result.insertId;
    const year = new Date().getFullYear();
    const enrollmentNo = `EXAM-${year}-${String(1000 + studentId).padStart(4, '0')}`;
    const rollNo = `ROL-${String(10000 + studentId)}`;

    await db.query(`UPDATE students SET enrollment_no = ?, roll_no = ? WHERE id = ?`, [
      enrollmentNo,
      rollNo,
      studentId
    ]);



    const [cntRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [data.centerId]);
    const walletBalance = Number(cntRows && cntRows[0] ? cntRows[0].wallet_balance : 0);

    return {
      studentId,
      enrollmentNo,
      rollNo,
      tokensDeducted: 0,
      remainingBalance: walletBalance
    };
  },

  updateStudentAcademicStatus: async (studentId: string | number, academicStatus: string) => {
    const validStatus = academicStatus === 'passout' ? 'passout' : 'pursuing';
    await db.query('UPDATE students SET academic_status = ? WHERE id = ?', [validStatus, studentId]);
    return { success: true, academicStatus: validStatus };
  },

  getStudentsByCenter: async (centerId: string | number) => {
    const [rows]: any = await db.query(`
      SELECT s.*, 
             c.name as courseName, c.code as courseCode, c.semesters as courseSemesters, c.duration as courseDuration,
             cntr.name as centerName, cntr.center_code as centerCode, cntr.address as centerAddress, cntr.city as centerCity, cntr.state as centerState,
             cntr.signature_url as centerSignatureUrl, cntr.stamp_url as centerStampUrl, cntr.head_name as centerHeadName
      FROM students s 
      LEFT JOIN courses c ON s.courseId = c.id 
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.centerId = ? 
      ORDER BY s.created_at DESC
    `, [centerId]);

    if (!rows || rows.length === 0) return [];

    try {
      const studentIds = rows.map((r: any) => r.id);
      const [marks]: any = await db.query(`
        SELECT studentId, id, semester, written_marks, viva_marks, status, is_marksheet_generated, DATE_FORMAT(exam_date, '%Y-%m-%d') as exam_date
        FROM student_marks
        WHERE studentId IN (?)
        ORDER BY semester ASC, id ASC
      `, [studentIds]);

      const marksMap: Record<number, any[]> = {};
      (marks || []).forEach((m: any) => {
        if (!marksMap[m.studentId]) marksMap[m.studentId] = [];
        marksMap[m.studentId].push(m);
      });

      return rows.map((r: any) => ({
        ...r,
        marks: marksMap[r.id] || []
      }));
    } catch {
      return rows;
    }
  },

  getStudentById: async (id: string | number) => {
    const [rows]: any = await db.query(`
      SELECT s.*, 
             c.name as courseName, c.code as courseCode, c.semesters as courseSemesters, c.duration as courseDuration,
             cntr.name as centerName, cntr.center_code as centerCode, cntr.address as centerAddress, cntr.city as centerCity, cntr.state as centerState,
             cntr.signature_url as centerSignatureUrl, cntr.stamp_url as centerStampUrl, cntr.head_name as centerHeadName
      FROM students s 
      LEFT JOIN courses c ON s.courseId = c.id 
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.id = ?
    `, [id]);
    if (!rows[0]) return null;

    try {
      const [marks]: any = await db.query(`
        SELECT id, semester, written_marks, viva_marks, status, is_marksheet_generated, DATE_FORMAT(exam_date, '%Y-%m-%d') as exam_date
        FROM student_marks
        WHERE studentId = ?
        ORDER BY semester ASC, id ASC
      `, [id]);
      return { ...rows[0], marks: marks || [] };
    } catch {
      return rows[0];
    }
  },

  updateStudent: async (id: string | number, updateData: any) => {
    const fieldMapping: Record<string, string> = {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      courseId: 'courseId',
      studentType: 'student_type',
      student_type: 'student_type',
      duration: 'duration',
      dob: 'dob',
      gender: 'gender',
      maritalStatus: 'marital_status',
      marital_status: 'marital_status',
      phone: 'phone',
      fatherName: 'father_name',
      father_name: 'father_name',
      motherName: 'mother_name',
      mother_name: 'mother_name',
      qualification: 'qualification',
      address: 'address',
      pincode: 'pincode',
      city: 'city',
      state: 'state',
      courseFee: 'course_fee',
      course_fee: 'course_fee',
      sessionStart: 'session_start',
      session_start: 'session_start',
      sessionEnd: 'session_end',
      session_end: 'session_end',
      idType: 'id_type',
      id_type: 'id_type',
      idNumber: 'id_number',
      id_number: 'id_number',
      academicStatus: 'academic_status',

      academic_status: 'academic_status',
      photoUrl: 'photo_url',
      photo_url: 'photo_url',
      idCardUrl: 'id_card_url',
      id_card_url: 'id_card_url',
      marksheetUrl: 'marksheet_url',
      marksheet_url: 'marksheet_url',
      password: 'password',

      status: 'status'
    };

    if (updateData.phone && !/^[6-9]\d{9}$/.test(String(updateData.phone).trim())) {
      throw new Error('Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    }

    if (updateData.pincode && !/^\d{6}$/.test(String(updateData.pincode).trim())) {
      throw new Error('Please provide a valid 6-digit postal Pincode.');
    }

    const effectiveIdType = updateData.idType || updateData.id_type;
    const effectiveIdNumber = updateData.idNumber || updateData.id_number;
    if (effectiveIdType === 'Aadhaar Card' && effectiveIdNumber && !/^\d{12}$/.test(String(effectiveIdNumber).trim())) {
      throw new Error('Aadhaar Card number must be exactly 12 digits.');
    }

    if (effectiveIdType === 'PAN Card' && effectiveIdNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(effectiveIdNumber).trim().toUpperCase())) {
      throw new Error('PAN Card number must be a valid 10-character alphanumeric code (e.g. ABCDE1234F).');
    }

    const finalFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (value === undefined) continue;
      // Security Fix: Strictly whitelist valid columns. Disallow arbitrary object keys from entering SQL query
      const dbCol = fieldMapping[key];
      if (!dbCol) continue;
      if (dbCol === 'photo_url') {
        if (value && typeof value === 'string' && value.startsWith('data:')) {
          finalFields[dbCol] = saveBase64File(value as string, 'photo');
        } else if (value) {
          finalFields[dbCol] = value;
        }
      } else if (dbCol === 'id_card_url') {
        if (value && typeof value === 'string' && value.startsWith('data:')) {
          finalFields[dbCol] = saveBase64File(value as string, 'idcard');
        } else if (value) {
          finalFields[dbCol] = value;
        }
      } else if (dbCol === 'marksheet_url') {
        if (value && typeof value === 'string' && value.startsWith('data:')) {
          finalFields[dbCol] = saveBase64File(value as string, 'marksheet');
        } else if (value) {
          finalFields[dbCol] = value;
        }
      } else {
        finalFields[dbCol] = value;
      }
    }

    const setClauses = Object.keys(finalFields).map(k => `${k} = ?`).join(', ');
    const values = Object.values(finalFields);
    if (setClauses.length > 0) {
      await db.query(`UPDATE students SET ${setClauses} WHERE id = ?`, [...values, id]);
    }

    if (updateData.isAdvancedEdit) {
      const [student]: any = await db.query('SELECT centerId FROM students WHERE id = ?', [id]);
      if (student && student.length > 0) {
        const centerId = student[0].centerId;
        const [center]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
        if (center && center.length > 0) {
          const currentBalance = Number(center[0].wallet_balance) || 0;
          if (currentBalance >= 50) {
            await db.query('UPDATE centers SET wallet_balance = wallet_balance - 50 WHERE id = ?', [centerId]);
            await db.query(`
              INSERT INTO wallet_transactions (centerId, amount, type, description) 
              VALUES (?, ?, 'deduction', 'Advanced Edit Fee for student ID: ?')
            `, [centerId, 50, id]);
          } else {
            throw new Error('Insufficient wallet balance for Advanced Edit (50 tokens required).');
          }
        }
      }
    }
  },

  // --- CANCELLATION & STRICT REFUND RULE ---
  cancelStudentAdmission: async (studentId: string | number, centerId: string | number) => {
    // 1. Check student certificate status
    const [rows]: any = await db.query('SELECT * FROM students WHERE id = ? AND centerId = ?', [studentId, centerId]);
    if (!rows || rows.length === 0) {
      throw new Error('Student not found');
    }
    const student = rows[0];

    if (student.status === 'cancelled') {
      throw new Error('Student admission has already been cancelled.');
    }

    if (student.certificate_status === 'generated' || student.certificate_status === 'issued') {
      throw new Error('Strict Rule: Certificate has already been generated for this student. Admission cancellation and wallet refund is NOT permitted.');
    }

    const refundAmount = Number(student.tokens_deducted) || 0;

    // 2. Mark student cancelled
    await db.query('UPDATE students SET status = "cancelled" WHERE id = ?', [studentId]);

    // 3. Check 24-hour limit for refund
    const enrollmentDate = new Date(student.created_at);
    const currentDate = new Date();
    const diffHours = Math.abs(currentDate.getTime() - enrollmentDate.getTime()) / 3600000;

    let actualRefund = 0;

    // 4. Refund tokens to center wallet only if within 24 hours
    if (refundAmount > 0 && diffHours <= 24) {
      actualRefund = refundAmount;
      await db.query('UPDATE centers SET wallet_balance = wallet_balance + ? WHERE id = ?', [actualRefund, centerId]);
      await db.query(
        'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, ?, ?)',
        [centerId, actualRefund, 'credit', `Refund for cancelled admission: ${student.firstName} ${student.lastName}`]
      );
    }

    return { success: true, refundedTokens: actualRefund, message: actualRefund > 0 ? 'Admission cancelled and tokens refunded.' : 'Admission cancelled. No refund issued as 24 hours have passed.' };
  },

  getInstantCertificateCharge: async (centerId?: string | number) => {
    let charge = 200;
    let allowed = true;
    try {
      const [rows]: any = await db.query('SELECT value FROM settings WHERE key_name = "online_test_pricing_config"');
      if (rows && rows.length > 0 && rows[0].value) {
        const config = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
        if (config.instant_certificate_charge !== undefined) {
          charge = Number(config.instant_certificate_charge) || 200;
        }
        if (config.allow_instant_certificate !== undefined) {
          allowed = Boolean(config.allow_instant_certificate);
        }
      }

      if (centerId && centerId !== 'undefined' && centerId !== 'null') {
        const [centerRows]: any = await db.query('SELECT custom_pricing_config FROM centers WHERE id = ? OR center_code = ?', [centerId, centerId]);
        if (centerRows && centerRows.length > 0 && centerRows[0].custom_pricing_config) {
          const custom = typeof centerRows[0].custom_pricing_config === 'string'
            ? JSON.parse(centerRows[0].custom_pricing_config)
            : centerRows[0].custom_pricing_config;
          if (custom.allow_instant_certificate !== undefined) {
            allowed = Boolean(custom.allow_instant_certificate);
          }
          if (custom.instant_certificate_charge !== undefined) {
            charge = Number(custom.instant_certificate_charge);
          }
        }
      }
    } catch (_) { }
    return { charge, allowed };
  },

  generateStudentCertificate: async (studentId: string | number, isInstant: boolean = false) => {
    // 1. Fetch student to get centerId and student details
    const [studentRows]: any = await db.query(
      'SELECT id, centerId, firstName, lastName, roll_no, enrollment_no, certificate_status FROM students WHERE id = ? OR enrollment_no = ? OR roll_no = ?',
      [studentId, studentId, studentId]
    );
    if (!studentRows || studentRows.length === 0) throw new Error('Student not found');
    const student = studentRows[0];
    const actualStudentId = student.id;
    const centerId = student.centerId;

    if (student.certificate_status === 'generated') {
      throw new Error('Certificate has already been generated for this student.');
    }

    // 2. Fetch certificate charge & permissions
    const chargeInfo = await centerService.getInstantCertificateCharge(centerId);
    const deduction = Number(chargeInfo.charge) || 200;

    if (isInstant && !chargeInfo.allowed) {
      throw new Error('Instant Certificate generation is not enabled for your center. All semester exams must be completed.');
    }

    // 3. Check wallet balance and deduct required fee
    if (deduction > 0) {
      const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
      const balance = Number(centerRows[0]?.wallet_balance || 0);
      if (balance < deduction) {
        const certType = isInstant ? 'instant certificate' : 'certificate generation';
        throw new Error(`Insufficient wallet balance for ${certType}. Required: ₹${deduction}, Available: ₹${balance}. Please recharge your center wallet.`);
      }

      // Deduct from center wallet balance
      await db.query('UPDATE centers SET wallet_balance = wallet_balance - ? WHERE id = ?', [deduction, centerId]);

      // Generate Txn UID & Description
      const txnUid = `EXAMTXN${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || `Student #${actualStudentId}`;
      const studentIdentifier = student.roll_no || student.enrollment_no || actualStudentId;
      const desc = isInstant
        ? `Instant Certificate Fee: ${studentName} (Roll/ID: ${studentIdentifier})`
        : `Certificate Generation Fee: ${studentName} (Roll/ID: ${studentIdentifier})`;

      // Log transaction with complete metadata
      await db.query(
        'INSERT INTO wallet_transactions (centerId, amount, type, status, txn_uid, description, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [centerId, deduction, 'debit', 'Approved', txnUid, desc, desc]
      );
    }

    // 4. Generate Certificate
    const certNumber = `EXAM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await db.query(
      'UPDATE students SET certificate_status = "generated", certificate_number = ?, tokens_deducted = ? WHERE id = ?',
      [certNumber, deduction, actualStudentId]
    );

    const [updatedCenter]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
    return {
      success: true,
      certificateNumber: certNumber,
      charged: deduction,
      remaining_balance: updatedCenter[0]?.wallet_balance || 0
    };
  },

  // --- DASHBOARD ---
  getDashboardData: async (centerId: string | number) => {
    const [studentsRow]: any = await db.query('SELECT COUNT(*) as count FROM students WHERE centerId = ? AND status != "cancelled"', [centerId]);
    const [freeTestsRow]: any = await db.query('SELECT COUNT(*) as count FROM free_tests WHERE centerId = ?', [centerId]);
    const [examsRow]: any = await db.query('SELECT COUNT(*) as count FROM exams WHERE centerId = ?', [centerId]);
    const [coursesRow]: any = await db.query('SELECT COUNT(*) as count FROM center_courses WHERE centerId = ?', [centerId]);
    const [centerRows]: any = await db.query('SELECT wallet_balance, name, center_code, email, phone, city, state, status FROM centers WHERE id = ?', [centerId]);

    const studentsCount = (studentsRow && studentsRow[0] && studentsRow[0].count) || 0;
    const freeTestsCount = (freeTestsRow && freeTestsRow[0] && freeTestsRow[0].count) || 0;
    const examsCount = (examsRow && examsRow[0] && examsRow[0].count) || 0;
    const coursesCount = (coursesRow && coursesRow[0] && coursesRow[0].count) || 0;
    const walletBalance = (centerRows && centerRows[0] && centerRows[0].wallet_balance) || 0;

    const [chartData]: any = await db.query(`
      SELECT MONTHNAME(created_at) as month, COUNT(*) as count 
      FROM students 
      WHERE centerId = ? AND YEAR(created_at) = YEAR(CURRENT_DATE()) AND status != "cancelled"
      GROUP BY MONTH(created_at), MONTHNAME(created_at)
      ORDER BY MONTH(created_at)
    `, [centerId]);

    const [recentStudents]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.email, s.created_at, s.certificate_status, s.status, c.name as courseName 
      FROM students s 
      LEFT JOIN courses c ON s.courseId = c.id 
      WHERE s.centerId = ? 
      ORDER BY s.created_at DESC 
      LIMIT 5
    `, [centerId]);

    const centerProfile = centerRows && centerRows.length > 0 ? {
      name: centerRows[0].name,
      code: centerRows[0].center_code,
      email: centerRows[0].email,
      phone: centerRows[0].phone,
      location: `${centerRows[0].city || ''}, ${centerRows[0].state || ''}`.trim().replace(/^,|,$/g, ''),
      status: centerRows[0].status
    } : null;

    return {
      centerProfile,
      stats: {
        studentsCount,
        freeTestsCount,
        examsCount,
        coursesCount,
        walletBalance
      },
      chartData: chartData || [],
      recentStudents: recentStudents || []
    };
  },

  getStats: async (centerId: string | number = 1) => {
    const [studentsRow]: any = await db.query('SELECT COUNT(*) as count FROM students WHERE centerId = ? AND status != "cancelled"', [centerId]);
    const [freeTestsRow]: any = await db.query('SELECT COUNT(*) as count FROM free_tests WHERE centerId = ?', [centerId]);
    const [examsRow]: any = await db.query('SELECT COUNT(*) as count FROM exams WHERE centerId = ?', [centerId]);
    const [coursesRow]: any = await db.query('SELECT COUNT(*) as count FROM center_courses WHERE centerId = ?', [centerId]);
    const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);

    return {
      studentsCount: (studentsRow && studentsRow[0] && studentsRow[0].count) || 0,
      freeTestsCount: (freeTestsRow && freeTestsRow[0] && freeTestsRow[0].count) || 0,
      examsCount: (examsRow && examsRow[0] && examsRow[0].count) || 0,
      coursesCount: (coursesRow && coursesRow[0] && coursesRow[0].count) || 0,
      walletBalance: (centerRows && centerRows[0] && centerRows[0].wallet_balance) || 0
    };
  },

  // --- WALLET & RECHARGE REQUESTS ---
  getWalletInfo: async (centerId: string | number) => {
    let cid: number | string = centerId;
    const [centerRows]: any = await db.query('SELECT id, name, center_code, wallet_balance FROM centers WHERE id = ? OR center_code = ?', [centerId, centerId]);
    if (centerRows && centerRows.length > 0) {
      cid = centerRows[0].id;
    }

    const [transactions]: any = await db.query(`
      SELECT 
        id, 
        centerId, 
        amount, 
        type, 
        COALESCE(description, remark, CASE WHEN type = 'debit' THEN 'Token Deducted by Administrator' ELSE 'Wallet Recharge' END) as narration, 
        COALESCE(description, remark, CASE WHEN type = 'debit' THEN 'Token Deducted by Administrator' ELSE 'Wallet Recharge' END) as description,
        created_at, 
        created_at as approved_at, 
        COALESCE(txn_uid, CONCAT('EXAMTXN', LPAD(id, 5, '0'), DATE_FORMAT(created_at, '%y%m%d%H%i%s'))) as txn_uid, 
        COALESCE(utr_number, '') as utr_number, 
        COALESCE(status, 'Approved') as status, 
        NULL as rejection_reason,
        COALESCE(remark, description, CASE WHEN type = 'debit' THEN 'Token Deducted by Administrator' ELSE 'Thanks for your business.' END) as remark
      FROM wallet_transactions 
      WHERE centerId = ? 
      
      UNION ALL
      
      SELECT 
        id + 100000 as id, 
        centerId, 
        amount, 
        'credit' as type, 
        narration, 
        narration as description,
        created_at, 
        approved_at, 
        CONCAT('EXAMTXN', LPAD(id, 5, '0'), DATE_FORMAT(created_at, '%y%m%d%H%i%s')) as txn_uid, 
        utr_number, 
        status, 
        rejection_reason,
        COALESCE(rejection_reason, CASE WHEN status = 'pending' THEN 'Pending administrator verification.' WHEN status = 'approved' THEN 'Approved by administrator.' ELSE 'Payment verification failed by administrator.' END) as remark
      FROM wallet_requests 
      WHERE centerId = ? AND (status = 'pending' OR status = 'rejected')
      
      ORDER BY created_at DESC 
      LIMIT 100
    `, [cid, cid]);

    return {
      center: centerRows[0] || null,
      balance: centerRows[0]?.wallet_balance || 0,
      transactions: transactions || []
    };
  },

  submitWalletRequest: async (centerId: number | string, amount: number, utrNumber: string, narration: string = 'Wallet Recharge', requestIdToResubmit?: number | string) => {
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      throw new Error('Please enter a valid 12-digit UTR or Transaction reference number');
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 300) {
      throw new Error('Minimum recharge amount is Rs.300');
    }

    // If re-submitting a specific rejected request
    if (requestIdToResubmit) {
      const realId = Number(requestIdToResubmit) > 100000 ? Number(requestIdToResubmit) - 100000 : Number(requestIdToResubmit);
      const resubmittedNarration = narration.startsWith('Resubmitted') ? narration : `Resubmitted - ${narration}`;
      await db.query(
        'UPDATE wallet_requests SET amount = ?, utr_number = ?, narration = ?, status = "pending", rejection_reason = NULL, created_at = NOW() WHERE id = ? AND centerId = ?',
        [numAmount, cleanUtr, resubmittedNarration, realId, centerId]
      );
      return { requestId: realId, message: 'Request re-submitted successfully' };
    }

    // Check if UTR is already in use
    const [existing]: any = await db.query('SELECT id, status FROM wallet_requests WHERE utr_number = ?', [cleanUtr]);
    if (existing.length > 0) {
      if (existing[0].status === 'pending') {
        throw new Error('A wallet recharge request with this UTR number is already awaiting verification');
      } else if (existing[0].status === 'approved') {
        throw new Error('This UTR number has already been verified and credited previously');
      } else if (existing[0].status === 'rejected') {
        // Re-activate previously rejected request with updated details
        const resubmittedNarration = narration.startsWith('Resubmitted') ? narration : `Resubmitted - ${narration}`;
        await db.query(
          'UPDATE wallet_requests SET amount = ?, narration = ?, status = "pending", rejection_reason = NULL, created_at = NOW() WHERE id = ?',
          [numAmount, resubmittedNarration, existing[0].id]
        );

        await notificationService.createNotification('admin', null, 'Wallet Request Resubmitted', `A center resubmitted a wallet recharge request for ₹${numAmount} (UTR: ${cleanUtr})`, 'wallet_request');

        return { requestId: existing[0].id, message: 'Recharge request updated and re-submitted successfully' };
      }
    }

    const [result]: any = await db.query(
      'INSERT INTO wallet_requests (centerId, amount, utr_number, narration, status) VALUES (?, ?, ?, ?, "pending")',
      [centerId, numAmount, cleanUtr, narration]
    );

    await notificationService.createNotification('admin', null, 'New Wallet Request', `A center requested a wallet recharge of ₹${numAmount} (UTR: ${cleanUtr})`, 'wallet_request');

    return { requestId: result.insertId };
  },

  // --- SETTED EXAMS ---
  createExam: async (centerId: string | number, title: string, date: string) => {
    const [result]: any = await db.query('INSERT INTO exams (centerId, title, date) VALUES (?, ?, ?)', [centerId, title, date]);
    return result.insertId;
  },

  getExams: async (centerId: string | number) => {
    const [rows] = await db.query('SELECT * FROM exams WHERE centerId = ? ORDER BY date DESC', [centerId]);
    return rows;
  },

  deleteExam: async (id: string | number) => {
    await db.query('DELETE FROM exams WHERE id = ?', [id]);
  },

  // --- ONLINE TEST MANAGEMENT & DYNAMIC MONTHLY QUOTA ---
  getCenterOnlineTestQuota: async (centerId: string | number) => {
    // 1. Fetch dynamic Super Admin configuration
    const [rows]: any = await db.query('SELECT value FROM settings WHERE key_name = "online_test_pricing_config" LIMIT 1');
    let config = {
      monthly_free_limit: 2,
      charge_per_extra_test: 50,
      enabled: true,
      allow_wallet_deduction: true,
      free_students_per_test: 50,
      charge_per_extra_student: 5
    };
    if (rows && rows.length > 0) {
      try {
        const parsed = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
        config = { ...config, ...parsed };
      } catch { }
    }

    // 1.5 Fetch Center's specific custom pricing override (if any)
    const [centerConfigRows]: any = await db.query('SELECT custom_pricing_config FROM centers WHERE id = ?', [centerId]);
    if (centerConfigRows && centerConfigRows.length > 0 && centerConfigRows[0].custom_pricing_config) {
      try {
        const customConfigStr = centerConfigRows[0].custom_pricing_config;
        const customParsed = typeof customConfigStr === 'string' ? JSON.parse(customConfigStr) : customConfigStr;
        config = { ...config, ...customParsed };
      } catch { }
    }

    // 2. Count tests published this month by this center
    const [cntRows]: any = await db.query(
      'SELECT COUNT(*) as count FROM free_tests WHERE centerId = ? AND created_at >= DATE_FORMAT(NOW(), "%Y-%m-01 00:00:00")',
      [centerId]
    );
    const testsCreatedThisMonth = Number(cntRows[0]?.count) || 0;

    // 3. Get center details & current wallet balance
    const [centerRows]: any = await db.query('SELECT id, name, center_code, COALESCE(wallet_balance, 0) as wallet_balance FROM centers WHERE id = ?', [centerId]);
    const walletBalance = Number(centerRows[0]?.wallet_balance) || 0;

    const monthlyFreeLimit = Math.max(0, Number(config.monthly_free_limit) ?? 2);
    const chargePerExtra = Math.max(0, Number(config.charge_per_extra_test) ?? 50);
    const isFreeAvailable = testsCreatedThisMonth < monthlyFreeLimit;
    const remainingFreeTests = Math.max(0, monthlyFreeLimit - testsCreatedThisMonth);
    const requiresCharge = Boolean(config.enabled) && !isFreeAvailable && chargePerExtra > 0;
    const hasSufficientBalance = walletBalance >= chargePerExtra;

    const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return {
      center_id: Number(centerId),
      current_month: currentMonth,
      monthly_free_limit: monthlyFreeLimit,
      charge_per_extra_test: chargePerExtra,
      pricing_enabled: Boolean(config.enabled),
      allow_wallet_deduction: Boolean(config.allow_wallet_deduction),
      tests_created_this_month: testsCreatedThisMonth,
      remaining_free_tests: remainingFreeTests,
      free_tests_remaining: remainingFreeTests,
      free_students_per_test: Number(config.free_students_per_test) || 50,
      charge_per_extra_student: Number(config.charge_per_extra_student) || 5,
      is_free_available: isFreeAvailable,
      requires_charge: requiresCharge,
      wallet_balance: walletBalance,
      has_sufficient_balance: hasSufficientBalance,
      center_name: centerRows[0]?.name || 'Center',
      center_code: centerRows[0]?.center_code || ''
    };
  },

  createFreeTest: async (centerId: string | number, titleOrData: any, description?: string) => {
    const isObject = typeof titleOrData === 'object' && titleOrData !== null;
    const title = isObject ? titleOrData.title : titleOrData;
    const desc = isObject ? (titleOrData.description || '') : (description || '');
    const duration = isObject ? (Number(titleOrData.duration_minutes) || 30) : 30;
    const autoSubmit = isObject ? (titleOrData.auto_submit !== undefined ? titleOrData.auto_submit : 1) : 1;
    const passMarks = isObject ? (Number(titleOrData.pass_marks) || 40) : 40;
    const totalMarks = isObject ? (Number(titleOrData.total_marks) || 100) : 100;
    const category = isObject ? (titleOrData.category || 'General') : 'General';
    const uid = `TEST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check quota and deduct if required upon CREATION
    const quota = await centerService.getCenterOnlineTestQuota(centerId);

    let chargeApplied = 0;
    if (quota.requires_charge) {
      if (!quota.has_sufficient_balance) {
        throw new Error(
          `Monthly free limit of ${quota.monthly_free_limit} tests has been reached. Creating this test requires ₹${quota.charge_per_extra_test}, but your Center Wallet balance is ₹${quota.wallet_balance}. Please recharge your wallet.`
        );
      }

      chargeApplied = quota.charge_per_extra_test;
      // Deduct charge from Center Wallet
      await db.query('UPDATE centers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?', [chargeApplied, centerId]);

      // Record transaction
      const txnDesc = `Fee for creating Online Test "${title}" (Paid Test #${quota.tests_created_this_month + 1}, beyond monthly limit of ${quota.monthly_free_limit})`;
      await db.query(
        'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, "debit", ?)',
        [centerId, chargeApplied, txnDesc]
      );
    }

    // Ensure columns exist
    try {
      await db.query('ALTER TABLE free_tests ADD COLUMN expires_at DATETIME DEFAULT NULL');
    } catch (_) { }
    try {
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
    } catch (_) { }

    const [result]: any = await db.query(
      'INSERT INTO free_tests (centerId, title, description, duration_minutes, auto_submit, pass_marks, total_marks, category, test_uid, is_published, status, has_been_published, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, "draft", 1, DATE_ADD(NOW(), INTERVAL 72 HOUR))',
      [centerId, title, desc, duration, autoSubmit, passMarks, totalMarks, category, uid]
    );

    const [updatedCenter]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);

    return {
      insertId: result.insertId,
      test_uid: uid,
      charge_applied: chargeApplied,
      is_free: chargeApplied === 0,
      remaining_balance: updatedCenter[0]?.wallet_balance || 0,
      tests_created_this_month: quota.tests_created_this_month + 1,
      monthly_free_limit: quota.monthly_free_limit
    };
  },

  getFreeTests: async (centerId: string | number) => {
    // Ensure migrations
    try {
      await db.query('ALTER TABLE free_tests ADD COLUMN expires_at DATETIME DEFAULT NULL');
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
      // Backfill expires_at for existing tests to 72 hours after their creation date
      await db.query('UPDATE free_tests SET expires_at = DATE_ADD(created_at, INTERVAL 72 HOUR) WHERE expires_at IS NULL AND created_at IS NOT NULL');
    } catch (_) { }

    // 1. Auto-expire / soft-delete any active tests whose 72-hour duration has passed
    try {
      await db.query(`
        UPDATE free_tests 
        SET is_deleted = 1, status = 'expired', deleted_at = COALESCE(deleted_at, NOW())
        WHERE is_deleted = 0 
          AND (
            (expires_at IS NOT NULL AND expires_at < NOW())
            OR (created_at < DATE_SUB(NOW(), INTERVAL 72 HOUR))
          )
      `);
    } catch (_) { }

    // 2. Permanently auto-delete tests that have been expired / deleted for more than 72 hours
    try {
      const [oldDeletedRows]: any = await db.query(`
        SELECT id FROM free_tests 
        WHERE is_deleted = 1 
          AND (
            (deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 72 HOUR))
            OR (expires_at IS NOT NULL AND expires_at < DATE_SUB(NOW(), INTERVAL 72 HOUR))
          )
      `);
      if (oldDeletedRows && oldDeletedRows.length > 0) {
        for (const row of oldDeletedRows) {
          await db.query('DELETE FROM free_test_submissions WHERE test_id = ?', [row.id]);
          await db.query('DELETE FROM free_test_questions WHERE testId = ?', [row.id]);
          await db.query('DELETE FROM free_tests WHERE id = ?', [row.id]);
        }
      }
    } catch (_) { }

    const [rows] = await db.query(`
      SELECT ft.*, 
             COALESCE(ft.duration_minutes, 30) as duration_minutes,
             COALESCE(ft.auto_submit, 1) as auto_submit,
             COALESCE(ft.pass_marks, 40) as pass_marks,
             COALESCE(ft.total_marks, 100) as total_marks,
             COALESCE(ft.expires_at, DATE_ADD(ft.created_at, INTERVAL 72 HOUR)) as expires_at,
             TIMESTAMPDIFF(SECOND, NOW(), COALESCE(ft.expires_at, DATE_ADD(ft.created_at, INTERVAL 72 HOUR))) as remaining_seconds,
             IF(NOW() > COALESCE(ft.expires_at, DATE_ADD(ft.created_at, INTERVAL 72 HOUR)), 1, 0) as is_expired,
             TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(COALESCE(ft.deleted_at, ft.expires_at, ft.created_at), INTERVAL 72 HOUR)) as auto_delete_remaining_seconds,
             (SELECT COUNT(*) FROM free_test_questions ftq WHERE ftq.testId = ft.id) as questionCount,
             (SELECT COALESCE(SUM(ftq.marks), COUNT(*)) FROM free_test_questions ftq WHERE ftq.testId = ft.id) as totalQuestionMarks,
             (SELECT COUNT(*) FROM free_test_submissions fts WHERE fts.test_id = ft.id) as submissionCount,
             (SELECT COUNT(*) FROM free_test_submissions fts WHERE fts.test_id = ft.id) as testedCount,
             (SELECT COUNT(DISTINCT fts.ip_address) FROM free_test_submissions fts WHERE fts.test_id = ft.id AND fts.ip_address IS NOT NULL AND fts.ip_address != '') as uniqueDevicesCount
      FROM free_tests ft
      WHERE ft.centerId = ?
      ORDER BY ft.is_deleted ASC, ft.created_at DESC
    `, [centerId]);
    return rows;
  },

  deleteFreeTest: async (id: string | number) => {
    await db.query('UPDATE free_tests SET is_deleted = 1, status = "expired", deleted_at = NOW() WHERE id = ?', [id]);
  },

  permanentDeleteFreeTest: async (id: string | number) => {
    await db.query('DELETE FROM free_test_submissions WHERE test_id = ?', [id]);
    await db.query('DELETE FROM free_test_questions WHERE testId = ?', [id]);
    await db.query('DELETE FROM free_tests WHERE id = ?', [id]);
  },

  recoverFreeTest: async (id: string | number) => {
    const [rows]: any = await db.query('SELECT * FROM free_tests WHERE id = ?', [id]);
    if (!rows || rows.length === 0) throw new Error('Test not found');
    const test = rows[0];
    const centerId = test.centerId;

    // Check quota to ensure center does not exceed allowed limit without paying / checking limits
    const quota = await centerService.getCenterOnlineTestQuota(centerId);
    let chargeApplied = 0;

    if (quota.requires_charge) {
      if (!quota.has_sufficient_balance) {
        throw new Error(
          `Monthly free limit of ${quota.monthly_free_limit} tests has been reached. Recovering this test requires ₹${quota.charge_per_extra_test}, but your Center Wallet balance is ₹${quota.wallet_balance}. Please recharge your wallet.`
        );
      }

      chargeApplied = quota.charge_per_extra_test;
      // Deduct charge from Center Wallet
      await db.query('UPDATE centers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?', [chargeApplied, centerId]);

      // Record transaction
      const txnDesc = `Fee for recovering Online Test "${test.title}" (Paid Test #${quota.tests_created_this_month + 1}, beyond monthly limit of ${quota.monthly_free_limit})`;
      await db.query(
        'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, "debit", ?)',
        [centerId, chargeApplied, txnDesc]
      );
    }

    // Recover test: count as 1 for current month by resetting created_at to NOW() and renewing 72-hour lifetime
    await db.query(`
      UPDATE free_tests 
      SET is_deleted = 0, 
          deleted_at = NULL, 
          status = 'draft', 
          created_at = NOW(), 
          expires_at = DATE_ADD(NOW(), INTERVAL 72 HOUR) 
      WHERE id = ?
    `, [id]);

    const [updatedCenter]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);

    return {
      charge_applied: chargeApplied,
      is_free: chargeApplied === 0,
      remaining_balance: updatedCenter[0]?.wallet_balance || 0
    };
  },

  togglePublishFreeTest: async (id: string | number) => {
    const [rows]: any = await db.query('SELECT * FROM free_tests WHERE id = ?', [id]);
    if (!rows || rows.length === 0) throw new Error('Test not found');
    const test = rows[0];
    const current = Number(test.is_published) === 1;
    const newPublished = current ? 0 : 1;
    const newStatus = newPublished ? 'published' : 'draft';
    let uid = test.test_uid;
    if (!uid) {
      uid = `TEST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    await db.query('UPDATE free_tests SET is_published = ?, status = ?, test_uid = ? WHERE id = ?', [newPublished, newStatus, uid, id]);
    return { is_published: newPublished, status: newStatus, test_uid: uid };
  },

  updatePublishSettings: async (id: string | number, settings: { is_published?: number; duration_minutes?: number; auto_submit?: number; pass_marks?: number; total_marks?: number; student_limit?: number }) => {
    const [rows]: any = await db.query('SELECT * FROM free_tests WHERE id = ?', [id]);
    if (!rows || rows.length === 0) throw new Error('Test not found');
    const test = rows[0];
    let uid = test.test_uid;
    if (!uid) {
      uid = `TEST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const isPub = settings.is_published !== undefined ? Number(settings.is_published) : (test.is_published ? 1 : 0);
    const duration = settings.duration_minutes !== undefined ? Number(settings.duration_minutes) : (test.duration_minutes || 30);
    const autoSubmit = settings.auto_submit !== undefined ? Number(settings.auto_submit) : (test.auto_submit !== undefined ? test.auto_submit : 1);
    const passMarks = settings.pass_marks !== undefined ? Number(settings.pass_marks) : (test.pass_marks || 40);
    const totalMarks = settings.total_marks !== undefined ? Number(settings.total_marks) : (test.total_marks || 100);

    // Config and fee calculation
    const [configRows]: any = await db.query('SELECT value FROM settings WHERE key_name = "online_test_pricing_config" LIMIT 1');
    let config = { free_students_per_test: 50, charge_per_extra_student: 5, enabled: true };
    if (configRows && configRows.length > 0) {
      try { config = { ...config, ...JSON.parse(configRows[0].value) }; } catch { }
    }
    const baseLimit = Number(config.free_students_per_test) || 50;
    const studentLimit = settings.student_limit !== undefined ? Number(settings.student_limit) : (test.student_limit || baseLimit);

    // FIRST TIME PUBLISH: Check test limit quota
    if (isPub === 1 && !test.has_been_published) {
      const quota = await centerService.getCenterOnlineTestQuota(test.centerId);

      if (quota.requires_charge) {
        if (!quota.has_sufficient_balance) {
          throw new Error(
            `Monthly free limit of ${quota.monthly_free_limit} tests has been reached. Publishing this test requires ₹${quota.charge_per_extra_test}, but your Center Wallet balance is ₹${quota.wallet_balance}. Please recharge your wallet.`
          );
        }

        // Deduct charge from Center Wallet
        await db.query('UPDATE centers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?', [quota.charge_per_extra_test, test.centerId]);

        // Record transaction
        const txnDesc = `Fee for publishing Online Test "${test.title}" (Paid Test #${quota.tests_created_this_month + 1}, beyond monthly free limit of ${quota.monthly_free_limit})`;
        await db.query(
          'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, "debit", ?)',
          [test.centerId, quota.charge_per_extra_test, txnDesc]
        );
      }

      // Mark as officially published so it isn't charged again
      await db.query('UPDATE free_tests SET has_been_published = 1 WHERE id = ?', [id]);
    }

    if (isPub === 1 && studentLimit > test.student_limit && config.enabled && config.charge_per_extra_student > 0) {
      const extraStudentsToCharge = studentLimit - Math.max(test.student_limit || baseLimit, baseLimit);
      if (extraStudentsToCharge > 0) {
        const requiredFee = extraStudentsToCharge * config.charge_per_extra_student;

        const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [test.centerId]);
        const walletBalance = Number(centerRows[0]?.wallet_balance) || 0;

        if (walletBalance < requiredFee) {
          throw new Error(`Insufficient wallet balance. You need ₹${requiredFee} to increase the candidate limit by ${extraStudentsToCharge} students. Current balance: ₹${walletBalance}.`);
        }

        await db.query('UPDATE centers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?', [requiredFee, test.centerId]);

        const txnDesc = `Fee for extending candidate limit on test "${test.title}" (+${extraStudentsToCharge} candidates)`;
        await db.query(
          'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, "debit", ?)',
          [test.centerId, requiredFee, txnDesc]
        );
      }
    }

    const status = isPub === 1 ? 'published' : 'draft';

    await db.query(
      'UPDATE free_tests SET is_published = ?, status = ?, duration_minutes = ?, auto_submit = ?, pass_marks = ?, total_marks = ?, test_uid = ?, student_limit = ? WHERE id = ?',
      [isPub, status, duration, autoSubmit, passMarks, totalMarks, uid, studentLimit, id]
    );
    return { is_published: isPub, status, test_uid: uid, duration_minutes: duration, auto_submit: autoSubmit, pass_marks: passMarks, total_marks: totalMarks, student_limit: studentLimit };
  },

  getFreeTestSubmissions: async (testId: string | number) => {
    const [rows]: any = await db.query(`
      SELECT fts.*, ft.title as testTitle, ft.category as testCategory, ft.pass_marks as testPassMarks, ft.total_marks as testTotalMarks, ft.duration_minutes as testDuration,
             c.name as centerName, c.center_code as centerCode
      FROM free_test_submissions fts
      JOIN free_tests ft ON fts.test_id = ft.id
      LEFT JOIN centers c ON ft.centerId = c.id
      WHERE fts.test_id = ?
      ORDER BY fts.submitted_at DESC
    `, [testId]);
    return rows;
  },

  getCenterAllTestSubmissions: async (centerId: string | number) => {
    const [rows]: any = await db.query(`
      SELECT fts.*, ft.title as testTitle, ft.category as testCategory, ft.pass_marks as testPassMarks, ft.total_marks as testTotalMarks, ft.duration_minutes as testDuration,
             c.name as centerName, c.center_code as centerCode
      FROM free_test_submissions fts
      JOIN free_tests ft ON fts.test_id = ft.id
      LEFT JOIN centers c ON ft.centerId = c.id
      WHERE ft.centerId = ? OR fts.center_id = ?
      ORDER BY fts.submitted_at DESC
    `, [centerId, centerId]);
    return rows;
  },

  getFreeTestQuestions: async (testId: string | number) => {
    try {
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
    } catch (_) { }
    const [rows] = await db.query('SELECT id, testId, question, optA, optB, optC, optD, correct, COALESCE(marks, 1) as marks, created_at FROM free_test_questions WHERE testId = ? ORDER BY id ASC', [testId]);
    return rows;
  },

  addFreeTestQuestion: async (
    testId: string | number,
    question: string,
    optA: string,
    optB: string,
    optC: string,
    optD: string,
    correct: string,
    marks: number = 1
  ) => {
    try {
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
    } catch (_) { }
    const qMarks = Number(marks) > 0 ? Number(marks) : 1;
    const [result]: any = await db.query(
      'INSERT INTO free_test_questions (testId, question, optA, optB, optC, optD, correct, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [testId, question, optA, optB, optC, optD, correct, qMarks]
    );
    return result.insertId;
  },

  bulkAddFreeTestQuestions: async (testId: string | number, questions: any[]) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions array is required');
    }

    try {
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
    } catch (_) { }

    const insertedIds: number[] = [];

    for (const q of questions) {
      const questionText = q.question || q.question_text || '';
      let optA = q.optA || q.optionA || q.option_a || '';
      let optB = q.optB || q.optionB || q.option_b || '';
      let optC = q.optC || q.optionC || q.option_c || '';
      let optD = q.optD || q.optionD || q.option_d || '';
      let correct = String(q.correct || q.correctOption || q.correct_option || 'A').trim().toUpperCase();

      if (Array.isArray(q.options)) {
        for (let i = 0; i < q.options.length; i++) {
          const opt = q.options[i];
          const text = typeof opt === 'string' ? opt : (opt.option_text || opt.text || '');
          const isCorrect = typeof opt === 'object' && opt.is_correct;
          if (i === 0) {
            optA = text;
            if (isCorrect) correct = 'A';
          } else if (i === 1) {
            optB = text;
            if (isCorrect) correct = 'B';
          } else if (i === 2) {
            optC = text;
            if (isCorrect) correct = 'C';
          } else if (i === 3) {
            optD = text;
            if (isCorrect) correct = 'D';
          }
        }
      }

      const qMarks = Number(q.marks || q.questionMarks) > 0 ? Number(q.marks || q.questionMarks) : 1;

      const [result]: any = await db.query(
        'INSERT INTO free_test_questions (testId, question, optA, optB, optC, optD, correct, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [testId, questionText, optA, optB, optC, optD, correct, qMarks]
      );
      insertedIds.push(result.insertId);
    }

    return {
      success: true,
      importedCount: insertedIds.length,
      testId
    };
  },

  updateFreeTestQuestion: async (
    id: string | number,
    question: string,
    optA: string,
    optB: string,
    optC: string,
    optD: string,
    correct: string,
    marks: number = 1
  ) => {
    try {
      await db.query('ALTER TABLE free_test_questions ADD COLUMN marks DECIMAL(5,2) DEFAULT 1.00');
    } catch (_) { }
    const qMarks = Number(marks) > 0 ? Number(marks) : 1;
    await db.query(
      'UPDATE free_test_questions SET question = ?, optA = ?, optB = ?, optC = ?, optD = ?, correct = ?, marks = ? WHERE id = ?',
      [question, optA, optB, optC, optD, correct, qMarks, id]
    );
  },

  deleteFreeTestQuestion: async (id: string | number) => {
    await db.query('DELETE FROM free_test_questions WHERE id = ?', [id]);
  },

  // --- TRAINING VIDEOS ---
  getTrainingVideos: async () => {
    const [rows] = await db.query('SELECT * FROM training_videos ORDER BY created_at DESC');
    return rows;
  },

  addTrainingVideo: async (title: string, url: string, description?: string, duration?: string, thumbnail?: string) => {
    const [result]: any = await db.query(
      'INSERT INTO training_videos (title, url, description, duration, thumbnail) VALUES (?, ?, ?, ?, ?)',
      [title, url, description || '', duration || '', thumbnail || '']
    );
    return result.insertId;
  },

  deleteTrainingVideo: async (id: string | number) => {
    await db.query('DELETE FROM training_videos WHERE id = ?', [id]);
  },

  // --- Student Marks ---
  getStudentMarks: async (studentId: string | number) => {
    const [rows] = await db.query('SELECT id, semester, written_marks, viva_marks, status, reattempts, is_marksheet_generated, is_published_to_student, dues_cleared, hold_reason, DATE_FORMAT(exam_date, "%Y-%m-%d") as exam_date FROM student_marks WHERE studentId = ?', [studentId]);
    return rows;
  },

  saveStudentMarks: async (studentId: string | number, marks: any[], centerId: string | number, isDateChangeCharge: boolean = false) => {
    if (isDateChangeCharge) {
      const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
      if (!centerRows || centerRows.length === 0) throw new Error('Center not found');

      const balance = Number(centerRows[0].wallet_balance);
      if (balance < 50) {
        throw new Error('Insufficient wallet balance. 50 tokens required to change the exam date.');
      }

      await db.query('UPDATE centers SET wallet_balance = wallet_balance - 50 WHERE id = ?', [centerId]);
      await db.query(
        'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, ?, ?)',
        [centerId, 50, 'debit', `Exam Date Change Fee for student ID: ${studentId}`]
      );
    }

    for (const mark of marks) {
      const written = Number(mark.written_marks) || 0;
      const viva = Number(mark.viva_marks) || 0;
      const isDone = written > 0 || viva > 0;

      await db.query(
        `INSERT INTO student_marks (studentId, semester, written_marks, viva_marks, exam_date, status) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            viva_marks = CASE 
              WHEN status = 'completed' THEN viva_marks
              ELSE VALUES(viva_marks)
            END, 
            exam_date = CASE 
              WHEN status = 'completed' THEN exam_date
              ELSE COALESCE(VALUES(exam_date), exam_date)
            END,
            written_marks = CASE 
              WHEN status = 'completed' THEN written_marks 
              ELSE VALUES(written_marks) 
            END,
            status = CASE 
              WHEN status = 'completed' THEN 'completed'
              WHEN VALUES(written_marks) > 0 OR VALUES(viva_marks) > 0 THEN 'completed'
              ELSE status 
            END`,
        [studentId, mark.semester, written, viva, mark.exam_date || null, isDone ? 'completed' : 'scheduled']
      );
    }
  },

  updateVivaMarks: async (markId: string | number, vivaMarks: number, studentId?: any, semester?: string) => {
    if (markId && !isNaN(Number(markId)) && Number(markId) > 0) {
      const [rows]: any = await db.query('SELECT id FROM student_marks WHERE id = ?', [markId]);
      if (rows && rows.length > 0) {
        await db.query(`
          UPDATE student_marks 
          SET viva_marks = ?
          WHERE id = ?
        `, [vivaMarks, markId]);
        return;
      }
    }
    if (studentId && semester) {
      await db.query(`
        INSERT INTO student_marks (studentId, semester, viva_marks, written_marks, status)
        VALUES (?, ?, ?, 0, 'scheduled')
        ON DUPLICATE KEY UPDATE viva_marks = VALUES(viva_marks)
      `, [studentId, semester, vivaMarks]);
    }
  },

  generateMarksheet: async (markId: string | number, studentId?: any, semester?: string, publishToStudent: boolean = true, duesCleared: boolean = true, holdReason: string = '') => {
    const isPub = publishToStudent ? 1 : 0;
    const isDues = duesCleared ? 1 : 0;
    const reason = isPub ? null : (holdReason?.trim() || 'Marksheet held pending dues clearance');
    if (markId && !isNaN(Number(markId)) && Number(markId) > 0) {
      const [rows]: any = await db.query('SELECT id FROM student_marks WHERE id = ?', [markId]);
      if (rows && rows.length > 0) {
        await db.query(`
          UPDATE student_marks 
          SET is_marksheet_generated = 1,
              is_published_to_student = ?,
              dues_cleared = ?,
              hold_reason = ?,
              status = 'completed'
          WHERE id = ?
        `, [isPub, isDues, reason, markId]);
        return;
      }
    }
    if (studentId && semester) {
      await db.query(`
        INSERT INTO student_marks (studentId, semester, is_marksheet_generated, is_published_to_student, dues_cleared, hold_reason, status)
        VALUES (?, ?, 1, ?, ?, ?, 'completed')
        ON DUPLICATE KEY UPDATE is_marksheet_generated = 1, is_published_to_student = ?, dues_cleared = ?, hold_reason = ?, status = 'completed'
      `, [studentId, semester, isPub, isDues, reason, isPub, isDues, reason]);
    }
  },

  toggleMarksheetPublish: async (markId: string | number, isPublished: boolean, duesCleared: boolean = true, holdReason: string = '', studentId?: any, semester?: string) => {
    const isPub = isPublished ? 1 : 0;
    const isDues = duesCleared ? 1 : 0;
    const reason = isPub ? null : (holdReason?.trim() || 'Marksheet held pending dues clearance');
    if (markId && !isNaN(Number(markId)) && Number(markId) > 0) {
      const [rows]: any = await db.query('SELECT id FROM student_marks WHERE id = ?', [markId]);
      if (rows && rows.length > 0) {
        await db.query(`
          UPDATE student_marks 
          SET is_published_to_student = ?,
              dues_cleared = ?,
              hold_reason = ?
          WHERE id = ?
        `, [isPub, isDues, reason, markId]);
        return { isPublished: isPub === 1, duesCleared: isDues === 1, holdReason: reason };
      }
    }
    if (studentId && semester) {
      await db.query(`
        INSERT INTO student_marks (studentId, semester, is_marksheet_generated, is_published_to_student, dues_cleared, hold_reason, status)
        VALUES (?, ?, 1, ?, ?, ?, 'completed')
        ON DUPLICATE KEY UPDATE is_published_to_student = ?, dues_cleared = ?, hold_reason = ?
      `, [studentId, semester, isPub, isDues, reason, isPub, isDues, reason]);
      return { isPublished: isPub === 1, duesCleared: isDues === 1, holdReason: reason };
    }
  },

  getSettedExams: async (centerId: any) => {
    let cid: number | null = null;
    if (centerId && centerId !== 'undefined' && centerId !== 'null' && centerId !== 'all') {
      try {
        const [cRows]: any = await db.query('SELECT id FROM centers WHERE id = ? OR center_code = ?', [centerId, centerId]);
        if (cRows && cRows.length > 0) {
          cid = Number(cRows[0].id);
        } else {
          const parsed = Number(centerId);
          if (!isNaN(parsed) && parsed > 0) cid = parsed;
        }
      } catch (_) {
        const parsed = Number(centerId);
        if (!isNaN(parsed) && parsed > 0) cid = parsed;
      }
    }

    // 1. Fetch Global Instant Certificate Config
    let globalAllowed = true;
    let globalCharge = 200;
    try {
      const [globalRows]: any = await db.query('SELECT value FROM settings WHERE key_name = "online_test_pricing_config"');
      if (globalRows && globalRows.length > 0 && globalRows[0].value) {
        const gConfig = typeof globalRows[0].value === 'string' ? JSON.parse(globalRows[0].value) : globalRows[0].value;
        if (gConfig.allow_instant_certificate !== undefined) globalAllowed = Boolean(gConfig.allow_instant_certificate);
        if (gConfig.instant_certificate_charge !== undefined) globalCharge = Number(gConfig.instant_certificate_charge) || 200;
      }
    } catch (_) { }

    // 2. Fetch all active enrolled students for the center (or all active if cid is null)
    const [students]: any = await db.query(
      `SELECT s.id as studentId, s.firstName, s.lastName, s.father_name, s.mother_name, s.photo_url, s.enrollment_no, s.roll_no, s.duration, s.session_start, s.session_end, s.certificate_status, s.certificate_number, s.academic_status, s.centerId,
              c.id as courseId, c.name as courseName, c.code as courseCode, c.semesters as courseSemesters, c.duration as courseDuration,
              cntr.name as centerName, cntr.center_code as centerCode, cntr.address as centerAddress, cntr.city as centerCity, cntr.state as centerState,
              cntr.signature_url as centerSignatureUrl, cntr.stamp_url as centerStampUrl, cntr.head_name as centerHeadName, cntr.logo_url as centerLogo,
              cntr.custom_pricing_config as centerCustomPricingConfig
       FROM students s
       LEFT JOIN courses c ON s.courseId = c.id
       LEFT JOIN centers cntr ON s.centerId = cntr.id
       WHERE (? IS NULL OR s.centerId = ?) AND s.status != 'cancelled'
       ORDER BY s.id DESC`,
      [cid, cid]
    );

    if (!students || students.length === 0) return [];

    // 3. Fetch all student_marks for these students
    const studentIds = students.map((s: any) => s.studentId);
    const [allMarks]: any = await db.query(
      `SELECT id, studentId, semester, written_marks, viva_marks, exam_date, status, reattempts, is_marksheet_generated,
              is_published_to_student, dues_cleared, hold_reason, total_questions, correct_answers, wrong_answers
       FROM student_marks
       WHERE studentId IN (?)
       ORDER BY id ASC`,
      [studentIds]
    );

    // 4. Group marks by studentId
    const marksByStudent: Record<number, any[]> = {};
    for (const m of allMarks) {
      if (!marksByStudent[m.studentId]) marksByStudent[m.studentId] = [];
      marksByStudent[m.studentId].push(m);
    }

    // 5. Attach marks array & resolved instant certificate permissions to each student
    const result = students.map((st: any) => {
      let isInstantAllowed = globalAllowed;
      let instantCharge = globalCharge;

      if (st.centerCustomPricingConfig) {
        try {
          const custom = typeof st.centerCustomPricingConfig === 'string'
            ? JSON.parse(st.centerCustomPricingConfig)
            : st.centerCustomPricingConfig;
          if (custom.allow_instant_certificate !== undefined) {
            isInstantAllowed = Boolean(custom.allow_instant_certificate);
          }
          if (custom.instant_certificate_charge !== undefined) {
            instantCharge = Number(custom.instant_certificate_charge) || globalCharge;
          }
        } catch (_) { }
      }

      return {
        ...st,
        allow_instant_certificate: isInstantAllowed,
        instant_certificate_charge: instantCharge,
        marks: marksByStudent[st.studentId] || []
      };
    });

    return result;
  },

  resetExam: async (markId: string | number, studentId?: any, semester?: string, centerId?: string | number) => {
    let markRecord: any = null;

    if (markId && !isNaN(Number(markId)) && Number(markId) > 0) {
      const [rows]: any = await db.query(
        `SELECT sm.*, s.centerId as studentCenterId, s.firstName, s.lastName 
         FROM student_marks sm 
         JOIN students s ON sm.studentId = s.id 
         WHERE sm.id = ?`,
        [markId]
      );
      if (rows && rows.length > 0) {
        markRecord = rows[0];
      }
    }

    if (!markRecord && studentId && semester) {
      const [rows]: any = await db.query(
        `SELECT sm.*, s.centerId as studentCenterId, s.firstName, s.lastName 
         FROM student_marks sm 
         JOIN students s ON sm.studentId = s.id 
         WHERE sm.studentId = ? AND sm.semester = ?`,
        [studentId, semester]
      );
      if (rows && rows.length > 0) {
        markRecord = rows[0];
      }
    }

    if (markRecord) {
      if (Number(markRecord.is_marksheet_generated) === 1) {
        throw new Error('Exam is locked because the marksheet has already been generated. Re-exam reset is not permitted.');
      }

      const effectiveCenterId = centerId || markRecord.studentCenterId;
      const currentReattempts = Number(markRecord.reattempts) || 0;
      const isPaid = currentReattempts >= 2;
      let chargeAmount = 0;

      if (isPaid) {
        chargeAmount = 100;
        if (!effectiveCenterId) {
          throw new Error('Center ID is required to process token deduction for paid reset.');
        }

        const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [effectiveCenterId]);
        if (!centerRows || centerRows.length === 0) {
          throw new Error('Center not found.');
        }

        const balance = Number(centerRows[0].wallet_balance) || 0;
        if (balance < 100) {
          throw new Error(`Insufficient wallet balance. 100 tokens required for Re-Exam reset (First 2 resets were free). Your balance: ${balance} tokens.`);
        }

        // Deduct 100 tokens
        await db.query('UPDATE centers SET wallet_balance = wallet_balance - 100 WHERE id = ?', [effectiveCenterId]);
        await db.query(
          'INSERT INTO wallet_transactions (centerId, amount, type, description) VALUES (?, ?, ?, ?)',
          [
            effectiveCenterId,
            100,
            'debit',
            `Re-Exam Reset Fee (Reset #${currentReattempts + 1}) for student: ${markRecord.firstName || 'Student'} ${markRecord.lastName || ''} (${markRecord.semester})`
          ]
        );
      }

      // Reset exam status to scheduled, clear previous written marks and responses (preserving viva_marks), and increment reattempts
      await db.query(`
        UPDATE student_marks 
        SET status = 'scheduled', 
            written_marks = 0, 
            responses_json = NULL,
            total_questions = 0,
            correct_answers = 0,
            wrong_answers = 0,
            reattempts = COALESCE(reattempts, 0) + 1,
            exam_date = COALESCE(exam_date, CURDATE())
        WHERE id = ?
      `, [markRecord.id]);

      return {
        success: true,
        charged: chargeAmount,
        reattempts: currentReattempts + 1,
        message: isPaid
          ? `Exam reset successfully. 100 tokens deducted for Reset #${currentReattempts + 1}.`
          : `Exam reset successfully (Free reset #${currentReattempts + 1} of 2).`
      };
    } else if (studentId && semester) {
      await db.query(`
        INSERT INTO student_marks (studentId, semester, status, written_marks, viva_marks, reattempts, exam_date)
        VALUES (?, ?, 'scheduled', 0, 0, 1, CURDATE())
        ON DUPLICATE KEY UPDATE 
          status = 'scheduled', 
          written_marks = 0, 
          responses_json = NULL,
          total_questions = 0,
          correct_answers = 0,
          wrong_answers = 0,
          reattempts = COALESCE(reattempts, 0) + 1,
          exam_date = COALESCE(exam_date, CURDATE())
      `, [studentId, semester]);

      return {
        success: true,
        charged: 0,
        reattempts: 1,
        message: 'Exam reset successfully (Free reset #1 of 2).'
      };
    } else {
      throw new Error('Exam record not found to reset.');
    }
  },

  getCenterSignatureAndStamp: async (centerId: string | number) => {
    const [rows]: any = await db.query(
      'SELECT id, name, center_code, head_name, signature_url, stamp_url, address, city, state, pincode, phone, email, logo_url FROM centers WHERE id = ?',
      [centerId]
    );
    return rows[0] || null;
  },

  updateCenterSignatureAndStamp: async (centerId: string | number, data: { signature_url?: string; stamp_url?: string; head_name?: string }) => {
    let signatureUrl = data.signature_url;
    let stampUrl = data.stamp_url;

    if (signatureUrl && signatureUrl.startsWith('data:image/')) {
      signatureUrl = saveBase64File(signatureUrl, `center-sig-${centerId}`, 'branding');
    }
    if (stampUrl && stampUrl.startsWith('data:image/')) {
      stampUrl = saveBase64File(stampUrl, `center-stamp-${centerId}`, 'branding');
    }

    await db.query(`
      UPDATE centers 
      SET signature_url = COALESCE(?, signature_url),
          stamp_url = COALESCE(?, stamp_url),
          head_name = COALESCE(?, head_name)
      WHERE id = ?
    `, [signatureUrl || null, stampUrl || null, data.head_name || null, centerId]);

    return {
      signature_url: signatureUrl,
      stamp_url: stampUrl,
      head_name: data.head_name
    };
  }
};



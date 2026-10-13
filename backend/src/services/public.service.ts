import db from '../db';
import { saveBase64File } from '../utils/fileStorage';
import { realtimeService } from './realtime.service';

export const publicService = {
  getCourses: async () => {
    const [rows] = await db.query('SELECT * FROM courses WHERE is_published = 1 AND (is_draft = 0 OR is_draft IS NULL)');
    return rows;
  },

  getGallery: async (limit: number, offset: number) => {
    const [rows] = await db.query('SELECT * FROM gallery ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
  },

  getPublicStats: async () => {
    const [centersCount]: any = await db.query('SELECT COUNT(*) as count FROM centers');
    const [studentsCount]: any = await db.query('SELECT COUNT(*) as count FROM students');
    const [coursesCount]: any = await db.query('SELECT COUNT(*) as count FROM courses WHERE is_published = 1 AND (is_draft = 0 OR is_draft IS NULL)');
    const [certifiedCount]: any = await db.query('SELECT COUNT(DISTINCT studentId) as count FROM student_marks WHERE is_marksheet_generated = 1');
    const [passStats]: any = await db.query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' AND (COALESCE(written_marks, 0) + COALESCE(viva_marks, 0)) >= 40 THEN 1 ELSE 0 END) as passed FROM student_marks WHERE status = 'completed'");
    
    const [recentCenters]: any = await db.query(`
      SELECT 
        COALESCE(center_code, CONCAT('EXAMc2026-', LPAD(id, 3, '0'))) as code,
        name,
        state,
        city,
        DATE_FORMAT(COALESCE(joined_date, created_at), '%d-%m-%Y') as joinedDate
      FROM centers
      WHERE status = 'active' OR status IS NULL
      ORDER BY id DESC
      LIMIT 20
    `);

    const rawCenters = Number(centersCount[0]?.count) || 0;
    const rawStudents = Number(studentsCount[0]?.count) || 0;
    const rawCourses = Number(coursesCount[0]?.count) || 0;
    const rawCertified = Number(certifiedCount[0]?.count) || 0;

    const totalExams = Number(passStats[0]?.total) || 0;
    const passedExams = Number(passStats[0]?.passed) || 0;
    const successRate = totalExams > 0 ? `${Math.round((passedExams / totalExams) * 100)}%` : '98%';

    return {
      centersCount: rawCenters,
      studentsCount: rawStudents,
      coursesCount: rawCourses,
      certifiedStudentsCount: rawCertified > 0 ? rawCertified : rawStudents,
      successRate,
      recentCenters: recentCenters || []
    };
  },


  getPublicCenters: async () => {
    // 1. Fetch authorized branch centers
    const [centers]: any = await db.query(`
      SELECT 
        id,
        COALESCE(center_code, CONCAT('EXAMc2026-', LPAD(id, 3, '0'))) as code,
        COALESCE(head_name, 'Center Director') as headName,
        COALESCE(head_image_url, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300') as headImageUrl,
        COALESCE(DATE_FORMAT(joined_date, '%d-%m-%Y'), DATE_FORMAT(created_at, '%d-%m-%Y')) as joinedDate,
        COALESCE(name, 'Examirror Authorized Study Center') as instituteName,
        COALESCE(address, 'Main Road') as address,
        COALESCE(address_line2, '') as addressLine2,
        COALESCE(state, 'Delhi') as state,
        COALESCE(district, 'New Delhi') as district,
        COALESCE(city, 'New Delhi') as city
      FROM centers
      WHERE status = 'active' OR status IS NULL
      ORDER BY id ASC
    `);

    // 2. Also append any approved or registered franchise applications
    try {
      const [franchises]: any = await db.query(`
        SELECT 
          id + 1000 as id,
          CONCAT('EXAMc', DATE_FORMAT(created_at, '%Y'), '-', LPAD(id, 3, '0')) as code,
          CONCAT(center_head_first_name, ' ', COALESCE(center_head_last_name, '')) as headName,
          COALESCE(photo_url, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300') as headImageUrl,
          DATE_FORMAT(created_at, '%d-%m-%Y') as joinedDate,
          center_name as instituteName,
          address_line1 as address,
          COALESCE(address_line2, '') as addressLine2,
          state,
          district,
          CONCAT(city, IF(pincode != '', CONCAT('-', pincode), '')) as city
        FROM franchise_applications
        WHERE status = 'Pending'
        ORDER BY id DESC
      `);
      return [...centers, ...franchises];
    } catch {
      return centers;
    }
  },

  getSettings: async (key: string) => {
    const [rows]: any = await db.query('SELECT value FROM settings WHERE key_name = ? LIMIT 1', [key]);
    if (rows.length === 0) return null;
    try {
      return JSON.parse(rows[0].value);
    } catch {
      return rows[0].value; // fallback
    }
  },

  updateSettings: async (key: string, data: any) => {
    // Deeply traverse object/array to persist ANY base64 image strings to filesystem
    const processImagesDeep = (obj: any, prefix = 'content'): any => {
      if (!obj) return obj;
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image/')) {
          const savedUrl = saveBase64File(obj, prefix, 'branding');
          return savedUrl || obj;
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map((item, idx) => processImagesDeep(item, `${prefix}-${idx}`));
      }
      if (typeof obj === 'object') {
        const result: any = {};
        for (const k of Object.keys(obj)) {
          result[k] = processImagesDeep(obj[k], k);
        }
        return result;
      }
      return obj;
    };

    const processedData = processImagesDeep(data, key);
    const jsonString = JSON.stringify(processedData);
    await db.query(
      'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, jsonString, jsonString]
    );
    return processedData;
  },


  verifyStudent: async (identifier: string) => {
    const [rows]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.email, s.photo_url, s.enrollment_no, s.roll_no,
             s.student_type, s.academic_status, s.duration, s.dob, s.gender, s.father_name,
             s.mother_name, s.qualification, s.address, s.city, s.state, s.pincode,
             s.session_start, s.session_end, s.certificate_status, s.certificate_number,
             s.id_type, s.id_number, s.status, s.created_at,
             c.name as courseName, c.code as courseCode, c.shortDescription as courseDescription,
             cntr.name as centerName, cntr.center_code as centerCode, cntr.city as centerCity, cntr.state as centerState
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.enrollment_no = ? OR s.roll_no = ? OR CAST(s.id AS CHAR) = ? OR s.certificate_number = ?
      LIMIT 1
    `, [identifier, identifier, identifier, identifier]);
    if (!rows[0]) return null;

    try {
      const [marks]: any = await db.query(`
        SELECT id, semester, written_marks, viva_marks, status, is_marksheet_generated, DATE_FORMAT(exam_date, '%Y-%m-%d') as exam_date
        FROM student_marks
        WHERE studentId = ?
        ORDER BY id DESC
      `, [rows[0].id]);
      return { ...rows[0], marks: marks || [] };
    } catch {
      return rows[0];
    }
  },

  verifyCertificate: async (identifier: string) => {
    const [rows]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.email, s.photo_url, s.enrollment_no, s.roll_no,
             s.student_type, s.academic_status, s.duration, s.dob, s.gender, s.father_name,
             s.mother_name, s.session_start, s.session_end, s.certificate_status, s.certificate_number,
             s.status, s.created_at,
             c.name as courseName, c.code as courseCode, c.shortDescription as courseDescription,
             cntr.name as centerName, cntr.center_code as centerCode, cntr.city as centerCity, cntr.state as centerState
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.certificate_number = ? OR s.roll_no = ? OR s.enrollment_no = ? OR CAST(s.id AS CHAR) = ?
      LIMIT 1
    `, [identifier, identifier, identifier, identifier]);
    if (!rows[0]) return null;

    try {
      const [marks]: any = await db.query(`
        SELECT id, semester, written_marks, viva_marks, status, is_marksheet_generated, DATE_FORMAT(exam_date, '%Y-%m-%d') as exam_date
        FROM student_marks
        WHERE studentId = ?
        ORDER BY id DESC
      `, [rows[0].id]);
      return {
        ...rows[0],
        marks: marks || [],
        is_certified: rows[0].certificate_status === 'issued' || Boolean(rows[0].certificate_number) || (marks && marks.some((m: any) => m.is_marksheet_generated === 1))
      };
    } catch {
      return { ...rows[0], marks: [], is_certified: true };
    }
  },

  verifyCenter: async (identifier: string) => {
    const [rows]: any = await db.query(`
      SELECT id, name, center_code, city, state, address, phone, email, status, created_at
      FROM centers
      WHERE center_code = ? OR CAST(id AS CHAR) = ? OR name LIKE ?
      LIMIT 1
    `, [identifier, identifier, `%${identifier}%`]);
    return rows[0] || null;
  },

  submitFranchiseApplication: async (data: any) => {
    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS franchise_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        center_head_first_name VARCHAR(100) NOT NULL,
        center_head_middle_name VARCHAR(100),
        center_head_last_name VARCHAR(100) NOT NULL,
        father_first_name VARCHAR(100) NOT NULL,
        father_middle_name VARCHAR(100),
        father_last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150) NOT NULL,
        aadhar_number VARCHAR(30) NOT NULL,
        pan_number VARCHAR(30),
        dob VARCHAR(20),
        gender VARCHAR(20),
        marital_status VARCHAR(20),
        center_name VARCHAR(200) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        qualification VARCHAR(100) DEFAULT 'Graduate',
        photo_url TEXT,
        signature_url TEXT,
        marksheet_url TEXT,
        aadhar_front_url TEXT,
        aadhar_back_url TEXT,
        center_photos_url TEXT,
        status VARCHAR(30) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.query(`ALTER TABLE franchise_applications ADD COLUMN qualification VARCHAR(100) DEFAULT 'Graduate'`);
    } catch (_) {}

    if (data.dob) {
      const birthDate = new Date(data.dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new Error(`Applicant must be at least 18 years of age for Center Head registration (Provided age: ${age} years).`);
        }
      }
    }

    // Minimum qualification validation: Candidate must be at least Graduate
    if (data.qualification) {
      const qLower = String(data.qualification).toLowerCase();
      if (qLower.includes('matric') || qLower.includes('10th') || qLower.includes('12th') || qLower.includes('inter')) {
        throw new Error('Minimum eligibility requirement for Center Head registration is Graduation. Candidates with only Matric (10th) or Intermediate (12th) are not eligible.');
      }
    }

    // Strict Input Validations
    if (!data.phone || !/^[6-9]\d{9}$/.test(String(data.phone).trim())) {
      throw new Error('Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    }

    if (!data.aadhar_number || !/^\d{12}$/.test(String(data.aadhar_number).trim())) {
      throw new Error('Please provide a valid 12-digit Aadhaar number.');
    }

    if (data.pan_number && String(data.pan_number).trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(data.pan_number).trim().toUpperCase())) {
      throw new Error('Please provide a valid 10-character PAN number (e.g. ABCDE1234F).');
    }

    if (!data.pincode || !/^\d{6}$/.test(String(data.pincode).trim())) {
      throw new Error('Please provide a valid 6-digit postal Pincode.');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email).trim())) {
      throw new Error('Please provide a valid email address.');
    }

    let photoUrl = data.photo_url || '';
    if (photoUrl.startsWith('data:image/')) {
      photoUrl = saveBase64File(photoUrl, 'head-photo', 'franchise');
    }

    let signatureUrl = data.signature_url || '';
    if (signatureUrl.startsWith('data:image/')) {
      signatureUrl = saveBase64File(signatureUrl, 'head-sign', 'franchise');
    }

    let marksheetUrl = data.marksheet_url || '';
    if (marksheetUrl.startsWith('data:')) {
      marksheetUrl = saveBase64File(marksheetUrl, 'marksheet', 'franchise');
    }

    let aadharFrontUrl = data.aadhar_front_url || '';
    if (aadharFrontUrl.startsWith('data:')) {
      aadharFrontUrl = saveBase64File(aadharFrontUrl, 'aadhar-front', 'franchise');
    }

    let aadharBackUrl = data.aadhar_back_url || '';
    if (aadharBackUrl.startsWith('data:')) {
      aadharBackUrl = saveBase64File(aadharBackUrl, 'aadhar-back', 'franchise');
    }

    let finalCenterPhotosUrl = data.center_photos_url || '';
    if (typeof finalCenterPhotosUrl === 'string' && finalCenterPhotosUrl.startsWith('[')) {
      try {
        const parsed = JSON.parse(finalCenterPhotosUrl);
        if (Array.isArray(parsed)) {
          const savedList = parsed.map((item, idx) => {
            if (typeof item === 'string' && item.startsWith('data:')) {
              return saveBase64File(item, `center-infra-${idx + 1}`, 'franchise');
            }
            return item;
          });
          finalCenterPhotosUrl = JSON.stringify(savedList);
        }
      } catch (_) {}
    } else if (typeof finalCenterPhotosUrl === 'string' && finalCenterPhotosUrl.startsWith('data:')) {
      finalCenterPhotosUrl = saveBase64File(finalCenterPhotosUrl, 'center-infra', 'franchise');
    }

    const [res]: any = await db.query(
      `INSERT INTO franchise_applications (
        center_head_first_name, center_head_middle_name, center_head_last_name,
        father_first_name, father_middle_name, father_last_name,
        phone, email, aadhar_number, pan_number,
        dob, gender, marital_status, qualification,
        center_name, address_line1, address_line2, city, district, state, pincode,
        photo_url, signature_url, marksheet_url, aadhar_front_url, aadhar_back_url, center_photos_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.center_head_first_name || '',
        data.center_head_middle_name || '',
        data.center_head_last_name || '',
        data.father_first_name || '',
        data.father_middle_name || '',
        data.father_last_name || '',
        data.phone || '',
        data.email || '',
        data.aadhar_number || '',
        data.pan_number || '',
        data.dob || '',
        data.gender || '',
        data.marital_status || '',
        data.qualification || 'Graduate',
        data.center_name || '',
        data.address_line1 || '',
        data.address_line2 || '',
        data.city || '',
        data.district || '',
        data.state || '',
        data.pincode || '',
        photoUrl,
        signatureUrl,
        marksheetUrl,
        aadharFrontUrl,
        aadharBackUrl,
        finalCenterPhotosUrl
      ]
    );

    const newAppId = res.insertId;
    const applicantName = `${data.center_head_first_name || ''} ${data.center_head_last_name || ''}`.trim();
    const centerTitle = data.center_name || 'Authorized Study Centre';
    const locationStr = [data.city, data.state].filter(Boolean).join(', ');

    // Push real-time notification to Super Admin instantly without refresh
    realtimeService.notifyAdmin(
      'New Franchise Application Received',
      `New application submitted by <strong>${applicantName}</strong> for <strong>${centerTitle}</strong>${locationStr ? ` (${locationStr})` : ''}.`,
      'franchise_new',
      {
        id: newAppId,
        centerName: centerTitle,
        applicantName,
        phone: data.phone,
        email: data.email,
        city: data.city,
        state: data.state,
        createdAt: new Date().toISOString()
      }
    ).catch(err => console.error('[Realtime] Failed to notify admin of new franchise:', err));

    return { id: newAppId, ...data };
  },

  submitContactQuery: async (data: any) => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS contact_queries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(150),
        inquiry_type VARCHAR(100) DEFAULT 'Course Admission',
        course VARCHAR(150),
        message TEXT,
        status VARCHAR(30) DEFAULT 'Pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const phone = String(data.phone || '').trim();
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      throw new Error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
    }

    const [res]: any = await db.query(
      `INSERT INTO contact_queries (full_name, phone, email, inquiry_type, course, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        data.fullName || data.full_name || '',
        data.phone || '',
        data.email || '',
        data.inquiryType || data.inquiry_type || 'Course Admission',
        data.course || '',
        data.message || ''
      ]
    );

    const senderName = data.fullName || data.full_name || 'Visitor';
    realtimeService.notifyAdmin(
      'New Public Inquiry Received',
      `Inquiry from <strong>${senderName}</strong> (${data.phone || 'No phone'}) regarding <em>${data.inquiryType || data.inquiry_type || 'General'}</em>.`,
      'contact_query',
      {
        id: res.insertId,
        fullName: senderName,
        phone: data.phone,
        email: data.email,
        inquiryType: data.inquiryType || data.inquiry_type
      }
    ).catch(err => console.error('[Realtime] Failed to notify admin of contact query:', err));

    return { id: res.insertId, ...data, status: 'Pending' };
  },

  // --- CANDIDATE ONLINE TEST PORTAL ---
  getPublicTestByUid: async (uid: string, clientIp?: string, userAgent?: string) => {
    const numId = isNaN(Number(uid)) ? -1 : Number(uid);
    const [testRows]: any = await db.query(`
      SELECT ft.id, ft.title, ft.description, ft.test_uid, ft.duration_minutes, ft.auto_submit, 
             ft.pass_marks, ft.total_marks, ft.category, ft.is_published, ft.status, ft.student_limit,
             c.name as centerName, c.center_code as centerCode, c.phone as centerPhone, c.email as centerEmail, c.logo_url as centerLogo
      FROM free_tests ft
      LEFT JOIN centers c ON ft.centerId = c.id
      WHERE ft.test_uid = ? OR ft.id = ?
    `, [uid, numId]);

    if (!testRows || testRows.length === 0) {
      throw new Error('Test not found or invalid test link');
    }

    const test = testRows[0];

    // Ensure access log table and columns exist
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS free_test_access_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_id INT NOT NULL,
          test_uid VARCHAR(100),
          student_name VARCHAR(150),
          student_roll VARCHAR(100),
          student_mobile VARCHAR(50),
          student_email VARCHAR(150),
          ip_address VARCHAR(100),
          user_agent TEXT,
          device_type VARCHAR(50),
          status VARCHAR(50) DEFAULT 'opened',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_test_id (test_id),
          INDEX idx_ip (ip_address)
        )
      `);
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN ip_address VARCHAR(100) DEFAULT NULL');
    } catch (_) {}
    try {
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN user_agent TEXT DEFAULT NULL');
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN device_type VARCHAR(50) DEFAULT "Desktop"');
    } catch (_) {}
    
    // Detect Device Type
    const detectDevice = (ua: string = '') => {
      const low = ua.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(low)) return 'Tablet';
      if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(low)) return 'Mobile';
      return 'Desktop';
    };
    const deviceType = detectDevice(userAgent);

    // Log device access attempt asynchronously
    if (clientIp) {
      db.query(
        'INSERT INTO free_test_access_logs (test_id, test_uid, ip_address, user_agent, device_type, status) VALUES (?, ?, ?, ?, ?, "opened")',
        [test.id, test.test_uid, clientIp, userAgent || '', deviceType]
      ).catch(() => {});
    }

    const studentLimit = Number(test.student_limit) || 50;

    const [subRows]: any = await db.query('SELECT COUNT(*) as cnt FROM free_test_submissions WHERE test_id = ?', [test.id]);
    const submissionsCount = Number(subRows[0]?.cnt) || 0;

    const isExpired = Number(test.is_deleted) === 1 || test.status === 'expired' || (test.expires_at && new Date(test.expires_at).getTime() < Date.now()) || (test.created_at && new Date(test.created_at).getTime() + 48 * 3600 * 1000 < Date.now());
    const limitReached = submissionsCount >= studentLimit;
    const isPublished = !isExpired && Number(test.is_published) === 1 && test.status !== 'draft' && !limitReached;

    // Fetch questions WITHOUT the correct answer column for anti-cheat protection
    const [questions]: any = await db.query(`
      SELECT id, testId, question, optA, optB, optC, optD, COALESCE(marks, 1) as marks
      FROM free_test_questions
      WHERE testId = ?
      ORDER BY id ASC
    `, [test.id]);

    const totalQuestionMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0);
    const computedTotalMarks = totalQuestionMarks > 0 ? totalQuestionMarks : (Number(test.total_marks) || 100);

    return {
      is_active: isPublished,
      status: isExpired ? 'expired' : (test.status || (isPublished ? 'published' : 'deactivated')),
      deactivation_reason: isExpired
        ? 'This test link has expired after the 48-hour assessment validity window. Test submissions are no longer accepted.'
        : limitReached 
          ? 'The maximum candidate limit for this test has been reached.'
          : (!isPublished ? 'This online test link has not been published yet.' : null),
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        test_uid: test.test_uid,
        duration_minutes: Number(test.duration_minutes) || 30,
        auto_submit: Number(test.auto_submit) !== 0,
        pass_marks: Number(test.pass_marks) || 40,
        total_marks: computedTotalMarks,
        category: test.category || 'General',
        is_published: isPublished,
        is_expired: isExpired,
        expires_at: test.expires_at || (test.created_at ? new Date(new Date(test.created_at).getTime() + 48 * 3600 * 1000).toISOString() : null),
        status: isExpired ? 'expired' : (test.status || (isPublished ? 'published' : 'deactivated')),
        centerName: test.centerName || 'Authorized Examination Center',
        centerCode: test.centerCode || 'CENTRAL',
        centerPhone: test.centerPhone || '',
        totalQuestions: questions.length
      },
      questions: isPublished ? (questions || []) : []
    };
  },

  recordTestStart: async (uid: string, data: any, clientIp?: string, userAgent?: string) => {
    const numId = isNaN(Number(uid)) ? -1 : Number(uid);
    const [testRows]: any = await db.query('SELECT * FROM free_tests WHERE test_uid = ? OR id = ?', [uid, numId]);
    if (!testRows || testRows.length === 0) return;
    const test = testRows[0];

    const detectDevice = (ua: string = '') => {
      const low = ua.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(low)) return 'Tablet';
      if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(low)) return 'Mobile';
      return 'Desktop';
    };
    const deviceType = detectDevice(userAgent);

    await db.query(
      `INSERT INTO free_test_access_logs (
        test_id, test_uid, student_name, student_roll, student_mobile, student_email, ip_address, user_agent, device_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "started")`,
      [
        test.id,
        test.test_uid,
        data.student_name || '',
        data.student_roll || '',
        data.student_mobile || '',
        data.student_email || '',
        clientIp || '127.0.0.1',
        userAgent || '',
        deviceType
      ]
    );
  },

  submitPublicTest: async (uid: string, submissionData: {
    student_name: string;
    student_roll?: string;
    student_id_card?: string;
    student_mobile?: string;
    student_email?: string;
    time_taken_seconds?: number;
    is_cheating?: boolean;
    responses: { [questionId: string]: string };
  }, clientIp?: string, userAgent?: string) => {
    const numId = isNaN(Number(uid)) ? -1 : Number(uid);
    const [testRows]: any = await db.query('SELECT * FROM free_tests WHERE test_uid = ? OR id = ?', [uid, numId]);
    if (!testRows || testRows.length === 0) {
      throw new Error('Test not found');
    }
    const test = testRows[0];

    // Check 48-hour expiration
    const isExpired = Number(test.is_deleted) === 1 || test.status === 'expired' || (test.expires_at && new Date(test.expires_at).getTime() < Date.now()) || (test.created_at && new Date(test.created_at).getTime() + 48 * 3600 * 1000 < Date.now());
    if (isExpired) {
      throw new Error('This test link has expired after the 48-hour assessment validity window. Submissions are no longer accepted.');
    }

    // Verify test is still active & published
    if (Number(test.is_published) === 0 || test.status === 'draft') {
      throw new Error('This test link has not been published. Test submissions are no longer accepted.');
    }

    const testId = test.id;
    const centerId = test.centerId;
    const passMarks = Number(test.pass_marks) || 40;

    // Fetch all questions WITH correct answers and marks
    const [questions]: any = await db.query('SELECT id, testId, question, optA, optB, optC, optD, correct, COALESCE(marks, 1) as marks FROM free_test_questions WHERE testId = ? ORDER BY id ASC', [testId]);
    const totalQuestions = questions.length;

    if (totalQuestions === 0) {
      throw new Error('This test has no questions.');
    }

    const questionTotalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0);
    const totalMarks = questionTotalMarks > 0 ? questionTotalMarks : (Number(test.total_marks) || 100);

    let earnedScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionBreakdown = questions.map((q: any, idx: number) => {
      const candidateChoice = (submissionData.responses[String(q.id)] || '').toUpperCase();
      const isAnswered = Boolean(candidateChoice);
      const isCorrect = isAnswered && candidateChoice === String(q.correct).toUpperCase();
      const qMarks = Number(q.marks) || 1;

      if (!isAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
        earnedScore += qMarks;
      } else {
        wrongCount++;
      }

      return {
        questionNumber: idx + 1,
        questionId: q.id,
        question: q.question,
        optA: q.optA,
        optB: q.optB,
        optC: q.optC,
        optD: q.optD,
        correctAnswer: q.correct,
        candidateAnswer: candidateChoice || 'UNANSWERED',
        isCorrect,
        isAnswered,
        marks: qMarks
      };
    });

    const score = Number(earnedScore.toFixed(2));
    const percentage = Number(((score / totalMarks) * 100).toFixed(2));
    const isPassed = percentage >= passMarks;
    const status = isPassed ? 'PASSED' : 'FAILED';
    const timeTaken = Number(submissionData.time_taken_seconds) || 0;

    const detectDevice = (ua: string = '') => {
      const low = ua.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(low)) return 'Tablet';
      if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(low)) return 'Mobile';
      return 'Desktop';
    };
    const deviceType = detectDevice(userAgent);
    const ip = clientIp || '127.0.0.1';

    // Ensure columns exist
    try {
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN ip_address VARCHAR(100) DEFAULT NULL');
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN user_agent TEXT DEFAULT NULL');
      await db.query('ALTER TABLE free_test_submissions ADD COLUMN device_type VARCHAR(50) DEFAULT "Desktop"');
    } catch (_) {}

    const [insertResult]: any = await db.query(
      `INSERT INTO free_test_submissions (
        test_id, center_id, student_name, student_roll, student_id_card, student_mobile, student_email,
        score, total_marks, correct_count, wrong_count, unanswered_count, percentage,
        status, time_taken_seconds, is_cheating, responses_json, ip_address, user_agent, device_type, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        testId,
        centerId,
        submissionData.student_name || 'Candidate',
        submissionData.student_roll || '',
        submissionData.student_id_card || '',
        submissionData.student_mobile || '',
        submissionData.student_email || '',
        score,
        totalMarks,
        correctCount,
        wrongCount,
        unansweredCount,
        percentage,
        status,
        timeTaken,
        submissionData.is_cheating ? 1 : 0,
        JSON.stringify(questionBreakdown),
        ip,
        userAgent || '',
        deviceType
      ]
    );

    return {
      submissionId: insertResult.insertId,
      testTitle: test.title,
      candidate: {
        name: submissionData.student_name,
        roll: submissionData.student_roll,
        idCard: submissionData.student_id_card,
        mobile: submissionData.student_mobile,
        email: submissionData.student_email,
        ipAddress: ip,
        deviceType
      },
      score,
      totalMarks,
      correctCount,
      wrongCount,
      unansweredCount,
      totalQuestions,
      percentage,
      isPassed,
      status,
      timeTakenSeconds: timeTaken,
      isCheating: Boolean(submissionData.is_cheating),
      questionBreakdown,
      ipAddress: ip,
      deviceType,
      submittedAt: new Date().toISOString()
    };
  }
};


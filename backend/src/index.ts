import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import db from './db';
import studentRoutes from "./routes/student.routes";
import { initTestSeriesDatabase } from './utils/initTestSeriesDb';
import { isS3Configured, getS3ObjectStream, syncAllLocalUploadsToS3 } from './utils/s3Storage';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });

}

import { generalApiLimiter } from './middleware/rateLimiter';

// Security & Header Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://examirror.in',
  'https://www.examirror.in',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) or matched origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin image loading from /uploads
  crossOriginEmbedderPolicy: false
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' })); // Restricted from 50mb to 10mb for DoS prevention
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply general API rate limiter
app.use('/api', generalApiLimiter);

// Serve local assets and uploads statically with high-speed client & proxy caching (Zero-Cost Edge Cache)
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '30d',
  etag: true,
  lastModified: true
}));

// Fallback to S3 bucket if file does not exist on local disk
app.use('/uploads', async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  if (!isS3Configured) {
    return next();
  }

  const relativeSubpath = req.path.replace(/^\/+/, '');
  if (!relativeSubpath) {
    return next();
  }
  const s3Key = `uploads/${relativeSubpath}`;

  try {
    const s3Obj = await getS3ObjectStream(s3Key);
    if (!s3Obj) {
      return next();
    }

    res.setHeader('Content-Type', s3Obj.contentType);
    if (s3Obj.contentLength) {
      res.setHeader('Content-Length', s3Obj.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Cache locally in background so subsequent requests are served immediately
    const localCachedPath = path.join(uploadsDir, relativeSubpath);
    const localSubDir = path.dirname(localCachedPath);
    if (!fs.existsSync(localSubDir)) {
      fs.mkdirSync(localSubDir, { recursive: true });
    }

    const chunks: Buffer[] = [];
    s3Obj.stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    s3Obj.stream.on('end', () => {
      try {
        fs.writeFileSync(localCachedPath, Buffer.concat(chunks));
      } catch (_) {}
    });

    s3Obj.stream.pipe(res);
  } catch (err: any) {
    console.error(`[S3] Error streaming ${s3Key} from S3:`, err?.message || err);
    next();
  }
});

// Basic route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running without Prisma!' });
});

// Safe Database Schema Bootstrap
const initDbSchema = async () => {
  try {
    // Ensure centers table columns exist
    const centerColumns = [
      { name: 'head_name', type: "VARCHAR(150) DEFAULT 'Center Director'" },
      { name: 'head_image_url', type: "LONGTEXT" },
      { name: 'phone', type: "VARCHAR(30)" },
      { name: 'address', type: "VARCHAR(255) DEFAULT 'Main Road'" },
      { name: 'address_line2', type: "VARCHAR(255) DEFAULT ''" },
      { name: 'state', type: "VARCHAR(100) DEFAULT 'Delhi'" },
      { name: 'district', type: "VARCHAR(100) DEFAULT 'New Delhi'" },
      { name: 'city', type: "VARCHAR(100) DEFAULT 'New Delhi-110001'" },
      { name: 'pincode', type: "VARCHAR(20) DEFAULT '110001'" },
      { name: 'joined_date', type: "DATE" },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'active'" },
      { name: 'logo_url', type: "LONGTEXT" },
      { name: 'custom_pricing_config', type: "JSON" },
      { name: 'old_student_allowed_until', type: "DATETIME DEFAULT NULL" },
      { name: 'certificate_file_url', type: "LONGTEXT" },
      { name: 'certificate_s3_url', type: "LONGTEXT" }
    ];

    for (const col of centerColumns) {
      try {
        await db.query(`ALTER TABLE centers ADD COLUMN ${col.name} ${col.type}`);
      } catch (_) {}
    }

    // Seed/Update branch details for centers
    try {
      await db.query(`
        UPDATE centers SET 
          head_name = COALESCE(NULLIF(head_name, ''), 'CHHOTON GHOSH'),
          head_image_url = COALESCE(NULLIF(head_image_url, ''), 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300'),
          address = COALESCE(NULLIF(address, ''), 'RAILWAY MARKET'),
          state = COALESCE(NULLIF(state, ''), 'Assam'),
          district = COALESCE(NULLIF(district, ''), 'BONGAIGAON'),
          city = COALESCE(NULLIF(city, ''), 'DANGTAL-783381'),
          joined_date = COALESCE(joined_date, '2026-08-01')
        WHERE id = 1
      `);

      await db.query(`
        UPDATE centers SET 
          head_name = COALESCE(NULLIF(head_name, ''), 'LAXMAN KALINDI'),
          head_image_url = COALESCE(NULLIF(head_image_url, ''), 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300'),
          address = COALESCE(NULLIF(address, ''), 'KALIKAPUR'),
          address_line2 = COALESCE(NULLIF(address_line2, ''), 'MAIN ROAD'),
          state = COALESCE(NULLIF(state, ''), 'Jharkhand'),
          district = COALESCE(NULLIF(district, ''), 'EAST SINGHBHUM'),
          city = COALESCE(NULLIF(city, ''), 'POTKA-832102'),
          name = 'LAXMAN IT ACADEMY',
          joined_date = COALESCE(joined_date, '2026-07-09')
        WHERE id = 2
      `);

      await db.query(`
        UPDATE centers SET 
          head_name = COALESCE(NULLIF(head_name, ''), 'Narendra Pujhari'),
          head_image_url = COALESCE(NULLIF(head_image_url, ''), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'),
          address = COALESCE(NULLIF(address, ''), 'Ranmal'),
          address_line2 = COALESCE(NULLIF(address_line2, ''), 'Jaipatna'),
          state = COALESCE(NULLIF(state, ''), 'Odisha'),
          district = COALESCE(NULLIF(district, ''), 'Kalahandi'),
          city = COALESCE(NULLIF(city, ''), 'Bhawanipatna-766017'),
          name = 'Life Line Computer Center',
          joined_date = COALESCE(joined_date, '2026-04-27')
        WHERE id = 3
      `);

      // Add additional authorized branches if not existing
      const [cntRows]: any = await db.query('SELECT COUNT(*) as count FROM centers');
      if (cntRows && cntRows[0] && cntRows[0].count < 6) {
        const extraBranches = [
          {
            center_code: 'EXAMc2026-184',
            name: 'EXAMIRROR AUTHORIZED STUDY CENTER',
            head_name: 'Nafeesh Khan',
            head_image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
            email: 'lucknow@examirror.edu.in',
            address: 'KURESHIPUR',
            address_line2: 'NEAR CITY BUS STAND',
            state: 'Uttar Pradesh',
            district: 'LUCKNOW',
            city: 'LUCKNOW-226001',
            pincode: '226001',
            joined_date: '2026-04-15'
          },
          {
            center_code: 'EXAMc2026-183',
            name: 'TECHNO SKILL EDUCATION CENTER',
            head_name: 'Rajesh Sharma',
            head_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
            email: 'jaipur@examirror.edu.in',
            address: 'PLOT 45, TONK ROAD',
            address_line2: 'BEHIND METRO PILLAR 112',
            state: 'Rajasthan',
            district: 'JAIPUR',
            city: 'JAIPUR-302015',
            pincode: '302015',
            joined_date: '2026-03-20'
          },
          {
            center_code: 'EXAMc2026-182',
            name: 'FUTURE CAREER IT HUB',
            head_name: 'Priyanka Sen',
            head_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
            email: 'kolkata@examirror.edu.in',
            address: 'SALT LAKE SECTOR 5',
            address_line2: 'RING ROAD PLAZA',
            state: 'West Bengal',
            district: 'NORTH 24 PARGANAS',
            city: 'KOLKATA-700091',
            pincode: '700091',
            joined_date: '2026-02-18'
          }
        ];

        for (const b of extraBranches) {
          await db.query(`
            INSERT INTO centers (center_code, password_hash, name, head_name, head_image_url, email, address, address_line2, state, district, city, pincode, joined_date, wallet_balance, status)
            VALUES (?, '$2b$10$acAQo2TuK.ru4o7LEVNnhe4C19NaJFcrdt5POcD7XY9j0TqYSi62i', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 'active')
          `, [b.center_code, b.name, b.head_name, b.head_image_url, b.email, b.address, b.address_line2, b.state, b.district, b.city, b.pincode, b.joined_date]);
        }
      }
    } catch (e) {
      console.error('Error seeding branch centers:', e);
    }

    // Ensure courses table exists and has necessary columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        categoryId VARCHAR(50) DEFAULT 'General',
        fee DECIMAL(10,2) DEFAULT 0.00,
        shortDescription TEXT,
        duration VARCHAR(50) DEFAULT '3 Month(s)',
        semesters JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns if table already existed without them
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN duration VARCHAR(50) DEFAULT '3 Month(s)'`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN semesters JSON`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN shortDescription TEXT`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN is_draft TINYINT(1) DEFAULT 0`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN image_url LONGTEXT`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE courses ADD COLUMN eligibility VARCHAR(150) DEFAULT '10th / 12th Pass'`);
    } catch (_) {}

    // Ensure center_courses table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS center_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        centerId INT NOT NULL,
        courseId INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_center_course (centerId, courseId),
        FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // Ensure students table columns exist
    const studentColumns = [
      { name: 'student_type', type: "VARCHAR(20) DEFAULT 'new'" },
      { name: 'duration', type: "VARCHAR(50) DEFAULT '1-3 months'" },
      { name: 'tokens_deducted', type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: 'certificate_status', type: "VARCHAR(50) DEFAULT 'not_generated'" },
      { name: 'certificate_number', type: "VARCHAR(100)" },
      { name: 'dob', type: "VARCHAR(50)" },
      { name: 'gender', type: "VARCHAR(20)" },
      { name: 'marital_status', type: "VARCHAR(50)" },
      { name: 'phone', type: "VARCHAR(30)" },
      { name: 'father_name', type: "VARCHAR(150)" },
      { name: 'mother_name', type: "VARCHAR(150)" },
      { name: 'qualification', type: "VARCHAR(100)" },
      { name: 'address', type: "TEXT" },
      { name: 'pincode', type: "VARCHAR(20)" },
      { name: 'city', type: "VARCHAR(100)" },
      { name: 'state', type: "VARCHAR(100)" },
      { name: 'course_fee', type: "DECIMAL(10,2) DEFAULT 0.00" },
      { name: 'session_start', type: "VARCHAR(50)" },
      { name: 'session_end', type: "VARCHAR(50)" },
      { name: 'id_type', type: "VARCHAR(50)" },
      { name: 'id_number', type: "VARCHAR(100)" },
      { name: 'photo_url', type: "LONGTEXT" },
      { name: 'id_card_url', type: "LONGTEXT" },
      { name: 'marksheet_url', type: "LONGTEXT" },
      { name: 'academic_status', type: "VARCHAR(50) DEFAULT 'pursuing'" },
      { name: 'enrollment_no', type: "VARCHAR(100)" },
      { name: 'roll_no', type: "VARCHAR(100)" },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'active'" },
      { name: 'certificate_file_url', type: "LONGTEXT" },
      { name: 'certificate_s3_url', type: "LONGTEXT" },
      { name: 'marksheet_file_url', type: "LONGTEXT" },
      { name: 'marksheet_s3_url', type: "LONGTEXT" }
    ];

    for (const col of studentColumns) {
      try {
        await db.query(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
      } catch (_) {}
    }

    // Ensure photo_url can store full base64 images
    try {
      await db.query(`ALTER TABLE students MODIFY COLUMN photo_url LONGTEXT`);
    } catch (_) {}



    // Ensure wallet_transactions extra columns exist
    try {
      await db.query(`ALTER TABLE wallet_transactions ADD COLUMN txn_uid VARCHAR(100)`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE wallet_transactions ADD COLUMN utr_number VARCHAR(100)`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE wallet_transactions ADD COLUMN status VARCHAR(50) DEFAULT 'Approved'`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE wallet_transactions ADD COLUMN remark TEXT`);
    } catch (_) {}

    // Ensure free_tests enhanced columns exist
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN test_uid VARCHAR(100)`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN duration_minutes INT DEFAULT 30`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN auto_submit TINYINT(1) DEFAULT 1`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN pass_marks INT DEFAULT 40`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN total_marks INT DEFAULT 100`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN category VARCHAR(100) DEFAULT 'General'`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN student_limit INT DEFAULT 50`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN views INT DEFAULT 0`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE free_tests ADD COLUMN has_been_published BOOLEAN DEFAULT false`);
    } catch (_) {}

    // Ensure all existing free_tests have a unique test_uid
    try {
      const [existingTests]: any = await db.query('SELECT id, test_uid FROM free_tests WHERE test_uid IS NULL OR test_uid = ""');
      for (const t of existingTests) {
        const uid = `TEST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.query('UPDATE free_tests SET test_uid = ? WHERE id = ?', [uid, t.id]);
      }
    } catch (_) {}

    // Create free_test_submissions table for candidate test results & scorecards
    await db.query(`
      CREATE TABLE IF NOT EXISTS free_test_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_id INT NOT NULL,
        center_id INT,
        student_name VARCHAR(150) NOT NULL,
        student_roll VARCHAR(100),
        student_mobile VARCHAR(20),
        student_email VARCHAR(150),
        score DECIMAL(5,2) DEFAULT 0.00,
        total_marks INT DEFAULT 0,
        correct_count INT DEFAULT 0,
        wrong_count INT DEFAULT 0,
        unanswered_count INT DEFAULT 0,
        percentage DECIMAL(5,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Completed',
        time_taken_seconds INT DEFAULT 0,
        responses_json LONGTEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.query(`ALTER TABLE free_test_submissions ADD COLUMN is_cheating TINYINT(1) DEFAULT 0`);
    } catch (_) {}

    // Ensure center_material_purchases and center_material_distributions tables exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS center_material_purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_id INT NOT NULL,
        center_id INT NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0.00,
        payment_mode VARCHAR(50) DEFAULT 'WALLET',
        utr_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'APPROVED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS center_material_distributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_id INT NOT NULL,
        center_id INT NOT NULL,
        distribution_type VARCHAR(50) DEFAULT 'ALL_STUDENTS',
        course_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unq_mat_center (material_id, center_id)
      )
    `);

    // Ensure student_marks table has publication and dues columns
    try {
      await db.query(`ALTER TABLE student_marks ADD COLUMN is_published_to_student TINYINT(1) DEFAULT 1`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE student_marks ADD COLUMN dues_cleared TINYINT(1) DEFAULT 1`);
    } catch (_) {}
    try {
      await db.query(`ALTER TABLE student_marks ADD COLUMN hold_reason TEXT`);
    } catch (_) {}

    // Auto-link first 2 courses to center 1 if none linked
    const [centerCoursesRows]: any = await db.query('SELECT COUNT(*) as count FROM center_courses WHERE centerId = 1');
    if (centerCoursesRows && centerCoursesRows[0] && centerCoursesRows[0].count === 0) {
      const [allCrs]: any = await db.query('SELECT id FROM courses LIMIT 2');
      for (const cr of allCrs) {
        await db.query('INSERT IGNORE INTO center_courses (centerId, courseId) VALUES (1, ?)', [cr.id]);
      }
    }

    // Seed sample transactions for center 1 if less than 5
    const [txnCount]: any = await db.query('SELECT COUNT(*) as count FROM wallet_transactions WHERE centerId = 1');
    if (txnCount && txnCount[0] && txnCount[0].count < 4) {
      const sampleTxns = [
        {
          centerId: 1,
          amount: 250,
          type: 'debit',
          status: 'Approved',
          txn_uid: 'EXAMTXN66650260922104804',
          utr_number: '',
          description: 'ZEBA KHATOON (EXAMs26-1907) addmission fee.',
          remark: 'Thanks for business.',
          created_at: '2026-09-22 10:48:04'
        },
        {
          centerId: 1,
          amount: 250,
          type: 'debit',
          status: 'Approved',
          txn_uid: 'EXAMTXN41509260903084638',
          utr_number: '',
          description: 'Kaushik Kumar (EXAMs26-1846) addmission fee.',
          remark: 'Thanks for business.',
          created_at: '2026-09-03 08:46:38'
        },
        {
          centerId: 1,
          amount: 250,
          type: 'debit',
          status: 'Approved',
          txn_uid: 'EXAMTXN72312260901102123',
          utr_number: '',
          description: 'KHUSHBOO KUMARI MISHRA (EXAMs26-1835) addmission fee.',
          remark: 'Thanks for business.',
          created_at: '2026-09-01 10:21:23'
        },
        {
          centerId: 1,
          amount: 50,
          type: 'debit',
          status: 'Approved',
          txn_uid: 'EXAMTXN39684260820054114',
          utr_number: '',
          description: '1698 Advanced edit fee.',
          remark: 'Student edit request accepted.',
          created_at: '2026-08-20 05:41:14'
        },
        {
          centerId: 1,
          amount: 2000,
          type: 'credit',
          status: 'Approved',
          txn_uid: 'EXAMTXN16412260730101258',
          utr_number: '198795592349',
          description: 'extra bonus',
          remark: 'Thanks for your business.',
          created_at: '2026-07-30 10:12:58'
        },
        {
          centerId: 1,
          amount: 1000,
          type: 'credit',
          status: 'Approved',
          txn_uid: 'EXAMTXN87782260730100842',
          utr_number: '198795592348',
          description: 'Wallet Recharge',
          remark: 'Thanks for your business.',
          created_at: '2026-07-30 10:08:42'
        },
        {
          centerId: 1,
          amount: 250,
          type: 'debit',
          status: 'Rejected',
          txn_uid: 'EXAMTXN74234260730022446',
          utr_number: '',
          description: 'VIPUL KUMAR (EXAMs26-1752) addmission fee.',
          remark: 'On request of center, student was terminated and amount refunded back to wallet.',
          created_at: '2026-07-30 02:24:46'
        },
        {
          centerId: 1,
          amount: 300,
          type: 'debit',
          status: 'Rejected',
          txn_uid: 'EXAMTXN96015251227121426',
          utr_number: '',
          description: 'MADHU KUMAR SINGH (EXAMs25-1072) addmission fee.',
          remark: 'On request of center, student was terminated and amount refunded back to wallet.',
          created_at: '2025-12-27 12:14:26'
        },
        {
          centerId: 1,
          amount: 500,
          type: 'credit',
          status: 'Rejected',
          txn_uid: 'EXAMTXN74203251123090934',
          utr_number: '20251123210516954861819252736000',
          description: 'Wallet Recharge',
          remark: 'The information provided by you was not meeting our requirements.',
          created_at: '2025-11-23 09:09:34'
        }
      ];

      for (const st of sampleTxns) {
        await db.query(
          'INSERT INTO wallet_transactions (centerId, amount, type, status, txn_uid, utr_number, description, remark, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [st.centerId, st.amount, st.type, st.status, st.txn_uid, st.utr_number, st.description, st.remark, st.created_at]
        );
      }
    }

    // Initialize Test Series Database Schema and Migrations
    await initTestSeriesDatabase();

    // Ensure Center Affiliation & Certificate Verification columns
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_number VARCHAR(100)`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_issued_date DATE`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_valid_until DATE`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_status VARCHAR(50) DEFAULT 'unclaimed'`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_claim_date DATETIME NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_approved_date DATETIME NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_demand_notes TEXT NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_demanded_docs TEXT NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE centers ADD COLUMN certificate_uploaded_docs LONGTEXT NULL`); } catch (_) {}

    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN qualification VARCHAR(100) DEFAULT 'Graduate'`); } catch (_) {}
    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN certificate_status VARCHAR(50) DEFAULT 'unclaimed'`); } catch (_) {}
    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN certificate_claim_date DATETIME NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN certificate_approved_date DATETIME NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN certificate_demand_notes TEXT NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE franchise_applications ADD COLUMN certificate_uploaded_docs LONGTEXT NULL`); } catch (_) {}

    // Ensure Training Videos Schema
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN youtube_id VARCHAR(50) NULL`); } catch (_) {}
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN module_name VARCHAR(100) DEFAULT 'Module 01'`); } catch (_) {}
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN category VARCHAR(100) DEFAULT 'Portal Guide'`); } catch (_) {}
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN is_featured TINYINT(1) DEFAULT 0`); } catch (_) {}
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN is_active TINYINT(1) DEFAULT 1`); } catch (_) {}
    try { await db.query(`ALTER TABLE training_videos ADD COLUMN sort_order INT DEFAULT 0`); } catch (_) {}
  } catch (err) {
    console.error('Schema initialization warning:', err);
  }
};

initDbSchema();

import publicRoutes from './routes/public.routes';
import authRoutes from './routes/auth.routes';
import centerRoutes from './routes/center.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import testSeriesRoutes from './routes/testSeries.routes';
import studyMaterialRoutes from './routes/studyMaterial.routes';
import certificateRoutes from './routes/certificate.routes';
import { testSeriesService } from './services/testSeries.service';
import { studyMaterialService } from './services/studyMaterial.service';

// Register routes for both /api and /api/v1
app.use('/api/public', publicRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/center', centerRoutes);
app.use('/api/v1/center', centerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/test-series", testSeriesRoutes);
app.use("/api/v1/test-series", testSeriesRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/v1/study-materials", studyMaterialRoutes);
app.use("/api/study-material-categories", (req, res, next) => {
  req.url = '/categories' + (req.url === '/' ? '' : req.url);
  studyMaterialRoutes(req, res, next);
});
app.use("/api/v1/study-material-categories", (req, res, next) => {
  req.url = '/categories' + (req.url === '/' ? '' : req.url);
  studyMaterialRoutes(req, res, next);
});
// Settings routes mapping
const settingsHandler = (req: any, res: any, next: any) => {
  req.url = '/settings' + (req.url === '/' ? '' : req.url);
  publicRoutes(req, res, next);
};
app.use("/api/settings", settingsHandler);
app.use("/api/v1/settings", settingsHandler);

app.use("/api", testSeriesRoutes);
app.use("/api/v1", testSeriesRoutes);
app.use("/api", publicRoutes);
app.use("/api/v1", publicRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/v1/certificates", certificateRoutes);

// Catch-all 404 handler for unmatched API routes
app.use(['/api', '/api/v1'], (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    ...(isDev && err.stack ? { stack: err.stack } : {})
  });
});

// Background automated scheduler: Auto-publish scheduled test series & study materials every 30 seconds
setInterval(async () => {
  try {
    await Promise.all([
      testSeriesService.autoPublishScheduled(),
      studyMaterialService.autoPublishScheduled()
    ]);
  } catch (err) {
    // Silent background interval handler
  }
}, 30000);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  // Run an immediate check on startup
  testSeriesService.autoPublishScheduled().catch(() => {});
  studyMaterialService.autoPublishScheduled().catch(() => {});
  if (isS3Configured) {
    syncAllLocalUploadsToS3().catch((err) => {
      console.warn('[S3] Startup background sync notice:', err?.message || err);
    });

    // Schedule automated Nightly S3 backup at 02:00 AM every day (100% Free)
    const scheduleNightlyS3Sync = () => {
      const now = new Date();
      const next2AM = new Date();
      next2AM.setHours(2, 0, 0, 0);
      if (now >= next2AM) {
        next2AM.setDate(next2AM.getDate() + 1);
      }
      const delayMs = next2AM.getTime() - now.getTime();
      const hoursUntil = (delayMs / 3600000).toFixed(2);
      console.log(`[S3 Cron] ⏰ Next automated nightly sync scheduled at 02:00 AM (in ~${hoursUntil} hours)`);

      setTimeout(async () => {
        try {
          console.log('[S3 Cron] 🚀 02:00 AM reached! Executing automated nightly backup to AWS S3...');
          const result = await syncAllLocalUploadsToS3();
          console.log(`[S3 Cron] ✔ Nightly backup finished! Checked ${result.total} files, uploaded: ${result.uploaded}, errors: ${result.errors}`);
        } catch (syncErr: any) {
          console.error('[S3 Cron] ❌ Nightly sync error:', syncErr?.message || syncErr);
        }
        scheduleNightlyS3Sync();
      }, delayMs);
    };

    scheduleNightlyS3Sync();
  }
});


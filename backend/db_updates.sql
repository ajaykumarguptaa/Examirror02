-- =============================================================================
-- EXAMIRROR EDUTECH - DATABASE MIGRATION & SCHEMA CHANGELOG LEDGER
-- =============================================================================
-- This file tracks every database modification organized by DATE, FEATURE,
-- and TABLE to make it easy to identify when and why each change occurred.
-- All queries use idempotent syntax (IF NOT EXISTS) for safe execution.
-- =============================================================================


-- =============================================================================
-- [DATE: 2026-10-11] - MILESTONE 1: BASE SYSTEM SETUP & CORE ENTITIES
-- Purpose: Foundational tables for Centers, Courses, Admissions, and Wallets.
-- =============================================================================

-- 1. Free Practice Tests Table
CREATE TABLE IF NOT EXISTS free_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Center Scheduled Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Center Head Video Tutorials
CREATE TABLE IF NOT EXISTS training_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  thumbnail VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Center Wallet Transactions Ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit', 'debit') DEFAULT 'credit',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);

-- 5. Center Wallet Top-up Requests
CREATE TABLE IF NOT EXISTS wallet_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  utr_number VARCHAR(100) NOT NULL,
  bonus_tokens DECIMAL(10,2) DEFAULT 0.00,
  total_credited DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  narration VARCHAR(255) DEFAULT 'Wallet Recharge',
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);

-- 6. Course Curriculum & Question Bank
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
);

CREATE TABLE IF NOT EXISTS course_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  semester VARCHAR(50) DEFAULT 'SEM 1',
  question TEXT NOT NULL,
  optA VARCHAR(255) NOT NULL,
  optB VARCHAR(255) NOT NULL,
  optC VARCHAR(255) NOT NULL,
  optD VARCHAR(255) NOT NULL,
  correct VARCHAR(10) NOT NULL,
  marks INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- 7. Full Students Master Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  courseId INT,
  centerId INT,
  student_type VARCHAR(20) DEFAULT 'new',
  duration VARCHAR(50) DEFAULT '1-3 months',
  tokens_deducted DECIMAL(10,2) DEFAULT 0.00,
  certificate_status VARCHAR(50) DEFAULT 'not_generated',
  certificate_number VARCHAR(100),
  dob VARCHAR(50),
  gender VARCHAR(20),
  marital_status VARCHAR(50),
  phone VARCHAR(30),
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  qualification VARCHAR(100),
  address TEXT,
  pincode VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  course_fee DECIMAL(10,2) DEFAULT 0.00,
  session_start VARCHAR(50),
  session_end VARCHAR(50),
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);


-- =============================================================================
-- [DATE: 2026-10-12] - MILESTONE 2: ONLINE EXAMS, SCORECARDS & NOTIFICATIONS
-- Purpose: Enable student online test taking, auto-evaluation, and system alerts.
-- =============================================================================

-- Add Student Exam Login Password
ALTER TABLE students ADD COLUMN password VARCHAR(255) DEFAULT '123456';

-- Student Marks & Online Exam Attempt Tracking
CREATE TABLE IF NOT EXISTS student_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  semester VARCHAR(50) NOT NULL,
  written_marks DECIMAL(10,2) DEFAULT 0,
  viva_marks DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_semester (studentId, semester),
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

ALTER TABLE student_marks ADD COLUMN exam_date DATE;
ALTER TABLE student_marks ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
ALTER TABLE student_marks ADD COLUMN responses_json LONGTEXT;
ALTER TABLE student_marks ADD COLUMN total_questions INT DEFAULT 0;
ALTER TABLE student_marks ADD COLUMN correct_answers INT DEFAULT 0;
ALTER TABLE student_marks ADD COLUMN wrong_answers INT DEFAULT 0;
ALTER TABLE student_marks ADD COLUMN is_published_to_student TINYINT(1) DEFAULT 1;
ALTER TABLE student_marks ADD COLUMN dues_cleared TINYINT(1) DEFAULT 1;
ALTER TABLE student_marks ADD COLUMN hold_reason TEXT;

-- SuperAdmin Test Series & Question Bank
CREATE TABLE IF NOT EXISTS superadmin_test_series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('free', 'paid') DEFAULT 'free',
  price DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('draft', 'published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS superadmin_test_series_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_id INT NOT NULL,
  question TEXT NOT NULL,
  optA VARCHAR(255) NOT NULL,
  optB VARCHAR(255) NOT NULL,
  optC VARCHAR(255) NOT NULL,
  optD VARCHAR(255) NOT NULL,
  correct VARCHAR(10) NOT NULL,
  marks INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES superadmin_test_series(id) ON DELETE CASCADE
);

-- Public Candidate Free Test Submissions
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
  is_cheating TINYINT(1) DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_type ENUM('admin', 'center', 'student') NOT NULL,
  user_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Soft Delete columns for free_tests
ALTER TABLE free_tests ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;
ALTER TABLE free_tests ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Query Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_email_pwd ON students (email, password);
CREATE INDEX IF NOT EXISTS idx_student_marks_student ON student_marks (studentId, exam_date);
CREATE INDEX IF NOT EXISTS idx_superadmin_test_status ON superadmin_test_series (status);


-- =============================================================================
-- [DATE: 2026-10-12] - MILESTONE 3: CENTER HEAD ACADEMIC QUALIFICATION & MARKSHEET
-- Purpose: Minimum Graduation eligibility check for Center Head franchise applicants.
-- =============================================================================

-- Add academic qualification column to franchise applications
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS qualification VARCHAR(100) DEFAULT 'Graduate';


-- =============================================================================
-- [DATE: 2026-10-12] - MILESTONE 4: CENTER AFFILIATION CERTIFICATE BASELINE
-- Purpose: Store official accreditation certificate number and validity dates.
-- =============================================================================

ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100);
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_issued_date DATE;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_valid_until DATE;


-- =============================================================================
-- [DATE: 2026-10-12] - MILESTONE 5: CERTIFICATE CLAIMS, SECONDARY APPROVAL & DOCUMENT DEMANDS
-- Purpose: Full 2-way accreditation governance workflow:
--   1. Center Head clicks "Claim Certificate" -> status becomes 'pending'
--   2. Super Admin does Secondary Confirmation -> status becomes 'approved'
--   3. Super Admin demands missing docs (e.g. Electricity bill) -> status becomes 'action_required'
--   4. Center Head uploads demanded files -> status returns to 'pending'
-- =============================================================================

-- 1. Updates to 'centers' table for active study centers:
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'unclaimed';
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_claim_date DATETIME NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_approved_date DATETIME NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_demand_notes TEXT NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_demanded_docs TEXT NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_uploaded_docs LONGTEXT NULL;

-- 2. Updates to 'franchise_applications' table for cross-sync with admin dossiers:
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'unclaimed';
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_claim_date DATETIME NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_approved_date DATETIME NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_demand_notes TEXT NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_demanded_docs TEXT NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_uploaded_docs LONGTEXT NULL;

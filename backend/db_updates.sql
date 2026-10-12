
CREATE TABLE IF NOT EXISTS free_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  thumbnail VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  centerId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit', 'debit') DEFAULT 'credit',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);

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

-- Ensure courses table has duration and semesters
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

-- Seed default center if not exists
INSERT IGNORE INTO centers (id, center_code, password_hash, name, email, wallet_balance) VALUES
(1, 'CENT001', '$2b$10$xyz', 'Delhi Main Center', 'center@example.com', 2150.00);

-- Ensure full students table exists
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

-- Seed default training videos if empty
INSERT IGNORE INTO training_videos (id, title, url, description, duration) VALUES
(1, 'How to Register Students in Dashboard', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Complete walkthrough of student admission and registration module.', '10:15'),
(2, 'How to Set and Conduct Online Exams', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Step by step guide to creating tests and scheduling exams for batches.', '08:45'),
(3, 'Wallet Recharge & Payment Process', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Learn how to top up your center wallet instantly via QR and UPI.', '05:20');

-- Soft Delete for free_tests
ALTER TABLE free_tests ADD COLUMN is_deleted TINYINT(1) DEFAULT 0;
ALTER TABLE free_tests ADD COLUMN deleted_at DATETIME DEFAULT NULL;

-- Notifications Table
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
CREATE TABLE IF NOT EXISTS student_marks (id INT AUTO_INCREMENT PRIMARY KEY, studentId INT NOT NULL, semester VARCHAR(50) NOT NULL, written_marks DECIMAL(10,2) DEFAULT 0, viva_marks DECIMAL(10,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY unique_student_semester (studentId, semester), FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE);
ALTER TABLE student_marks ADD COLUMN exam_date DATE;
ALTER TABLE students ADD COLUMN password VARCHAR(255) DEFAULT '123456';

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

-- Performance Indexing
CREATE INDEX IF NOT EXISTS idx_students_email_pwd ON students (email, password);
CREATE INDEX IF NOT EXISTS idx_student_marks_student ON student_marks (studentId, exam_date);
CREATE INDEX IF NOT EXISTS idx_superadmin_test_status ON superadmin_test_series (status);


-- Add exam taking columns to student_marks
ALTER TABLE student_marks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled';
ALTER TABLE student_marks ADD COLUMN IF NOT EXISTS responses_json LONGTEXT;
ALTER TABLE student_marks ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 0;
ALTER TABLE student_marks ADD COLUMN IF NOT EXISTS correct_answers INT DEFAULT 0;
ALTER TABLE student_marks ADD COLUMN IF NOT EXISTS wrong_answers INT DEFAULT 0;

-- Center Affiliation Certificate & Franchise Applications Updates
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100);
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_issued_date DATE;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_valid_until DATE;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'unclaimed';
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_claim_date DATETIME NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_approved_date DATETIME NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_demand_notes TEXT NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_demanded_docs TEXT NULL;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS certificate_uploaded_docs LONGTEXT NULL;

ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS qualification VARCHAR(100) DEFAULT 'Graduate';
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(50) DEFAULT 'unclaimed';
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_claim_date DATETIME NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_approved_date DATETIME NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_demand_notes TEXT NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_demanded_docs TEXT NULL;
ALTER TABLE franchise_applications ADD COLUMN IF NOT EXISTS certificate_uploaded_docs LONGTEXT NULL;



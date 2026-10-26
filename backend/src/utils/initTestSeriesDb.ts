import db from '../db';

export async function initTestSeriesDatabase() {
  console.log('--- Initializing Test Series Database Tables ---');

  // 1. Test Categories
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(100) DEFAULT 'BookOpen',
      display_order INT DEFAULT 0,
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE test_categories ADD COLUMN thumbnail_url TEXT NULL AFTER description`);
  } catch (e) { }

  // 1b. Test Sub Categories (Hierarchical Sub-classification)
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_sub_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) NOT NULL,
      description TEXT,
      display_order INT DEFAULT 0,
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES test_categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Test Payment QR Configurations
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_payment_qr (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      upi_id VARCHAR(150) NOT NULL,
      account_name VARCHAR(150) NOT NULL,
      qr_image_url TEXT NOT NULL,
      amount DECIMAL(10, 2) DEFAULT 0.00,
      instructions TEXT,
      is_global_default BOOLEAN DEFAULT FALSE,
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE test_payment_qr ADD COLUMN amount DECIMAL(10, 2) DEFAULT 0.00 AFTER qr_image_url`);
  } catch (e) { }

  // 3. Test Series Master
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_series (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      category_id INT,
      description TEXT,
      thumbnail_url TEXT,
      instructions TEXT,
      exam_type VARCHAR(100) DEFAULT 'Mock Test Series',
      language VARCHAR(50) DEFAULT 'English + Hindi',
      difficulty ENUM('ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'ALL_LEVELS',
      total_tests INT DEFAULT 1,
      price DECIMAL(10, 2) DEFAULT 0.00,
      is_free BOOLEAN DEFAULT TRUE,
      duration_minutes INT DEFAULT 60,
      validity_days INT DEFAULT 90,
      publish_scope ENUM('ALL_CENTRES', 'SELECTED_CENTRES') DEFAULT 'ALL_CENTRES',
      payment_qr_id INT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      scheduled_publish_time DATETIME NULL,
      status ENUM('DRAFT', 'PUBLISHED', 'SCHEDULED', 'UNPUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES test_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (payment_qr_id) REFERENCES test_payment_qr(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe schema migration for existing databases
  try {
    await db.query(`
      ALTER TABLE test_series 
      MODIFY COLUMN status ENUM('DRAFT', 'PUBLISHED', 'SCHEDULED', 'UNPUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT'
    `);
  } catch (e) {
    // Column status modify
  }

  try {
    await db.query(`
      ALTER TABLE test_series 
      ADD COLUMN scheduled_publish_time DATETIME NULL AFTER end_date
    `);
  } catch (e) {
    // Column already exists
  }

  try {
    await db.query(`
      ALTER TABLE test_series 
      ADD COLUMN thumbnail_url TEXT NULL AFTER description
    `);
  } catch (e) {
    // Column already exists
  }

  try {
    await db.query(`
      ALTER TABLE test_series 
      ADD COLUMN sub_category_id INT NULL AFTER category_id
    `);
  } catch (e) {
    // Column already exists
  }

  try {
    await db.query(`
      ALTER TABLE test_series 
      ADD CONSTRAINT fk_test_series_sub_cat FOREIGN KEY (sub_category_id) REFERENCES test_sub_categories(id) ON DELETE SET NULL
    `);
  } catch (e) {
    // Constraint already exists
  }

  // 4. Test Series Allowed Centres (for SELECTED_CENTRES scope)
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_series_centres (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_series_id INT NOT NULL,
      centre_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_series_centre (test_series_id, centre_id),
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE,
      FOREIGN KEY (centre_id) REFERENCES centers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4b. Multi-Category Placement Junction Table (Allows placing a single test series in multiple categories)
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_series_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_series_id INT NOT NULL,
      category_id INT NOT NULL,
      sub_category_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_series_cat (test_series_id, category_id),
      KEY idx_tsc_category (category_id),
      KEY idx_tsc_series (test_series_id),
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES test_categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    // Auto-sync existing primary categories into junction table
    await db.query(`
      INSERT IGNORE INTO test_series_categories (test_series_id, category_id, sub_category_id)
      SELECT id, category_id, sub_category_id
      FROM test_series
      WHERE category_id IS NOT NULL
    `);
  } catch (e) {
    // Ignore migration catch
  }

  // 5. Individual Tests inside Series
  await db.query(`
    CREATE TABLE IF NOT EXISTS tests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_series_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      question_count INT DEFAULT 0,
      duration_minutes INT DEFAULT 60,
      total_marks DECIMAL(6, 2) DEFAULT 100.00,
      negative_marks DECIMAL(4, 2) DEFAULT 0.25,
      passing_marks DECIMAL(6, 2) DEFAULT 40.00,
      release_type ENUM('IMMEDIATE', 'WEEKLY', 'CUSTOM_DATE', 'MANUAL') DEFAULT 'IMMEDIATE',
      release_week INT DEFAULT 1,
      custom_release_date DATETIME NULL,
      is_released BOOLEAN DEFAULT TRUE,
      status ENUM('DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'ARCHIVED') DEFAULT 'LIVE',
      display_order INT DEFAULT 1,
      payment_qr_id INT NULL,
      price DECIMAL(10, 2) DEFAULT 0.00,
      is_free BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_qr_id) REFERENCES test_payment_qr(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe migration for tests table columns
  try {
    await db.query(`ALTER TABLE tests ADD COLUMN payment_qr_id INT NULL AFTER display_order`);
  } catch (e) { }
  try {
    await db.query(`ALTER TABLE tests ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00 AFTER payment_qr_id`);
  } catch (e) { }
  try {
    await db.query(`ALTER TABLE tests ADD COLUMN is_free BOOLEAN DEFAULT TRUE AFTER price`);
  } catch (e) { }
  try {
    await db.query(`ALTER TABLE tests ADD CONSTRAINT fk_tests_payment_qr FOREIGN KEY (payment_qr_id) REFERENCES test_payment_qr(id) ON DELETE SET NULL`);
  } catch (e) { }

  // 6. Questions
  await db.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      test_id INT NOT NULL,
      question_text TEXT NOT NULL,
      section_name VARCHAR(100) DEFAULT 'General Assessment',
      question_type ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE') DEFAULT 'SINGLE_CHOICE',
      explanation TEXT,
      marks DECIMAL(5, 2) DEFAULT 2.00,
      negative_marks DECIMAL(4, 2) DEFAULT 0.50,
      display_order INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. Question Options
  await db.query(`
    CREATE TABLE IF NOT EXISTS question_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      option_key VARCHAR(10) NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe migrations for questions and options rich schema
  try { await db.query(`ALTER TABLE questions MODIFY COLUMN question_type VARCHAR(50) DEFAULT 'SINGLE_CHOICE'`); } catch (e) { }
  try { await db.query(`ALTER TABLE questions ADD COLUMN image_url TEXT NULL AFTER question_type`); } catch (e) { }
  try { await db.query(`ALTER TABLE questions ADD COLUMN metadata JSON NULL AFTER image_url`); } catch (e) { }
  try { await db.query(`ALTER TABLE question_options ADD COLUMN image_url TEXT NULL AFTER option_text`); } catch (e) { }

  // 8. Test Series Enrollments
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_series_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      test_series_id INT NOT NULL,
      centre_id INT NOT NULL,
      enrollment_type ENUM('FREE', 'PAID') DEFAULT 'FREE',
      status ENUM('ACTIVE', 'PAYMENT_PENDING', 'REJECTED', 'EXPIRED', 'SUSPENDED') DEFAULT 'ACTIVE',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      UNIQUE KEY uq_student_series (student_id, test_series_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Safe migration: expand enrollment_type and status to VARCHAR(50)
  try { await db.query(`ALTER TABLE test_series_enrollments MODIFY COLUMN enrollment_type VARCHAR(50) DEFAULT 'FREE'`); } catch (e) { }
  try { await db.query(`ALTER TABLE test_series_enrollments MODIFY COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'`); } catch (e) { }

  // 9. Test Payments (Manual UPI / QR with UTR submission)
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      test_series_id INT NOT NULL,
      centre_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      payment_method VARCHAR(50) DEFAULT 'UPI_QR',
      utr_number VARCHAR(100) NOT NULL,
      payment_screenshot TEXT,
      payment_qr_id INT,
      status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING',
      rejection_reason TEXT,
      verified_by INT NULL,
      verified_at TIMESTAMP NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_utr (utr_number),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 10. Test Attempts
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      test_id INT NOT NULL,
      test_series_id INT NOT NULL,
      attempt_number INT DEFAULT 1,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      submitted_at TIMESTAMP NULL,
      server_end_time TIMESTAMP NULL,
      duration_seconds INT DEFAULT 0,
      status ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'RESET') DEFAULT 'IN_PROGRESS',
      total_questions INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      incorrect_answers INT DEFAULT 0,
      unanswered INT DEFAULT 0,
      marks_obtained DECIMAL(6, 2) DEFAULT 0.00,
      negative_marks_applied DECIMAL(6, 2) DEFAULT 0.00,
      final_score DECIMAL(6, 2) DEFAULT 0.00,
      percentage DECIMAL(5, 2) DEFAULT 0.00,
      accuracy DECIMAL(5, 2) DEFAULT 0.00,
      ranking INT DEFAULT 1,
      reset_reason TEXT,
      reset_by INT NULL,
      reset_at TIMESTAMP NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (test_series_id) REFERENCES test_series(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 11. Test Answers per Attempt
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      selected_option_key VARCHAR(10) NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      is_marked_for_review BOOLEAN DEFAULT FALSE,
      time_spent_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_attempt_question (attempt_id, question_id),
      FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 12. Achievement Rules (Configurable Stars & Milestones)
  await db.query(`
    CREATE TABLE IF NOT EXISTS achievement_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      badge_code VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      star_count INT DEFAULT 1,
      icon VARCHAR(50) DEFAULT 'Star',
      criteria_type ENUM('TESTS_COMPLETED', 'SCORE_PERCENTAGE', 'WEEKLY_STREAK', 'SERIES_COMPLETED') NOT NULL,
      threshold_value DECIMAL(10, 2) NOT NULL,
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 13. Student Achievements Earned
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_achievements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      rule_id INT NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_student_badge (student_id, rule_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (rule_id) REFERENCES achievement_rules(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 14. Test Module Internal Notifications
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient_type ENUM('SUPER_ADMIN', 'STUDENT') NOT NULL,
      recipient_id INT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      link_url VARCHAR(255) NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 15. Test Audit Logs
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      user_role VARCHAR(50) DEFAULT 'SUPER_ADMIN',
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      details JSON NULL,
      ip_address VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default Categories if empty
  const [catRows]: any = await db.query('SELECT COUNT(*) as count FROM test_categories');
  if (catRows[0].count === 0) {
    await db.query(`
      INSERT INTO test_categories (name, slug, description, icon, display_order) VALUES
      ('Information Technology & Computer', 'it-computer', 'Fundamental and advanced computer application diplomas (ADCA, DCA, Python, Web)', 'Laptop', 1),
      ('Competitive SSC & CGL', 'ssc-cgl', 'Staff Selection Commission mock tests, Quantitative Aptitude and General Intelligence', 'Award', 2),
      ('Banking & IBPS PO', 'banking-ibps', 'Banking awareness, Numerical ability, English and Financial reasoning mock series', 'Building2', 3),
      ('Railway & Technical RRB', 'railway-rrb', 'Railway Recruitment Board technical aptitude and general science examinations', 'Train', 4),
      ('Accounting & Tally Prime', 'accounting-tally', 'Computerized financial accounting, GST invoicing, TDS and ledger practical exams', 'FileText', 5);
    `);
    console.log('✓ Seeded default test categories');
  }

  // Seed default Sub-Categories if empty
  const [subCatRows]: any = await db.query('SELECT COUNT(*) as count FROM test_sub_categories');
  if (subCatRows[0].count === 0) {
    const [cats]: any = await db.query('SELECT id, slug FROM test_categories');
    const itCat = cats.find((c: any) => c.slug === 'it-computer');
    const sscCat = cats.find((c: any) => c.slug === 'ssc-cgl');
    const bankCat = cats.find((c: any) => c.slug === 'banking-ibps');
    const rrbCat = cats.find((c: any) => c.slug === 'railway-rrb');
    const tallyCat = cats.find((c: any) => c.slug === 'accounting-tally');

    const subCatsToSeed: any[] = [];
    if (itCat) {
      subCatsToSeed.push(
        [itCat.id, 'ADCA Diploma', 'adca-diploma', 'Advanced Diploma in Computer Applications', 1],
        [itCat.id, 'DCA Certificate', 'dca-certificate', 'Diploma in Computer Applications', 2],
        [itCat.id, 'Python Programming', 'python-programming', 'Core and Advanced Python with OOP', 3],
        [itCat.id, 'Web Development', 'web-development', 'HTML, CSS, JavaScript, React basics', 4]
      );
    }
    if (sscCat) {
      subCatsToSeed.push(
        [sscCat.id, 'SSC CGL (Tier 1 & 2)', 'ssc-cgl-tier-1-2', 'Combined Graduate Level Examination', 1],
        [sscCat.id, 'SSC CHSL (10+2)', 'ssc-chsl', 'Combined Higher Secondary Level Examination', 2],
        [sscCat.id, 'SSC MTS & Havaldar', 'ssc-mts', 'Multi-Tasking Staff examination', 3],
        [sscCat.id, 'SSC GD Constable', 'ssc-gd-constable', 'General Duty Constable exam series', 4]
      );
    }
    if (bankCat) {
      subCatsToSeed.push(
        [bankCat.id, 'IBPS PO (Probationary Officer)', 'ibps-po', 'IBPS PO Prelims and Mains', 1],
        [bankCat.id, 'IBPS Clerk', 'ibps-clerk', 'Clerical Cadre National Examination', 2],
        [bankCat.id, 'SBI PO & Clerk', 'sbi-po-clerk', 'State Bank of India Examinations', 3]
      );
    }
    if (rrbCat) {
      subCatsToSeed.push(
        [rrbCat.id, 'RRB NTPC (Non-Technical)', 'rrb-ntpc', 'Non-Technical Popular Categories', 1],
        [rrbCat.id, 'RRB Group D', 'rrb-group-d', 'Level 1 Posts Examination', 2],
        [rrbCat.id, 'RRB ALP & Technician', 'rrb-alp', 'Assistant Loco Pilot Examination', 3]
      );
    }
    if (tallyCat) {
      subCatsToSeed.push(
        [tallyCat.id, 'Tally Prime with GST', 'tally-prime-gst', 'Financial accounting & GST invoicing', 1],
        [tallyCat.id, 'Advanced Excel for Accountants', 'advanced-excel', 'Pivot tables, VLOOKUP, Financial formulas', 2]
      );
    }

    for (const sc of subCatsToSeed) {
      await db.query(`
        INSERT INTO test_sub_categories (category_id, name, slug, description, display_order)
        VALUES (?, ?, ?, ?, ?)
      `, sc);
    }
    console.log('✓ Seeded default test sub-categories');
  }

  // Auto-backfill sub_category_id for existing test series where NULL
  try {
    await db.query(`UPDATE test_series SET category_id = 1 WHERE id = 13 AND (category_id = 7 OR category_id IS NULL)`);
    await db.query(`UPDATE test_series SET sub_category_id = 2 WHERE id = 13 AND sub_category_id IS NULL`);
    await db.query(`
      UPDATE test_series ts
      JOIN test_sub_categories sc ON ts.sub_category_id IS NULL AND (
        (LOWER(ts.title) LIKE '%adca%' AND LOWER(sc.name) LIKE '%adca%') OR
        (LOWER(ts.title) LIKE '%dca%' AND LOWER(sc.name) LIKE '%dca%') OR
        (LOWER(ts.title) LIKE '%web%' AND LOWER(sc.name) LIKE '%web%') OR
        (LOWER(ts.title) LIKE '%python%' AND LOWER(sc.name) LIKE '%python%') OR
        (LOWER(ts.title) LIKE '%ssc cgl%' AND LOWER(sc.name) LIKE '%ssc cgl%') OR
        (LOWER(ts.title) LIKE '%group d%' AND LOWER(sc.name) LIKE '%group d%') OR
        (LOWER(ts.title) LIKE '%ntpc%' AND LOWER(sc.name) LIKE '%ntpc%') OR
        (LOWER(ts.title) LIKE '%ibps po%' AND LOWER(sc.name) LIKE '%ibps po%') OR
        (LOWER(ts.title) LIKE '%tally%' AND LOWER(sc.name) LIKE '%tally%')
      )
      SET ts.sub_category_id = sc.id
    `);
  } catch (err: any) {
    // Graceful fallback if table or columns are not ready
  }

  // Seed default Global Payment QR if empty
  const [qrRows]: any = await db.query('SELECT COUNT(*) as count FROM test_payment_qr');
  if (qrRows[0].count === 0) {
    await db.query(`
      INSERT INTO test_payment_qr (title, upi_id, account_name, qr_image_url, instructions, is_global_default) VALUES
      ('Examirror Central Fee Payment UPI', 'examirror.edu@icici', 'EXAMIRROR NATIONAL SKILL COUNCIL', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=examirror.edu@icici%26pn=EXAMIRROR%26cu=INR', 'Scan the QR code with any UPI app (GPay, PhonePe, Paytm) and enter the 12-digit UTR/Transaction Reference ID below.', TRUE);
    `);
    console.log('✓ Seeded global payment QR');
  }

  // Seed default Achievement Rules if empty
  const [ruleRows]: any = await db.query('SELECT COUNT(*) as count FROM achievement_rules');
  if (ruleRows[0].count === 0) {
    await db.query(`
      INSERT INTO achievement_rules (badge_code, title, description, star_count, icon, criteria_type, threshold_value) VALUES
      ('FIRST_TEST', 'First Test Milestone', 'Completed your very first mock examination successfully.', 1, 'Star', 'TESTS_COMPLETED', 1.00),
      ('FIVE_TESTS', 'Consistent Scholar', 'Completed 5 full-length mock examinations.', 2, 'Award', 'TESTS_COMPLETED', 5.00),
      ('TEN_TESTS', 'Master Challenger', 'Completed 10 mock examinations with verified scoring.', 3, 'Trophy', 'TESTS_COMPLETED', 10.00),
      ('HIGH_ACCURACY_80', 'High Accuracy Star (80%+)', 'Attained 80% or higher overall test accuracy in an examination.', 4, 'Sparkles', 'SCORE_PERCENTAGE', 80.00),
      ('SUPER_SCORER_90', 'Distinction Champion (90%+)', 'Attained exceptional score of 90% or above in an examination.', 5, 'Crown', 'SCORE_PERCENTAGE', 90.00),
      ('WEEKLY_STREAK_4', '4-Week Relentless Streak', 'Attempted weekly tests continuously for 4 consecutive weeks.', 4, 'Flame', 'WEEKLY_STREAK', 4.00);
    `);
    console.log('✓ Seeded achievement rules');
  }

  // Seed Sample Production Test Series if empty
  const [seriesRows]: any = await db.query('SELECT COUNT(*) as count FROM test_series');
  if (seriesRows[0].count === 0) {
    const [cats]: any = await db.query('SELECT id, slug FROM test_categories');
    const itCat = cats.find((c: any) => c.slug === 'it-computer') || cats[0];
    const sscCat = cats.find((c: any) => c.slug === 'ssc-cgl') || cats[0];

    // 1. Free IT Computer Test Series
    const [resFree]: any = await db.query(`
      INSERT INTO test_series (
        title, slug, category_id, description, thumbnail_url, instructions,
        exam_type, language, difficulty, total_tests, price, is_free,
        duration_minutes, validity_days, publish_scope, status
      ) VALUES (
        'Free Computer Fundamentals & ADCA Practice Mock',
        'free-adca-computer-practice-mock',
        ?,
        'Free full-length foundational examination covering MS Office, Operating Systems, Computer Hardware, and Internet safety for all enrolled students.',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
        '• Total 50 Multiple Choice Questions\\n• +2 Marks for each correct answer\\n• -0.50 Negative Marks for incorrect attempt\\n• Time limit: 45 Minutes\\n• Do not refresh or switch tabs during the test.',
        'National Skill Assessment', 'Hindi + English', 'ALL_LEVELS', 2, 0.00, TRUE,
        45, 180, 'ALL_CENTRES', 'PUBLISHED'
      );
    `, [itCat.id]);

    const freeSeriesId = resFree.insertId;

    // Add Test 1 to Free Series
    const [test1Res]: any = await db.query(`
      INSERT INTO tests (test_series_id, title, description, question_count, duration_minutes, total_marks, negative_marks, passing_marks, release_type, is_released, status, display_order)
      VALUES (?, 'ADCA Mock Test 01 - Fundamentals & MS Office', 'Foundational test covering CPU architecture, memory, Word and Excel formulas.', 10, 30, 20.00, 0.50, 8.00, 'IMMEDIATE', TRUE, 'LIVE', 1);
    `, [freeSeriesId]);

    const test1Id = test1Res.insertId;

    // Seed 10 realistic questions for Test 1
    const sampleQuestions = [
      {
        q: 'Which component is known as the "Brain of the Computer"?',
        sec: 'Computer Fundamentals',
        marks: 2.0, neg: 0.5,
        exp: 'The Central Processing Unit (CPU) executes instructions and performs all calculations.',
        opts: [{ k: 'A', t: 'Hard Disk Drive' }, { k: 'B', t: 'Central Processing Unit (CPU)', c: true }, { k: 'C', t: 'RAM' }, { k: 'D', t: 'SMPS' }]
      },
      {
        q: 'Which shortcut key is used to save an active document in Microsoft Word?',
        sec: 'MS Word',
        marks: 2.0, neg: 0.5,
        exp: 'Ctrl + S is the universal keyboard shortcut to save the active document.',
        opts: [{ k: 'A', t: 'Ctrl + P' }, { k: 'B', t: 'Ctrl + S', c: true }, { k: 'C', t: 'Ctrl + O' }, { k: 'D', t: 'Ctrl + V' }]
      },
      {
        q: 'In MS Excel, all formulas must begin with which symbol?',
        sec: 'MS Excel',
        marks: 2.0, neg: 0.5,
        exp: 'Every formula or calculation in MS Excel must start with an equal sign (=).',
        opts: [{ k: 'A', t: '=', c: true }, { k: 'B', t: '+' }, { k: 'C', t: '@' }, { k: 'D', t: '#' }]
      },
      {
        q: 'Which type of memory is volatile and loses its contents when power is turned off?',
        sec: 'Hardware & Architecture',
        marks: 2.0, neg: 0.5,
        exp: 'Random Access Memory (RAM) is volatile temporary storage.',
        opts: [{ k: 'A', t: 'ROM' }, { k: 'B', t: 'RAM', c: true }, { k: 'C', t: 'SSD' }, { k: 'D', t: 'Flash Drive' }]
      },
      {
        q: 'What is the full form of URL in web technology?',
        sec: 'Internet & Web',
        marks: 2.0, neg: 0.5,
        exp: 'URL stands for Uniform Resource Locator, identifying web resources.',
        opts: [{ k: 'A', t: 'Universal Real Link' }, { k: 'B', t: 'Uniform Resource Locator', c: true }, { k: 'C', t: 'United Routing Location' }, { k: 'D', t: 'User Resource Link' }]
      },
      {
        q: 'Which protocol is used for securely browsing encrypted web pages?',
        sec: 'Cyber Security',
        marks: 2.0, neg: 0.5,
        exp: 'HTTPS (HyperText Transfer Protocol Secure) encrypts communication over SSL/TLS.',
        opts: [{ k: 'A', t: 'FTP' }, { k: 'B', t: 'HTTP' }, { k: 'C', t: 'HTTPS', c: true }, { k: 'D', t: 'SMTP' }]
      },
      {
        q: 'Which function in MS Excel finds the highest value in a given range of cells?',
        sec: 'MS Excel',
        marks: 2.0, neg: 0.5,
        exp: '=MAX() returns the largest number in a specified set of values.',
        opts: [{ k: 'A', t: '=TOP()' }, { k: 'B', t: '=MAX()', c: true }, { k: 'C', t: '=HIGH()' }, { k: 'D', t: '=LARGEST()' }]
      },
      {
        q: 'What is the primary extension of a PowerPoint presentation file created in modern MS Office?',
        sec: 'MS PowerPoint',
        marks: 2.0, neg: 0.5,
        exp: '.pptx is the default XML-based presentation format.',
        opts: [{ k: 'A', t: '.docx' }, { k: 'B', t: '.xlsx' }, { k: 'C', t: '.pptx', c: true }, { k: 'D', t: '.pdf' }]
      },
      {
        q: 'What is the standard subnet mask for a Class C IPv4 Network?',
        sec: 'Networking',
        marks: 2.0, neg: 0.5,
        exp: '255.255.255.0 is standard for Class C (default /24 mask).',
        opts: [{ k: 'A', t: '255.0.0.0' }, { k: 'B', t: '255.255.0.0' }, { k: 'C', t: '255.255.255.0', c: true }, { k: 'D', t: '255.255.255.255' }]
      },
      {
        q: 'In Tally Prime, which voucher type is used for bank cash deposits or withdrawals?',
        sec: 'Financial Accounting',
        marks: 2.0, neg: 0.5,
        exp: 'Contra Voucher (F4) is used for transactions between Cash and Bank accounts.',
        opts: [{ k: 'A', t: 'Payment (F5)' }, { k: 'B', t: 'Contra (F4)', c: true }, { k: 'C', t: 'Receipt (F6)' }, { k: 'D', t: 'Journal (F7)' }]
      }
    ];

    for (let i = 0; i < sampleQuestions.length; i++) {
      const qData = sampleQuestions[i];
      const [qRes]: any = await db.query(`
        INSERT INTO questions (test_id, question_text, section_name, explanation, marks, negative_marks, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `, [test1Id, qData.q, qData.sec, qData.exp, qData.marks, qData.neg, i + 1]);

      const qId = qRes.insertId;
      for (const opt of qData.opts) {
        await db.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct)
          VALUES (?, ?, ?, ?);
        `, [qId, opt.k, opt.t, opt.c ? true : false]);
      }
    }

    // 2. Paid SSC CGL Complete Mock Test Series
    await db.query(`
      INSERT INTO test_series (
        title, slug, category_id, description, thumbnail_url, instructions,
        exam_type, language, difficulty, total_tests, price, is_free,
        duration_minutes, validity_days, publish_scope, status
      ) VALUES (
        'SSC CGL Tier-1 Complete National Mock Series 2026',
        'ssc-cgl-tier-1-complete-national-mock-series-2026',
        ?,
        'High-yield national level competitive test series with weekly new test releases, full all-India ranking, negative mark simulation, and detailed scorecards.',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
        '• 100 Questions per test\\n• +2.00 Marks for Correct, -0.50 Marks for Incorrect\\n• Time limit: 60 Minutes\\n• Detailed answer explanations provided upon submission.',
        'National Competitive', 'Bilingual (Hindi + English)', 'INTERMEDIATE', 10, 499.00, FALSE,
        60, 90, 'ALL_CENTRES', 'PUBLISHED'
      );
    `, [sscCat.id]);

    console.log('✓ Seeded sample production test series and questions');
  }

  console.log('--- Test Series Database Ready ---');
}

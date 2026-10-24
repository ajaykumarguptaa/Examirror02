import db from '../db';

/**
 * Initializes Student Wallet, Elite & Basic Pass, and Referral Database Tables & Schema
 */
export async function initStudentWalletDatabase() {
  console.log('--- Initializing Student Wallet & Exam Pass Database ---');

  // 1. Ensure students table has wallet and pass columns
  const alterColumns = [
    `ALTER TABLE students ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER course_fee`,
    `ALTER TABLE students ADD COLUMN active_pass_type VARCHAR(20) DEFAULT 'NONE' AFTER wallet_balance`,
    `ALTER TABLE students ADD COLUMN pass_expires_at TIMESTAMP NULL DEFAULT NULL AFTER active_pass_type`
  ];

  for (const query of alterColumns) {
    try {
      await db.query(query);
    } catch (e: any) {
      // Column already exists or duplicate column name error (safe to ignore)
    }
  }

  // 2. Student Wallet Transactions Ledger
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_wallet_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      type ENUM('CREDIT', 'DEBIT') NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'RECHARGE',
      amount DECIMAL(10, 2) NOT NULL,
      balance_before DECIMAL(10, 2) NOT NULL,
      balance_after DECIMAL(10, 2) NOT NULL,
      reference_id VARCHAR(100) NULL,
      description VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_student_wallet_txn (student_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Student Wallet Recharge Requests (Hybrid UPI QR Proof Upload)
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_wallet_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      utr_number VARCHAR(100) NOT NULL UNIQUE,
      screenshot_url TEXT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
      rejection_reason TEXT NULL,
      approved_by INT NULL,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_student_wallet_req_status (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Test Passes Master Catalog (Basic Pass & Elite Pass)
  await db.query(`
    CREATE TABLE IF NOT EXISTS test_passes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pass_type VARCHAR(20) NOT NULL UNIQUE,
      title VARCHAR(150) NOT NULL,
      subtitle VARCHAR(255) NULL,
      price DECIMAL(10, 2) NOT NULL,
      validity_days INT NOT NULL DEFAULT 365,
      features JSON NULL,
      badge_text VARCHAR(50) DEFAULT 'MOST POPULAR',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Seed Test Passes if empty
  const [existingPasses]: any = await db.query('SELECT COUNT(*) as count FROM test_passes');
  if (existingPasses[0]?.count === 0) {
    const basicFeatures = JSON.stringify([
      "Access to all Standard Mock Tests & Foundations",
      "Instant Scorecard & Detailed Question Solutions",
      "Topic-wise Performance Analytics",
      "Subject Weakness & Accuracy Analysis",
      "Valid for 90 Days"
    ]);

    const eliteFeatures = JSON.stringify([
      "👑 UNLIMITED 1-Click Access to ALL Paid Test Series",
      "⚡ Zero Extra Payment - Instant Test Activation",
      "🔄 Unlimited Mock Re-attempts & Practice Rounds",
      "🏆 Official All India Ranking (AIR) & Percentile Cards",
      "📥 Detailed Solution PDF Explanations",
      "⭐ VIP Candidate Verification Badge & Priority Support",
      "Valid for Full 365 Days (1 Year)"
    ]);

    await db.query(`
      INSERT INTO test_passes (pass_type, title, subtitle, price, validity_days, features, badge_text, is_active)
      VALUES 
        ('BASIC', 'Basic Practice Pass', 'Foundational Mock Tests & Solutions', 199.00, 90, ?, 'STARTER', 1),
        ('ELITE', 'Examirror Elite Pass 👑', 'All-Access VIP Pass to ALL Test Series & Live Mocks', 499.00, 365, ?, 'BEST VALUE', 1)
    `, [basicFeatures, eliteFeatures]);
    console.log('--- Seeded Basic and Elite Passes ---');
  }

  // 6. Student Pass Subscriptions Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_pass_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      pass_type VARCHAR(20) NOT NULL,
      amount_paid DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'WALLET',
      starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      status ENUM('ACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_student_pass_sub (student_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('--- Student Wallet & Exam Pass Tables Ready ---');
}

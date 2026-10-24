import db from '../db';
import { saveBase64File } from '../utils/fileStorage';
import { realtimeService } from './realtime.service';

export class StudentWalletService {
  /**
   * 1. Get Student Wallet Overview (Balance, Active Pass, Referrals & Recent Activity)
   */
  async getWalletOverview(studentId: number | string) {
    const sId = Number(studentId);
    if (!sId || isNaN(sId)) throw new Error('Invalid student ID');

    // Fetch student info
    const [students]: any = await db.query(
      `SELECT id, firstName, lastName, email, phone, wallet_balance, active_pass_type, pass_expires_at 
       FROM students WHERE id = ?`,
      [sId]
    );

    if (students.length === 0) throw new Error('Student account not found');
    const student = students[0];

    // Check pass expiration
    let activePassType = student.active_pass_type || 'NONE';
    const passExpiresAt = student.pass_expires_at ? new Date(student.pass_expires_at) : null;
    const isPassExpired = passExpiresAt && passExpiresAt.getTime() < Date.now();

    if (isPassExpired && activePassType !== 'NONE') {
      await db.query(`UPDATE students SET active_pass_type = 'NONE' WHERE id = ?`, [sId]);
      activePassType = 'NONE';
    }

    const hasElitePass = activePassType === 'ELITE' && !isPassExpired;
    const hasBasicPass = (activePassType === 'BASIC' || activePassType === 'ELITE') && !isPassExpired;

    // Fetch recent 10 transactions
    const [recentTxns]: any = await db.query(
      `SELECT * FROM student_wallet_transactions 
       WHERE student_id = ? 
       ORDER BY id DESC LIMIT 10`,
      [sId]
    );

    // Check pending recharge requests
    const [pendingRequests]: any = await db.query(
      `SELECT * FROM student_wallet_requests 
       WHERE student_id = ? AND status = 'PENDING' 
       ORDER BY id DESC LIMIT 5`,
      [sId]
    );

    const walletBalance = Number(student.wallet_balance || 0);

    return {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      walletBalance,
      isLowBalance: walletBalance < 50.0,
      activePass: {
        type: activePassType,
        isElite: hasElitePass,
        isBasic: hasBasicPass,
        expiresAt: passExpiresAt,
        daysRemaining: passExpiresAt ? Math.max(0, Math.ceil((passExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
      },
      recentTransactions: recentTxns,
      pendingRequests
    };
  }

  /**
   * 2. Get Full Paginated Wallet Ledger
   */
  async getTransactions(studentId: number | string, page: number = 1, limit: number = 30) {
    const sId = Number(studentId);
    const offset = Math.max(0, (page - 1) * limit);

    const [rows]: any = await db.query(
      `SELECT * FROM student_wallet_transactions 
       WHERE student_id = ? 
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [sId, Number(limit), Number(offset)]
    );

    const [total]: any = await db.query(
      `SELECT COUNT(*) as count FROM student_wallet_transactions WHERE student_id = ?`,
      [sId]
    );

    return {
      transactions: rows,
      total: total[0]?.count || 0,
      page,
      limit
    };
  }

  /**
   * 3. Submit UPI QR Recharge Request (Hybrid Verification)
   */
  async submitRechargeRequest(data: {
    studentId: number | string;
    amount: number;
    utrNumber: string;
    screenshot?: string;
  }) {
    const { studentId, amount, utrNumber, screenshot } = data;
    const sId = Number(studentId);
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 10) {
      throw new Error('Minimum recharge amount is ₹10.00');
    }

    const cleanUtr = (utrNumber || '').trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      throw new Error('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
    }

    // Check duplicate UTR
    const [existing]: any = await db.query(
      `SELECT id FROM student_wallet_requests WHERE utr_number = ?`,
      [cleanUtr]
    );
    if (existing.length > 0) {
      throw new Error('This UTR number has already been submitted. Duplicate transactions cannot be processed.');
    }

    // Also check test_payments UTR
    const [existingInTestPay]: any = await db.query(
      `SELECT id FROM test_payments WHERE utr_number = ?`,
      [cleanUtr]
    );
    if (existingInTestPay.length > 0) {
      throw new Error('This transaction reference is already linked to another order.');
    }

    // Fetch student info
    const [students]: any = await db.query(`SELECT firstName, lastName, phone FROM students WHERE id = ?`, [sId]);
    if (students.length === 0) throw new Error('Student not found');
    const student = students[0];

    // Save screenshot if base64
    let screenshotUrl = screenshot || '';
    if (screenshotUrl.startsWith('data:image/')) {
      screenshotUrl = saveBase64File(screenshotUrl, `student-wallet-${sId}-${Date.now()}`, 'wallet-proofs');
    }

    const [insertResult]: any = await db.query(
      `INSERT INTO student_wallet_requests (student_id, amount, utr_number, screenshot_url, status)
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [sId, numAmount, cleanUtr, screenshotUrl]
    );

    // Notify Super Admin via unified notification & realtime chime
    try {
      await realtimeService.notifyAdmin(
        '💳 Student Wallet Recharge Request',
        `Student ${student.firstName} ${student.lastName} (Phone: ${student.phone || 'N/A'}) submitted wallet recharge of ₹${numAmount} (UTR: ${cleanUtr}).`,
        'student_wallet_recharge',
        { studentId: sId, amount: numAmount, utrNumber: cleanUtr, requestId: insertResult.insertId },
        '/admin/wallet-requests?tab=student'
      );
      realtimeService.emitToAdmin('student_wallet_request_created', {
        requestId: insertResult.insertId,
        studentId: sId,
        amount: numAmount,
        utrNumber: cleanUtr
      });
    } catch (e) {
      console.warn('[StudentWallet] Failed to notify admin:', e);
    }

    return {
      success: true,
      requestId: insertResult.insertId,
      message: 'Recharge request submitted successfully! Your wallet will be credited once verified.'
    };
  }

  /**
   * 4. Secondary Confirmation Instant Purchase: Test Series via Wallet
   */
  async purchaseTestSeriesWithWallet(studentId: number | string, seriesId: number | string) {
    const sId = Number(studentId);
    const sSeriesId = Number(seriesId);

    // Fetch Student
    const [students]: any = await db.query(
      `SELECT id, firstName, lastName, centerId, wallet_balance, active_pass_type, pass_expires_at FROM students WHERE id = ?`,
      [sId]
    );
    if (students.length === 0) throw new Error('Student account not found');
    const student = students[0];

    // Check if student has active Elite Pass
    const isElite = student.active_pass_type === 'ELITE' && 
                    student.pass_expires_at && 
                    new Date(student.pass_expires_at).getTime() > Date.now();

    // Fetch Series
    const [seriesList]: any = await db.query(
      `SELECT id, title, price, is_free, validity_days FROM test_series WHERE id = ?`,
      [sSeriesId]
    );
    if (seriesList.length === 0) throw new Error('Test series not found or removed');
    const series = seriesList[0];
    const seriesPrice = Number(series.price || 0);
    const validityDays = Number(series.validity_days || 90);

    // If student has Elite Pass or series is free, free enrollment!
    if (isElite || series.is_free || seriesPrice === 0) {
      await db.query(
        `INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status, expires_at)
         VALUES (?, ?, ?, 'PAID', 'APPROVED', DATE_ADD(NOW(), INTERVAL ? DAY))
         ON DUPLICATE KEY UPDATE status = 'APPROVED', expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)`,
        [sId, sSeriesId, student.centerId, validityDays, validityDays]
      );

      return {
        success: true,
        enrolledVia: isElite ? 'ELITE_PASS' : 'FREE',
        deductedAmount: 0,
        remainingBalance: Number(student.wallet_balance || 0),
        message: isElite ? '👑 Unlocked instantly with your active Elite Pass! Enjoy practicing.' : 'Enrolled successfully in free test series!'
      };
    }

    // Check Wallet Balance
    const currentBalance = Number(student.wallet_balance || 0);
    if (currentBalance < seriesPrice) {
      throw new Error(`Insufficient wallet balance. Required: ₹${seriesPrice.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}. Please recharge your wallet.`);
    }

    // Atomically Deduct Balance
    const [updateRes]: any = await db.query(
      `UPDATE students 
       SET wallet_balance = wallet_balance - ? 
       WHERE id = ? AND wallet_balance >= ?`,
      [seriesPrice, sId, seriesPrice]
    );

    if (updateRes.affectedRows === 0) {
      throw new Error('Transaction could not be completed due to insufficient balance.');
    }

    const newBalance = currentBalance - seriesPrice;

    // Log Ledger Transaction
    await db.query(
      `INSERT INTO student_wallet_transactions 
         (student_id, type, category, amount, balance_before, balance_after, reference_id, description)
       VALUES (?, 'DEBIT', 'TEST_SERIES_PURCHASE', ?, ?, ?, ?, ?)`,
      [
        sId,
        seriesPrice,
        currentBalance,
        newBalance,
        String(sSeriesId),
        `Enrolled in Test Series: ${series.title}`
      ]
    );

    // Grant Active Enrollment
    await db.query(
      `INSERT INTO test_series_enrollments (student_id, test_series_id, centre_id, enrollment_type, status, expires_at)
       VALUES (?, ?, ?, 'PAID', 'APPROVED', DATE_ADD(NOW(), INTERVAL ? DAY))
       ON DUPLICATE KEY UPDATE status = 'APPROVED', expires_at = DATE_ADD(NOW(), INTERVAL ? DAY)`,
      [sId, sSeriesId, student.centerId, validityDays, validityDays]
    );

    // Record in test_payments for accounting
    await db.query(
      `INSERT INTO test_payments (student_id, test_series_id, centre_id, amount, payment_method, utr_number, status, verified_at)
       VALUES (?, ?, ?, ?, 'WALLET', ?, 'APPROVED', NOW())`,
      [sId, sSeriesId, student.centerId, seriesPrice, `WAL-${Date.now()}-${sId}`]
    );

    return {
      success: true,
      enrolledVia: 'WALLET',
      deductedAmount: seriesPrice,
      remainingBalance: newBalance,
      message: `Successfully purchased "${series.title}" using your wallet! ₹${seriesPrice.toFixed(2)} deducted.`
    };
  }

  /**
   * 5. Secondary Confirmation Instant Purchase: Basic / Elite Pass via Wallet
   */
  async purchasePassWithWallet(studentId: number | string, passType: 'BASIC' | 'ELITE') {
    const sId = Number(studentId);
    const cleanType = passType.toUpperCase() as 'BASIC' | 'ELITE';

    // Fetch Pass Master
    const [passes]: any = await db.query(
      `SELECT * FROM test_passes WHERE pass_type = ? AND is_active = 1`,
      [cleanType]
    );
    if (passes.length === 0) throw new Error('Selected Exam Pass is currently unavailable');
    const pass = passes[0];
    const passPrice = Number(pass.price);
    const validityDays = Number(pass.validity_days || 365);

    // Fetch Student
    const [students]: any = await db.query(
      `SELECT id, firstName, lastName, wallet_balance, active_pass_type, pass_expires_at FROM students WHERE id = ?`,
      [sId]
    );
    if (students.length === 0) throw new Error('Student account not found');
    const student = students[0];

    const currentBalance = Number(student.wallet_balance || 0);
    if (currentBalance < passPrice) {
      throw new Error(`Insufficient wallet balance. Required: ₹${passPrice.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}. Please recharge your wallet.`);
    }

    // Atomically Deduct Balance
    const [updateRes]: any = await db.query(
      `UPDATE students 
       SET wallet_balance = wallet_balance - ? 
       WHERE id = ? AND wallet_balance >= ?`,
      [passPrice, sId, passPrice]
    );

    if (updateRes.affectedRows === 0) {
      throw new Error('Transaction could not be completed due to insufficient balance.');
    }

    const newBalance = currentBalance - passPrice;

    // Calculate new expiration date (extend if existing pass active)
    let newExpiresAt: Date;
    if (student.active_pass_type === cleanType && student.pass_expires_at && new Date(student.pass_expires_at).getTime() > Date.now()) {
      newExpiresAt = new Date(new Date(student.pass_expires_at).getTime() + validityDays * 24 * 60 * 60 * 1000);
    } else {
      newExpiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    }

    // Update Student Pass
    await db.query(
      `UPDATE students 
       SET active_pass_type = ?, pass_expires_at = ? 
       WHERE id = ?`,
      [cleanType, newExpiresAt, sId]
    );

    // Insert Subscription Record
    await db.query(
      `INSERT INTO student_pass_subscriptions (student_id, pass_type, amount_paid, payment_method, expires_at, status)
       VALUES (?, ?, ?, 'WALLET', ?, 'ACTIVE')`,
      [sId, cleanType, passPrice, newExpiresAt]
    );

    // Log Ledger Transaction
    await db.query(
      `INSERT INTO student_wallet_transactions 
         (student_id, type, category, amount, balance_before, balance_after, reference_id, description)
       VALUES (?, 'DEBIT', 'PASS_PURCHASE', ?, ?, ?, ?, ?)`,
      [
        sId,
        passPrice,
        currentBalance,
        newBalance,
        cleanType,
        `Purchased ${pass.title}`
      ]
    );

    return {
      success: true,
      passType: cleanType,
      deductedAmount: passPrice,
      remainingBalance: newBalance,
      expiresAt: newExpiresAt,
      message: `🎉 Congratulations! Your ${pass.title} is now ACTIVE! You now have unrestricted access to tests.`
    };
  }

  /**
   * 6. Get Available Test Passes Catalog
   */
  async getPassCatalog() {
    const [rows]: any = await db.query(`SELECT * FROM test_passes WHERE is_active = 1 ORDER BY price ASC`);
    return rows.map((p: any) => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
    }));
  }

  // =========================================================================
  // ADMIN WALLET REQUESTS MANAGEMENT
  // =========================================================================

  async getAdminWalletRequests(status?: string) {
    let query = `
      SELECT 
        swr.*,
        s.firstName as student_first_name,
        s.lastName as student_last_name,
        s.email as student_email,
        s.phone as student_phone,
        s.wallet_balance as student_current_balance,
        s.enrollment_no,
        c.name as center_name,
        c.center_code
      FROM student_wallet_requests swr
      JOIN students s ON swr.student_id = s.id
      LEFT JOIN centers c ON s.centerId = c.id
    `;
    const params: any[] = [];
    if (status) {
      query += ` WHERE swr.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY swr.id DESC LIMIT 100`;

    const [rows]: any = await db.query(query, params);
    return rows;
  }

  async approveWalletRequest(requestId: number | string, adminId: number | string) {
    const reqId = Number(requestId);
    const [requests]: any = await db.query(`SELECT * FROM student_wallet_requests WHERE id = ?`, [reqId]);
    if (requests.length === 0) throw new Error('Request not found');
    const req = requests[0];
    if (req.status !== 'PENDING') throw new Error(`Request has already been ${req.status.toLowerCase()}`);

    const amount = Number(req.amount);
    const studentId = req.student_id;

    // Fetch current student balance
    const [students]: any = await db.query(`SELECT wallet_balance FROM students WHERE id = ?`, [studentId]);
    const balanceBefore = Number(students[0]?.wallet_balance || 0);
    const balanceAfter = balanceBefore + amount;

    // Credit wallet & update request
    await db.query(`UPDATE students SET wallet_balance = wallet_balance + ? WHERE id = ?`, [amount, studentId]);
    await db.query(
      `UPDATE student_wallet_requests 
       SET status = 'APPROVED', approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      [Number(adminId) || 1, reqId]
    );

    // Record ledger transaction
    await db.query(
      `INSERT INTO student_wallet_transactions 
         (student_id, type, category, amount, balance_before, balance_after, reference_id, description)
       VALUES (?, 'CREDIT', 'RECHARGE', ?, ?, ?, ?, ?)`,
      [studentId, amount, balanceBefore, balanceAfter, req.utr_number, `UPI QR Wallet Recharge (UTR: ${req.utr_number})`]
    );

    // Notify student & emit events
    try {
      realtimeService.emitToAdmin('wallet-updated', { type: 'STUDENT_WALLET' });
      realtimeService.broadcastAll('student_wallet_updated', { studentId, newBalance: balanceAfter });
    } catch (_) {}

    return {
      success: true,
      creditedAmount: amount,
      newBalance: balanceAfter,
      message: `Request approved. ₹${amount.toFixed(2)} credited to student wallet.`
    };
  }

  async rejectWalletRequest(requestId: number | string, reason: string, adminId: number | string) {
    const reqId = Number(requestId);
    const [requests]: any = await db.query(`SELECT * FROM student_wallet_requests WHERE id = ?`, [reqId]);
    if (requests.length === 0) throw new Error('Request not found');
    const req = requests[0];
    if (req.status !== 'PENDING') throw new Error(`Request has already been ${req.status.toLowerCase()}`);

    await db.query(
      `UPDATE student_wallet_requests 
       SET status = 'REJECTED', rejection_reason = ?, approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      [reason || 'Invalid transaction details or unverified payment reference', Number(adminId) || 1, reqId]
    );

    try {
      realtimeService.emitToAdmin('wallet-updated', { type: 'STUDENT_WALLET' });
    } catch (_) {}

    return {
      success: true,
      message: 'Recharge request rejected.'
    };
  }
}

export const studentWalletService = new StudentWalletService();

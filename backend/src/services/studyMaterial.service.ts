import db from '../db';
import { saveBase64File } from '../utils/fileStorage';

export const studyMaterialService = {
  // Auto-publish any scheduled study materials
  autoPublishScheduled: async () => {
    try {
      const [res]: any = await db.query(`
        UPDATE study_materials
        SET status = 'PUBLISHED'
        WHERE status = 'SCHEDULED' 
          AND scheduled_publish_time IS NOT NULL 
          AND scheduled_publish_time <= NOW()
      `);
      return res.affectedRows || 0;
    } catch (e) {
      console.error('Error auto-publishing study materials:', e);
      return 0;
    }
  },

  // ADMIN: Get all study materials
  getAllAdmin: async (statusFilter?: string, categoryFilter?: string) => {
    await studyMaterialService.autoPublishScheduled();

    let sql = `
      SELECT sm.*,
             qr.upi_id as qr_upi_id, qr.account_name as qr_account_name,
             c.name as course_name,
             (SELECT COUNT(*) FROM study_material_purchases p WHERE p.material_id = sm.id AND p.status = 'APPROVED') as purchases_count,
             (SELECT COUNT(*) FROM study_material_purchases p WHERE p.material_id = sm.id AND p.status = 'PENDING') as pending_purchases_count,
             (SELECT COUNT(*) FROM center_material_distributions cmd WHERE cmd.material_id = sm.id) as distributed_centers_count
      FROM study_materials sm
      LEFT JOIN test_payment_qr qr ON sm.payment_qr_id = qr.id
      LEFT JOIN courses c ON sm.course_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      sql += ` AND sm.status = ?`;
      params.push(statusFilter);
    }
    if (categoryFilter && categoryFilter !== 'ALL') {
      sql += ` AND sm.category = ?`;
      params.push(categoryFilter);
    }

    sql += ` ORDER BY sm.id DESC`;

    const [rows]: any = await db.query(sql, params);

    // Fetch allowed centres
    for (const item of rows) {
      if (item.publish_scope === 'SELECTED_CENTRES') {
        const [centres]: any = await db.query(`
          SELECT centre_id FROM study_material_centres WHERE material_id = ?
        `, [item.id]);
        item.allowed_centre_ids = centres.map((c: any) => c.centre_id);
      } else {
        item.allowed_centre_ids = [];
      }
    }

    return rows;
  },

  // ADMIN: Create study material
  create: async (data: any, createdByType: 'admin' | 'center' = 'admin', createdById?: number) => {
    let fileUrl = data.file_url;
    if (fileUrl && fileUrl.startsWith('data:')) {
      fileUrl = saveBase64File(fileUrl, `mat-${Date.now()}`, 'study-materials');
    }

    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    const formatSqlDate = (d: any) => {
      if (!d || d === '' || d === 'null' || d === 'undefined') return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 19).replace('T', ' ');
    };

    const schedFormatted = formatSqlDate(data.scheduled_publish_time);
    let initialStatus = data.status || 'PUBLISHED';
    const schedDate = data.scheduled_publish_time ? new Date(data.scheduled_publish_time) : null;
    if (initialStatus === 'SCHEDULED' && schedDate && !isNaN(schedDate.getTime()) && schedDate.getTime() <= Date.now()) {
      initialStatus = 'PUBLISHED';
    }
    
    if (createdByType === 'center') {
      initialStatus = 'PENDING_APPROVAL';
    }

    const isFree = data.is_free !== undefined ? (Number(data.is_free) === 1 ? 1 : 0) : (Number(data.price || 0) <= 0 ? 1 : 0);
    const price = isFree ? 0.00 : Number(data.price || 0);
    const centerPrice = isFree ? 0.00 : Number(data.center_price || data.price || 0);
    const studentPrice = isFree ? 0.00 : Number(data.student_price || data.price || 0);
    const targetAudience = data.target_audience || 'STUDENT_DIRECT';
    const paymentQrId = data.payment_qr_id && Number(data.payment_qr_id) > 0 ? Number(data.payment_qr_id) : null;
    const courseId = data.course_id && Number(data.course_id) > 0 ? Number(data.course_id) : null;

    const [res]: any = await db.query(`
      INSERT INTO study_materials (
        title, slug, category, description, file_url, file_type, file_size, content_text,
        is_free, price, center_price, student_price, center_distribute_price, payment_qr_id, publish_scope, target_audience,
        course_id, status, scheduled_publish_time, watermark_enabled, created_by_type, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.title,
      slug,
      data.category || 'General',
      data.description || '',
      fileUrl || '',
      data.file_type || 'PDF',
      data.file_size || '2.5 MB',
      data.content_text || '',
      isFree,
      price,
      centerPrice,
      studentPrice,
      Number(data.center_distribute_price || 20),
      paymentQrId,
      data.publish_scope || 'ALL_CENTRES',
      targetAudience,
      courseId,
      initialStatus,
      schedFormatted,
      data.watermark_enabled !== undefined ? (data.watermark_enabled ? 1 : 0) : 1,
      createdByType,
      createdById || null
    ]);

    const materialId = res.insertId;

    // Handle selected centres
    if (data.publish_scope === 'SELECTED_CENTRES' && Array.isArray(data.allowed_centre_ids)) {
      for (const centreId of data.allowed_centre_ids) {
        await db.query(`
          INSERT IGNORE INTO study_material_centres (material_id, centre_id)
          VALUES (?, ?)
        `, [materialId, centreId]);
      }
    }

    return { id: materialId, ...data, slug, file_url: fileUrl };
  },

  // ADMIN: Update study material
  update: async (id: number | string, data: any) => {
    let fileUrl = data.file_url;
    if (fileUrl && fileUrl.startsWith('data:')) {
      fileUrl = saveBase64File(fileUrl, `mat-${Date.now()}`, 'study-materials');
    }

    const formatSqlDate = (d: any) => {
      if (!d || d === '' || d === 'null' || d === 'undefined') return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 19).replace('T', ' ');
    };

    const schedFormatted = formatSqlDate(data.scheduled_publish_time);
    let newStatus = data.status;
    const schedDate = data.scheduled_publish_time ? new Date(data.scheduled_publish_time) : null;
    if (newStatus === 'SCHEDULED' && schedDate && !isNaN(schedDate.getTime()) && schedDate.getTime() <= Date.now()) {
      newStatus = 'PUBLISHED';
    }

    const isFree = data.is_free !== undefined ? (Number(data.is_free) === 1 ? 1 : 0) : (data.price !== undefined && Number(data.price) <= 0 ? 1 : undefined);
    const paymentQrId = data.payment_qr_id !== undefined ? (data.payment_qr_id && Number(data.payment_qr_id) > 0 ? Number(data.payment_qr_id) : null) : null;
    const courseId = data.course_id !== undefined ? (data.course_id && Number(data.course_id) > 0 ? Number(data.course_id) : null) : null;

    await db.query(`
      UPDATE study_materials
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          file_url = COALESCE(?, file_url),
          file_type = COALESCE(?, file_type),
          file_size = COALESCE(?, file_size),
          content_text = COALESCE(?, content_text),
          is_free = COALESCE(?, is_free),
          price = COALESCE(?, price),
          center_price = COALESCE(?, center_price),
          student_price = COALESCE(?, student_price),
          center_distribute_price = COALESCE(?, center_distribute_price),
          payment_qr_id = ?,
          publish_scope = COALESCE(?, publish_scope),
          target_audience = COALESCE(?, target_audience),
          course_id = ?,
          status = COALESCE(?, status),
          scheduled_publish_time = COALESCE(?, scheduled_publish_time),
          watermark_enabled = COALESCE(?, watermark_enabled)
      WHERE id = ?
    `, [
      data.title,
      data.category,
      data.description,
      fileUrl,
      data.file_type,
      data.file_size,
      data.content_text,
      isFree,
      data.price !== undefined ? Number(data.price) : null,
      data.center_price !== undefined ? Number(data.center_price) : null,
      data.student_price !== undefined ? Number(data.student_price) : null,
      data.center_distribute_price !== undefined ? Number(data.center_distribute_price) : null,
      paymentQrId,
      data.publish_scope,
      data.target_audience,
      courseId,
      newStatus,
      schedFormatted,
      data.watermark_enabled !== undefined ? (data.watermark_enabled ? 1 : 0) : null,
      id
    ]);

    // Update centres
    if (data.publish_scope === 'SELECTED_CENTRES' && Array.isArray(data.allowed_centre_ids)) {
      await db.query('DELETE FROM study_material_centres WHERE material_id = ?', [id]);
      for (const centreId of data.allowed_centre_ids) {
        await db.query(`
          INSERT IGNORE INTO study_material_centres (material_id, centre_id)
          VALUES (?, ?)
        `, [id, centreId]);
      }
    }

    return { id, ...data };
  },

  // ADMIN: Delete
  delete: async (id: number | string) => {
    await db.query('DELETE FROM study_material_centres WHERE material_id = ?', [id]);
    await db.query('DELETE FROM study_material_purchases WHERE material_id = ?', [id]);
    await db.query('DELETE FROM center_material_distributions WHERE material_id = ?', [id]);
    await db.query('DELETE FROM center_material_purchases WHERE material_id = ?', [id]);
    await db.query('DELETE FROM study_materials WHERE id = ?', [id]);
    return { success: true };
  },

  // ADMIN: Get pending approvals for center created notes
  getPendingApprovals: async () => {
    const [rows]: any = await db.query(`
      SELECT sm.*, c.name as center_name, c.center_code, c.wallet_balance as center_wallet_balance
      FROM study_materials sm
      LEFT JOIN centers c ON sm.created_by_id = c.id
      WHERE sm.status = 'PENDING_APPROVAL' AND sm.created_by_type = 'center'
      ORDER BY sm.created_at DESC
    `);
    return rows;
  },

  // ADMIN: Approve Center Note
  approveCenterNote: async (id: number | string) => {
    const [rows]: any = await db.query(`SELECT * FROM study_materials WHERE id = ? AND status = 'PENDING_APPROVAL'`, [id]);
    if (!rows || rows.length === 0) throw new Error('Material not found or not pending approval');
    
    const mat = rows[0];
    if (mat.created_by_type !== 'center' || !mat.created_by_id) throw new Error('Material was not created by a center');
    
    const centerId = mat.created_by_id;

    // Get approval fee setting
    const [settingsRows]: any = await db.query(`SELECT value FROM settings WHERE key_name = 'enotes_approval_fee'`);
    let fee = 100;
    if (settingsRows && settingsRows.length > 0) {
      try {
        const val = typeof settingsRows[0].value === 'string' ? JSON.parse(settingsRows[0].value) : settingsRows[0].value;
        fee = val.fee !== undefined ? Number(val.fee) : 100;
      } catch (e) { }
    }

    // Check Center Wallet Balance
    const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
    const currentBal = Number(centerRows[0]?.wallet_balance || 0);
    if (currentBal < fee) {
      throw new Error(`Insufficient center wallet balance for approval fee (Required: ₹${fee.toFixed(2)}, Current: ₹${currentBal.toFixed(2)}). Approval blocked.`);
    }

    // Deduct Wallet
    await db.query('UPDATE centers SET wallet_balance = wallet_balance - ? WHERE id = ?', [fee, centerId]);

    // Record Wallet Transaction
    await db.query(`
      INSERT INTO wallet_transactions (centerId, type, amount, description, status)
      VALUES (?, 'DEBIT', ?, ?, 'COMPLETED')
    `, [centerId, fee, `Approval fee for created E-Note: ${mat.title}`]);

    // Update Status to PUBLISHED
    await db.query(`UPDATE study_materials SET status = 'PUBLISHED' WHERE id = ?`, [id]);

    // Automatically grant the center full access to distribute it (add to center_material_purchases)
    await db.query(`
      INSERT INTO center_material_purchases (material_id, center_id, amount, payment_mode, utr_number, status)
      VALUES (?, ?, 0, 'WALLET', 'CREATOR_AUTO_GRANT', 'APPROVED')
    `, [id, centerId]);

    return { success: true, message: `Material approved. ₹${fee} deducted from Center.` };
  },

  // ADMIN: Reject Center Note
  rejectCenterNote: async (id: number | string) => {
    const [rows]: any = await db.query(`SELECT * FROM study_materials WHERE id = ? AND status = 'PENDING_APPROVAL'`, [id]);
    if (!rows || rows.length === 0) throw new Error('Material not found or not pending approval');
    
    await db.query(`UPDATE study_materials SET status = 'ARCHIVED' WHERE id = ?`, [id]);
    return { success: true, message: 'Material rejected and archived.' };
  },

  // ADMIN: Get payment requests
  getPurchasesAdmin: async (statusFilter: string = 'ALL') => {
    let sql = `
      SELECT p.id, p.material_id, p.student_id, p.centre_id, p.amount, p.payment_mode, p.utr_number, p.screenshot_url, p.status, p.created_at,
             sm.title as material_title, sm.price as material_price, sm.category as material_category,
             s.firstName, s.lastName, s.email as student_email, s.phone as student_phone, s.enrollment_no, s.roll_no,
             cntr.name as center_name, cntr.center_code,
             'STUDENT' as buyer_type
      FROM study_material_purchases p
      JOIN study_materials sm ON p.material_id = sm.id
      JOIN students s ON p.student_id = s.id
      LEFT JOIN centers cntr ON p.centre_id = cntr.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (statusFilter && statusFilter !== 'ALL') {
      sql += ` AND p.status = ?`;
      params.push(statusFilter);
    }
    
    sql += `
      UNION ALL
      
      SELECT cp.id, cp.material_id, NULL as student_id, cp.center_id as centre_id, cp.amount, cp.payment_mode, cp.utr_number, NULL as screenshot_url, cp.status, cp.created_at,
             sm.title as material_title, sm.center_price as material_price, sm.category as material_category,
             NULL as firstName, NULL as lastName, NULL as student_email, NULL as student_phone, NULL as enrollment_no, NULL as roll_no,
             c.name as center_name, c.center_code,
             'CENTER' as buyer_type
      FROM center_material_purchases cp
      JOIN study_materials sm ON cp.material_id = sm.id
      JOIN centers c ON cp.center_id = c.id
      WHERE 1=1
    `;
    if (statusFilter && statusFilter !== 'ALL') {
      sql += ` AND cp.status = ?`;
      params.push(statusFilter);
    }
    
    sql += ` ORDER BY created_at DESC`;

    const [rows]: any = await db.query(sql, params);
    return rows;
  },

  // ADMIN: Verify purchase
  verifyPurchase: async (purchaseId: number | string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string, buyerType: 'STUDENT' | 'CENTER' = 'STUDENT') => {
    if (buyerType === 'CENTER') {
      await db.query(`
        UPDATE center_material_purchases
        SET status = ?
        WHERE id = ?
      `, [status, purchaseId]);
    } else {
      await db.query(`
        UPDATE study_material_purchases
        SET status = ?,
            rejection_reason = ?
        WHERE id = ?
      `, [status, rejectionReason || null, purchaseId]);
    }
    return { success: true };
  },

  // ==========================================
  // CENTER PORTAL: MATERIALS, BUY & DISTRIBUTE
  // ==========================================
  getForCenter: async (centerId: number | string) => {
    await studyMaterialService.autoPublishScheduled();

    const [rows]: any = await db.query(`
      SELECT sm.*,
             qr.upi_id as qr_upi_id, qr.account_name as qr_account_name, qr.qr_image_url,
             c.name as course_name,
             (
               SELECT COUNT(*) FROM students s 
               WHERE s.centerId = ? AND (sm.course_id IS NULL OR s.courseId = sm.course_id)
             ) as center_eligible_students_count,
             (
               SELECT cmd.created_at 
               FROM center_material_distributions cmd 
               WHERE cmd.material_id = sm.id AND cmd.center_id = ? 
               LIMIT 1
             ) as distributed_at,
             (
               SELECT GROUP_CONCAT(smp.student_id)
               FROM study_material_purchases smp 
               WHERE smp.material_id = sm.id AND smp.centre_id = ? AND smp.status = 'APPROVED'
             ) as distributed_student_ids,
             (
               SELECT cmp.status 
               FROM center_material_purchases cmp 
               WHERE cmp.material_id = sm.id AND cmp.center_id = ? 
               ORDER BY cmp.id DESC LIMIT 1
             ) as center_purchase_status
      FROM study_materials sm
      LEFT JOIN test_payment_qr qr ON sm.payment_qr_id = qr.id
      LEFT JOIN courses c ON sm.course_id = c.id
      WHERE (sm.status = 'PUBLISHED' OR (sm.status = 'PENDING_APPROVAL' AND sm.created_by_type = 'center' AND sm.created_by_id = ?))
        AND sm.target_audience IN ('CENTER_PURCHASE', 'BOTH')
        AND (
          sm.publish_scope = 'ALL_CENTRES'
          OR (sm.publish_scope = 'SELECTED_CENTRES' AND EXISTS (
            SELECT 1 FROM study_material_centres smc 
            WHERE smc.material_id = sm.id AND smc.centre_id = ?
          ))
        )
      ORDER BY sm.is_free DESC, sm.id DESC
    `, [centerId, centerId, centerId, centerId, centerId, centerId]);

    return rows.map((r: any) => ({
      ...r,
      distributed_student_ids: r.distributed_student_ids ? r.distributed_student_ids.split(',').map(Number) : [],
      is_distributed: Boolean(r.distributed_at) || Boolean(r.distributed_student_ids),
      is_unlocked_for_center: Number(r.is_free) === 1 || r.center_purchase_status === 'APPROVED'
    }));
  },

  // CENTER: Distribute study material to center's students
  distributeToStudents: async (materialId: number | string, centerId: number | string, distributionType: string = 'SELECTED_STUDENTS', studentIds?: number[]) => {
    if (!studentIds || studentIds.length === 0) {
      throw new Error('Please select at least one student to distribute the material to.');
    }

    const [matRows]: any = await db.query('SELECT center_distribute_price FROM study_materials WHERE id = ?', [materialId]);
    if (!matRows || matRows.length === 0) throw new Error('Material not found');
    
    // Check which students already have this material to prevent double charge
    const [existingRows]: any = await db.query(`
      SELECT student_id FROM study_material_purchases
      WHERE material_id = ? AND centre_id = ? AND status = 'APPROVED'
    `, [materialId, centerId]);
    
    const existingIds = existingRows.map((r: any) => Number(r.student_id));
    const newStudentIds = studentIds.filter(id => !existingIds.includes(Number(id)));

    if (newStudentIds.length === 0) {
      return { success: true, message: 'All selected students already have this material. No tokens deducted.' };
    }

    const perStudentFee = Number(matRows[0].center_distribute_price || 0);
    const tokenCost = newStudentIds.length * perStudentFee;

    // Check center wallet balance
    const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
    const currentBal = Number(centerRows[0]?.wallet_balance || 0);
    if (currentBal < tokenCost) {
      throw new Error(`Insufficient wallet balance. You need ${tokenCost} tokens to distribute this note to ${studentIds.length} students.`);
    }

    // Deduct wallet if fee > 0
    if (tokenCost > 0) {
      await db.query('UPDATE centers SET wallet_balance = wallet_balance - ? WHERE id = ?', [tokenCost, centerId]);

      // Record transaction
      await db.query(`
        INSERT INTO wallet_transactions (centerId, type, amount, description, status)
        VALUES (?, 'debit', ?, ?, 'Approved')
      `, [centerId, tokenCost, `Note Distribution Fee: ${studentIds.length} students @ ${perStudentFee} tokens each for Note #${materialId}`]);
    }

    // Grant access to each student via study_material_purchases
    for (const studentId of newStudentIds) {
      await db.query(`
        INSERT INTO study_material_purchases (material_id, student_id, centre_id, amount, payment_mode, utr_number, status)
        VALUES (?, ?, ?, 0, 'CENTER_WALLET', 'DISTRIBUTED_BY_CENTER', 'APPROVED')
      `, [materialId, studentId, centerId]);
    }

    return { success: true, message: `Study material successfully distributed to ${studentIds.length} students!` };
  },

  // CENTER: Purchase study material for center
  purchaseForCenter: async (materialId: number | string, centerId: number | string, data: any) => {
    const [matRows]: any = await db.query('SELECT center_price, price, is_free FROM study_materials WHERE id = ?', [materialId]);
    if (!matRows || matRows.length === 0) throw new Error('Material not found');

    const amount = matRows[0].center_price != null ? Number(matRows[0].center_price) : Number(matRows[0].price || 0);

    // Check if already purchased
    const [existingPurchase]: any = await db.query(`
      SELECT id FROM center_material_purchases 
      WHERE material_id = ? AND center_id = ? AND status IN ('APPROVED', 'PENDING')
    `, [materialId, centerId]);

    if (existingPurchase.length > 0) {
      throw new Error('This material has already been purchased or is pending approval for your center.');
    }

    // If payment via wallet, check center wallet balance
    if (data.payment_mode === 'WALLET') {
      const [centerRows]: any = await db.query('SELECT wallet_balance FROM centers WHERE id = ?', [centerId]);
      const currentBal = Number(centerRows[0]?.wallet_balance || 0);
      if (currentBal < amount) {
        throw new Error(`Insufficient center wallet balance (Current: ₹${currentBal.toFixed(2)}, Required: ₹${amount.toFixed(2)}). Please recharge wallet.`);
      }

      // Deduct wallet
      await db.query('UPDATE centers SET wallet_balance = wallet_balance - ? WHERE id = ?', [amount, centerId]);

      // Record transaction
      await db.query(`
        INSERT INTO wallet_transactions (centerId, type, amount, description, status)
        VALUES (?, 'debit', ?, ?, 'Approved')
      `, [centerId, amount, `Purchased Study Material ID #${materialId} for student distribution`]);
    }

    const status = data.payment_mode === 'WALLET' ? 'APPROVED' : 'PENDING';
    
    await db.query(`
      INSERT INTO center_material_purchases (material_id, center_id, amount, payment_mode, utr_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [materialId, centerId, amount, data.payment_mode || 'WALLET', data.utr_number || 'WALLET_DEBIT', status]);

    return { success: true, message: status === 'APPROVED' ? 'Material purchased successfully. You can now distribute it to your students!' : 'Payment submitted for verification. Material will be unlocked once approved.' };
  },

  // ==========================================
  // STUDENT PORTAL: ACCESSIBLE MATERIALS
  // ==========================================
  getForStudent: async (studentId: number | string) => {
    await studyMaterialService.autoPublishScheduled();

    // 1. Get student profile
    const [studentRows]: any = await db.query(`
      SELECT s.id, s.centerId, s.courseId FROM students s WHERE s.id = ?
    `, [studentId]);
    const student = studentRows[0];
    const centerId = student?.centerId;
    const courseId = student?.courseId;

    // 2. Query published study materials:
    // Accessible if:
    // A. DIRECT STUDENT ACCESS (published to student portal matching scope)
    // B. OR CENTER DISTRIBUTED (center purchased/distributed to their students)
    const [rows]: any = await db.query(`
      SELECT sm.id, sm.title, sm.slug, sm.category, sm.description, sm.file_type, sm.file_size,
             sm.is_free, sm.price, sm.student_price, sm.payment_qr_id, sm.publish_scope, sm.target_audience,
             sm.watermark_enabled, sm.downloads_count, sm.views_count, sm.created_at,
             qr.upi_id as qr_upi_id, qr.account_name as qr_account_name, qr.qr_image_url,
             (
               SELECT p.status 
               FROM study_material_purchases p 
               WHERE p.material_id = sm.id AND p.student_id = ? 
               ORDER BY p.id DESC LIMIT 1
             ) as purchase_status,
             (
               SELECT 1 
               FROM center_material_distributions cmd 
               WHERE cmd.material_id = sm.id AND cmd.center_id = ?
               LIMIT 1
             ) as is_center_distributed
      FROM study_materials sm
      LEFT JOIN test_payment_qr qr ON sm.payment_qr_id = qr.id
      WHERE sm.status = 'PUBLISHED'
        AND (
          -- CASE 1: Distributed by student's center
          EXISTS (
            SELECT 1 FROM center_material_distributions cmd 
            WHERE cmd.material_id = sm.id AND cmd.center_id = ?
          )
          -- CASE 2: Directly published to student portal
          OR (
            sm.target_audience IN ('STUDENT_DIRECT', 'BOTH')
            AND (
              sm.publish_scope = 'ALL_CENTRES'
              OR (sm.publish_scope = 'SELECTED_CENTRES' AND EXISTS (
                SELECT 1 FROM study_material_centres smc 
                WHERE smc.material_id = sm.id AND smc.centre_id = ?
              ))
              OR (sm.publish_scope = 'ENROLLED_STUDENTS' AND (sm.course_id = ? OR sm.course_id IS NULL))
            )
          )
        )
      ORDER BY sm.is_free DESC, sm.id DESC
    `, [studentId, centerId || 0, centerId || 0, centerId || 0, courseId || 0]);

    return rows.map((r: any) => {
      const isCenterUnlocked = Boolean(r.is_center_distributed);
      const isFree = Number(r.is_free) === 1;
      const isPurchased = r.purchase_status === 'APPROVED';

      return {
        ...r,
        price: r.student_price || r.price || 0,
        is_unlocked: isFree || isCenterUnlocked || isPurchased,
        source: isCenterUnlocked ? 'CENTER_PROVIDED' : 'DIRECT_PORTAL'
      };
    });
  },

  // STUDENT: Secure view study material with dynamic watermark payload
  getSecureContent: async (materialId: number | string, studentId: number | string, isAdmin: boolean = false, centerContextId?: string) => {
    // 1. Fetch material & student details
    const [matRows]: any = await db.query(`
      SELECT * FROM study_materials WHERE id = ? AND status = 'PUBLISHED'
    `, [materialId]);
    if (!matRows || matRows.length === 0) {
      throw new Error('Study material not found or not published.');
    }
    const mat = matRows[0];

    const [stuRows]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.enrollment_no, s.roll_no, s.centerId,
             cntr.name as centerName, cntr.center_code as centerCode
      FROM students s
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.id = ?
    `, [studentId]);
    const student = stuRows[0];

    // 2. Check access authorization
    let isAuthorized = isAdmin;

    if (centerContextId) {
      const actualCenterPrice = mat.center_price != null ? Number(mat.center_price) : Number(mat.price || 0);
      const isFreeForCenter = Number(mat.is_free) === 1 || actualCenterPrice <= 0;
      if (isFreeForCenter) {
        isAuthorized = true;
      } else {
        const [purRows]: any = await db.query(`
          SELECT status FROM center_material_purchases
          WHERE material_id = ? AND center_id = ? AND status = 'APPROVED'
        `, [materialId, centerContextId]);
        if (purRows && purRows.length > 0) isAuthorized = true;
      }
    } else {
      const actualStudentPrice = mat.student_price != null ? Number(mat.student_price) : Number(mat.price || 0);
      const isFree = Number(mat.is_free) === 1 || actualStudentPrice <= 0;
      if (isFree) isAuthorized = true;
    }

    if (!isAuthorized && student?.centerId) {
      // Check if center distributed it
      const [distRows]: any = await db.query(`
        SELECT 1 FROM center_material_distributions 
        WHERE material_id = ? AND center_id = ?
      `, [materialId, student.centerId]);
      if (distRows && distRows.length > 0) isAuthorized = true;
    }

    if (!isAuthorized && !centerContextId) {
      const [purRows]: any = await db.query(`
        SELECT status FROM study_material_purchases
        WHERE material_id = ? AND student_id = ? AND status = 'APPROVED'
      `, [materialId, studentId]);

      if (purRows && purRows.length > 0) isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new Error('Payment or Center Enrollment required. Please unlock this note.');
    }

    // 3. Increment views count
    await db.query('UPDATE study_materials SET views_count = views_count + 1 WHERE id = ?', [materialId]);

    // 4. Return secure content & anti-piracy watermark stamp
    let watermarkStamp: any;

    if (centerContextId) {
      const [cntRows]: any = await db.query('SELECT name, center_code FROM centers WHERE id = ?', [centerContextId]);
      const cntr = cntRows?.[0] || {};
      watermarkStamp = {
        watermarkText: `EXAMIRROR SECURE • CENTER ADMIN PREVIEW • CENTER: ${cntr.center_code || 'EXM'} • STRICTLY CONFIDENTIAL`,
        candidateName: `Center Admin`,
        rollNo: `CENTER-ADMIN-01`,
        enrollmentNo: `PREVIEW`,
        centerName: cntr.name || 'Examirror Authorized Study Center',
        centerCode: cntr.center_code || '6767',
        accessTime: new Date().toISOString()
      };
    } else {
      watermarkStamp = {
        watermarkText: `EXAMIRROR SECURE • CANDIDATE: ${(student?.firstName || '').toUpperCase()} ${(student?.lastName || '').toUpperCase()} • ROLL: ${student?.roll_no || 'N/A'} • ID: ${student?.enrollment_no || student?.id} • CENTER: ${student?.centerCode || 'EXM'} • STRICTLY CONFIDENTIAL`,
        candidateName: `${student?.firstName || ''} ${student?.lastName || ''}`,
        rollNo: student?.roll_no || `ROL-${10000 + (student?.id || 1)}`,
        enrollmentNo: student?.enrollment_no || `EXAM-2026-${student?.id || 1}`,
        centerName: student?.centerName || 'Examirror Authorized Study Center',
        centerCode: student?.centerCode || '6767',
        accessTime: new Date().toISOString()
      };
    }

    return {
      id: mat.id,
      title: mat.title,
      category: mat.category,
      description: mat.description,
      file_url: mat.file_url,
      file_type: mat.file_type,
      file_size: mat.file_size,
      content_text: mat.content_text,
      watermark_enabled: Boolean(mat.watermark_enabled),
      watermarkStamp
    };
  },

  // STUDENT: Submit purchase request
  submitPurchase: async (materialId: number | string, studentId: number | string, data: any) => {
    let proofUrl = data.screenshot_url;
    if (proofUrl && proofUrl.startsWith('data:')) {
      proofUrl = saveBase64File(proofUrl, `mat-pay-${Date.now()}`, 'material-payments');
    }

    const [stuRows]: any = await db.query('SELECT centerId FROM students WHERE id = ?', [studentId]);
    const centerId = stuRows[0]?.centerId || null;

    const [matRows]: any = await db.query('SELECT student_price, price FROM study_materials WHERE id = ?', [materialId]);
    const amount = Number(matRows[0]?.student_price || matRows[0]?.price || data.amount || 0);

    const [res]: any = await db.query(`
      INSERT INTO study_material_purchases (
        material_id, student_id, centre_id, amount, payment_mode, utr_number, screenshot_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      materialId,
      studentId,
      centerId,
      amount,
      data.payment_mode || 'UPI',
      data.utr_number || '',
      proofUrl || '',
    ]);

    return { id: res.insertId, success: true, message: 'Payment submitted for verification. Access will be unlocked once approved.' };
  }
};

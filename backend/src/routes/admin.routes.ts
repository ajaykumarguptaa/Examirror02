import db from '../db';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { adminService } from '../services/admin.service';
import { centerService } from '../services/center.service';
import { exportService } from '../services/export.service';
import { backupDatabaseToS3 } from '../utils/dbBackup';
import { notificationService } from '../services/notification.service';
import { realtimeService } from '../services/realtime.service';
import { getAuditLogs, logAudit } from '../utils/auditLogger';
import { hybridCache } from '../utils/redisCache';
import { runHousekeepingMaintenance } from '../utils/housekeeper';

import { verifyAdmin } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateBody, loginSchema, announcementSchema } from '../middleware/validate.middleware';

const router = Router();

// ==========================================
// 1. PUBLIC ADMIN LOGIN (Rate-limited)
// ==========================================
router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { username, password } = req.body;
  try {
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    // 1. Check database admins table
    try {
      const [adminRows]: any = await db.query(
        'SELECT * FROM admins WHERE (LOWER(TRIM(username)) = LOWER(?) OR LOWER(TRIM(email)) = LOWER(?)) AND status = "active"',
        [cleanUsername, cleanUsername]
      );

      if (adminRows && adminRows.length > 0) {
        const admin = adminRows[0];
        const isMatch = await bcrypt.compare(cleanPassword, admin.password_hash);
        if (isMatch) {
          const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role || 'superadmin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
          );
          return res.status(200).json({
            success: true,
            token,
            admin: { id: admin.id, username: admin.username, role: admin.role }
          });
        }
      }
    } catch (dbErr) {
      console.warn('Admin DB lookup warning:', dbErr);
    }

    // 2. Controlled developer credentials fallback if configured in env
    const devUser = process.env.ADMIN_USER || 'devAjay@108';
    const devPass = process.env.ADMIN_PASS || '108@Ajaydev';
    if (cleanUsername === devUser && cleanPassword === devPass) {
      const token = jwt.sign(
        { role: 'superadmin', username: cleanUsername },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );
      return res.status(200).json({ success: true, token, admin: { username: cleanUsername, role: 'superadmin' } });
    }

    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
});

// ==========================================
// 2. ENFORCE SUPERADMIN AUTHENTICATION FOR ALL REMAINING ROUTES
// ==========================================
router.use(verifyAdmin);

router.post('/announcements', validateBody(announcementSchema), async (req, res) => {
  try {
    const { title, message, expiryDate, target, type } = req.body;
    
    const notificationType = type || 'announcement';
    const targetAudience = target || 'center'; // 'center', 'student', or 'both'

    if (targetAudience === 'center' || targetAudience === 'both') {
      await notificationService.createNotification('center', null, title, message, notificationType, expiryDate || null);
      realtimeService.emitToCenter(null, 'notification', {
        title,
        message,
        type: notificationType,
        created_at: new Date().toISOString()
      });
    }
    if (targetAudience === 'student' || targetAudience === 'both') {
      await notificationService.createNotification('student', null, title, message, notificationType, expiryDate || null);
    }
    
    res.status(200).json({ success: true, message: `Announcement broadcasted to ${targetAudience === 'both' ? 'Centers & Students' : targetAudience === 'center' ? 'All Centers' : 'All Students'}!` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 100');
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, message, expiryDate, type } = req.body;
    await db.query(
      'UPDATE notifications SET title = ?, message = ?, type = ?, expiry_date = ? WHERE id = ? AND user_id IS NULL',
      [title, message, type || 'announcement', expiryDate || null, req.params.id]
    );
    res.status(200).json({ success: true, message: 'Broadcast updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = ? AND user_id IS NULL', [req.params.id]);
    res.status(200).json({ success: true, message: 'Broadcast deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const stats = await adminService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/centers', async (req, res) => {
  try {
    const rows = await adminService.getAllCenters();
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/centers/:id', async (req, res) => {
  try {
    const data = await adminService.getCenterDetails(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.delete('/centers/:id', async (req, res) => {
  try {
    await adminService.deleteCenter(req.params.id);
    res.status(200).json({ success: true, message: 'Center deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/centers/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  try {
    const result = await adminService.updateCenterPassword(req.params.id, newPassword);
    res.status(200).json({ success: true, message: 'Center password updated successfully', ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/centers/:id/password', async (req, res) => {
  const { newPassword } = req.body;
  try {
    const result = await adminService.updateCenterPassword(req.params.id, newPassword);
    res.status(200).json({ success: true, message: 'Center password updated successfully', ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/centers/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const cleanStatus = ['active', 'suspended', 'blocked', 'inactive'].includes(status) ? status : 'active';
    await db.query(
      'UPDATE centers SET status = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?', 
      [cleanStatus, req.params.id]
    );
    res.status(200).json({ success: true, message: `Center status updated to ${cleanStatus} and all active sessions terminated.` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/students', async (req, res) => {
  try {
    const rows = await adminService.getAllStudents();
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    await adminService.deleteStudent(req.params.id);
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/courses/:id/usage', async (req, res) => {
  try {
    const usageInfo = await adminService.checkCourseUsage(req.params.id);
    res.status(200).json({ success: true, data: usageInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await adminService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  const { code, name, categoryId, fee, shortDescription, duration, semesters, image_url, imageUrl, eligibility } = req.body;
  try {
    const img = image_url || imageUrl || undefined;
    await centerService.updateCourse(req.params.id, code, name, categoryId, fee, shortDescription, duration, semesters, img, eligibility);
    res.status(200).json({ success: true, message: 'Course updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/courses/:id/publish', async (req, res) => {
  try {
    const { is_published } = req.body;
    const courseId = req.params.id;

    if (!is_published) {
      // Find all centers actively using this course
      const [centerRows]: any = await db.query(`
        SELECT DISTINCT c.id, c.name, c.center_code,
               (SELECT COUNT(*) FROM students s WHERE s.courseId = cc.courseId AND s.centerId = c.id) as student_count
        FROM center_courses cc
        JOIN centers c ON cc.centerId = c.id
        WHERE cc.courseId = ?
      `, [courseId]);

      const [directStudentCenters]: any = await db.query(`
        SELECT DISTINCT c.id, c.name, c.center_code, COUNT(s.id) as student_count
        FROM students s
        JOIN centers c ON s.centerId = c.id
        WHERE s.courseId = ?
        GROUP BY c.id, c.name, c.center_code
      `, [courseId]);

      const centerMap = new Map();
      for (const row of centerRows) {
        centerMap.set(row.id, {
          id: row.id,
          name: row.name,
          center_code: row.center_code,
          student_count: Number(row.student_count) || 0
        });
      }
      for (const row of directStudentCenters) {
        if (centerMap.has(row.id)) {
          const existing = centerMap.get(row.id);
          existing.student_count = Math.max(existing.student_count, Number(row.student_count) || 0);
        } else {
          centerMap.set(row.id, {
            id: row.id,
            name: row.name,
            center_code: row.center_code,
            student_count: Number(row.student_count) || 0
          });
        }
      }

      const activeCenters = Array.from(centerMap.values());

      if (activeCenters.length > 0) {
        return res.status(200).json({ 
          success: false, 
          inUse: true,
          blocked: true,
          centers: activeCenters,
          message: `Cannot unpublish: This course is actively being used by ${activeCenters.length} study center(s).`
        });
      }
    }

    await adminService.toggleCoursePublish(courseId, is_published);
    res.status(200).json({ 
      success: true, 
      message: is_published ? 'Course published successfully!' : 'Course unpublished successfully!' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/courses/:id/semesters/:semIndex/publish', async (req, res) => {
  try {
    const { is_published } = req.body;
    await adminService.toggleSemesterPublish(req.params.id, parseInt(req.params.semIndex), is_published);
    res.status(200).json({ success: true, message: 'Semester publish status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- WALLET REQUESTS ---
router.get('/wallet-requests', async (req, res) => {
  const { status } = req.query;
  try {
    const requests = await adminService.getWalletRequests(status as string);
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/wallet-requests/check-duplicate/:utr', async (req, res) => {
  try {
    const data = await adminService.checkDuplicateUTR(req.params.utr);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wallet-requests/:id/approve', async (req, res) => {
  const { bonusTokens, verifiedAmount } = req.body;
  try {
    const result = await adminService.approveWalletRequest(req.params.id, bonusTokens, verifiedAmount);
    res.status(200).json({ success: true, message: 'Wallet request approved and tokens credited successfully', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/wallet-requests/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await adminService.rejectWalletRequest(req.params.id, reason);
    res.status(200).json({ success: true, message: 'Wallet request rejected', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/activities', async (req, res) => {
  try {
    const data = await adminService.getRecentActivities();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/centers/:id/wallet-adjust', async (req, res) => {
  const { amount, type, reason } = req.body;
  try {
    const result = await adminService.adjustCenterWallet(req.params.id, amount, type, reason);
    res.status(200).json({ success: true, message: 'Wallet adjusted successfully', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const data = await adminService.getAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    const data = await adminService.getAllGallery();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gallery', async (req, res) => {
  const { imageUrl, caption } = req.body;
  try {
    const result = await adminService.addGalleryItem(imageUrl, caption);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  try {
    await adminService.deleteGalleryItem(req.params.id);
    res.status(200).json({ success: true, message: 'Gallery item removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- SUPER ADMIN EXCEL BACKUP & EXPORT ENDPOINTS ---

/**
 * Complete Master Database Backup (.xlsx)
 * Exports all centers, students, courses, wallet ledgers, topups, and exams in one styled multi-sheet workbook.
 */
router.get('/export/master', async (req, res) => {
  try {
    const workbook = await exportService.generateMasterBackupExcel();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Academy_Master_Backup_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Master export error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate master Excel backup: ' + error.message });
  }
});

/**
 * Center-Wise Dedicated Backup (.xlsx)
 * Exports full data for a specific center (Profile, Students, Courses, Wallet, Requests).
 */
router.get('/export/center/:id', async (req, res) => {
  try {
    const centerId = req.params.id;
    const workbook = await exportService.generateSingleCenterBackupExcel(centerId);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Center_${centerId}_Backup_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Center export error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate center Excel backup: ' + error.message });
  }
});

/**
 * On-Demand MySQL Database Backup to AWS S3 (Disaster Recovery)
 */
router.post('/backup/database-s3', verifyAdmin, async (_req, res) => {
  try {
    const result = await backupDatabaseToS3();
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || 'Database backup failed' });
    }
    res.status(200).json({
      success: true,
      message: `Database backed up to AWS S3! (${result.compressedSizeKB} KB, ${result.tableCount} tables)`,
      data: result,
    });
  } catch (error: any) {
    console.error('Database backup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Database backup error' });
  }
});

// --- FRANCHISE REQUESTS ROUTES ---
router.get('/franchise-requests', async (req, res) => {
  const { status } = req.query;
  try {
    const data = await adminService.getFranchiseRequests(status as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/franchise-requests/:id', async (req, res) => {
  try {
    const data = await adminService.getFranchiseRequestById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/franchise-requests/:id/approve', async (req, res) => {
  const { centerCode, initialWallet, password } = req.body;
  try {
    const result = await adminService.approveFranchiseRequest(req.params.id, centerCode, initialWallet, password);
    res.status(200).json({ success: true, message: 'Franchise application approved and Center provisioned successfully!', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/franchise-requests/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await adminService.rejectFranchiseRequest(req.params.id, reason);
    res.status(200).json({ success: true, message: 'Franchise application rejected', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/franchise-requests/:id/soft-delete', async (req, res) => {
  try {
    const result = await adminService.softDeleteFranchiseRequest(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/franchise-requests/:id/restore', async (req, res) => {
  try {
    const result = await adminService.restoreFranchiseRequest(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/franchise-requests/:id', async (req, res) => {
  try {
    await adminService.deleteFranchiseRequest(req.params.id);
    res.status(200).json({ success: true, message: 'Franchise application permanently deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Certificate Governance: Secondary Confirmation & Demanding Documents
router.post('/franchise-requests/:id/approve-certificate', async (req, res) => {
  const { notes } = req.body;
  try {
    const result = await adminService.approveCenterCertificate(req.params.id, notes);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/franchise-requests/:id/demand-certificate-docs', async (req, res) => {
  const { notes, demandedDocs } = req.body;
  try {
    const result = await adminService.demandCenterCertificateDocs(req.params.id, notes, demandedDocs);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/centers/:id/approve-certificate', async (req, res) => {
  const { notes } = req.body;
  try {
    const result = await adminService.approveCenterCertificate(req.params.id, notes);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/centers/:id/demand-certificate-docs', async (req, res) => {
  const { notes, demandedDocs } = req.body;
  try {
    const result = await adminService.demandCenterCertificateDocs(req.params.id, notes, demandedDocs);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// --- CONTACT QUERIES / INQUIRIES ENDPOINTS ---
router.get('/contact-queries', async (req, res) => {
  const { status } = req.query;
  try {
    const data = await adminService.getContactQueries(status as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/contact-queries/:id/status', async (req, res) => {
  const { status, adminNotes } = req.body;
  try {
    const result = await adminService.updateContactQueryStatus(req.params.id, status, adminNotes);
    res.status(200).json({ success: true, message: 'Status updated successfully', result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/contact-queries/:id', async (req, res) => {
  try {
    await adminService.deleteContactQuery(req.params.id);
    res.status(200).json({ success: true, message: 'Contact inquiry deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- DYNAMIC ONLINE TEST PRICING & QUOTA MANAGEMENT ---
router.get('/online-test-pricing', async (req, res) => {
  try {
    const data = await adminService.getOnlineTestPricingOverview();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/online-test-pricing', async (req, res) => {
  try {
    const data = await adminService.updateOnlineTestPricingConfig(req.body);
    res.status(200).json({ success: true, message: 'Online test pricing configuration updated successfully!', data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/centers/:id/pricing-override', async (req, res) => {
  try {
    const centerId = req.params.id;
    const val = Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null;
    await db.query('UPDATE centers SET custom_pricing_config = ? WHERE id = ?', [val, centerId]);
    res.status(200).json({ success: true, message: 'Center specific override saved!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/centers/:id/old-student-permission', async (req, res) => {
  try {
    const centerId = req.params.id;
    const { allow, hours = 2 } = req.body;
    
    if (allow) {
      const durationHours = Math.max(1, Number(hours) || 2);
      await db.query(
        'UPDATE centers SET old_student_allowed_until = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?',
        [durationHours, centerId]
      );
      const [rows]: any = await db.query(
        'SELECT old_student_allowed_until, TIMESTAMPDIFF(SECOND, NOW(), old_student_allowed_until) as seconds_left FROM centers WHERE id = ?',
        [centerId]
      );
      const allowedUntil = rows[0]?.old_student_allowed_until;
      const secondsLeft = rows[0]?.seconds_left || (durationHours * 3600);
      res.status(200).json({
        success: true,
        allowed: true,
        allowedUntil,
        secondsLeft,
        message: `Old student admission authorized for ${durationHours} hours!`
      });
    } else {
      await db.query('UPDATE centers SET old_student_allowed_until = NULL WHERE id = ?', [centerId]);
      res.status(200).json({
        success: true,
        allowed: false,
        allowedUntil: null,
        secondsLeft: 0,
        message: 'Old student admission disabled for this center.'
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/students/:id/marks', async (req: any, res: any) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM student_marks WHERE studentId = ? ORDER BY semester', [req.params.id]);
    res.status(200).json({ success: true, marks: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- SUPER ADMIN / AUTHORITY E-SIGNATURE & SEALS ---
router.get('/authority-signature', async (req, res) => {
  try {
    const data = await adminService.getAuthoritySignatureConfig();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/authority-signature', async (req, res) => {
  try {
    const data = await adminService.updateAuthoritySignatureConfig(req.body);
    res.status(200).json({ success: true, message: 'Authority E-Signature & Stamp updated successfully!', data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// --- SUPER ADMIN / TRAINING & TUTORIAL VIDEOS CUSTOMIZER ---
router.get('/training-videos', async (req, res) => {
  try {
    const data = await adminService.getAdminTrainingVideos();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/training-videos', async (req, res) => {
  try {
    const data = await adminService.saveAdminTrainingVideo(req.body);
    res.status(201).json({ success: true, message: 'Training video saved successfully!', data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/training-videos/:id', async (req, res) => {
  try {
    const data = await adminService.saveAdminTrainingVideo({ ...req.body, id: req.params.id });
    res.status(200).json({ success: true, message: 'Training video updated successfully!', data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/training-videos/:id', async (req, res) => {
  try {
    await adminService.deleteAdminTrainingVideo(req.params.id);
    res.status(200).json({ success: true, message: 'Training video deleted successfully!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/training-videos/batch', async (req, res) => {
  try {
    const data = await adminService.batchSaveAdminTrainingVideos(req.body.videos || req.body);
    res.status(200).json({ success: true, message: 'All training videos published successfully!', data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/audit-logs
 * Tamper-proof activity and security trail for Super Admin
 */
router.get('/audit-logs', verifyAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const action = req.query.action as string;
    const userType = req.query.userType as string;
    const search = req.query.search as string;

    const data = await getAuditLogs({ page, limit, action, userType, search });
    res.status(200).json({ success: true, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/admin/cache-stats
 * Diagnostics on L1 Memory and L2 Redis Cache
 */
router.get('/cache-stats', verifyAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    cache: hybridCache.getHealth()
  });
});

/**
 * POST /api/admin/cache-flush
 * Instantly purges all L1 in-memory and L2 Redis cached data
 */
router.post('/cache-flush', verifyAdmin, async (req, res) => {
  try {
    await hybridCache.flush();
    res.status(200).json({ success: true, message: 'All distributed and local cache stores flushed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/maintenance/housekeeping
 * Executes database housekeeping: purges 90-day read notifications & temp files
 */
router.post('/maintenance/housekeeping', verifyAdmin, async (req, res) => {
  try {
    const result = await runHousekeepingMaintenance();
    res.status(200).json({
      success: result.success,
      message: `Housekeeping complete: ${result.purgedNotifications} notifications purged, ${result.cleanedTempFiles} temp files removed.`,
      result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

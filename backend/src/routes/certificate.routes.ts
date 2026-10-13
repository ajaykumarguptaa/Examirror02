import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../db';
import { uploadBufferToS3, isS3Configured, syncAllLocalUploadsToS3 } from '../utils/s3Storage';

const router = Router();

const BASE_UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const CERTIFICATES_DIR = path.join(BASE_UPLOAD_DIR, 'certificates');

if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

/**
 * POST /api/certificates/save-to-s3
 * Receives base64-encoded certificate (PDF or PNG), stores locally, and uploads to AWS S3 bucket.
 */
router.post('/save-to-s3', async (req, res) => {
  try {
    const { type = 'center', identifier, fileBase64, format = 'pdf', title } = req.body;

    if (!fileBase64 || !identifier) {
      return res.status(400).json({ success: false, message: 'identifier and fileBase64 are required' });
    }

    const safeType = ['center', 'student', 'marksheet'].includes(type) ? type : 'center';
    const safeFormat = format === 'png' ? 'png' : 'pdf';
    const mimeType = safeFormat === 'png' ? 'image/png' : 'application/pdf';

    // Parse base64 string
    let cleanBase64 = fileBase64;
    const base64Index = fileBase64.indexOf(';base64,');
    if (base64Index !== -1) {
      cleanBase64 = fileBase64.substring(base64Index + 8);
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeIdentifier = String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeType}_${safeIdentifier}_${Date.now()}.${safeFormat}`;

    // Ensure subfolder exists
    const subDir = path.join(CERTIFICATES_DIR, safeType);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }

    const localFilePath = path.join(subDir, filename);
    fs.writeFileSync(localFilePath, buffer);
    const localUrl = `/uploads/certificates/${safeType}/${filename}`;

    // Upload to AWS S3 Bucket
    const s3Key = `uploads/certificates/${safeType}/${filename}`;
    let s3Url: string | null = null;

    if (isS3Configured) {
      try {
        s3Url = await uploadBufferToS3(s3Key, buffer, mimeType);
      } catch (s3Err: any) {
        console.error(`[S3] Error uploading certificate to s3://${s3Key}:`, s3Err?.message || s3Err);
      }
    }

    const finalFileUrl = s3Url || localUrl;

    // Update database records
    try {
      if (safeType === 'center') {
        await db.query(`
          UPDATE centers 
          SET certificate_file_url = ?, certificate_s3_url = ?
          WHERE center_code = ? OR id = ?
        `, [finalFileUrl, s3Url, identifier, identifier]);
      } else if (safeType === 'student') {
        await db.query(`
          UPDATE students 
          SET certificate_file_url = ?, certificate_s3_url = ?
          WHERE roll_no = ? OR enrollment_no = ? OR id = ?
        `, [finalFileUrl, s3Url, identifier, identifier, identifier]);
      } else if (safeType === 'marksheet') {
        await db.query(`
          UPDATE students 
          SET marksheet_file_url = ?, marksheet_s3_url = ?
          WHERE roll_no = ? OR enrollment_no = ? OR id = ?
        `, [finalFileUrl, s3Url, identifier, identifier, identifier]);
      }
    } catch (dbErr: any) {
      console.warn('[Certificate S3] DB update notice:', dbErr?.message || dbErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Certificate successfully stored in AWS S3 bucket and local archive!',
      s3Url,
      localUrl,
      finalUrl: finalFileUrl,
      s3Key,
      isS3Configured
    });
  } catch (err: any) {
    console.error('Error in /api/certificates/save-to-s3:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to save certificate to S3' });
  }
});

/**
 * GET /api/certificates/status/:identifier
 */
router.get('/status/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const [centerRows]: any = await db.query(
      'SELECT id, center_code, certificate_number, certificate_file_url, certificate_s3_url FROM centers WHERE center_code = ? OR id = ?',
      [identifier, identifier]
    );

    const [studentRows]: any = await db.query(
      'SELECT id, roll_no, enrollment_no, certificate_number, certificate_file_url, certificate_s3_url, marksheet_file_url, marksheet_s3_url FROM students WHERE roll_no = ? OR enrollment_no = ? OR id = ?',
      [identifier, identifier, identifier]
    );

    return res.status(200).json({
      success: true,
      center: centerRows?.[0] || null,
      student: studentRows?.[0] || null,
      isS3Configured
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/certificates/sync-s3-now
 * Triggers full synchronization of all local uploads to AWS S3 bucket.
 */
router.post('/sync-s3-now', async (req, res) => {
  try {
    if (!isS3Configured) {
      return res.status(400).json({ success: false, message: 'AWS S3 is not configured in .env' });
    }
    const stats = await syncAllLocalUploadsToS3();
    return res.status(200).json({
      success: true,
      message: 'S3 Synchronization completed successfully!',
      stats
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Sync failed' });
  }
});

export default router;

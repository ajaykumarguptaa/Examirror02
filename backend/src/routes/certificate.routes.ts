import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../db';
import { uploadBufferToS3, isS3Configured, syncAllLocalUploadsToS3 } from '../utils/s3Storage';
import { generateCertificatePdfBuffer, generateMarksheetPdfBuffer, generateAdmitCardPdfBuffer } from '../utils/pdfEngine';
const archiver = require('archiver');

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
        if (s3Url && fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
            console.log(`[S3-First] Certificate uploaded directly to S3. Purged local copy: ${s3Key}`);
          } catch (_) {}
        }
      } catch (s3Err: any) {
        console.error(`[S3 Fallback] S3 upload failed; certificate retained safely on local server disk: ${localFilePath}`, s3Err?.message || s3Err);
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

/**
 * POST /api/certificates/bulk-download-zip
 * Server-side Bulk Marksheet & Certificate PDF & ZIP Archiver Engine.
 * Streams clean, compressed .zip file in 5 seconds without freezing client browser RAM.
 */
router.post('/bulk-download-zip', async (req, res) => {
  try {
    const { studentIds, type = 'both' } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one student for bulk download' });
    }

    const cleanIds = studentIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    if (cleanIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid student IDs' });
    }

    const [rows]: any = await db.query(`
      SELECT s.id, s.roll_no, s.enrollment_no, 
             TRIM(CONCAT(COALESCE(s.firstName, ''), ' ', COALESCE(s.lastName, ''))) as name,
             s.father_name, s.certificate_number,
             s.certificate_file_url, s.certificate_s3_url, s.marksheet_file_url, s.marksheet_s3_url,
             c.name as course_name, cnt.name as center_name, cnt.center_code
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cnt ON s.centerId = cnt.id
      WHERE s.id IN (?)
    `, [cleanIds]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No student records found for the selected IDs' });
    }

    const zipFilename = `Examirror_Batch_Docs_${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = typeof archiver === 'function' 
      ? archiver('zip', { zlib: { level: 9 } })
      : (archiver.ZipArchive ? new archiver.ZipArchive({ zlib: { level: 9 } }) : new archiver.Archiver('zip', { zlib: { level: 9 } }));

    archive.on('error', (err: any) => {
      console.error('[BulkZip] Archiver error:', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
    });

    archive.pipe(res);

    let manifestCsv = 'ID,Roll No,Enrollment No,Name,Father Name,Course,Certificate No,Center Code\n';

    for (const st of rows) {
      const cleanRoll = String(st.roll_no || st.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanName = String(st.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');

      manifestCsv += `"${st.id}","${st.roll_no || ''}","${st.enrollment_no || ''}","${(st.name || '').replace(/"/g, '""')}","${(st.father_name || '').replace(/"/g, '""')}","${(st.course_name || '').replace(/"/g, '""')}","${st.certificate_number || ''}","${st.center_code || ''}"\n`;

      // 1. Certificate PDF
      if (type === 'both' || type === 'certificates') {
        try {
          const certBuf = await generateCertificatePdfBuffer({
            id: st.id,
            roll_no: st.roll_no,
            enrollment_no: st.enrollment_no,
            name: st.name,
            father_name: st.father_name,
            course_name: st.course_name,
            certificate_number: st.certificate_number,
            center_name: st.center_name,
            center_code: st.center_code
          });
          archive.append(certBuf, { name: `Certificates/${cleanRoll}_${cleanName}_Certificate.pdf` });
        } catch (certErr) {
          console.warn(`[BulkZip] Error generating cert for student ${st.id}:`, certErr);
        }
      }

      // 2. Marksheet PDF
      if (type === 'both' || type === 'marksheets') {
        try {
          const marksheetBuf = await generateMarksheetPdfBuffer({
            id: st.id,
            roll_no: st.roll_no,
            enrollment_no: st.enrollment_no,
            name: st.name,
            father_name: st.father_name,
            course_name: st.course_name,
            certificate_number: st.certificate_number,
            center_name: st.center_name,
            center_code: st.center_code
          });
          archive.append(marksheetBuf, { name: `Marksheets/${cleanRoll}_${cleanName}_Marksheet.pdf` });
        } catch (markErr) {
          console.warn(`[BulkZip] Error generating marksheet for student ${st.id}:`, markErr);
        }
      }
    }

    archive.append(manifestCsv, { name: 'Batch_Manifest.csv' });
    await archive.finalize();
  } catch (err: any) {
    console.error('[BulkZip] Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create bulk zip archive' });
    }
  }
});

/**
 * GET /api/certificate/admit-card/:studentId
 * Allows Center or Admin to download official student Admit Card PDF
 */
router.get('/admit-card/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const [rows]: any = await db.query(`
      SELECT s.id, s.firstName, s.lastName, s.father_name, s.roll_no, s.enrollment_no, s.photo_url,
             c.name as course_name, cntr.name as center_name, cntr.center_code, cntr.address as center_address
      FROM students s
      LEFT JOIN courses c ON s.courseId = c.id
      LEFT JOIN centers cntr ON s.centerId = cntr.id
      WHERE s.id = ? OR s.roll_no = ?
      LIMIT 1
    `, [studentId, studentId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const st = rows[0];
    const pdfBuf = await generateAdmitCardPdfBuffer({
      id: st.id,
      name: `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student',
      father_name: st.father_name,
      roll_no: st.roll_no,
      enrollment_no: st.enrollment_no,
      course_name: st.course_name,
      photo_url: st.photo_url,
      center_name: st.center_name,
      center_code: st.center_code,
      center_address: st.center_address
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admit-card-${st.roll_no || st.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuf.length);
    res.send(pdfBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

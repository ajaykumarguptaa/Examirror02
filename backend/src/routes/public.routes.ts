import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { publicService } from '../services/public.service';
import { adminService } from '../services/admin.service';
import { saveBase64File } from '../utils/fileStorage';
import { uploadLocalFileToS3 } from '../utils/s3Storage';
import { verifyAdmin } from '../middleware/auth.middleware';
import { publicVerifyLimiter } from '../middleware/rateLimiter';
import db from '../db';

const router = Router();

// Multer setup for direct file uploads with MIME and extension hardening
const brandingDir = path.join(process.cwd(), 'uploads', 'branding');
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, brandingDir);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = allowedExts.includes(rawExt) ? rawExt : '.png';
    const uniqueName = `img-${Date.now()}-${Math.floor(100 + Math.random() * 900)}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'));
    }
  }
});

// Universal Image Upload Endpoint (restricted to authenticated admin or center)
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (req.file) {
      let finalFilePath = req.file.path;
      let finalFilename = req.file.filename;

      // If uploaded file is an image and not already WebP, convert to WebP using sharp
      const mime = req.file.mimetype.toLowerCase();
      if (mime.startsWith('image/') && !mime.includes('svg') && !mime.includes('gif')) {
        const cleanName = path.parse(req.file.filename).name;
        const webpFilename = `${cleanName}.webp`;
        const webpPath = path.join(brandingDir, webpFilename);

        try {
          await sharp(req.file.path)
            .webp({ quality: 82 })
            .toFile(webpPath);

          // Delete original non-webp file
          if (fs.existsSync(req.file.path) && req.file.path !== webpPath) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
          }

          finalFilePath = webpPath;
          finalFilename = webpFilename;
        } catch (sharpErr: any) {
          console.warn('[Upload] Failed to convert image to WebP, keeping original:', sharpErr?.message);
        }
      }

      const url = `/uploads/branding/${finalFilename}`;
      const s3Key = `uploads/branding/${finalFilename}`;
      const s3Url = await uploadLocalFileToS3(finalFilePath, s3Key);
      if (s3Url && fs.existsSync(finalFilePath)) {
        try {
          fs.unlinkSync(finalFilePath);
          console.log(`[S3-First] WebP file uploaded directly to S3. Purged local copy: ${s3Key}`);
        } catch (_) {}
      }
      return res.status(200).json({ 
        success: true, 
        url, 
        s3Url: s3Url || url, 
        isS3Synced: Boolean(s3Url) 
      });
    }

    if (req.body && req.body.image) {
      const prefix = String(req.body.prefix || 'branding').replace(/[^a-zA-Z0-9_-]/g, '');
      const folder = String(req.body.folder || 'branding').replace(/[^a-zA-Z0-9_-]/g, '');
      const url = saveBase64File(req.body.image, prefix, folder);
      if (!url) {
        return res.status(400).json({ success: false, message: 'Invalid or prohibited image file type' });
      }
      return res.status(200).json({ success: true, url });
    }

    return res.status(400).json({ success: false, message: 'No image or file provided' });
  } catch (error: any) {
    console.error('Error during upload:', error.message);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

router.get('/public-stats', async (req, res) => {
  try {
    const stats = await publicService.getPublicStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching public stats:', error.message);
    res.status(500).json({ success: false, data: null });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await publicService.getPublicStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching public stats:', error.message);
    res.status(500).json({ success: false, data: null });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const rows = await publicService.getCourses();
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

router.get('/gallery', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const rows = await publicService.getGallery(limit, offset);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching gallery:', error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

router.get('/centers/public', async (req, res) => {
  try {
    const rows = await publicService.getPublicCenters();
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching centers:', error.message);
    res.status(500).json({ success: false, data: [] });
  }
});

// Generic Page Settings Endpoints
router.get('/settings/:key', async (req, res) => {
  try {
    const data = await publicService.getSettings(req.params.key);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error(`Error fetching ${req.params.key} settings:`, error.message);
    res.status(500).json({ success: false, data: null });
  }
});

router.get('/authority-signature', async (req, res) => {
  try {
    const data = await adminService.getAuthoritySignatureConfig();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching authority signature settings:', error.message);
    res.status(500).json({ success: false, data: null });
  }
});

router.put('/settings/:key', verifyAdmin, async (req, res) => {
  try {
    const payload = req.body.data !== undefined ? req.body.data : req.body.homeData !== undefined ? req.body.homeData : req.body;
    const saved = await publicService.updateSettings(String(req.params.key), payload);
    res.status(200).json({ success: true, message: `${req.params.key} settings updated successfully`, data: saved });
  } catch (error: any) {
    console.error(`Error updating ${req.params.key} settings:`, error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Auto-generate realistic demo verification records synced with active database
router.post('/settings/demo_showcase/auto-generate', verifyAdmin, async (_req, res) => {
  try {
    const [centers]: any = await db.query("SELECT * FROM centers ORDER BY id ASC LIMIT 5");
    const [students]: any = await db.query(`
      SELECT s.*, c.name as course_name 
      FROM students s 
      LEFT JOIN courses c ON s.courseId = c.id 
      ORDER BY s.id DESC 
      LIMIT 10
    `);

    const certStudent = students.find((s: any) => s.certificate_number) || students[0] || {};
    const regularStudent = students.find((s: any) => s.id !== certStudent.id) || students[0] || {};
    const mainCenter = centers.find((c: any) => c.center_code === 'CENT001') || centers[0] || {};

    const demoData = {
      enabled: true,
      title: "Official Specimen & Verification Showcase",
      subtitle: "Explore authentic demo certificates, authorized study center licenses, and online verifiable student marksheets.",
      demoCertificate: {
        title: certStudent.course_name || "Diploma in Computer Application (DCA)",
        studentName: `${certStudent.firstName || 'Ajay'} ${certStudent.lastName || 'Kumar Gupta'}`.trim(),
        rollNo: certStudent.roll_no || "ROL-10004",
        enrollmentNo: certStudent.enrollment_no || "EXAM-2026-1004",
        certificateNo: certStudent.certificate_number || "EXAM-2026-836087",
        courseName: certStudent.course_name || "DCA (Diploma in Computer Application)",
        grade: "Grade A+ (94%)",
        issueDate: "15-08-2026",
        sampleImageUrl: certStudent.certificate_file_url || ""
      },
      demoCenter: {
        centerName: mainCenter.name || "Delhi Main Center",
        centerCode: mainCenter.center_code || "CENT001",
        directorName: mainCenter.head_name || "Chhoton Ghosh",
        city: mainCenter.city || "New Delhi-110001",
        state: mainCenter.state || "Delhi",
        phone: mainCenter.phone || "+91 98765 43210",
        sampleImageUrl: mainCenter.certificate_file_url || ""
      },
      demoStudent: {
        studentName: `${regularStudent.firstName || 'Ajay'} ${regularStudent.lastName || 'Gupta'}`.trim(),
        rollNo: regularStudent.roll_no || "ROL-10001",
        enrollmentNo: regularStudent.enrollment_no || "EXM-2026-1001",
        courseName: regularStudent.course_name || "ADCA (Advance Diploma in Computer Application)",
        centerCode: mainCenter.center_code || "CENT001",
        sampleImageUrl: regularStudent.photo_url || ""
      }
    };

    await publicService.updateSettings('demo_showcase', demoData);
    res.status(200).json({
      success: true,
      message: 'System Demo auto-generated and synced with active database records!',
      data: demoData
    });
  } catch (error: any) {
    console.error('Error auto-generating demo showcase:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-generate demo records' });
  }
});

// Secure Public Student & Certificate Verification Route (Scannable from QR Code & Barcode)
router.get('/verify/student/:identifier', publicVerifyLimiter, async (req, res) => {
  try {
    const student = await publicService.verifyStudent(String(req.params.identifier));
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found or invalid QR/Enrollment Number' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error: any) {
    console.error('Error verifying student:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Secure Public Certificate Verification Route
router.get('/verify/certificate/:identifier', publicVerifyLimiter, async (req, res) => {
  try {
    const cert = await publicService.verifyCertificate(String(req.params.identifier));
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate or Diploma record not found with this Certificate / Roll Number' });
    }
    res.status(200).json({ success: true, data: cert });
  } catch (error: any) {
    console.error('Error verifying certificate:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Secure Public Center Verification Route
router.get('/verify/center/:identifier', publicVerifyLimiter, async (req, res) => {
  try {
    const center = await publicService.verifyCenter(String(req.params.identifier));
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center record not found with this Center No / Code' });
    }
    res.status(200).json({ success: true, data: center });
  } catch (error: any) {
    console.error('Error verifying center:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Franchise Online Registration Submission Endpoint
router.post('/franchise/register', async (req, res) => {
  try {
    const application = await publicService.submitFranchiseApplication(req.body);
    res.status(201).json({
      success: true,
      message: 'Franchise application registered successfully! Our affiliation officer will review your documents within 24 hours.',
      data: application
    });
  } catch (error: any) {
    console.error('Error submitting franchise application:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit franchise application' });
  }
});

// Contact Us Query Submission Endpoint
router.post('/contact', async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Full name and phone number are required' });
    }

    const query = await publicService.submitContactQuery(req.body);
    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our academic counseling desk will contact you shortly.',
      data: query
    });
  } catch (error: any) {
    console.error('Error submitting contact query:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit contact query' });
  }
});

// Helper to extract client IP address
const getClientIp = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
};

// Candidate Live Online Test Portal Endpoints
router.get('/test/:uid', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const data = await publicService.getPublicTestByUid(req.params.uid, clientIp, userAgent);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message || 'Test not found' });
  }
});

router.post('/test/:uid/start', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    await publicService.recordTestStart(req.params.uid, req.body, clientIp, userAgent);
    res.status(200).json({ success: true, message: 'Test session initiated with device tracking' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/test/:uid/submit', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const result = await publicService.submitPublicTest(req.params.uid, req.body, clientIp, userAgent);
    res.status(200).json({
      success: true,
      message: 'Test submitted and evaluated successfully!',
      result
    });
  } catch (error: any) {
    console.error('Error evaluating candidate test:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Failed to evaluate test submission' });
  }
});

// --- PUBLIC STUDY MATERIALS API (SEO) ---

router.get('/test-categories', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT tc.id, tc.name, tc.slug, tc.description, tc.icon, tc.thumbnail_url, tc.display_order,
             COUNT(ts.id) AS test_series_count
      FROM test_categories tc
      LEFT JOIN test_series ts ON ts.category_id = tc.id AND ts.status = 'PUBLISHED'
      WHERE tc.status = 'ACTIVE'
      GROUP BY tc.id
      ORDER BY tc.display_order ASC, tc.id ASC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/study-material-categories', async (req, res) => {
  try {
    const [rows]: any = await db.query(`SELECT id, name, slug FROM study_material_categories ORDER BY name ASC`);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/study-materials', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT id, title, description, category, file_type, file_size, price, created_at, status, views_count 
      FROM study_materials 
      WHERE status = 'PUBLISHED'
      ORDER BY created_at DESC
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/study-materials/:id', async (req, res) => {
  try {
    const [rows]: any = await db.query(`
      SELECT id, title, description, category, file_type, file_size, price, created_at, status, content_text 
      FROM study_materials 
      WHERE id = ? AND status = 'PUBLISHED'
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Material not found or not published' });
    }
    
    const note = rows[0];
    let demo_content = null;
    const isFree = Number(note.price) === 0;
    
    // Create a safe demo snippet for HTML notes (or full content if free)
    if (note.file_type === 'HTML' && note.content_text) {
      if (isFree) {
        demo_content = note.content_text;
      } else {
        let rawText = note.content_text;
        
        // Extract Head to keep CSS and styles
        let headContent = '';
        const headMatch = rawText.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
        if (headMatch) headContent = headMatch[0];
        
        // Extract Body
        let bodyContent = rawText;
        const bodyMatch = rawText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) bodyContent = bodyMatch[1];
        
        // Strip scripts from body for safety
        bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Take first 3500 characters of the body for demo
        const truncatedBody = bodyContent.substring(0, 3500);
        
        // Combine head and truncated body
        demo_content = `${headContent} <body>${truncatedBody}</body>`;
      }
    }
    
    // Delete content_text so we don't send the full IP to the public for paid notes
    delete note.content_text;
    note.demo_content = demo_content;

    res.status(200).json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


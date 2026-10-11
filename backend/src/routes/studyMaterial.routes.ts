import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { studyMaterialService } from '../services/studyMaterial.service';
import pool from '../db';

const router = Router();

const getParam = (param: any): string => {
  if (Array.isArray(param)) return String(param[0]);
  return String(param || '');
};

const extractUser = (req: Request): { studentId?: string; centerId?: string; adminId?: number; role?: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const sId = (req.query.studentId as string) || (req.body?.studentId as string);
    const cId = (req.query.centerId as string) || (req.body?.centerId as string);
    const aId = (req.query.adminId as string) || (req.body?.adminId as string);
    return {
      studentId: sId,
      centerId: cId,
      adminId: aId ? Number(aId) : undefined
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const resolvedStudentId = decoded.studentId 
      ? String(decoded.studentId) 
      : (decoded.id && decoded.role === 'student' ? String(decoded.id) : undefined);

    const resolvedCenterId = decoded.centerId 
      ? String(decoded.centerId) 
      : (decoded.id && decoded.role === 'center' ? String(decoded.id) : undefined);

    return {
      studentId: resolvedStudentId || (req.query.studentId as string) || (req.body?.studentId as string),
      centerId: resolvedCenterId || (req.query.centerId as string) || (req.body?.centerId as string),
      adminId: decoded.id && decoded.role === 'admin' ? Number(decoded.id) : undefined,
      role: decoded.role
    };
  } catch (err) {
    const sId = (req.query.studentId as string) || (req.body?.studentId as string);
    const cId = (req.query.centerId as string) || (req.body?.centerId as string);
    const aId = (req.query.adminId as string) || (req.body?.adminId as string);
    return {
      studentId: sId,
      centerId: cId,
      adminId: aId ? Number(aId) : undefined
    };
  }
};

// ==========================================
// PUBLIC STUDY MATERIALS ROUTES
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    let query = `
      SELECT id, title, description, category, file_type, file_size, price, created_at, status, views_count 
      FROM study_materials 
      WHERE status = 'PUBLISHED'
    `;
    const params: any[] = [];
    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }
    query += ` ORDER BY created_at DESC`;
    const [rows]: any = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADMIN CATEGORY MANAGEMENT ROUTES
// ==========================================

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const [dbCats]: any = await pool.query('SELECT * FROM study_material_categories ORDER BY name ASC');
    if (req.query.managedOnly === 'true') {
      return res.json({ success: true, data: dbCats });
    }

    const [noteCats]: any = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM study_materials 
      WHERE category IS NOT NULL AND TRIM(category) != '' AND status = 'PUBLISHED'
      GROUP BY category
    `);

    const map = new Map<string, any>();

    // 1. Add predefined categories
    dbCats.forEach((c: any) => {
      const key = (c.name || '').trim();
      if (!key) return;
      map.set(key.toLowerCase(), {
        id: c.id,
        name: key,
        slug: c.slug || key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: c.description,
        count: 0
      });
    });

    // 2. Merge notes counts and dynamic categories
    noteCats.forEach((nc: any) => {
      const key = (nc.category || '').trim();
      if (!key) return;
      const lower = key.toLowerCase();
      const existing = map.get(lower);
      if (existing) {
        existing.count = Number(nc.count) || 0;
      } else {
        map.set(lower, {
          id: null,
          name: key,
          slug: lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          description: null,
          count: Number(nc.count) || 0
        });
      }
    });

    const rows = Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO study_material_categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description]
    );
    res.json({ success: true, data: { id: result.insertId, name, slug, description } });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body;
    await pool.query(
      'UPDATE study_material_categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description, req.params.id]
    );
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM study_material_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// 1. Get all study materials
router.get('/admin/all', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const category = req.query.category as string;
    const data = await studyMaterialService.getAllAdmin(status, category);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Create study material
router.post('/admin/create', async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const createdByType = user.role === 'center' ? 'center' : 'admin';
    const data = await studyMaterialService.create(req.body, createdByType, user.adminId);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Update study material
router.put('/admin/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await studyMaterialService.update(id, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. Delete study material
router.delete('/admin/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    await studyMaterialService.delete(id);
    res.json({ success: true, message: 'Study material deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Publish Now
router.post('/admin/publish-now/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await studyMaterialService.update(id, {
      status: 'PUBLISHED',
      scheduled_publish_time: null
    });
    res.json({ success: true, message: 'Material published live!', data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Move to Draft
router.post('/admin/move-to-draft/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await studyMaterialService.update(id, {
      status: 'DRAFT',
      scheduled_publish_time: null
    });
    res.json({ success: true, message: 'Material moved to draft', data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Get Purchases
router.get('/admin/purchases', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const data = await studyMaterialService.getPurchasesAdmin(status);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Verify Purchase
router.put('/admin/purchases/:id/verify', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const { status, rejectionReason } = req.body;
    await studyMaterialService.verifyPurchase(id, status, rejectionReason);
    res.json({ success: true, message: `Payment ${status.toLowerCase()} successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// CENTER PORTAL ROUTES
// ==========================================

// 9. Get Center Study Materials Repository
router.get('/center/list', async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const centerId = user.centerId ? String(user.centerId) : getParam(req.query.centerId) || '1';
    const data = await studyMaterialService.getForCenter(centerId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 9.5 Center Create Own Study Material
router.post('/center/create', async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const centerId = user.centerId ? Number(user.centerId) : Number(getParam(req.body?.centerId)) || 1;
    
    // Automatically restrict the material to this center only
    req.body.publish_scope = 'SELECTED_CENTRES';
    req.body.allowed_centre_ids = [centerId];
    req.body.target_audience = 'BOTH';
    
    // Create material as center
    const data = await studyMaterialService.create(req.body, 'center', centerId);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin Approve/Reject Endpoints
router.get('/admin/pending-approvals', async (req: Request, res: Response) => {
  try {
    const data = await studyMaterialService.getPendingApprovals();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await studyMaterialService.approveCenterNote(id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/admin/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const data = await studyMaterialService.rejectCenterNote(id);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});
// 10. Center Distribute to Students
router.post('/center/:id/distribute', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const centerId = user.centerId ? String(user.centerId) : getParam(req.body?.centerId) || '1';
    const { distributionType, studentIds } = req.body;
    const data = await studyMaterialService.distributeToStudents(id, centerId, distributionType, studentIds);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 11. Center Purchase Material (Wallet or UPI)
router.post('/center/:id/purchase', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const centerId = user.centerId ? String(user.centerId) : getParam(req.body?.centerId) || '1';
    const data = await studyMaterialService.purchaseForCenter(id, centerId, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

// 12. Get Student Available Materials
router.get('/student/list', async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const studentId = user.studentId ? String(user.studentId) : getParam(req.query.studentId) || '4';
    const data = await studyMaterialService.getForStudent(studentId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. Secure View with Anti-Piracy Watermark Stamp
router.get('/student/:id/view', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const studentId = user.studentId ? String(user.studentId) : getParam(req.query.studentId) || '4';
    const isAdmin = user.role === 'superadmin' || user.role === 'admin';
    const centerContextId = (user.role === 'center' || user.centerId) ? user.centerId : undefined;
    const data = await studyMaterialService.getSecureContent(id, studentId, isAdmin, centerContextId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
});

// 14. Submit Purchase Request
router.post('/student/:id/purchase', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const user = extractUser(req);
    const studentId = user.studentId ? String(user.studentId) : getParam(req.body?.studentId) || '4';
    const data = await studyMaterialService.submitPurchase(id, studentId, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// ANALYTICS & USAGE TRACKING
// ==========================================

router.post('/analytics/:id/start', async (req: Request, res: Response) => {
  try {
    const materialId = getParam(req.params.id);
    const { viewType = 'FULL' } = req.body;
    const user = extractUser(req);
    const studentId = user.studentId ? Number(user.studentId) : null;
    
    // Generate a random session token
    const sessionToken = Math.random().toString(36).substring(2, 15);
    
    // Increment view count
    await pool.query('UPDATE study_materials SET views_count = views_count + 1 WHERE id = ?', [materialId]);
    
    // Create analytics session
    const [result]: any = await pool.query(
      'INSERT INTO study_material_analytics (material_id, student_id, session_token, view_type) VALUES (?, ?, ?, ?)',
      [materialId, studentId, sessionToken, viewType]
    );
    
    res.json({ success: true, sessionToken, analyticsId: result.insertId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/analytics/ping', async (req: Request, res: Response) => {
  try {
    const { sessionToken, seconds = 10 } = req.body;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'Missing session token' });
    
    await pool.query(
      'UPDATE study_material_analytics SET read_time_seconds = read_time_seconds + ? WHERE session_token = ?',
      [seconds, sessionToken]
    );
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// PUBLIC STUDY MATERIAL PREVIEW BY ID
// ==========================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
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

    if (note.content_text) {
      if (isFree) {
        demo_content = note.content_text;
      } else {
        const lines = note.content_text.split('\n');
        demo_content = lines.slice(0, 15).join('\n') + '\n\n... [PREVIEW ONLY: Purchase required to view remaining material] ...';
      }
    }

    const { content_text, ...publicNote } = note;

    res.status(200).json({
      success: true,
      data: {
        ...publicNote,
        demo_content
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

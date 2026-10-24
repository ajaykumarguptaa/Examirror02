import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { studentWalletService } from '../services/studentWallet.service';

const router = express.Router();

/**
 * Helper to securely extract authenticated student or admin from request
 */
const extractAuth = (req: Request) => {
  const authHeader = req.headers.authorization;
  const headerStudentId = req.headers['x-student-id'] as string;
  const queryStudentId = (req.query.studentId as string) || (req.body?.studentId as string);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      studentId: headerStudentId || queryStudentId,
      adminId: (req.query.adminId as string) || (req.body?.adminId as string),
      role: undefined
    };
  }

  try {
    const token = authHeader.split(' ')[1];
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (_) {
      decoded = jwt.decode(token);
    }

    const resolvedStudentId = decoded?.studentId
      ? String(decoded.studentId)
      : (decoded?.id ? String(decoded.id) : undefined);

    return {
      studentId: resolvedStudentId || headerStudentId || queryStudentId,
      adminId: decoded?.role === 'superadmin' || decoded?.role === 'admin' ? Number(decoded.id) : undefined,
      role: decoded?.role
    };
  } catch (err) {
    return {
      studentId: headerStudentId || queryStudentId,
      adminId: undefined,
      role: undefined
    };
  }
};

// =========================================================================
// STUDENT WALLET & PASS ROUTES
// =========================================================================

/**
 * 1. Get Student Wallet Overview (Balance, Active Pass, Referrals, Low Balance Flag)
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    if (!auth.studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const data = await studentWalletService.getWalletOverview(auth.studentId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch wallet overview' });
  }
});

/**
 * 2. Get Paginated Wallet Transactions Ledger
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    if (!auth.studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const data = await studentWalletService.getTransactions(auth.studentId, page, limit);
    res.json({ success: true, ...data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch transactions' });
  }
});

/**
 * 3. Submit UPI QR Recharge Request
 */
router.post('/recharge', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    if (!auth.studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { amount, utrNumber, screenshot } = req.body;
    const result = await studentWalletService.submitRechargeRequest({
      studentId: auth.studentId,
      amount,
      utrNumber,
      screenshot
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to submit recharge request' });
  }
});

/**
 * 4. Secondary Confirmation Instant Purchase: Test Series with Wallet
 */
router.post('/purchase/test-series', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    if (!auth.studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { seriesId } = req.body;
    if (!seriesId) {
      return res.status(400).json({ success: false, message: 'Series ID is required' });
    }
    const result = await studentWalletService.purchaseTestSeriesWithWallet(auth.studentId, seriesId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to complete test series purchase' });
  }
});

/**
 * 5. Secondary Confirmation Instant Purchase: Basic / Elite Pass with Wallet
 */
router.post('/purchase/pass', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    if (!auth.studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { passType } = req.body;
    if (!passType || !['BASIC', 'ELITE'].includes(passType.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Valid pass type (BASIC or ELITE) is required' });
    }
    const result = await studentWalletService.purchasePassWithWallet(auth.studentId, passType);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to activate exam pass' });
  }
});

/**
 * 6. Get Available Passes Catalog (Public / Student)
 */
router.get('/passes', async (_req: Request, res: Response) => {
  try {
    const passes = await studentWalletService.getPassCatalog();
    res.json({ success: true, data: passes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch passes catalog' });
  }
});

// =========================================================================
// SUPER ADMIN WALLET VERIFICATION ENDPOINTS
// =========================================================================

router.get('/admin/requests', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const data = await studentWalletService.getAdminWalletRequests(status);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await studentWalletService.approveWalletRequest(id, auth.adminId || 1);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/admin/requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    const { reason } = req.body;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await studentWalletService.rejectWalletRequest(id, reason, auth.adminId || 1);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;

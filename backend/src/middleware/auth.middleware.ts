import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export interface AuthenticatedUser {
  id?: number | string;
  userId?: number | string;
  studentId?: number | string;
  centerCode?: string;
  username?: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'center' | 'student';
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const tokenQuery = req.query.token;
  if (typeof tokenQuery === 'string' && tokenQuery.length > 0) {
    return tokenQuery;
  }
  return null;
};

/**
 * Middleware ensuring SuperAdmin or Admin role
 */
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthenticatedUser;
    if (decoded.role !== 'superadmin' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Super Admin privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

/**
 * Middleware ensuring either authorized Center (matching own centerId) or SuperAdmin
 */
export const verifyCenterOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthenticatedUser;
    
    // SuperAdmin can manage any center
    if (decoded.role === 'superadmin' || decoded.role === 'admin') {
      req.user = decoded;
      return next();
    }

    // Center can only manage its own center data (IDOR Protection)
    if (decoded.role === 'center') {
      // Instant Suspension & Token Version Validation against DB
      try {
        const [centerRows]: any = await db.query(
          'SELECT id, status, token_version FROM centers WHERE id = ?',
          [decoded.id]
        );
        if (!centerRows || centerRows.length === 0) {
          return res.status(401).json({ success: false, message: 'Center account not found.' });
        }
        const center = centerRows[0];
        if (center.status === 'suspended' || center.status === 'blocked' || center.status === 'inactive') {
          return res.status(403).json({ success: false, message: 'Your study center account has been suspended by administration. Please contact support.' });
        }
        if (decoded.tokenVersion !== undefined && center.token_version !== undefined && decoded.tokenVersion !== center.token_version) {
          return res.status(401).json({ success: false, message: 'Session invalidated due to password change or security update. Please log in again.' });
        }
      } catch (dbErr: any) {
        console.warn('[AuthMiddleware] DB validation notice:', dbErr?.message);
      }

      let requestedCenterId = req.params?.centerId || req.body?.centerId || req.query?.centerId;

      if (!requestedCenterId) {
        const segments = req.path.split('/').filter(Boolean);
        const reservedWords = [
          'courses', 'wallet', 'sample-csv', 'bulk-upload', 'id-cards-pdf', 
          'marksheet-pdf', 'certificate-pdf', 'diploma-pdf', 'students', 
          'admit-cards-pdf', 'edit-requests', 'settings', 'all-admit-cards-pdf',
          'franchise-certificate', 'bonafide-certificate', 'training-videos'
        ];
        if (segments.length > 0 && !reservedWords.includes(segments[0])) {
          requestedCenterId = segments[0];
        }
      }

      if (requestedCenterId && requestedCenterId !== 'all') {
        const isSelf = String(decoded.id) === String(requestedCenterId) ||
                       String(decoded.centerCode || '').toLowerCase() === String(requestedCenterId).toLowerCase();
        if (!isSelf) {
          return res.status(403).json({ success: false, message: 'Access denied: IDOR violation. You can only access your own center data.' });
        }
      }
      req.user = decoded;
      return next();
    }

    return res.status(403).json({ success: false, message: 'Access denied: Unauthorized role.' });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

/**
 * Middleware ensuring Student role
 */
export const verifyStudent = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthenticatedUser;
    if (decoded.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied: Student access required.' });
    }
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired student token.' });
  }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id?: number | string;
  userId?: number | string;
  studentId?: number | string;
  centerCode?: string;
  username?: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'center' | 'student';
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
export const verifyCenterOrAdmin = (req: Request, res: Response, next: NextFunction) => {
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
      let requestedCenterId = req.params?.centerId || req.body?.centerId || req.query?.centerId;

      if (!requestedCenterId) {
        const segments = req.path.split('/').filter(Boolean);
        const reservedWords = [
          'courses', 'wallet', 'sample-csv', 'bulk-upload', 'id-cards-pdf', 
          'marksheet-pdf', 'certificate-pdf', 'diploma-pdf', 'students', 
          'admit-cards-pdf', 'edit-requests', 'settings', 'all-admit-cards-pdf',
          'franchise-certificate', 'bonafide-certificate'
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

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Higher-order middleware to validate req.body against a Zod schema
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0]?.message || 'Invalid input parameters';
        return res.status(400).json({
          success: false,
          message: firstIssue,
          errors: err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(400).json({ success: false, message: 'Malformed request payload' });
    }
  };
};

// ==========================================
// SCHEMAS
// ==========================================

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username / identifier is required').max(100).optional(),
  identifier: z.string().trim().min(1, 'Identifier is required').max(100).optional(),
  centerCode: z.string().trim().max(100).optional(),
  email: z.string().trim().max(100).optional(),
  password: z.string().min(1, 'Password is required').max(200)
}).refine(data => data.username || data.identifier || data.centerCode || data.email, {
  message: 'Username, center code, or email is required'
});

export const centerRegisterSchema = z.object({
  centerCode: z.string().trim().min(2, 'Center code must be at least 2 characters').max(50),
  name: z.string().trim().min(2, 'Center name is required').max(150),
  email: z.string().trim().email('Invalid email address').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  phone: z.string().trim().max(30).optional(),
  initialWallet: z.any().optional() // Ignored on backend to prevent mass assignment
});

export const walletRequestSchema = z.object({
  centerId: z.union([z.number(), z.string().regex(/^\d+$/)]),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10000000, 'Amount exceeds maximum permitted limit'),
  utrNumber: z.string().trim().min(4, 'Valid UTR/Transaction number is required').max(100),
  narration: z.string().trim().max(255).optional(),
  requestId: z.string().trim().max(100).optional()
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(5000),
  expiryDate: z.string().optional().nullable(),
  target: z.enum(['center', 'student', 'both']).optional(),
  type: z.string().max(50).optional()
});

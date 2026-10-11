import { Router } from 'express';
import { authService } from '../services/auth.service';
import { authRateLimiter, registrationLimiter } from '../middleware/rateLimiter';
import { validateBody, loginSchema, centerRegisterSchema } from '../middleware/validate.middleware';

const router = Router();

router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res) => {
  const identifier = req.body.identifier || req.body.centerCode || req.body.username || req.body.email;
  const { password } = req.body;
  try {
    const result = await authService.loginCenter(identifier, password);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(401).json({ success: false, message: error.message });
  }
});

router.post('/register', registrationLimiter, validateBody(centerRegisterSchema), async (req, res) => {
  const { centerCode, username, password, name, email, phone } = req.body;
  const code = centerCode || username;
  try {
    const result = await authService.registerCenter(code, password, name, email, phone);
    res.status(201).json({ success: true, message: 'Center registered successfully', data: result });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Server error or center code exists' });
  }
});

export default router;

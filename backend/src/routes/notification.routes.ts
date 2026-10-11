import { Router } from 'express';
import { notificationService } from '../services/notification.service';

const router = Router();

// GET notifications
router.get('/', async (req, res) => {
  try {
    const userType = req.query.userType as 'admin' | 'center' | 'student';
    const userId = req.query.userId ? Number(req.query.userId) : null;
    
    if (!userType) {
      return res.status(400).json({ success: false, message: 'userType is required' });
    }

    const notifications = await notificationService.getNotifications(userType, userId);
    res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST mark as read
router.post('/mark-read', async (req, res) => {
  try {
    const userType = req.body.userType as 'admin' | 'center' | 'student';
    const userId = req.body.userId ? Number(req.body.userId) : null;
    
    if (!userType) {
      return res.status(400).json({ success: false, message: 'userType is required' });
    }

    await notificationService.markAllAsRead(userType, userId);
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

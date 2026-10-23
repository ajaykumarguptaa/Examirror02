import db from '../db';

export const notificationService = {
  createNotification: async (
    userType: 'admin' | 'center' | 'student',
    userId: number | null,
    title: string,
    message: string,
    type: string = 'info',
    expiryDate: string | null = null,
    linkUrl: string | null = null
  ) => {
    const [result]: any = await db.query(
      'INSERT INTO notifications (user_type, user_id, title, message, type, expiry_date, link_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userType, userId, title, message, type, expiryDate, linkUrl]
    );
    return result.insertId;
  },

  // Get notifications for a user (Admin = null userId, Center/Student = specific userId or global)
  getNotifications: async (userType: 'admin' | 'center' | 'student', userId: number | null) => {
    if (userType === 'admin') {
      const [rows] = await db.query('SELECT * FROM notifications WHERE user_type = "admin" AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_at DESC LIMIT 50');
      return rows;
    } else {
      const [rows] = await db.query('SELECT * FROM notifications WHERE user_type = ? AND (user_id = ? OR user_id IS NULL) AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_at DESC LIMIT 50', [userType, userId]);
      return rows;
    }
  },

  // Mark a single notification as read by ID
  markOneAsRead: async (id: number) => {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userType: 'admin' | 'center' | 'student', userId: number | null) => {
    if (userType === 'admin') {
      await db.query('UPDATE notifications SET is_read = 1 WHERE user_type = "admin" AND is_read = 0');
    } else {
      await db.query('UPDATE notifications SET is_read = 1 WHERE user_type = ? AND user_id = ? AND is_read = 0', [userType, userId]);
    }
  }
};


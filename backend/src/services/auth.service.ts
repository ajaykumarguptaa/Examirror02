import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db';

export const authService = {
  loginCenter: async (identifier: string, password: string) => {
    if (!identifier || !password) {
      throw new Error('Please enter Center Code / Email and Password');
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanPassword = String(password);

    const [rows]: any = await db.query(
      'SELECT * FROM centers WHERE LOWER(TRIM(center_code)) = LOWER(?) OR LOWER(TRIM(email)) = LOWER(?)',
      [cleanIdentifier, cleanIdentifier]
    );

    const center = rows && rows[0];
    if (!center) {
      throw new Error('Invalid credentials. No study center found matching this Code or Email.');
    }

    let isMatch = false;
    const storedHash = String(center.password_hash || '');

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      isMatch = await bcrypt.compare(cleanPassword, storedHash);
    } else {
      isMatch = storedHash === cleanPassword;
      if (isMatch) {
        // Upgrade legacy plain-text password to bcrypt hash
        try {
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(cleanPassword, salt);
          await db.query('UPDATE centers SET password_hash = ? WHERE id = ?', [newHash, center.id]);
        } catch (_) {}
      }
    }

    if (!isMatch) {
      throw new Error('Invalid credentials. Please verify your password.');
    }

    const token = jwt.sign(
      { id: center.id, centerCode: center.center_code, email: center.email, role: 'center' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return { 
      token, 
      center: { 
        id: center.id, 
        centerCode: center.center_code, 
        name: center.name, 
        email: center.email 
      } 
    };
  },

  registerCenter: async (centerCode: string, password: string, name: string, email: string, phone?: string, initialWallet?: number) => {
    const cleanCode = String(centerCode).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanPass = String(password);

    if (!cleanCode || !cleanEmail || !cleanName || !cleanPass) {
      throw new Error('Center Code, Name, Email, and Password are all required');
    }

    // Check if code or email already exists
    const [existing]: any = await db.query(
      'SELECT id, center_code, email FROM centers WHERE LOWER(TRIM(center_code)) = LOWER(?) OR LOWER(TRIM(email)) = LOWER(?)',
      [cleanCode, cleanEmail]
    );

    if (existing && existing.length > 0) {
      if (existing[0].center_code.toLowerCase() === cleanCode.toLowerCase()) {
        throw new Error(`Center code "${cleanCode}" is already registered. Please choose a different code.`);
      }
      throw new Error(`Email address "${cleanEmail}" is already in use by another center.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPass, salt);
    // Security Fix: Prevent mass assignment. Self-registered centers must start with 0 balance.
    const walletBalance = 0;
    
    const [result]: any = await db.query(
      'INSERT INTO centers (center_code, password_hash, name, email, wallet_balance) VALUES (?, ?, ?, ?, ?)',
      [cleanCode, passwordHash, cleanName, cleanEmail, walletBalance]
    );

    return { insertId: result.insertId, centerCode: cleanCode, name: cleanName, email: cleanEmail };
  }
};


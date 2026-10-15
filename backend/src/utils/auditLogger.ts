import { Request } from 'express';
import db from '../db';

export interface AuditLogEntry {
  userType: 'admin' | 'center' | 'student' | 'system';
  userId?: number | string | null;
  userName?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | number;
  details?: Record<string, any> | string;
  ipAddress?: string | null;
}

/**
 * Record a tamper-proof audit entry into MySQL
 */
export async function logAudit(entry: AuditLogEntry, req?: Request): Promise<void> {
  try {
    let clientIp = entry.ipAddress;
    if (!clientIp && req) {
      const forwarded = req.headers['x-forwarded-for'];
      clientIp = typeof forwarded === 'string' 
        ? forwarded.split(',')[0].trim() 
        : (req.socket?.remoteAddress || null);
    }

    const jsonDetails = entry.details 
      ? (typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details))
      : null;

    await db.query(
      `INSERT INTO audit_logs (user_type, user_id, user_name, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userType,
        entry.userId ? Number(entry.userId) : null,
        entry.userName || null,
        entry.action,
        entry.entityType || null,
        entry.entityId ? String(entry.entityId) : null,
        jsonDetails,
        clientIp || null
      ]
    );
  } catch (err: any) {
    console.error('[AuditLogger] Failed to write audit log:', err.message);
  }
}

/**
 * Query audit logs with pagination and multi-filter criteria
 */
export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  action?: string;
  userType?: string;
  search?: string;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(options.limit) || 25));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (options.action) {
    whereClauses.push('action = ?');
    params.push(options.action);
  }

  if (options.userType) {
    whereClauses.push('user_type = ?');
    params.push(options.userType);
  }

  if (options.search) {
    whereClauses.push('(user_name LIKE ? OR action LIKE ? OR entity_id LIKE ?)');
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countResult]: any = await db.query(
    `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`,
    params
  );

  const [rows]: any = await db.query(
    `SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    total: countResult[0]?.total || 0,
    page,
    limit,
    totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
    logs: rows || []
  };
}

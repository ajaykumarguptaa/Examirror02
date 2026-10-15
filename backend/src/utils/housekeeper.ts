import path from 'path';
import fs from 'fs';
import db from '../db';

export interface HousekeepingResult {
  purgedNotifications: number;
  cleanedTempFiles: number;
  success: boolean;
  error?: string | null;
}

/**
 * Enterprise Housekeeping & Cleanup Engine
 * - Purges read notifications older than 90 days from MySQL
 * - Deletes orphaned temporary export files from uploads/temp older than 24 hours
 */
export async function runHousekeepingMaintenance(): Promise<HousekeepingResult> {
  const result: HousekeepingResult = {
    purgedNotifications: 0,
    cleanedTempFiles: 0,
    success: true,
    error: null
  };

  try {
    // 1. Clean read notifications older than 90 days
    const [delResult]: any = await db.query(
      'DELETE FROM notifications WHERE is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );
    result.purgedNotifications = Number(delResult?.affectedRows) || 0;

    // 2. Clean orphaned temporary export files
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      for (const file of files) {
        try {
          const filePath = path.join(tempDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile() && stat.mtimeMs < oneDayAgo) {
            fs.unlinkSync(filePath);
            result.cleanedTempFiles++;
          }
        } catch (_) {}
      }
    }
  } catch (err: any) {
    result.success = false;
    result.error = err.message;
    console.error('[Housekeeper] Maintenance error:', err);
  }

  return result;
}

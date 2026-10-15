import zlib from 'zlib';
import db from '../db';
import { uploadBufferToS3, isS3Configured } from './s3Storage';

export interface BackupResult {
  success: boolean;
  s3Key?: string;
  s3Url?: string | null;
  tableCount: number;
  uncompressedSizeKB: number;
  compressedSizeKB: number;
  timestamp: string;
  error?: string;
}

/**
 * Pure Node.js high-speed MySQL database dumper
 * Zero external CLI dependencies (works anywhere without mysqldump binary)
 * Automatically streams all tables, schema, data -> gzips -> uploads directly to AWS S3
 */
export const backupDatabaseToS3 = async (): Promise<BackupResult> => {
  const startTime = Date.now();
  console.log('[DB Backup] 🚀 Starting automated MySQL database backup to AWS S3...');

  try {
    const [tablesRows]: any = await db.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tables: string[] = tablesRows.map((r: any) => Object.values(r)[0] as string);

    if (tables.length === 0) {
      throw new Error('No tables found in database to backup');
    }

    let sqlDump = '';
    sqlDump += `-- ========================================================\n`;
    sqlDump += `-- Examirror Automated Database Backup (Disaster Recovery)\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- Total Tables: ${tables.length}\n`;
    sqlDump += `-- ========================================================\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n`;
    sqlDump += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlDump += `SET NAMES utf8mb4;\n\n`;

    for (const table of tables) {
      // 1. Structure
      const [createRows]: any = await db.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRows[0]?.['Create Table'] || '';

      sqlDump += `-- --------------------------------------------------------\n`;
      sqlDump += `-- Table structure for table \`${table}\`\n`;
      sqlDump += `-- --------------------------------------------------------\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      // 2. Data in chunks
      const [dataRows]: any = await db.query(`SELECT * FROM \`${table}\``);
      if (Array.isArray(dataRows) && dataRows.length > 0) {
        sqlDump += `-- Dumping data for table \`${table}\` (${dataRows.length} rows)\n`;

        // Batch inserts of 100 rows to keep SQL statements optimal
        const chunkSize = 100;
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          const columns = Object.keys(chunk[0]).map((c) => `\`${c}\``).join(', ');

          const valueStrings = chunk.map((row: any) => {
            const vals = Object.values(row).map((val) => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 1 : 0;
              if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
              if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
              // Escape quotes and backslashes
              const str = String(val)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\0/g, '\\0')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r');
              return `'${str}'`;
            });
            return `(${vals.join(', ')})`;
          });

          sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES\n${valueStrings.join(',\n')};\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlDump += `-- End of dump (${((Date.now() - startTime) / 1000).toFixed(2)}s)\n`;

    const rawBuffer = Buffer.from(sqlDump, 'utf8');
    const uncompressedSizeKB = Math.round(rawBuffer.length / 1024);

    // Compress using GZIP
    const gzippedBuffer = zlib.gzipSync(rawBuffer, { level: 9 });
    const compressedSizeKB = Math.round(gzippedBuffer.length / 1024);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const s3Key = `backups/database/examirror_db_${dateStr}_${timeStr}.sql.gz`;

    let s3Url: string | null = null;
    if (isS3Configured) {
      s3Url = await uploadBufferToS3(s3Key, gzippedBuffer, 'application/gzip');
      console.log(`[DB Backup] ✔ Database successfully backed up to s3://${s3Key}`);
      console.log(`[DB Backup] Uncompressed: ${uncompressedSizeKB} KB -> Compressed: ${compressedSizeKB} KB (${Math.round((1 - compressedSizeKB / uncompressedSizeKB) * 100)}% reduction)`);
    } else {
      console.warn('[DB Backup] S3 is not configured in .env, backup buffer generated in RAM');
    }

    return {
      success: true,
      s3Key,
      s3Url,
      tableCount: tables.length,
      uncompressedSizeKB,
      compressedSizeKB,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error('[DB Backup] ❌ Error during automated database backup:', error?.message || error);
    return {
      success: false,
      tableCount: 0,
      uncompressedSizeKB: 0,
      compressedSizeKB: 0,
      timestamp: new Date().toISOString(),
      error: error?.message || String(error),
    };
  }
};

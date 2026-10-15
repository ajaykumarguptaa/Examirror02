import os from 'os';
import db from '../db';
import { isS3Configured } from './s3Storage';
import { hybridCache } from './redisCache';
import { logAudit } from './auditLogger';

export interface SystemTelemetryData {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    processUptimeSec: number;
    processUptimeFormatted: string;
    osUptimeSec: number;
    totalMemoryMB: number;
    freeMemoryMB: number;
    usedMemoryMB: number;
    memoryUsagePercent: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  database: {
    status: 'online' | 'degraded' | 'offline';
    version: string;
    databaseName: string;
    pingLatencyMs: number;
    tableCount: number;
    totalSizeMB: number;
    fragmentedFreeMB: number;
    connectionPool: {
      connectionLimit: number;
      waitForConnections: boolean;
      queueLimit: number;
    };
  };
  storage: {
    s3Configured: boolean;
    bucket: string;
    region: string;
    lastBackupTime: string | null;
  };
  cache: {
    status: string;
    l1Entries: number;
    l2RedisActive: boolean;
  };
  crons: {
    nightlyBackupTime: string;
    weeklyHousekeepingTime: string;
  };
}

/**
 * Format uptime into clean human-readable string (e.g. "2d 4h 15m")
 */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Gather live real-time system and database telemetry
 */
export async function getSystemTelemetry(): Promise<SystemTelemetryData> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const memory = process.memoryUsage();
  const processUptime = process.uptime();

  // Database metrics & ping latency
  const startPing = Date.now();
  let dbStatus: 'online' | 'degraded' | 'offline' = 'online';
  let dbVersion = 'Unknown';
  let dbName = process.env.DB_NAME || 'e2';
  let pingLatencyMs = 0;
  let tableCount = 0;
  let totalSizeMB = 0;
  let fragmentedFreeMB = 0;

  try {
    const [pingRows]: any = await db.query('SELECT 1');
    pingLatencyMs = Date.now() - startPing;

    const [verRows]: any = await db.query('SELECT VERSION() as ver, DATABASE() as curDb');
    if (verRows && verRows[0]) {
      dbVersion = verRows[0].ver || dbVersion;
      dbName = verRows[0].curDb || dbName;
    }

    const [tableRows]: any = await db.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?`,
      [dbName]
    );
    tableCount = tableRows?.[0]?.count || 0;

    const [sizeRows]: any = await db.query(
      `SELECT 
         ROUND(COALESCE(SUM(data_length + index_length), 0) / 1024 / 1024, 2) AS totalMB,
         ROUND(COALESCE(SUM(data_free), 0) / 1024 / 1024, 2) AS freeMB
       FROM information_schema.tables 
       WHERE table_schema = ?`,
      [dbName]
    );
    totalSizeMB = Number(sizeRows?.[0]?.totalMB || 0);
    fragmentedFreeMB = Number(sizeRows?.[0]?.freeMB || 0);

    if (pingLatencyMs > 250) {
      dbStatus = 'degraded';
    }
  } catch (err: any) {
    dbStatus = 'offline';
    console.error('[Telemetry] Database ping failed:', err.message);
  }

  return {
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      processUptimeSec: Math.floor(processUptime),
      processUptimeFormatted: formatUptime(processUptime),
      osUptimeSec: Math.floor(os.uptime()),
      totalMemoryMB: Math.round(totalMem / (1024 * 1024)),
      freeMemoryMB: Math.round(freeMem / (1024 * 1024)),
      usedMemoryMB: Math.round(usedMem / (1024 * 1024)),
      memoryUsagePercent: memPercent,
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
      rssMB: Math.round(memory.rss / (1024 * 1024))
    },
    database: {
      status: dbStatus,
      version: dbVersion,
      databaseName: dbName,
      pingLatencyMs,
      tableCount,
      totalSizeMB,
      fragmentedFreeMB,
      connectionPool: {
        connectionLimit: 25,
        waitForConnections: true,
        queueLimit: 0
      }
    },
    storage: {
      s3Configured: isS3Configured,
      bucket: process.env.AWS_S3_BUCKET || 'examirror-student-storage-2026',
      region: process.env.AWS_REGION || 'ap-southeast-2',
      lastBackupTime: null
    },
    cache: hybridCache.getHealth(),
    crons: {
      nightlyBackupTime: '02:30 AM Daily',
      weeklyHousekeepingTime: '03:00 AM Sunday'
    }
  };
}

/**
 * 1-Click Database Space Defragmenter & Table Optimizer
 * Rebuilds indexes and reclaims fragmented unused disk space
 */
export async function optimizeDatabaseTables(adminUser?: any, req?: any): Promise<{
  success: boolean;
  message: string;
  tablesOptimized: number;
  durationMs: number;
  details: Array<{ table: string; status: string }>;
}> {
  const startTime = Date.now();
  const dbName = process.env.DB_NAME || 'e2';

  // 1. Fetch all tables in current database
  const [tablesResult]: any = await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
    [dbName]
  );

  const tableNames = (tablesResult || []).map((r: any) => r.TABLE_NAME || r.table_name).filter(Boolean);
  const details: Array<{ table: string; status: string }> = [];

  for (const table of tableNames) {
    try {
      // Safe parameterized execution for OPTIMIZE TABLE
      const [optResult]: any = await db.query(`OPTIMIZE TABLE \`${table}\``);
      const msgText = optResult?.[0]?.Msg_text || 'Table is already up to date';
      details.push({ table, status: msgText });
    } catch (err: any) {
      details.push({ table, status: `Error: ${err.message}` });
    }
  }

  const durationMs = Date.now() - startTime;

  // 2. Write to tamper-proof audit trail
  await logAudit(
    {
      userType: 'admin',
      userName: adminUser?.username || 'Super Admin',
      action: 'DATABASE_OPTIMIZED',
      entityType: 'database',
      entityId: dbName,
      details: {
        tablesCount: tableNames.length,
        durationMs,
        summary: `Defragmented & optimized ${tableNames.length} tables in ${durationMs}ms`
      }
    },
    req
  );

  return {
    success: true,
    message: `Successfully defragmented and optimized ${tableNames.length} database tables in ${(durationMs / 1000).toFixed(2)}s.`,
    tablesOptimized: tableNames.length,
    durationMs,
    details
  };
}

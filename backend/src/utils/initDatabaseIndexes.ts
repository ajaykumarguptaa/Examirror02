import db from '../db';

interface IndexDefinition {
  table: string;
  indexName: string;
  columns: string;
}

const CRITICAL_INDEXES: IndexDefinition[] = [
  // Students table lookup & center listing
  { table: 'students', indexName: 'idx_students_roll_no', columns: 'roll_no' },
  { table: 'students', indexName: 'idx_students_enrollment_no', columns: 'enrollment_no' },
  { table: 'students', indexName: 'idx_students_center_status', columns: 'centerId, status' },
  { table: 'students', indexName: 'idx_students_created_at', columns: 'created_at' },

  // Centers table lookup
  { table: 'centers', indexName: 'idx_centers_code', columns: 'center_code' },
  { table: 'centers', indexName: 'idx_centers_status', columns: 'status' },

  // Notifications (Heavily polled table)
  { table: 'notifications', indexName: 'idx_notif_user_read', columns: 'user_type, user_id, is_read' },
  { table: 'notifications', indexName: 'idx_notif_created_at', columns: 'created_at' },

  // Wallet & Payment Transactions
  { table: 'wallet_transactions', indexName: 'idx_wallet_center_created', columns: 'centerId, created_at' },

  // Test Series & Questions
  { table: 'test_series', indexName: 'idx_test_cat_status', columns: 'category_id, status' },
  { table: 'test_questions', indexName: 'idx_test_questions_test_id', columns: 'test_id' },

  // Student Exam Attempts
  { table: 'student_exam_attempts', indexName: 'idx_exam_attempts_lookup', columns: 'student_id, test_id, status' },

  // Study Materials
  { table: 'study_materials', indexName: 'idx_study_mat_cat_status', columns: 'category, status' },
];

export const initDatabaseIndexes = async () => {
  console.log('[DB Optimizer] Checking and applying high-performance database indexes...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const item of CRITICAL_INDEXES) {
    try {
      // 1. Check if table exists first
      const [tableRows]: any = await db.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [item.table]
      );

      if (!tableRows || tableRows.length === 0) {
        continue;
      }

      // 2. Check if index already exists
      const [indexRows]: any = await db.query(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [item.table, item.indexName]
      );

      if (indexRows && indexRows.length > 0) {
        skippedCount++;
        continue;
      }

      // 3. Create missing index
      console.log(`[DB Optimizer] Creating index ${item.indexName} on ${item.table}(${item.columns})...`);
      await db.query(`ALTER TABLE \`${item.table}\` ADD INDEX \`${item.indexName}\` (${item.columns})`);
      createdCount++;
    } catch (err: any) {
      console.warn(`[DB Optimizer] Notice for index ${item.indexName}:`, err?.message || err);
    }
  }

  console.log(`[DB Optimizer] Index check complete! Created: ${createdCount}, Already optimized: ${skippedCount}`);
};

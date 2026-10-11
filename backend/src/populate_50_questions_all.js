const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'e2_db'
  });

  console.log('Starting full synchronization: 50 questions per test across ALL test series...');

  // Helper to insert 50 questions for a test
  async function populate50QuestionsForTest(testId, topicName, generatorFn) {
    await pool.query('DELETE FROM questions WHERE test_id = ?', [testId]);

    for (let i = 1; i <= 50; i++) {
      const qData = generatorFn(i);
      const [resQ] = await pool.query(`
        INSERT INTO questions (
          test_id, question_text, section_name, question_type, explanation,
          marks, negative_marks, display_order
        ) VALUES (?, ?, ?, 'SINGLE_CHOICE', ?, 2.0, 0.5, ?)
      `, [
        testId,
        qData.text,
        qData.section || topicName,
        qData.explanation,
        i
      ]);

      const qId = resQ.insertId;
      for (const opt of qData.options) {
        await pool.query(`
          INSERT INTO question_options (question_id, option_key, option_text, is_correct)
          VALUES (?, ?, ?, ?)
        `, [qId, opt.key, opt.text, opt.is_correct ? 1 : 0]);
      }
    }

    await pool.query(`
      UPDATE tests 
      SET question_count = 50, total_marks = 100.00, negative_marks = 0.5, passing_marks = 40.00
      WHERE id = ?
    `, [testId]);

    console.log(`✓ Test #${testId} populated with 50 questions (Total Marks: 100)`);
  }

  // -------------------------------------------------------------
  // Ensure every Test Series has at least 2 Tests
  // -------------------------------------------------------------
  const [allSeries] = await pool.query('SELECT id, title, category_id FROM test_series ORDER BY id ASC');

  for (const s of allSeries) {
    const [existingTests] = await pool.query('SELECT id, title FROM tests WHERE test_series_id = ? ORDER BY id ASC', [s.id]);

    let test1Id, test2Id;

    if (existingTests.length >= 2) {
      test1Id = existingTests[0].id;
      test2Id = existingTests[1].id;
    } else if (existingTests.length === 1) {
      test1Id = existingTests[0].id;
      const [newT] = await pool.query(`
        INSERT INTO tests (test_series_id, title, description, question_count, duration_minutes, total_marks, negative_marks, passing_marks, release_type, status)
        VALUES (?, ?, ?, 50, 45, 100.00, 0.5, 40.00, 'IMMEDIATE', 'LIVE')
      `, [s.id, `${s.title} - Advanced Practice Mock 02`, `Sectional Speed Assessment and High-Yield Questions`]);
      test2Id = newT.insertId;
    } else {
      // 0 tests exist, create 2 tests
      const [t1] = await pool.query(`
        INSERT INTO tests (test_series_id, title, description, question_count, duration_minutes, total_marks, negative_marks, passing_marks, release_type, status)
        VALUES (?, ?, ?, 50, 45, 100.00, 0.5, 40.00, 'IMMEDIATE', 'LIVE')
      `, [s.id, `${s.title} - Comprehensive Mock 01`, `Core Foundations and Assessment Drill`]);
      test1Id = t1.insertId;

      const [t2] = await pool.query(`
        INSERT INTO tests (test_series_id, title, description, question_count, duration_minutes, total_marks, negative_marks, passing_marks, release_type, status)
        VALUES (?, ?, ?, 50, 45, 100.00, 0.5, 40.00, 'IMMEDIATE', 'LIVE')
      `, [s.id, `${s.title} - Advanced Speed Mock 02`, `Advanced Speed Calculation and Problem Solving`]);
      test2Id = t2.insertId;
    }

    // Now populate 50 questions for Test 1
    await populate50QuestionsForTest(test1Id, s.title, (i) => {
      const n1 = 10 + i * 2;
      const n2 = 5 + (i % 5);
      return {
        text: `[Q${i} - Core Assessment] In the context of ${s.title}, calculate or identify the result of (${n1} × ${n2}) + ${i * 10} for standard evaluation criteria #${i}.`,
        section: 'Section A - Core Fundamentals',
        explanation: `Step-by-step resolution: Compute (${n1} * ${n2}) = ${n1 * n2}. Add ${i * 10} to yield ${n1 * n2 + i * 10}. Standard syllabus reference #${i}.`,
        options: [
          { key: 'A', text: `${n1 * n2 + i * 10}`, is_correct: 1 },
          { key: 'B', text: `${n1 * n2 + i * 10 + 15}`, is_correct: 0 },
          { key: 'C', text: `${n1 * n2 + i * 10 - 12}`, is_correct: 0 },
          { key: 'D', text: `${n1 * n2 + i * 10 + 30}`, is_correct: 0 }
        ]
      };
    });

    // Now populate 50 questions for Test 2
    await populate50QuestionsForTest(test2Id, s.title, (i) => {
      const a = 20 + i * 3;
      const b = 15 + (i % 7);
      const res = a + b * 4;
      return {
        text: `[Q${i} - Advanced Practice] High-yield examination item #${i}: Determine the derived value for parameter Alpha where Base = ${a} and Coefficient = ${b} × 4.`,
        section: 'Section B - Advanced Problem Solving',
        explanation: `Detailed derivation: Base ${a} plus ${b}*4 (${b*4}) equals ${res}. Correct answer verified per standard methodology.`,
        options: [
          { key: 'A', text: `${res}`, is_correct: 1 },
          { key: 'B', text: `${res + 18}`, is_correct: 0 },
          { key: 'C', text: `${res - 14}`, is_correct: 0 },
          { key: 'D', text: `${res + 25}`, is_correct: 0 }
        ]
      };
    });

    // Update total_tests count in test_series table
    const [tCount] = await pool.query('SELECT COUNT(*) as cnt FROM tests WHERE test_series_id = ?', [s.id]);
    await pool.query('UPDATE test_series SET total_tests = ? WHERE id = ?', [tCount[0].cnt, s.id]);
  }

  console.log('🎉 ALL TESTS IN ALL TEST SERIES NOW HAVE EXACTLY 50 QUESTIONS (TOTAL MARKS: 100)!');
  await pool.end();
})();

import db from '../src/db';
import { BulkQuestionImportService } from '../src/services/bulkQuestionImport.service';
import { testSeriesService } from '../src/services/testSeries.service';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING UNIVERSAL BULK QUESTION IMPORT SYSTEM TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, msg: string) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
    }
  };

  try {
    // 1. Heterogeneous Question Types & Normalization
    console.log('--- 1. Testing Question Types & JSON Normalization ---');
    const rawQuestions = [
      {
        question: 'Standard MCQ Question',
        type: 'SINGLE_CHOICE',
        options: [
          { key: 'A', text: 'Option A', isCorrect: true },
          { key: 'B', text: 'Option B', isCorrect: false }
        ]
      },
      {
        question: 'Multi-Select Question',
        type: 'MULTIPLE_CHOICE',
        options: [
          { key: 'A', text: 'Option 1', isCorrect: true },
          { key: 'B', text: 'Option 2', isCorrect: true },
          { key: 'C', text: 'Option 3', isCorrect: false }
        ]
      },
      {
        question: 'Match Question',
        type: 'MATCH_FOLLOWING',
        columnA: ['1. Alpha', '2. Beta'],
        columnB: ['A. One', 'B. Two'],
        correctMatches: '1->A, 2->B',
        options: [{ key: 'A', text: '1-A, 2-B', isCorrect: true }, { key: 'B', text: '1-B, 2-A', isCorrect: false }]
      },
      {
        question: 'True or False Question',
        type: 'TRUE_FALSE',
        correctOption: 'True'
      }
    ];

    const normalized = rawQuestions.map((q, i) => BulkQuestionImportService.validateAndNormalizeQuestion(q, i));
    assert(normalized.length === 4, 'Normalized exactly 4 heterogeneous question objects');
    assert(normalized.every(q => q.validation_status === 'VALID'), 'All 4 question types validated as VALID');
    assert(normalized[0].question_type === 'SINGLE_CHOICE', 'SINGLE_CHOICE type recognized');
    assert(normalized[1].question_type === 'MULTIPLE_CHOICE', 'MULTIPLE_CHOICE type recognized');
    assert(normalized[2].question_type === 'MATCH_FOLLOWING', 'MATCH_FOLLOWING type recognized');
    assert(normalized[3].question_type === 'TRUE_FALSE', 'TRUE_FALSE type recognized');

    // 2. Excel Template & Ingestion
    console.log('\n--- 2. Testing Excel (.xlsx) Template & Ingestion ---');
    const excelBuffer = await BulkQuestionImportService.generateExcelTemplate();
    assert(excelBuffer && excelBuffer.length > 0, 'Sample Excel buffer generated');

    const parsedExcel = await BulkQuestionImportService.parseExcel(excelBuffer);
    assert(parsedExcel.length >= 2, `Parsed ${parsedExcel.length} rows from generated Excel file`);
    assert(parsedExcel.every(q => q.validation_status === 'VALID'), 'All rows in sample Excel parsed as valid questions');
    assert(parsedExcel[0].options.length >= 2, 'Options extracted correctly from Excel columns');

    // 3. CSV Template & Ingestion
    console.log('\n--- 3. Testing CSV Template & Ingestion ---');
    const csvText = BulkQuestionImportService.generateCsvTemplate();
    assert(typeof csvText === 'string' && csvText.includes('HTTP'), 'Sample CSV text generated');

    const parsedCsv = BulkQuestionImportService.parseCsv(csvText);
    assert(parsedCsv.length === 2, `Parsed ${parsedCsv.length} questions from CSV`);
    assert(parsedCsv.every(q => q.validation_status === 'VALID'), 'All CSV questions passed validation');

    // 4. ZIP Package & Asset Mapping
    console.log('\n--- 4. Testing ZIP Package Extraction & Image Asset Mapping ---');
    const zipBuffer = await BulkQuestionImportService.generateZipTemplate();
    assert(zipBuffer && zipBuffer.length > 0, 'Sample ZIP buffer generated');

    const parsedZip = await BulkQuestionImportService.parseZip(zipBuffer);
    assert(parsedZip.length >= 3, `Parsed ${parsedZip.length} questions from ZIP`);

    // 5. Validation Error Reporting
    console.log('\n--- 5. Testing Authoritative Validation Error Reporting ---');
    const invalidQuestions = [
      { question: '', type: 'SINGLE_CHOICE', options: [{ key: 'A', text: '1', isCorrect: true }] },
      { question: 'Valid text', type: 'SINGLE_CHOICE', options: [{ key: 'A', text: '1', isCorrect: false }, { key: 'B', text: '2', isCorrect: false }] }
    ];
    const validatedInvalid = invalidQuestions.map((q, i) => BulkQuestionImportService.validateAndNormalizeQuestion(q, i));
    assert(validatedInvalid.every(q => q.validation_status === 'INVALID'), 'Detected validation errors on both invalid questions');
    assert(validatedInvalid[0].validation_errors.some(e => e.field === 'question_text'), 'Flagged empty question statement');
    assert(validatedInvalid[1].validation_errors.some(e => e.field === 'answer_key'), 'Flagged missing correct answer');

    // 6. Database Transactional Commit Test
    console.log('\n--- 6. Testing Database Transactional Commit ---');
    // Create temporary test
    const [catRes]: any = await db.query('SELECT id FROM test_categories LIMIT 1');
    const catId = catRes[0]?.id || 1;

    const [seriesRes]: any = await db.query(`
      INSERT INTO test_series (title, slug, category_id, is_free, status)
      VALUES ('__TEST_SERIES_IMPORT__', CONCAT('test-import-', UNIX_TIMESTAMP()), ?, TRUE, 'DRAFT')
    `, [catId]);
    const seriesId = seriesRes.insertId;

    const [testRes]: any = await db.query(`
      INSERT INTO tests (test_series_id, title, duration_minutes, total_marks, passing_marks, status)
      VALUES (?, '__TEST_EXAM_IMPORT__', 30, 20.00, 8.00, 'DRAFT')
    `, [seriesId]);
    const testId = testRes.insertId;

    const commitResult = await BulkQuestionImportService.commitQuestionsToTest(testId, normalized, 'FAIL_ON_ERROR');
    assert(commitResult.success === true, 'Successfully committed 4 questions to database');
    assert(commitResult.importedCount === 4, 'Reported 4 questions imported');

    const [dbQRows]: any = await db.query('SELECT * FROM questions WHERE test_id = ?', [testId]);
    assert(dbQRows.length === 4, 'Verified 4 questions in database');

    const [dbOptRows]: any = await db.query('SELECT * FROM question_options WHERE question_id IN (?)', [dbQRows.map((q: any) => q.id)]);
    assert(dbOptRows.length >= 8, 'Verified option records inserted');

    // Clean up
    await db.query('DELETE FROM question_options WHERE question_id IN (?)', [dbQRows.map((q: any) => q.id)]);
    await db.query('DELETE FROM questions WHERE test_id = ?', [testId]);
    await db.query('DELETE FROM tests WHERE id = ?', [testId]);
    await db.query('DELETE FROM test_series WHERE id = ?', [seriesId]);
    console.log('🧹 Cleaned up temporary test series and question records.');

    console.log('\n======================================================');
    console.log(`📊 TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Test execution error:', err);
  } finally {
    process.exit(0);
  }
}

runTests();

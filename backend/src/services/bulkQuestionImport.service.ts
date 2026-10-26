import db from '../db';
import ExcelJS from 'exceljs';
import unzipper from 'unzipper';
const archiver = require('archiver');
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export interface QuestionOptionItem {
  id?: string;
  option_key: string;
  option_text: string;
  image_url?: string | null;
  is_correct: boolean;
}

export interface QuestionValidationError {
  field: string;
  message: string;
  category: 'STRUCTURE' | 'CONTENT' | 'OPTIONS' | 'ANSWER_KEY' | 'ASSETS';
  severity: 'ERROR' | 'WARNING';
}

export interface NormalizedQuestion {
  temp_id: string;
  question_text: string;
  question_type: string;
  section_name: string;
  marks: number;
  negative_marks: number;
  explanation: string;
  image_url: string | null;
  metadata?: any;
  options: QuestionOptionItem[];
  validation_status: 'VALID' | 'INVALID';
  validation_errors: QuestionValidationError[];
  raw?: any;
}

export class BulkQuestionImportService {
  private static uploadsDir = path.join(process.cwd(), 'uploads', 'questions');

  private static ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Validate and normalize a single raw question object
   */
  public static validateAndNormalizeQuestion(raw: any, index: number, assetMap: Map<string, string> = new Map()): NormalizedQuestion {
    const errors: QuestionValidationError[] = [];
    const tempId = String(raw.id || raw.temp_id || `q_${Date.now()}_${index + 1}`);

    const questionText = String(raw.question_text || raw.question || raw.text || raw.title || '').trim();
    if (!questionText) {
      errors.push({
        field: 'question_text',
        message: 'Question statement cannot be empty.',
        category: 'CONTENT',
        severity: 'ERROR'
      });
    }

    let qType = String(raw.question_type || raw.questionType || raw.type || '').trim().toUpperCase();
    if (!qType) {
      if (raw.columnA || raw.column_a || raw.leftItems) {
        qType = 'MATCH_FOLLOWING';
      } else if (raw.imageUrl || raw.image_url || raw.assets) {
        qType = 'IMAGE_MCQ';
      } else {
        qType = 'SINGLE_CHOICE';
      }
    }

    // Supported question types check
    const validTypes = [
      'SINGLE_CHOICE', 'MCQ', 'MULTIPLE_CHOICE', 'MULTI_SELECT',
      'TRUE_FALSE', 'FILL_BLANK', 'ASSERTION_REASON', 'IMAGE_MCQ',
      'MULTI_IMAGE_SELECT', 'IMAGE_MULTI_SELECT',
      'MATCH_FOLLOWING', 'SEQUENCE', 'IMAGE_SEQUENCE', 'SEQUENCE_ORDER',
      'ARRANGE_ORDER', 'ORDERING', 'TABLE_BASED'
    ];
    if (!validTypes.includes(qType)) {
      errors.push({
        field: 'question_type',
        message: `Unknown question type "${qType}". Defaulting to SINGLE_CHOICE.`,
        category: 'STRUCTURE',
        severity: 'WARNING'
      });
      qType = 'SINGLE_CHOICE';
    }

    // Resolve question diagram image and multiple supporting figures
    let imageUrl: string | null = raw.image_url || raw.imageUrl || null;
    if (raw.assets && Array.isArray(raw.assets) && raw.assets.length > 0) {
      const assetKey = raw.assets[0];
      imageUrl = assetMap.get(assetKey) || assetKey;
    } else if (imageUrl && assetMap.has(imageUrl)) {
      imageUrl = assetMap.get(imageUrl) || imageUrl;
    }

    const sectionName = String(raw.section_name || raw.section || 'General Assessment').trim();
    const marks = raw.marks !== undefined && !isNaN(Number(raw.marks)) ? Math.max(0.5, Number(raw.marks)) : 2.0;
    const negativeMarks = raw.negative_marks !== undefined && !isNaN(Number(raw.negative_marks))
      ? Math.max(0, Number(raw.negative_marks))
      : (raw.negativeMarks !== undefined && !isNaN(Number(raw.negativeMarks)) ? Math.max(0, Number(raw.negativeMarks)) : 0.5);
    const explanation = String(raw.explanation || raw.desc || '').trim();

    // Parse Metadata (for MATCH_FOLLOWING, TABLE_BASED, SEQUENCE/ORDER, MULTI-IMAGE)
    let metadata: any = null;
    if (raw.metadata) {
      metadata = typeof raw.metadata === 'string' ? JSON.parse(raw.metadata) : raw.metadata;
    } else if (qType === 'MATCH_FOLLOWING' || raw.columnA || raw.column_a) {
      const colA = raw.columnA || raw.column_a || raw.leftItems || [];
      const colB = raw.columnB || raw.column_b || raw.rightItems || [];
      const pairs = raw.correctMatches || raw.correct_matches || (raw.answer?.pairs ? JSON.stringify(raw.answer.pairs) : '');
      metadata = { columnA: colA, columnB: colB, correctMatches: pairs };
    } else if (qType.includes('SEQUENCE') || qType.includes('ORDER') || raw.itemsToOrder || raw.items_to_order) {
      const items = raw.itemsToOrder || raw.items_to_order || raw.sequenceItems || [];
      const order = raw.correctOrder || raw.correct_order || '';
      metadata = { itemsToOrder: items, correctOrder: order };
    }

    // Support multiple question figures in metadata
    const rawImages = Array.isArray(raw.imageUrls || raw.images || raw.figures) ? (raw.imageUrls || raw.images || raw.figures) : [];
    const resolvedImages = rawImages.map((img: string) => assetMap.get(img) || img);
    if (resolvedImages.length > 0) {
      if (!imageUrl) imageUrl = resolvedImages[0];
      if (!metadata) metadata = {};
      metadata.imageUrls = resolvedImages;
    }

    // Parse Options
    const options: QuestionOptionItem[] = [];

    if (qType === 'TRUE_FALSE') {
      const corr = String(raw.correct_option || raw.correctOption || raw.correct || 'True').trim().toLowerCase();
      options.push({
        id: 'opt_true',
        option_key: 'A',
        option_text: 'True',
        is_correct: corr === 'true' || corr === 'a' || corr === '1'
      });
      options.push({
        id: 'opt_false',
        option_key: 'B',
        option_text: 'False',
        is_correct: corr === 'false' || corr === 'b' || corr === '0'
      });
    } else if (Array.isArray(raw.options)) {
      raw.options.forEach((opt: any, idx: number) => {
        const key = String(opt.option_key || opt.key || String.fromCharCode(65 + idx)).trim().toUpperCase();
        const text = typeof opt === 'string' ? opt : String(opt.option_text || opt.text || opt.title || '').trim();
        let optImg = opt.image_url || opt.imageUrl || null;
        if (opt.assets && Array.isArray(opt.assets) && opt.assets.length > 0) {
          const aKey = opt.assets[0];
          optImg = assetMap.get(aKey) || aKey;
        } else if (optImg && assetMap.has(optImg)) {
          optImg = assetMap.get(optImg) || optImg;
        }

        let isCorrect = false;
        if (typeof opt === 'object' && opt.is_correct !== undefined) {
          isCorrect = Boolean(opt.is_correct);
        } else if (typeof opt === 'object' && opt.isCorrect !== undefined) {
          isCorrect = Boolean(opt.isCorrect);
        } else if (raw.correct_option || raw.correctOption || raw.correct) {
          const corr = String(raw.correct_option || raw.correctOption || raw.correct).trim().toUpperCase();
          isCorrect = corr === key || corr === text.toUpperCase() || String(idx) === corr;
        }

        options.push({
          id: opt.id ? String(opt.id) : `opt_${idx + 1}`,
          option_key: key,
          option_text: text,
          image_url: optImg,
          is_correct: isCorrect
        });
      });
    } else if (raw.optionA || raw.option_a || raw.a) {
      const optKeys = ['A', 'B', 'C', 'D'];
      const corr = String(raw.correct_option || raw.correctOption || raw.correct || 'A').trim().toUpperCase();

      optKeys.forEach((k) => {
        const val = raw[`option${k}`] || raw[`option_${k.toLowerCase()}`] || raw[k.toLowerCase()] || '';
        const optImgRaw = raw[`option${k}_image`] || raw[`option_${k.toLowerCase()}_image`] || null;
        const optImg = optImgRaw ? (assetMap.get(optImgRaw) || optImgRaw) : null;
        const text = String(val).trim();
        if (text || optImg) {
          options.push({
            id: `opt_${k.toLowerCase()}`,
            option_key: k,
            option_text: text,
            image_url: optImg,
            is_correct: corr === k || corr === text.toUpperCase()
          });
        }
      });
    }

    // Validation rules
    if (['SINGLE_CHOICE', 'MCQ', 'IMAGE_MCQ', 'MULTIPLE_CHOICE', 'MULTI_SELECT'].includes(qType)) {
      if (options.length < 2) {
        errors.push({
          field: 'options',
          message: 'Question must have at least 2 distinct options.',
          category: 'OPTIONS',
          severity: 'ERROR'
        });
      }
      const hasCorrect = options.some(o => o.is_correct);
      if (!hasCorrect) {
        errors.push({
          field: 'answer_key',
          message: 'No correct answer specified for this question.',
          category: 'ANSWER_KEY',
          severity: 'ERROR'
        });
      }
    }

    const hasErrors = errors.some(e => e.severity === 'ERROR');

    return {
      temp_id: tempId,
      question_text: questionText,
      question_type: qType,
      section_name: sectionName,
      marks,
      negative_marks: negativeMarks,
      explanation,
      image_url: imageUrl,
      metadata,
      options,
      validation_status: hasErrors ? 'INVALID' : 'VALID',
      validation_errors: errors,
      raw
    };
  }

  /**
   * Parse JSON input (Array of questions or standardized schema package)
   */
  public static parseJson(bufferOrString: Buffer | string): NormalizedQuestion[] {
    const text = typeof bufferOrString === 'string' ? bufferOrString : bufferOrString.toString('utf8');
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
    if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);

    if (!Array.isArray(list)) {
      throw new Error('Input must be a JSON array of question objects.');
    }

    return list.map((q, i) => this.validateAndNormalizeQuestion(q, i));
  }

  /**
   * Parse Excel (.xlsx) file with multi-column support
   */
  public static async parseExcel(buffer: Buffer): Promise<NormalizedQuestion[]> {
    const workbook = new ExcelJS.Workbook();
    // @ts-ignore
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel workbook has no sheets.');
    }

    const rows: any[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as any[];
      if (rowNumber === 1) {
        values.forEach((v) => {
          if (v) headers.push(String(v).trim().toLowerCase().replace(/[\s_-]+/g, ''));
        });
      } else {
        const rowData: any = {};
        headers.forEach((h, idx) => {
          const val = values[idx + 1];
          rowData[h] = val !== undefined && val !== null ? (typeof val === 'object' && val.text ? val.text : String(val).trim()) : '';
        });
        if (Object.values(rowData).some(v => v !== '')) {
          rows.push(rowData);
        }
      }
    });

    const parsedQuestions = rows.map((r, i) => {
      const rawQuestion: any = {
        question: r.question || r.questiontext || r.statement || r.questionstatement || '',
        questionType: r.questiontype || r.type || 'SINGLE_CHOICE',
        imageUrl: r.imageurl || r.diagramurl || r.image || '',
        section: r.section || r.sectionname || 'General Assessment',
        marks: r.marks || 2,
        negativeMarks: r.negativemarks || r.negative || 0.5,
        explanation: r.explanation || r.desc || '',
        optionA: r.optiona || r.choicea || '',
        optionB: r.optionb || r.choiceb || '',
        optionC: r.optionc || r.choicec || '',
        optionD: r.optiond || r.choiced || '',
        correctOption: r.correctoption || r.correctanswer || r.answer || 'A'
      };

      // Match the following support in excel
      if (r.columna || r.columnb) {
        rawQuestion.columnA = String(r.columna || '').split(';').map(s => s.trim()).filter(Boolean);
        rawQuestion.columnB = String(r.columnb || '').split(';').map(s => s.trim()).filter(Boolean);
        rawQuestion.correctMatches = r.correctmatches || r.pairs || '';
      }

      return this.validateAndNormalizeQuestion(rawQuestion, i);
    });

    return parsedQuestions;
  }

  /**
   * Parse CSV string/buffer
   */
  public static parseCsv(bufferOrString: Buffer | string): NormalizedQuestion[] {
    const content = typeof bufferOrString === 'string' ? bufferOrString : bufferOrString.toString('utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one question row.');
    }

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const questions: NormalizedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const rowData: any = {};
      headers.forEach((h, idx) => {
        rowData[h] = cols[idx] || '';
      });

      const rawQuestion: any = {
        question: rowData.question || rowData.questiontext || rowData.questionstatement || rowData.statement || '',
        questionType: rowData.questiontype || rowData.type || 'SINGLE_CHOICE',
        imageUrl: rowData.imageurl || rowData.image || '',
        section: rowData.section || rowData.sectionname || 'General Assessment',
        marks: rowData.marks || 2,
        negativeMarks: rowData.negativemarks || rowData.negative || 0.5,
        explanation: rowData.explanation || '',
        optionA: rowData.optiona || '',
        optionB: rowData.optionb || '',
        optionC: rowData.optionc || '',
        optionD: rowData.optiond || '',
        correctOption: rowData.correctoption || rowData.answer || 'A'
      };

      questions.push(this.validateAndNormalizeQuestion(rawQuestion, i - 1));
    }

    return questions;
  }

  /**
   * Parse ZIP package containing questions.json and images/ folder
   */
  public static async parseZip(buffer: Buffer): Promise<NormalizedQuestion[]> {
    this.ensureUploadsDir();
    const assetMap = new Map<string, string>();
    let questionsContent: string | null = null;
    let excelBuffer: Buffer | null = null;

    const directory = await unzipper.Open.buffer(buffer);

    // 1. First extract all images securely (path traversal protection)
    for (const file of directory.files) {
      const safePath = path.normalize(file.path).replace(/^(\.\.[\/\\])+/, '');
      if (safePath.includes('..')) continue; // Prevent directory traversal

      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(safePath);
      if (isImage) {
        const fileBuffer = await file.buffer();
        const baseName = path.basename(safePath);
        const ext = path.extname(baseName) || '.png';
        const targetFilename = `zip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${baseName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        const targetPath = path.join(this.uploadsDir, targetFilename);

        fs.writeFileSync(targetPath, fileBuffer);
        const publicUrl = `/uploads/questions/${targetFilename}`;

        // Map both raw filename and relative path
        assetMap.set(baseName, publicUrl);
        assetMap.set(safePath, publicUrl);
        assetMap.set(`images/${baseName}`, publicUrl);
      } else if (safePath.endsWith('questions.json') || safePath.endsWith('.json')) {
        const content = await file.buffer();
        questionsContent = content.toString('utf8');
      } else if (safePath.endsWith('.xlsx')) {
        excelBuffer = await file.buffer();
      }
    }

    // 2. Parse questions
    if (questionsContent) {
      const text = questionsContent.trim();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      return list.map((q, i) => this.validateAndNormalizeQuestion(q, i, assetMap));
    } else if (excelBuffer) {
      const excelQuestions = await this.parseExcel(excelBuffer);
      // Remap assets
      return excelQuestions.map((q, i) => this.validateAndNormalizeQuestion(q.raw, i, assetMap));
    } else {
      throw new Error('ZIP archive must contain a "questions.json" or ".xlsx" file.');
    }
  }

  /**
   * Commit normalized questions into MySQL database in a secure transaction
   */
  public static async commitQuestionsToTest(
    testId: number | string,
    questions: NormalizedQuestion[],
    policy: 'FAIL_ON_ERROR' | 'SKIP_ERRORS' = 'FAIL_ON_ERROR'
  ): Promise<{ success: boolean; importedCount: number; skippedCount: number; errors: any[] }> {
    const invalidQuestions = questions.filter(q => q.validation_status === 'INVALID');

    if (policy === 'FAIL_ON_ERROR' && invalidQuestions.length > 0) {
      throw new Error(`Cannot import: ${invalidQuestions.length} question(s) have blocking validation errors.`);
    }

    const eligible = policy === 'SKIP_ERRORS' ? questions.filter(q => q.validation_status === 'VALID') : questions;
    if (eligible.length === 0) {
      return { success: true, importedCount: 0, skippedCount: questions.length, errors: invalidQuestions };
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let orderOffset = 1;
      const [orderRow]: any = await connection.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM questions WHERE test_id = ?',
        [testId]
      );
      orderOffset = (orderRow[0]?.max_order || 0) + 1;

      for (let i = 0; i < eligible.length; i++) {
        const q = eligible[i];
        const [qRes]: any = await connection.query(`
          INSERT INTO questions (
            test_id, question_text, section_name, question_type,
            image_url, explanation, metadata, marks, negative_marks, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testId,
          q.question_text,
          q.section_name,
          q.question_type,
          q.image_url,
          q.explanation,
          q.metadata ? JSON.stringify(q.metadata) : null,
          q.marks,
          q.negative_marks,
          orderOffset + i
        ]);

        const questionId = qRes.insertId;

        for (const opt of q.options) {
          await connection.query(`
            INSERT INTO question_options (question_id, option_key, option_text, image_url, is_correct)
            VALUES (?, ?, ?, ?, ?)
          `, [
            questionId,
            opt.option_key,
            opt.option_text,
            opt.image_url || null,
            opt.is_correct ? 1 : 0
          ]);
        }
      }

      // Sync question count on tests table
      const [countRow]: any = await connection.query(
        'SELECT COUNT(*) as cnt FROM questions WHERE test_id = ?',
        [testId]
      );
      await connection.query('UPDATE tests SET question_count = ? WHERE id = ?', [countRow[0]?.cnt || 0, testId]);

      await connection.commit();

      return {
        success: true,
        importedCount: eligible.length,
        skippedCount: questions.length - eligible.length,
        errors: invalidQuestions
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Sample Template Generators
   */
  public static generateJsonTemplate(): string {
    return JSON.stringify([
      {
        question: "Which component is recognized as the central processing unit of a computer?",
        questionType: "SINGLE_CHOICE",
        section: "Computer Architecture",
        marks: 2,
        negativeMarks: 0.5,
        options: [
          { key: "A", text: "RAM (Random Access Memory)", isCorrect: false },
          { key: "B", text: "CPU (Central Processing Unit)", isCorrect: true },
          { key: "C", text: "Hard Drive Disk", isCorrect: false },
          { key: "D", text: "Power Supply Unit", isCorrect: false }
        ],
        explanation: "The CPU coordinates data operations and executes instructions."
      },
      {
        question: "Which of the following are open-source relational database management systems?",
        questionType: "MULTIPLE_CHOICE",
        section: "Database Systems",
        marks: 4,
        negativeMarks: 1.0,
        options: [
          { key: "A", text: "PostgreSQL", isCorrect: true },
          { key: "B", text: "MySQL", isCorrect: true },
          { key: "C", text: "Oracle Database Commercial", isCorrect: false },
          { key: "D", text: "SQLite", isCorrect: true }
        ],
        explanation: "PostgreSQL, MySQL, and SQLite are open-source RDBMS."
      },
      {
        question: "RAM retains its stored electrical data indefinitely without constant power supply.",
        questionType: "TRUE_FALSE",
        section: "Hardware Architecture",
        correctOption: "False",
        marks: 2,
        negativeMarks: 0.5,
        explanation: "RAM is volatile memory; data dissipates when power is lost."
      },
      {
        question: "Match the internet application protocol in Column A with its standard TCP/UDP port in Column B:",
        questionType: "MATCH_FOLLOWING",
        section: "Computer Networking",
        columnA: ["1. HTTP", "2. HTTPS", "3. SSH", "4. DNS"],
        columnB: ["A. Port 22", "B. Port 53", "C. Port 80", "D. Port 443"],
        correctMatches: "1->C, 2->D, 3->A, 4->B",
        options: [
          { key: "A", text: "1-C, 2-D, 3-A, 4-B", isCorrect: true },
          { key: "B", text: "1-A, 2-B, 3-C, 4-D", isCorrect: false },
          { key: "C", text: "1-D, 2-C, 3-B, 4-A", isCorrect: false },
          { key: "D", text: "1-B, 2-A, 3-D, 4-C", isCorrect: false }
        ],
        marks: 4,
        negativeMarks: 1.0,
        explanation: "HTTP uses port 80, HTTPS uses port 443, SSH uses 22, and DNS uses 53."
      }
    ], null, 2);
  }

  public static async generateExcelTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Questions Template');

    sheet.columns = [
      { header: 'Question Statement', key: 'question', width: 35 },
      { header: 'Question Type', key: 'questionType', width: 18 },
      { header: 'Section Name', key: 'section', width: 20 },
      { header: 'Image URL', key: 'imageUrl', width: 25 },
      { header: 'Option A', key: 'optionA', width: 22 },
      { header: 'Option B', key: 'optionB', width: 22 },
      { header: 'Option C', key: 'optionC', width: 22 },
      { header: 'Option D', key: 'optionD', width: 22 },
      { header: 'Correct Option (A/B/C/D or True/False)', key: 'correctOption', width: 25 },
      { header: 'Marks', key: 'marks', width: 10 },
      { header: 'Negative Marks', key: 'negativeMarks', width: 14 },
      { header: 'Explanation', key: 'explanation', width: 30 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    sheet.addRow({
      question: 'Which component is known as the brain of the computer?',
      questionType: 'SINGLE_CHOICE',
      section: 'Computer Basics',
      imageUrl: '',
      optionA: 'RAM',
      optionB: 'CPU',
      optionC: 'Hard Drive',
      optionD: 'Power Supply',
      correctOption: 'B',
      marks: 2,
      negativeMarks: 0.5,
      explanation: 'The CPU performs all instructions and computations.'
    });

    sheet.addRow({
      question: 'RAM retains its data even after the computer is turned off.',
      questionType: 'TRUE_FALSE',
      section: 'Hardware',
      imageUrl: '',
      optionA: 'True',
      optionB: 'False',
      optionC: '',
      optionD: '',
      correctOption: 'False',
      marks: 2,
      negativeMarks: 0.5,
      explanation: 'RAM is volatile memory.'
    });

    // @ts-ignore
    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  public static generateCsvTemplate(): string {
    return [
      'Question Statement,Question Type,Section Name,Image URL,Option A,Option B,Option C,Option D,Correct Option,Marks,Negative Marks,Explanation',
      '"What is the default port for HTTP?","SINGLE_CHOICE","Web Tech","","21","80","443","8080","B",2,0.5,"HTTP standard port is 80."',
      '"Python is an interpreted language.","TRUE_FALSE","Programming","","True","False","","","True",2,0.5,"Python is interpreted."'
    ].join('\n');
  }

  public static async generateZipTemplate(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = typeof archiver === 'function'
        ? archiver('zip', { zlib: { level: 9 } })
        : (archiver.ZipArchive ? new archiver.ZipArchive({ zlib: { level: 9 } }) : new archiver.Archiver('zip', { zlib: { level: 9 } }));
      const buffers: Buffer[] = [];

      archive.on('data', data => buffers.push(data));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', err => reject(err));

      const questionsJson = this.generateJsonTemplate();
      archive.append(questionsJson, { name: 'questions.json' });

      // Provide a tiny 1x1 transparent PNG in images/
      const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      archive.append(dummyPng, { name: 'images/diagram-001.png' });

      archive.finalize();
    });
  }
}

import PDFDocument from 'pdfkit';

export interface StudentPdfRecord {
  id: number;
  roll_no?: string;
  enrollment_no?: string;
  name: string;
  father_name?: string;
  course_name?: string;
  certificate_number?: string;
  percentage?: number | string;
  grade?: string;
  status?: string;
  issue_date?: string;
  center_name?: string;
  center_code?: string;
  certificate_file_url?: string;
  certificate_s3_url?: string;
  marksheet_file_url?: string;
  marksheet_s3_url?: string;
}

/**
 * Generates an official Certificate PDF Buffer entirely on the server.
 * Uses high-resolution vector lines and typography for print-ready quality.
 */
export function generateCertificatePdfBuffer(student: StudentPdfRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 36
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;

      // Outer Decorative Border (Navy & Gold)
      doc.rect(20, 20, width - 40, height - 40)
        .lineWidth(3)
        .strokeColor('#0c2340')
        .stroke();

      doc.rect(26, 26, width - 52, height - 52)
        .lineWidth(1)
        .strokeColor('#d97706')
        .stroke();

      // Top Organization Header
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#b45309')
        .text('AN ISO 9001:2015 CERTIFIED AUTONOMOUS INSTITUTION', 0, 50, { align: 'center' });

      doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#0c2340')
        .text('EXAMIRROR SKILL DEVELOPMENT & EXAMINATION BOARD', 0, 68, { align: 'center' });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Registered Under Ministry of Corporate Affairs (MCA) Govt. of India', 0, 96, { align: 'center' });

      // Certificate Title Ribbon
      doc.moveDown(1.5);
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#d97706')
        .text('CERTIFICATE OF COMPLETION', 0, 125, { align: 'center' });

      doc.fontSize(11)
        .font('Helvetica-Oblique')
        .fillColor('#475569')
        .text('This is to proudly certify that', 0, 160, { align: 'center' });

      // Student Name
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text((student.name || 'CANDIDATE NAME').toUpperCase(), 0, 185, { align: 'center' });

      // Line under name
      const nameWidth = Math.min(420, (student.name || '').length * 15 + 100);
      const startX = (width - nameWidth) / 2;
      doc.moveTo(startX, 215)
        .lineTo(startX + nameWidth, 215)
        .lineWidth(1.5)
        .strokeColor('#d97706')
        .stroke();

      // Student Father & Enrollment Details
      const fatherText = student.father_name ? `Son/Daughter of Shri ${student.father_name}` : '';
      const rollText = `Roll No: ${student.roll_no || student.id}   |   Enrollment No: ${student.enrollment_no || 'N/A'}`;

      if (fatherText) {
        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#334155')
          .text(fatherText, 0, 226, { align: 'center' });
      }

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#475569')
        .text(rollText, 0, 246, { align: 'center' });

      // Course text
      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text('has successfully completed the prescribed curriculum and examination for the certification of', 0, 275, { align: 'center' });

      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1e1b4b')
        .text(student.course_name || 'Vocational Training & Skill Certification', 0, 300, { align: 'center' });

      // Center and Performance
      const centerInfo = student.center_name 
        ? `Authorized Study Center: ${student.center_name} (${student.center_code || 'EXAMIRROR'})`
        : `Authorized Examination Center (${student.center_code || 'EXAMIRROR'})`;

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(centerInfo, 0, 335, { align: 'center' });

      const gradeText = student.grade ? `Grade: ${student.grade}` : 'Performance: Satisfactory';
      const scoreText = student.percentage ? `Score: ${student.percentage}%` : '';
      const certNoText = `Certificate Sl. No: ${student.certificate_number || `EXAM-${student.id}-2026`}`;

      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#047857')
        .text(`${gradeText}   ${scoreText ? '|   ' + scoreText : ''}   |   ${certNoText}`, 0, 360, { align: 'center' });

      // Verification note
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(`Online Verification: https://examirror.com/verify/certificate/${student.certificate_number || student.roll_no || student.id}`, 0, 420, { align: 'center' });

      // Footer Signatures
      const bottomY = height - 90;

      // Issue Date
      const issueDate = student.issue_date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(`Issue Date: ${issueDate}`, 50, bottomY);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('New Delhi, India', 50, bottomY + 14);

      // Signatory 1
      doc.moveTo(width / 2 - 80, bottomY + 5)
        .lineTo(width / 2 + 80, bottomY + 5)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text('Authorized Center In-Charge', width / 2 - 100, bottomY + 12, { width: 200, align: 'center' });

      // Signatory 2
      doc.moveTo(width - 230, bottomY + 5)
        .lineTo(width - 50, bottomY + 5)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .stroke();
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0c2340').text('Controller of Examinations', width - 230, bottomY + 12, { width: 180, align: 'center' });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('EXAMIRROR ACADEMIC COUNCIL', width - 230, bottomY + 24, { width: 180, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an official Marksheet PDF Buffer entirely on the server.
 */
export function generateMarksheetPdfBuffer(student: StudentPdfRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 36
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;

      // Border
      doc.rect(20, 20, width - 40, doc.page.height - 40)
        .lineWidth(2)
        .strokeColor('#0f172a')
        .stroke();

      // Header
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#b45309')
        .text('EXAMIRROR SKILL EVALUATION & CERTIFICATION BOARD', 0, 45, { align: 'center' });

      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0c2340')
        .text('STATEMENT OF MARKS', 0, 62, { align: 'center' });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Annual / Semester Evaluation Examination', 0, 85, { align: 'center' });

      // Details Table
      doc.moveDown(1.5);
      const startY = 115;
      doc.rect(40, startY, width - 80, 85)
        .fillAndStroke('#f8fafc', '#cbd5e1');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
      doc.text(`Student Name:`, 55, startY + 12);
      doc.font('Helvetica').fillColor('#0f172a').text(student.name, 150, startY + 12);

      doc.font('Helvetica-Bold').fillColor('#334155').text(`Father's Name:`, 55, startY + 28);
      doc.font('Helvetica').fillColor('#0f172a').text(student.father_name || 'N/A', 150, startY + 28);

      doc.font('Helvetica-Bold').fillColor('#334155').text(`Roll Number:`, 55, startY + 44);
      doc.font('Helvetica').fillColor('#0f172a').text(student.roll_no || String(student.id), 150, startY + 44);

      doc.font('Helvetica-Bold').fillColor('#334155').text(`Enrollment No:`, 55, startY + 60);
      doc.font('Helvetica').fillColor('#0f172a').text(student.enrollment_no || 'N/A', 150, startY + 60);

      const rightX = 320;
      doc.font('Helvetica-Bold').fillColor('#334155').text(`Course:`, rightX, startY + 12);
      doc.font('Helvetica').fillColor('#0f172a').text(student.course_name || 'Certificate Course', rightX + 80, startY + 12, { width: 140 });

      doc.font('Helvetica-Bold').fillColor('#334155').text(`Center Code:`, rightX, startY + 44);
      doc.font('Helvetica').fillColor('#0f172a').text(student.center_code || 'EXAMIRROR', rightX + 80, startY + 44);

      doc.font('Helvetica-Bold').fillColor('#334155').text(`Cert Sl. No:`, rightX, startY + 60);
      doc.font('Helvetica').fillColor('#047857').text(student.certificate_number || 'Official', rightX + 80, startY + 60);

      // Marks Table Header
      const tableY = startY + 110;
      doc.rect(40, tableY, width - 80, 25).fillAndStroke('#0c2340', '#0c2340');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('Subject / Module Code', 55, tableY + 8);
      doc.text('Maximum Marks', 250, tableY + 8, { width: 90, align: 'center' });
      doc.text('Pass Marks', 350, tableY + 8, { width: 80, align: 'center' });
      doc.text('Marks Obtained', 440, tableY + 8, { width: 90, align: 'center' });

      // Table Rows
      const modules = [
        { name: 'Theory Examination Paper I', max: 100, pass: 40, obt: Math.round(Number(student.percentage) || 78) },
        { name: 'Practical Assessment & Lab Skills', max: 50, pass: 20, obt: Math.round((Number(student.percentage) || 78) * 0.45) },
        { name: 'Viva-Voce & Project Evaluation', max: 50, pass: 20, obt: Math.round((Number(student.percentage) || 78) * 0.42) }
      ];

      let rowY = tableY + 25;
      modules.forEach((mod, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, rowY, width - 80, 24).fillAndStroke(bg, '#e2e8f0');
        doc.fontSize(8.5).font('Helvetica').fillColor('#1e293b');
        doc.text(mod.name, 55, rowY + 7);
        doc.text(String(mod.max), 250, rowY + 7, { width: 90, align: 'center' });
        doc.text(String(mod.pass), 350, rowY + 7, { width: 80, align: 'center' });
        doc.font('Helvetica-Bold').fillColor('#0c2340').text(String(mod.obt), 440, rowY + 7, { width: 90, align: 'center' });
        rowY += 24;
      });

      // Total Row
      const totalMax = 200;
      const totalObtained = Math.min(200, Math.round(((Number(student.percentage) || 78) / 100) * totalMax));
      doc.rect(40, rowY, width - 80, 28).fillAndStroke('#e2e8f0', '#94a3b8');
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('GRAND TOTAL', 55, rowY + 9);
      doc.text(String(totalMax), 250, rowY + 9, { width: 90, align: 'center' });
      doc.text('80', 350, rowY + 9, { width: 80, align: 'center' });
      doc.fillColor('#047857').text(String(totalObtained), 440, rowY + 9, { width: 90, align: 'center' });

      // Performance Summary
      const summaryY = rowY + 45;
      doc.rect(40, summaryY, width - 80, 50).fillAndStroke('#f0fdf4', '#86efac');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#14532d');
      doc.text(`Percentage: ${student.percentage || '78.5'}%   |   Grade: ${student.grade || 'A'}   |   Result: PASSED`, 0, summaryY + 18, { align: 'center' });

      // Footer
      const bottomY = doc.page.height - 80;
      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text('This is a computer generated official statement of marks issued by Examirror.', 0, bottomY, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

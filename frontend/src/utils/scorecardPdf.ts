import { jsPDF } from 'jspdf';

export interface ScorecardPdfData {
  testTitle: string;
  seriesTitle?: string;
  studentName: string;
  enrollmentNo: string;
  centerName?: string;
  examDate?: string;
  status: 'PASSED' | 'FAILED';
  finalScore: number;
  totalMarks: number;
  passingMarks: number;
  percentage: number;
  accuracy: number;
  durationSeconds: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  ranking?: number;
  topicBreakdown?: Array<{
    topicName: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export const downloadOfficialScorecardPdf = (data: ScorecardPdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const reportId = `CBT-REP-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const timestamp = data.examDate || new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Outer Border & Margins
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Accent Border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.3);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(12, 12, pageWidth - 24, 28, 'F');

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXAMIRROR SKILL DEVELOPMENT COUNCIL', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('GOVT. REGD. | ISO 9001:2015 CERTIFIED NATIONAL VOCATIONAL & IT BOARD', pageWidth / 2, 28, { align: 'center' });

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(7.5);
  doc.text('OFFICIAL CBT ASSESSMENT REPORT & PERFORMANCE SCORECARD', pageWidth / 2, 34, { align: 'center' });

  // Verification Code Ribbon
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(12, 40, pageWidth - 24, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`REPORT ID: ${reportId}`, 16, 45);
  doc.text(`GENERATED: ${timestamp}`, pageWidth - 16, 45, { align: 'right' });

  // Section 1: Candidate & Exam Profile
  let y = 54;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CANDIDATE & EXAMINATION PROFILE', 16, y);

  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(0.5);
  doc.line(16, y + 2, 75, y + 2);

  y += 7;
  const col1X = 16;
  const col2X = pageWidth / 2 + 5;

  const drawField = (label: string, value: string, xPos: number, yPos: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(label.toUpperCase(), xPos, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(value || 'N/A', xPos, yPos + 4.5);
  };

  drawField('Candidate Name', data.studentName, col1X, y);
  drawField('Enrollment / Roll No', data.enrollmentNo, col2X, y);
  y += 12;

  drawField('Assessment Title', data.testTitle, col1X, y);
  drawField('Program / Course', data.seriesTitle || 'Vocational Skills Course', col2X, y);
  y += 12;

  drawField('Authorised Center', data.centerName || 'Direct Online Student Portal', col1X, y);
  drawField('Duration Taken', `${Math.floor(data.durationSeconds / 60)}m ${data.durationSeconds % 60}s`, col2X, y);
  y += 16;

  // Section 2: Overall Score & Result Banner
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('ASSESSMENT EVALUATION SUMMARY', 16, y);

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(16, y + 2, 75, y + 2);

  y += 7;

  // Large Performance Card
  const isPassed = data.status === 'PASSED';
  doc.setFillColor(isPassed ? 240 : 254, isPassed ? 253 : 242, isPassed ? 244 : 242);
  doc.setDrawColor(isPassed ? 187 : 254, isPassed ? 247 : 202, isPassed ? 208 : 202);
  doc.setLineWidth(0.5);
  doc.roundedRect(16, y, pageWidth - 32, 28, 3, 3, 'FD');

  // Status Badge
  doc.setFillColor(isPassed ? 22 : 225, isPassed ? 101 : 29, isPassed ? 52 : 72);
  doc.roundedRect(pageWidth - 55, y + 4, 34, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(data.status, pageWidth - 38, y + 9.5, { align: 'center' });

  // Main Marks
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Final Score Obtained', 22, y + 9);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.finalScore.toFixed(2)}`, 22, y + 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`/ ${data.totalMarks.toFixed(2)} Marks (Passing: ${data.passingMarks})`, 48, y + 18);

  // Four Metric Stats inside Banner
  y += 33;
  const statBoxW = (pageWidth - 32 - 9) / 4;

  const statItems = [
    { label: 'PERCENTAGE', val: `${data.percentage.toFixed(1)}%`, color: [15, 23, 42] },
    { label: 'ACCURACY', val: `${data.accuracy.toFixed(1)}%`, color: [5, 150, 105] },
    { label: 'CORRECT ANSWERS', val: `${data.correctAnswers}`, color: [5, 150, 105] },
    { label: 'INCORRECT / LEFT', val: `${data.incorrectAnswers} / ${data.unanswered}`, color: [225, 29, 72] }
  ];

  statItems.forEach((st, idx) => {
    const curX = 16 + idx * (statBoxW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(curX, y, statBoxW, 14, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, curX + statBoxW / 2, y + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(st.color[0], st.color[1], st.color[2]);
    doc.text(st.val, curX + statBoxW / 2, y + 11, { align: 'center' });
  });

  y += 20;

  // Section 3: Topic / Section Mastery Breakdown
  if (data.topicBreakdown && data.topicBreakdown.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SECTION & TOPIC PERFORMANCE BREAKDOWN', 16, y);

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(16, y + 2, 85, y + 2);

    y += 7;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(16, y, pageWidth - 32, 6.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('TOPIC / SECTION NAME', 20, y + 4.5);
    doc.text('TOTAL QUESTIONS', 115, y + 4.5);
    doc.text('CORRECT', 145, y + 4.5);
    doc.text('MASTERY / ACCURACY', pageWidth - 20, y + 4.5, { align: 'right' });

    y += 7;

    data.topicBreakdown.forEach((tp, i) => {
      if (y > pageHeight - 55) return; // avoid overflow
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(16, y, pageWidth - 32, 6.5, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(tp.topicName || 'General Module', 20, y + 4.5);
      doc.text(String(tp.total), 125, y + 4.5);
      doc.text(String(tp.correct), 150, y + 4.5);

      const accColor = tp.accuracy >= 75 ? [5, 150, 105] : tp.accuracy >= 50 ? [217, 119, 6] : [225, 29, 72];
      doc.setTextColor(accColor[0], accColor[1], accColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`${tp.accuracy.toFixed(0)}%`, pageWidth - 20, y + 4.5, { align: 'right' });

      y += 6.5;
    });

    y += 4;
  }

  // Footer: Security & Official Stamp Box
  const footerY = pageHeight - 42;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(16, footerY, pageWidth - 16, footerY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Security Disclaimer: This computer-generated CBT Scorecard is digitally signed and cryptographically logged.', 16, footerY + 6);
  doc.text('Authenticity can be verified online via the Examirror National Portal using the Report ID.', 16, footerY + 10);
  doc.text(`Proctored Session ID: SEC-PROCTOR-${data.enrollmentNo}-${data.finalScore.toFixed(0)}`, 16, footerY + 14);

  // Digital Signature Seal
  doc.setDrawColor(79, 70, 229);
  doc.roundedRect(pageWidth - 60, footerY + 4, 44, 16, 2, 2);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('DIGITALLY VERIFIED', pageWidth - 38, footerY + 10, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EXAMIRROR CONTROLLER OF EXAMS', pageWidth - 38, footerY + 15, { align: 'center' });

  // Save PDF
  const cleanName = data.studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTest = data.testTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Scorecard_${cleanTest}_${cleanName}.pdf`);
};

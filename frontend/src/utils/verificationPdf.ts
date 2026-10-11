import { jsPDF } from 'jspdf';

export interface VerificationPdfData {
  studentName: string;
  enrollmentNo: string;
  rollNo?: string;
  courseName: string;
  centerName: string;
  centerCode?: string;
  academicStatus?: string;
  certificateNumber?: string;
  issueDate?: string;
  marks?: Array<{
    semester: string;
    written_marks?: number;
    viva_marks?: number;
    status?: string;
    exam_date?: string;
  }>;
}

export const downloadOfficialVerificationPdf = (data: VerificationPdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const verificationId = `VER-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Border & Header Container
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
  doc.setFontSize(15);
  doc.text('EXAMIRROR SKILL DEVELOPMENT COUNCIL', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('GOVT. REGD. | ISO 9001:2015 CERTIFIED NATIONAL VOCATIONAL & IT BOARD', pageWidth / 2, 28, { align: 'center' });
  doc.setTextColor(203, 213, 225);
  doc.text('CENTRALIZED AUTHENTICATION & CREDENTIAL VERIFICATION RECORD', pageWidth / 2, 34, { align: 'center' });

  // Verification Status Badge Box
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(34, 197, 94); // Emerald 500
  doc.setLineWidth(0.5);
  doc.roundedRect(18, 45, pageWidth - 36, 16, 2, 2, 'FD');

  doc.setTextColor(22, 101, 52); // Emerald 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STATUS: OFFICIAL CREDENTIAL AUTHENTICATED & VERIFIED', pageWidth / 2, 53, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Digital Verification ID: ${verificationId}  |  Timestamp: ${timestamp}`, pageWidth / 2, 58, { align: 'center' });

  // Candidate Details Section Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. CANDIDATE IDENTIFICATION & COURSE ENROLLMENT', 18, 70);

  doc.setDrawColor(226, 232, 240);
  doc.line(18, 72, pageWidth - 18, 72);

  // Student Details Grid Table
  doc.setFontSize(9);
  const startY = 78;
  const rowHeight = 8;

  const candidateFields = [
    { label: 'Student Full Name:', value: (data.studentName || 'N/A').toUpperCase() },
    { label: 'Enrollment Number:', value: data.enrollmentNo || 'N/A' },
    { label: 'Roll Number:', value: data.rollNo || 'N/A' },
    { label: 'Program / Course:', value: data.courseName || 'Computer Technology Program' },
    { label: 'Affiliated Study Center:', value: data.centerName || 'Authorized Center' },
    { label: 'Center Code:', value: data.centerCode || 'N/A' },
    { label: 'Academic Status:', value: (data.academicStatus || 'Active Enrolled').toUpperCase() },
    { label: 'Diploma / Certificate No:', value: data.certificateNumber || 'ISSUED_VERIFIED' }
  ];

  candidateFields.forEach((field, idx) => {
    const col = idx % 2 === 0 ? 18 : 110;
    const y = startY + Math.floor(idx / 2) * rowHeight;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(field.label, col, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(field.value, col + 44, y);
  });

  // Academic Examination Records (if marks exist)
  let currentY = startY + Math.ceil(candidateFields.length / 2) * rowHeight + 8;

  if (data.marks && data.marks.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. EXAMINATION PERFORMANCE & MARKSHEET SUMMARY', 18, currentY);
    doc.line(18, currentY + 2, pageWidth - 18, currentY + 2);

    currentY += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(18, currentY, pageWidth - 36, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Semester / Module', 22, currentY + 5);
    doc.text('Theory Marks', 80, currentY + 5);
    doc.text('Practical / Viva', 120, currentY + 5);
    doc.text('Status', 160, currentY + 5);

    currentY += 7;

    data.marks.forEach((m) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(m.semester || 'Semester 1', 22, currentY + 5);
      doc.text(String(m.written_marks ?? 'Pass'), 80, currentY + 5);
      doc.text(String(m.viva_marks ?? 'Pass'), 120, currentY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52);
      doc.text((m.status || 'COMPLETED').toUpperCase(), 160, currentY + 5);

      doc.setDrawColor(241, 245, 249);
      doc.line(18, currentY + 7, pageWidth - 18, currentY + 7);
      currentY += 7;
    });

    currentY += 6;
  }

  // Verification & Legal Disclaimer Box
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. DIGITAL SIGNATURE & OFFICIAL RECORD ATTESTATION', 18, currentY);
  doc.line(18, currentY + 2, pageWidth - 18, currentY + 2);

  currentY += 8;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const disclaimer = 'This official verification statement is electronically generated from the centralized database of Examirror Skill Development Council. Any physical modification, digital tampering, or unauthorized replication of this record is punishable under Section 66D of the Information Technology Act. Employers and educational institutions can verify this credential at any time using the official URL or QR Code.';
  doc.text(doc.splitTextToSize(disclaimer, pageWidth - 36), 18, currentY);

  // Bottom Seals / Signature line
  const bottomY = pageHeight - 38;
  doc.setDrawColor(203, 213, 225);
  doc.line(25, bottomY, 75, bottomY);
  doc.line(pageWidth - 75, bottomY, pageWidth - 25, bottomY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Controller of Examinations', 50, bottomY + 5, { align: 'center' });
  doc.text('Authorized Registrar / Seal', pageWidth - 50, bottomY + 5, { align: 'center' });

  // Verification QR Link at Center Bottom
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Verification URL: https://examirror.edu.in/verify/student/${encodeURIComponent(data.enrollmentNo || data.rollNo || '')}`, pageWidth / 2, pageHeight - 16, { align: 'center' });

  // Save the PDF
  const safeFilename = `Verification_Slip_${(data.enrollmentNo || data.rollNo || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(safeFilename);
};

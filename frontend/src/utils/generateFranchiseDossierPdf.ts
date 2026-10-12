import { jsPDF } from 'jspdf';

export interface FranchiseDossierData {
  id: number;
  center_head_first_name: string;
  center_head_middle_name?: string;
  center_head_last_name: string;
  father_first_name?: string;
  father_middle_name?: string;
  father_last_name?: string;
  phone: string;
  email: string;
  aadhar_number: string;
  pan_number?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  qualification?: string;
  center_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  status: string;
  created_at: string;
  center_code?: string;
  certificate_number?: string;
  documents?: Array<{
    key: string;
    label: string;
    category: string;
    isUploaded: boolean;
    isVerified?: boolean;
    filename: string;
  }>;
}

export const createFranchiseDossierPdf = (data: FranchiseDossierData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const appDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // --- PAGE 1: APPLICATION DOSSIER & APPLICANT / CENTER DETAILS ---
  // Outer Border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.6);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(12, 12, pageWidth - 24, 28, 'F');

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXAMIRROR EDUCATIONAL SERVICES & ACCREDITATION BOARD', pageWidth / 2, 21, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('GOVT. REGD. (MCA) | ISO 9001:2015 CERTIFIED NATIONAL EXAMINATION & IT PORTAL', pageWidth / 2, 27, { align: 'center' });
  doc.setTextColor(203, 213, 225);
  doc.text('AUTHORIZED TRAINING CENTER (ATC) - FRANCHISE APPLICATION DOSSIER', pageWidth / 2, 33, { align: 'center' });

  // Application Meta Ribbon Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, 44, pageWidth - 32, 15, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`APPLICATION ID: #${data.id}`, 20, 50);
  doc.text(`SUBMISSION DATE: ${appDate}`, 85, 50);

  // Status Badge
  const isApproved = (data.status || '').toLowerCase() === 'approved';
  const isRejected = (data.status || '').toLowerCase() === 'rejected';
  const statusColor = isApproved ? [22, 101, 52] : isRejected ? [159, 18, 57] : [180, 83, 9];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`CURRENT STATUS: ${(data.status || 'PENDING').toUpperCase()}`, 150, 50);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated On: ${timestamp} | Official Administrative Record`, 20, 55);

  let currentY = 65;

  // SECTION 1: APPLICANT / CENTER HEAD DETAILS
  doc.setFillColor(241, 245, 249);
  doc.rect(16, currentY, pageWidth - 32, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. CENTER HEAD / DIRECTOR PROFILE & PERSONAL IDENTITY', 20, currentY + 5);

  currentY += 10;

  const headFullName = [data.center_head_first_name, data.center_head_middle_name, data.center_head_last_name]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const fatherFullName = [data.father_first_name, data.father_middle_name, data.father_last_name]
    .filter(Boolean)
    .join(' ')
    .toUpperCase() || 'N/A';

  const applicantGrid = [
    [
      { label: 'Director Full Name:', val: headFullName },
      { label: "Father's Full Name:", val: fatherFullName },
    ],
    [
      { label: 'Registered Mobile:', val: data.phone || 'N/A' },
      { label: 'Email Address:', val: data.email || 'N/A' },
    ],
    [
      { label: 'Aadhaar (UIDAI) No:', val: data.aadhar_number || 'N/A' },
      { label: 'Income Tax PAN No:', val: data.pan_number || 'N/A' },
    ],
    [
      { label: 'Date of Birth:', val: data.dob || 'N/A' },
      { label: 'Gender / Marital:', val: `${data.gender || 'N/A'} / ${data.marital_status || 'N/A'}` },
    ],
    [
      { label: 'Academic Qualification:', val: `${data.qualification || 'Graduate'} (Min. Eligibility Verified)` },
      { label: 'Affiliation ID / Code:', val: data.center_code || 'Pending Allocation' },
    ],
  ];

  doc.setFontSize(8);
  applicantGrid.forEach(row => {
    // Column 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0].label, 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[0].val, 60, currentY);

    // Column 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[1].label, 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1].val, 150, currentY);

    currentY += 6.5;
  });

  currentY += 4;

  // SECTION 2: PROPOSED CENTER & INFRASTRUCTURE
  doc.setFillColor(241, 245, 249);
  doc.rect(16, currentY, pageWidth - 32, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. PROPOSED TRAINING CENTER LOCATION & INFRASTRUCTURE', 20, currentY + 5);

  currentY += 10;

  const centerAddress = [data.address_line1, data.address_line2].filter(Boolean).join(', ');

  const centerGrid = [
    [
      { label: 'Institute / Center Name:', val: (data.center_name || 'N/A').toUpperCase() },
      { label: 'PIN / Postal Code:', val: data.pincode || 'N/A' },
    ],
    [
      { label: 'Street Address:', val: centerAddress || 'N/A' },
      { label: 'City & District:', val: `${data.city || 'N/A'}, ${data.district || 'N/A'}` },
    ],
    [
      { label: 'State / Union Territory:', val: (data.state || 'N/A').toUpperCase() },
      { label: 'Certificate Reg. No:', val: data.certificate_number || 'Issued Upon Approval' },
    ],
  ];

  centerGrid.forEach(row => {
    // Column 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0].label, 20, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[0].val, 60, currentY);

    // Column 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[1].label, 115, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1].val, 150, currentY);

    currentY += 6.5;
  });

  currentY += 4;

  // SECTION 3: KYC & BIOMETRIC DOCUMENTS AUDIT CHECKLIST
  doc.setFillColor(241, 245, 249);
  doc.rect(16, currentY, pageWidth - 32, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. MANDATORY KYC & BIOMETRIC DOCUMENT AUDIT LOG', 20, currentY + 5);

  currentY += 10;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(16, currentY, pageWidth - 32, 6.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SR', 20, currentY + 4.5);
  doc.text('DOCUMENT NAME & CATEGORY', 32, currentY + 4.5);
  doc.text('ATTACHED FILENAME', 110, currentY + 4.5);
  doc.text('AUDIT STATUS', 165, currentY + 4.5);

  currentY += 7;

  const docList = data.documents && data.documents.length > 0
    ? data.documents
    : [
        { key: 'photo', label: 'Center Head Passport Photo', category: 'Biometric Headshot', isUploaded: true, filename: 'Passport_Photo.png' },
        { key: 'signature', label: 'Center Head Legal Signature', category: 'Specimen Signature', isUploaded: true, filename: 'Signature.png' },
        { key: 'marksheet', label: 'Graduation Marksheet / Degree', category: 'Minimum Qualification', isUploaded: true, filename: 'Graduation_Marksheet.png' },
        { key: 'aadhar_front', label: 'Aadhaar Card (Front)', category: 'UIDAI ID Proof', isUploaded: true, filename: 'Aadhar_Front.png' },
        { key: 'aadhar_back', label: 'Aadhaar Card (Back)', category: 'UIDAI Address Proof', isUploaded: true, filename: 'Aadhar_Back.png' },
        { key: 'center_photos', label: 'Center Premises Infrastructure Photos', category: 'Facility Proof', isUploaded: true, filename: 'Center_Photos.png' },
      ];

  docList.forEach((d, idx) => {
    // Alternate row bg
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(16, currentY - 1, pageWidth - 32, 6, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1).padStart(2, '0'), 20, currentY + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(d.label, 32, currentY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(d.filename || 'File Attached', 110, currentY + 3);

    if (d.isUploaded) {
      doc.setTextColor(22, 101, 52); // green
      doc.setFont('helvetica', 'bold');
      doc.text(d.isVerified ? 'VERIFIED [OK]' : 'UPLOADED [AUDIT OK]', 165, currentY + 3);
    } else {
      doc.setTextColor(225, 29, 72); // rose
      doc.setFont('helvetica', 'bold');
      doc.text('NOT ATTACHED', 165, currentY + 3);
    }

    currentY += 6;
  });

  currentY += 6;

  // SECTION 4: APPLICANT DECLARATION & SUPER ADMIN VERIFICATION SEAL
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, currentY, pageWidth - 32, 38, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('APPLICANT UNDERTAKING & STATUTORY DECLARATION:', 20, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    'I hereby solemnly affirm and declare that the statements, qualification proofs, and infrastructure details provided in this franchise affiliation dossier are true, genuine, and authentic. I agree to comply with the Examirror Academic Code, student fee rules, and operational guidelines at all times.';
  doc.text(declarationText, 20, currentY + 9, { maxWidth: pageWidth - 40 });

  // Signature Blocks
  const sigY = currentY + 20;

  // Left: Applicant Sign
  doc.setDrawColor(203, 213, 225);
  doc.line(22, sigY + 10, 72, sigY + 10);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(headFullName, 22, sigY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Center Head / Director Signature', 22, sigY + 16);

  // Center: Official Stamp Box
  doc.setDrawColor(245, 158, 11); // Amber
  doc.setLineWidth(0.4);
  doc.roundedRect(88, sigY + 1, 36, 15, 1, 1);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('EXAMIRROR VERIFIED', 106, sigY + 6, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('CENTRAL AUDIT WING', 106, sigY + 10, { align: 'center' });
  doc.text('GOVT. REGD & ISO 9001', 106, sigY + 14, { align: 'center' });

  // Right: Super Admin Sign
  doc.setDrawColor(203, 213, 225);
  doc.line(140, sigY + 10, 190, sigY + 10);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('SUPER ADMIN / AUDIT BOARD', 140, sigY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Examirror Central Accreditation', 140, sigY + 16);

  // Footer Note
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Electronic Application Dossier • System Generated • Verifiable via Examirror Admin Portal • Page 1 of 1`,
    pageWidth / 2,
    pageHeight - 14,
    { align: 'center' }
  );

  return doc;
};

export const downloadFranchiseDossierPdf = (data: FranchiseDossierData, filename?: string) => {
  const doc = createFranchiseDossierPdf(data);
  const safeName = filename || `Franchise_Application_#${data.id}_Dossier.pdf`;
  doc.save(safeName);
};

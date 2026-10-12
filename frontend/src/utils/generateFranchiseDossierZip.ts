import JSZip from 'jszip';
import { createFranchiseDossierPdf, type FranchiseDossierData } from './generateFranchiseDossierPdf';
import { getAssetUrl } from './axiosSetup';

export interface AppDocItem {
  key: string;
  label: string;
  category: string;
  url?: string;
  filename: string;
}

export interface ProgressCallback {
  (message: string, current?: number, total?: number): void;
}

export const downloadFranchiseDossierZip = async (
  app: any,
  docs: AppDocItem[],
  verifiedDocs: Record<string, boolean> = {},
  onProgress?: ProgressCallback
): Promise<void> => {
  const zip = new JSZip();
  const safeCenterName = (app.center_name || 'Center').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeHeadName = `${app.center_head_first_name || ''}_${app.center_head_last_name || ''}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const totalSteps = docs.length + 2;
  let currentStep = 0;

  // 1. Generate Application Dossier Summary PDF
  if (onProgress) onProgress('Generating Application Dossier PDF...', ++currentStep, totalSteps);

  const dossierPdfData: FranchiseDossierData = {
    id: app.id,
    center_head_first_name: app.center_head_first_name,
    center_head_middle_name: app.center_head_middle_name,
    center_head_last_name: app.center_head_last_name,
    father_first_name: app.father_first_name,
    father_middle_name: app.father_middle_name,
    father_last_name: app.father_last_name,
    phone: app.phone,
    email: app.email,
    aadhar_number: app.aadhar_number,
    pan_number: app.pan_number,
    dob: app.dob,
    gender: app.gender,
    marital_status: app.marital_status,
    qualification: app.qualification,
    center_name: app.center_name,
    address_line1: app.address_line1,
    address_line2: app.address_line2,
    city: app.city,
    district: app.district,
    state: app.state,
    pincode: app.pincode,
    status: app.status,
    created_at: app.created_at,
    center_code: app.center_code,
    certificate_number: app.certificate_number,
    documents: docs.map(d => ({
      key: d.key,
      label: d.label,
      category: d.category,
      isUploaded: !!d.url,
      isVerified: !!verifiedDocs[`${app.id}_${d.key}`],
      filename: d.filename
    }))
  };

  try {
    const pdfDoc = createFranchiseDossierPdf(dossierPdfData);
    const pdfBlob = pdfDoc.output('blob');
    const pdfFilename = `00_Franchise_Application_Summary_#${app.id}_${safeCenterName}.pdf`;
    zip.file(pdfFilename, pdfBlob);
  } catch (pdfErr) {
    console.error('Failed to create dossier PDF:', pdfErr);
  }

  // 2. Fetch and add each uploaded KYC document into KYC_Documents/ folder
  const kycFolder = zip.folder('KYC_Documents');

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (onProgress) onProgress(`Fetching ${doc.label}...`, ++currentStep, totalSteps);

    if (!doc.url) continue;

    try {
      if (doc.url.startsWith('data:')) {
        const base64Index = doc.url.indexOf(';base64,');
        if (base64Index !== -1) {
          const base64Data = doc.url.substring(base64Index + 8);
          kycFolder?.file(doc.filename, base64Data, { base64: true });
        }
      } else {
        const fullUrl = getAssetUrl(doc.url);
        const res = await fetch(fullUrl);
        if (res.ok) {
          const blob = await res.blob();
          kycFolder?.file(doc.filename, blob);
        } else {
          console.warn(`Could not fetch asset at ${fullUrl}`);
        }
      }
    } catch (fetchErr) {
      console.error(`Error adding document ${doc.filename} to zip:`, fetchErr);
    }
  }

  // 3. Add Manifest / Readme file
  const timestamp = new Date().toLocaleString('en-IN');
  const manifestContent = `================================================================================
EXAMIRROR EDUCATIONAL SERVICES & ACCREDITATION BOARD
AUTHORIZED TRAINING CENTER (ATC) - FRANCHISE APPLICATION DOSSIER ARCHIVE
================================================================================

APPLICATION DETAILS:
--------------------------------------------------------------------------------
• Application ID    : #${app.id}
• Center Name       : ${app.center_name}
• Center Head       : ${app.center_head_first_name} ${app.center_head_last_name}
• Registered Mobile : ${app.phone}
• Registered Email  : ${app.email}
• City & State      : ${app.city}, ${app.state} (${app.pincode})
• Qualification     : ${app.qualification || 'Graduate'}
• Status            : ${app.status}
• Application Date  : ${new Date(app.created_at).toLocaleString('en-IN')}
• Archive Generated : ${timestamp}

ARCHIVE CONTENTS:
--------------------------------------------------------------------------------
1. 00_Franchise_Application_Summary_#${app.id}_${safeCenterName}.pdf
   -> Comprehensive official 1-page administrative dossier with complete applicant details,
      center specifications, and Super Admin audit log.

2. KYC_Documents/
${docs.map((d, index) => `   [${index + 1}] ${d.filename.padEnd(40)} | ${d.label} (${d.url ? 'Attached' : 'Missing'})`).join('\n')}

================================================================================
Generated securely by Examirror Central Admin Portal. All rights reserved.
================================================================================
`;
  zip.file('README_DOSSIER_INFO.txt', manifestContent);

  // 4. Generate ZIP archive
  if (onProgress) onProgress('Compressing into final ZIP package...', totalSteps, totalSteps);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // 5. Trigger download
  const downloadUrl = window.URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `Examirror_Franchise_#${app.id}_${safeCenterName}_Dossier.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
};

import React from 'react';
import { createRoot } from 'react-dom/client';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createFranchiseDossierPdf, type FranchiseDossierData } from './generateFranchiseDossierPdf';
import { getAssetUrl } from './axiosSetup';
import { CenterCertificateCard, type CenterCertificateData } from '../components/CenterCertificateCard';

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
  const isApproved = app.status === 'Approved' || app.certificate_status === 'approved';
  const totalSteps = docs.length + (isApproved ? 4 : 2);
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

  // 2. If Approved: Generate & embed Center Authorization & Affiliation Certificate (PDF & HD PNG)
  let certGenerated = false;
  if (isApproved) {
    if (onProgress) onProgress('Generating Official Center Affiliation Certificate...', ++currentStep, totalSteps);

    const centerCertData: CenterCertificateData = {
      id: app.id,
      centerName: app.center_name,
      centerCode: app.center_code || `EXAMc2026-${String(100 + app.id).padStart(3, '0')}`,
      headName: `${app.center_head_first_name} ${app.center_head_last_name}`,
      headPhoto: app.photo_url,
      email: app.email,
      phone: app.phone,
      address: app.address_line1,
      addressLine2: app.address_line2,
      city: app.city,
      district: app.district,
      state: app.state,
      pincode: app.pincode,
      certificateNumber: app.certificate_number || `EXAM-ATC-2026-${String(100 + app.id).padStart(4, '0')}`,
      issueDate: app.certificate_approved_date || app.created_at,
      validUntil: '2027-03-31'
    };

    try {
      // Create off-screen container for rendering certificate
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '1149px';
      tempContainer.style.height = '758px';
      tempContainer.style.zIndex = '-9999';
      tempContainer.style.background = '#fcfbfa';
      document.body.appendChild(tempContainer);

      const root = createRoot(tempContainer);
      root.render(React.createElement(CenterCertificateCard, { center: centerCertData, id: 'temp-cert-zip-element' }));

      // Wait for React mount and barcode/QR rendering
      await new Promise(r => setTimeout(r, 500));

      const certElement = document.getElementById('temp-cert-zip-element') || tempContainer;
      const canvas = await html2canvas(certElement, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfbfa',
        logging: false
      });

      // Cleanup off-screen container
      root.unmount();
      document.body.removeChild(tempContainer);

      const certDataUrl = canvas.toDataURL('image/png', 1.0);
      const b64Data = certDataUrl.split(',')[1];

      // A. Add HD PNG Certificate to ZIP
      zip.file(`01_Official_Center_Affiliation_Certificate_${safeCenterName}.png`, b64Data, { base64: true });

      // B. Add A4 Landscape PDF Certificate to ZIP
      const certPdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      certPdf.addImage(certDataUrl, 'PNG', 0, 0, 297, 210);
      const certPdfBlob = certPdf.output('blob');
      zip.file(`01_Official_Center_Affiliation_Certificate_${safeCenterName}.pdf`, certPdfBlob);

      certGenerated = true;
    } catch (certError) {
      console.error('Failed to generate center certificate for ZIP:', certError);
    }
  }

  // 3. Fetch and add each uploaded KYC document into KYC_Documents/ folder
  const kycFolder = zip.folder('KYC_Documents');

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (onProgress) onProgress(`Fetching KYC: ${doc.label}...`, ++currentStep, totalSteps);

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

  // 4. Fetch and add any Resubmitted Demand Documents (if applicable)
  let resubmittedCount = 0;
  if (app.certificate_uploaded_docs) {
    try {
      const parsed = typeof app.certificate_uploaded_docs === 'string'
        ? JSON.parse(app.certificate_uploaded_docs)
        : app.certificate_uploaded_docs;

      const getExt = (url?: string): string => {
        if (!url) return 'png';
        const lower = url.toLowerCase();
        if (lower.startsWith('data:application/pdf') || lower.endsWith('.pdf')) return 'pdf';
        if (lower.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml') || lower.startsWith('data:application/vnd.ms-excel') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
        if (lower.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml') || lower.startsWith('data:application/msword') || lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
        if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg';
        if (lower.includes('webp')) return 'webp';
        return 'png';
      };

      let resubList: { filename: string; url: string }[] = [];
      if (Array.isArray(parsed)) {
        resubList = parsed.map((item: any, idx: number) => {
          const u = item.url || item;
          return {
            filename: `Resubmitted_${idx + 1}_${(item.label || item.key || 'doc').replace(/[^a-zA-Z0-9_-]/g, '_')}.${getExt(u)}`,
            url: u
          };
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        resubList = Object.entries(parsed).map(([key, val]: [string, any], idx) => {
          const u = typeof val === 'string' ? val : val?.url || '';
          return {
            filename: `Resubmitted_${idx + 1}_${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.${getExt(u)}`,
            url: u
          };
        });
      }

      if (resubList.length > 0) {
        const resubFolder = zip.folder('Resubmitted_Demand_Documents');
        for (const rdoc of resubList) {
          if (!rdoc.url) continue;
          try {
            if (rdoc.url.startsWith('data:')) {
              const b64 = rdoc.url.split(';base64,')[1];
              if (b64) {
                resubFolder?.file(rdoc.filename, b64, { base64: true });
                resubmittedCount++;
              }
            } else {
              const fullUrl = getAssetUrl(rdoc.url);
              const res = await fetch(fullUrl);
              if (res.ok) {
                const blob = await res.blob();
                resubFolder?.file(rdoc.filename, blob);
                resubmittedCount++;
              }
            }
          } catch (rErr) {
            console.error('Error adding resubmitted doc to zip:', rErr);
          }
        }
      }
    } catch (resubErr) {
      console.error('Error reading resubmitted documents:', resubErr);
    }
  }

  // 5. Add Manifest / Readme file
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
• Center Code       : ${app.center_code || `EXAMc2026-${String(100 + app.id).padStart(3, '0')}`}
• Certificate No    : ${app.certificate_number || `EXAM-ATC-2026-${String(100 + app.id).padStart(4, '0')}`}
• Registered Mobile : ${app.phone}
• Registered Email  : ${app.email}
• City & State      : ${app.city}, ${app.state} (${app.pincode})
• Qualification     : ${app.qualification || 'Graduate'}
• Status            : ${app.status}
• Certificate Status: ${app.certificate_status || (isApproved ? 'approved' : 'pending')}
• Application Date  : ${new Date(app.created_at).toLocaleString('en-IN')}
• Archive Generated : ${timestamp}

ARCHIVE CONTENTS:
--------------------------------------------------------------------------------
1. 00_Franchise_Application_Summary_#${app.id}_${safeCenterName}.pdf
   -> Comprehensive official 1-page administrative dossier with complete applicant details,
      center specifications, and Super Admin audit log.
${certGenerated ? `
2. 01_Official_Center_Affiliation_Certificate_${safeCenterName}.pdf
   -> Official Vector & High-Definition printable A4 landscape accreditation certificate.

3. 01_Official_Center_Affiliation_Certificate_${safeCenterName}.png
   -> Ultra-high-resolution master certificate graphic with official security stamps,
      barcode, holographic seal, and authorized signatures.
` : ''}
4. KYC_Documents/
${docs.map((d, index) => `   [${index + 1}] ${d.filename.padEnd(40)} | ${d.label} (${d.url ? 'Attached' : 'Missing'})`).join('\n')}
${resubmittedCount > 0 ? `
5. Resubmitted_Demand_Documents/
   -> ${resubmittedCount} document(s) uploaded by Center Head in response to Super Admin demand notices.
` : ''}
================================================================================
Generated securely by Examirror Central Admin Portal. All rights reserved.
================================================================================
`;
  zip.file('README_DOSSIER_INFO.txt', manifestContent);

  // 6. Generate ZIP archive
  if (onProgress) onProgress('Compressing into final ZIP package...', totalSteps, totalSteps);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // 7. Trigger download
  const downloadUrl = window.URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `Examirror_Franchise_#${app.id}_${safeCenterName}_Dossier.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
};

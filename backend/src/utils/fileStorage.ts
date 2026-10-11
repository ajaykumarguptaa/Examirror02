import fs from 'fs';
import path from 'path';

const BASE_UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const STUDENTS_DIR = path.join(BASE_UPLOAD_DIR, 'students');
const BRANDING_DIR = path.join(BASE_UPLOAD_DIR, 'branding');

// Ensure upload directories exist
[BASE_UPLOAD_DIR, STUDENTS_DIR, BRANDING_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Saves a base64 data string or buffer to local filesystem
 * @param base64OrUrl Base64 data string (e.g. data:image/png;base64,...) or already existing URL
 * @param prefix File prefix (e.g. 'logo', 'hero', 'photo')
 * @param folder Subfolder under uploads (e.g. 'students', 'branding')
 * @returns Accessible URL path (e.g. '/uploads/branding/logo-1727450000-123.png')
 */
export const saveBase64File = (
  base64OrUrl: string | undefined | null, 
  prefix: string = 'file',
  folder: string = 'students'
): string => {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') {
    return '';
  }

  // If already a URL or server path, keep it
  if (base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://') || base64OrUrl.startsWith('/uploads/')) {
    return base64OrUrl;
  }

  // Check if it's a base64 data URL
  const matches = base64OrUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64OrUrl; // Return as is if not standard base64
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Determine safe extension - strictly whitelist safe image and document formats
  let ext = 'jpg';
  if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('pdf')) ext = 'pdf';
  else {
    // Disallow dangerous extensions such as html, svg, exe, js, php
    return '';
  }

  // Prevent path traversal in folder or prefix
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'students';
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '') || 'file';

  const targetDir = path.resolve(BASE_UPLOAD_DIR, safeFolder);
  if (!targetDir.startsWith(BASE_UPLOAD_DIR)) {
    return ''; // Path traversal attempt detected
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${safePrefix}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}.${ext}`;
  const filePath = path.join(targetDir, filename);

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${safeFolder}/${filename}`;
  } catch (err) {
    console.error(`Failed to write file ${filename} to disk:`, err);
    return '';
  }
};



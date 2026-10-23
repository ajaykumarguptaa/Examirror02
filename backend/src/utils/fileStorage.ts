import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { uploadBufferToS3 } from './s3Storage';

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
 * Saves a base64 data string or buffer to local filesystem and uploads to AWS S3 bucket.
 * Automatically converts image files (PNG, JPG, JPEG) to optimized WebP format before storing in S3.
 * @param base64OrUrl Base64 data string (e.g. data:image/png;base64,...) or already existing URL
 * @param prefix File prefix (e.g. 'logo', 'hero', 'photo')
 * @param folder Subfolder under uploads (e.g. 'students', 'branding')
 * @returns Accessible URL path (e.g. '/uploads/branding/logo-1727450000-123.webp')
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

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];
  
  // Determine if it's an image or document
  const isImage = mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('gif');
  const isPdf = mimeType.includes('pdf');

  if (!isImage && !isPdf && !mimeType.includes('svg') && !mimeType.includes('gif')) {
    // Disallow dangerous extensions
    return '';
  }

  // Automatically standardize all images to WebP format
  const ext = isImage ? 'webp' : (isPdf ? 'pdf' : (mimeType.includes('png') ? 'png' : 'jpg'));

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
  const s3Key = `uploads/${safeFolder}/${filename}`;

  try {
    const rawBuffer = Buffer.from(base64Data, 'base64');
    
    if (isImage) {
      // Synchronously write rawBuffer so file exists immediately on disk
      fs.writeFileSync(filePath, rawBuffer);

      // Convert image to WebP with 82% quality (saves ~80-90% bandwidth and S3 storage)
      sharp(rawBuffer)
        .webp({ quality: 82 })
        .toBuffer()
        .then((webpBuffer) => {
          fs.writeFileSync(filePath, webpBuffer);
          uploadBufferToS3(s3Key, webpBuffer, 'image/webp').then((s3Url) => {
            if (s3Url && fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
                console.log(`[S3-First] Converted to WebP and confirmed in S3: ${s3Key}`);
              } catch (_) {}
            }
          });
        })
        .catch((sharpErr) => {
          console.warn('[ImageConversion] Sharp WebP conversion error; saving raw buffer:', sharpErr?.message);
          fs.writeFileSync(filePath, rawBuffer);
          uploadBufferToS3(s3Key, rawBuffer, mimeType);
        });
    } else {
      // PDFs and other documents
      fs.writeFileSync(filePath, rawBuffer);
      uploadBufferToS3(s3Key, rawBuffer, mimeType).then((s3Url) => {
        if (s3Url && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[S3-First] Document confirmed in S3: ${s3Key}`);
          } catch (_) {}
        }
      });
    }

    return `/uploads/${safeFolder}/${filename}`;
  } catch (err) {
    console.error(`Failed to process base64 file ${filename}:`, err);
    return '';
  }
};



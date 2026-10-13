import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const region = process.env.AWS_REGION || 'ap-southeast-2';
const bucket = process.env.AWS_S3_BUCKET || 'examirror-student-storage-2026';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

export const isS3Configured = Boolean(bucket && accessKeyId && secretAccessKey);

export const s3Client = isS3Configured
  ? new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

/**
 * Returns MIME content-type based on file extension
 */
export const getMimeType = (filePathOrExt: string): string => {
  const ext = path.extname(filePathOrExt).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.pdf':
      return 'application/pdf';
    case '.txt':
      return 'text/plain';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Uploads a Buffer directly to S3
 */
export const uploadBufferToS3 = async (
  key: string,
  buffer: Buffer,
  contentType?: string
): Promise<string | null> => {
  if (!s3Client || !isS3Configured) {
    return null;
  }

  // Normalize key (remove leading slashes)
  const cleanKey = key.replace(/^\/+/, '');
  const mime = contentType || getMimeType(cleanKey);

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: mime,
    });
    await s3Client.send(command);
    console.log(`[S3] Uploaded successfully: s3://${bucket}/${cleanKey} (${mime})`);
    return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
  } catch (err: any) {
    console.error(`[S3] Failed to upload buffer to s3://${bucket}/${cleanKey}:`, err.message || err);
    return null;
  }
};

/**
 * Uploads a file from local disk to S3
 */
export const uploadLocalFileToS3 = async (
  localFilePath: string,
  s3Key: string
): Promise<string | null> => {
  if (!s3Client || !isS3Configured) {
    return null;
  }

  try {
    if (!fs.existsSync(localFilePath)) {
      console.warn(`[S3] Local file does not exist: ${localFilePath}`);
      return null;
    }

    const buffer = fs.readFileSync(localFilePath);
    return await uploadBufferToS3(s3Key, buffer, getMimeType(localFilePath));
  } catch (err: any) {
    console.error(`[S3] Error uploading local file ${localFilePath} to ${s3Key}:`, err.message || err);
    return null;
  }
};

/**
 * Checks if an object exists on S3
 */
export const objectExistsOnS3 = async (key: string): Promise<boolean> => {
  if (!s3Client || !isS3Configured) return false;
  const cleanKey = key.replace(/^\/+/, '');
  try {
    const cmd = new HeadObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });
    await s3Client.send(cmd);
    return true;
  } catch (err: any) {
    return false;
  }
};

/**
 * Gets a readable stream of an S3 object
 */
export const getS3ObjectStream = async (
  key: string
): Promise<{ stream: Readable; contentType: string; contentLength?: number } | null> => {
  if (!s3Client || !isS3Configured) return null;
  const cleanKey = key.replace(/^\/+/, '');

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });
    const response = await s3Client.send(command);
    if (!response.Body) return null;

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || getMimeType(cleanKey),
      contentLength: response.ContentLength,
    };
  } catch (err: any) {
    return null;
  }
};

/**
 * Synchronizes all existing local files in ./uploads to S3 in the background
 */
export const syncAllLocalUploadsToS3 = async (uploadsBaseDir?: string): Promise<{ total: number; uploaded: number; errors: number }> => {
  if (!s3Client || !isS3Configured) {
    console.log('[S3] Sync skipped: S3 is not configured in .env');
    return { total: 0, uploaded: 0, errors: 0 };
  }

  const baseDir = uploadsBaseDir || path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(baseDir)) {
    return { total: 0, uploaded: 0, errors: 0 };
  }

  console.log(`[S3] Starting sync of local uploads to s3://${bucket}...`);
  let total = 0;
  let uploaded = 0;
  let errors = 0;

  const traverseAndUpload = async (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await traverseAndUpload(fullPath);
      } else if (entry.isFile()) {
        total++;
        // Construct S3 key matching relative path under baseDir
        const relativePath = path.relative(path.join(process.cwd()), fullPath).replace(/\\/g, '/');
        // e.g. "uploads/branding/examirror-logo.png"
        try {
          const exists = await objectExistsOnS3(relativePath);
          if (!exists) {
            const res = await uploadLocalFileToS3(fullPath, relativePath);
            if (res) uploaded++;
            else errors++;
          }
        } catch (e) {
          errors++;
        }
      }
    }
  };

  try {
    await traverseAndUpload(baseDir);
    console.log(`[S3] Sync completed! Found: ${total}, Uploaded: ${uploaded}, Errors: ${errors}`);
  } catch (err: any) {
    console.error('[S3] Sync failed with error:', err.message || err);
  }

  return { total, uploaded, errors };
};

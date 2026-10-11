/**
 * Image Auto-Compression & Optimization Utility
 * Compresses uploaded images, camera snapshots, and document scans
 * from heavy multi-megabyte files to lightweight KBs (50KB - 200KB)
 * while preserving high visual clarity.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionResult {
  dataUrl: string;
  sizeKB: number;
  originalSizeKB: number;
  compressionRatio: number; // e.g. 85% saved
}

/**
 * Compresses a File or Blob into a lightweight JPEG dataUrl.
 */
export const compressImageFile = async (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    maxSizeKB = 220
  } = options;

  const originalSizeKB = Math.max(1, Math.round((file.size || 0) / 1024));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => reject(e);
    reader.onload = () => {
      const img = new Image();
      img.onerror = (e) => reject(e);
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const rawUrl = reader.result as string;
          resolve({
            dataUrl: rawUrl,
            sizeKB: originalSizeKB,
            originalSizeKB,
            compressionRatio: 0
          });
          return;
        }

        // Clean white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // High quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative quality adjustment
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        let sizeKB = Math.round((dataUrl.length * 0.75) / 1024);

        let attempts = 0;
        while (sizeKB > maxSizeKB && currentQuality > 0.45 && attempts < 3) {
          currentQuality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
          attempts++;
        }

        const compressionRatio = originalSizeKB > sizeKB
          ? Math.round(((originalSizeKB - sizeKB) / originalSizeKB) * 100)
          : 0;

        resolve({
          dataUrl,
          sizeKB,
          originalSizeKB,
          compressionRatio
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an existing Canvas element into a lightweight JPEG dataUrl.
 */
export const compressCanvas = (
  canvas: HTMLCanvasElement,
  quality: number = 0.78,
  maxWidth: number = 1000
): { dataUrl: string; sizeKB: number } => {
  let targetCanvas = canvas;

  if (canvas.width > maxWidth) {
    const scale = maxWidth / canvas.width;
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = maxWidth;
    scaledCanvas.height = Math.round(canvas.height * scale);
    const ctx = scaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      targetCanvas = scaledCanvas;
    }
  }

  const dataUrl = targetCanvas.toDataURL('image/jpeg', quality);
  const sizeKB = Math.round((dataUrl.length * 0.75) / 1024);
  return { dataUrl, sizeKB };
};

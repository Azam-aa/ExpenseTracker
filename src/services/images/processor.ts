import { ImageRecord } from '../../models/types';
import { computeSha256 } from '../../utils/ids';
import { storeImageInIdb } from '../storage/indexedDbImages';
import { appFolder } from '../storage/appFolder';

export interface ProcessedImageResult {
  record: ImageRecord;
  fullBlob: Blob;
  thumbnailBlob: Blob;
}

// Convert Blob to Base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 part after comma
      const commaIdx = result.indexOf(',');
      if (commaIdx !== -1) {
        resolve(result.substring(commaIdx + 1));
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper for canvas to Blob with dataURL fallback
async function canvasToBlobSafe(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // DataURL fallback
          try {
            const dataUrl = canvas.toDataURL(mime, quality);
            const byteString = atob(dataUrl.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            resolve(new Blob([ab], { type: mime }));
          } catch {
            resolve(new Blob([], { type: mime }));
          }
        }
      }, mime, quality);
    } catch {
      try {
        const dataUrl = canvas.toDataURL(mime, quality);
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        resolve(new Blob([ab], { type: mime }));
      } catch {
        resolve(new Blob([], { type: mime }));
      }
    }
  });
}

// Process and compress image
export async function processImageBytes(
  imageBlob: Blob,
  transactionId: string,
  txMeta: { date: string; type: string; amountMinor: number; title: string }
): Promise<ProcessedImageResult> {
  try {
    let drawSource: ImageBitmap | HTMLImageElement;
    let origWidth: number = 800;
    let origHeight: number = 600;

    try {
      try {
        drawSource = await createImageBitmap(imageBlob, { imageOrientation: 'from-image' });
      } catch {
        drawSource = await createImageBitmap(imageBlob);
      }
      origWidth = drawSource.width;
      origHeight = drawSource.height;
    } catch {
      // Universal fallback via HTMLImageElement (works on every browser/device)
      drawSource = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(imageBlob);
        img.onload = () => {
          resolve(img);
        };
        img.onerror = (err) => {
          reject(err);
        };
        img.src = url;
      });
      origWidth = drawSource.naturalWidth || drawSource.width || 800;
      origHeight = drawSource.naturalHeight || drawSource.height || 600;
    }

    // 1. Constrain to 1280px max dimension
    const maxDimension = 1280;
    let targetWidth = origWidth;
    let targetHeight = origHeight;
    if (origWidth > maxDimension || origHeight > maxDimension) {
      if (origWidth >= origHeight) {
        targetWidth = maxDimension;
        targetHeight = Math.round((origHeight * maxDimension) / origWidth);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((origWidth * maxDimension) / origHeight);
      }
    }

    // Draw on canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context for canvas');
    ctx.drawImage(drawSource as CanvasImageSource, 0, 0, targetWidth, targetHeight);

    // Encode WebP or JPEG
    let mime: 'image/webp' | 'image/jpeg' = 'image/webp';
    let quality = 0.82;
    let fullBlob = await canvasToBlobSafe(canvas, 'image/webp', quality);

    if (!fullBlob || fullBlob.size === 0 || fullBlob.type !== 'image/webp') {
      mime = 'image/jpeg';
      quality = 0.85;
      fullBlob = await canvasToBlobSafe(canvas, 'image/jpeg', quality);
    }

    if (!fullBlob || fullBlob.size === 0) {
      // Ultimate fallback to raw imageBlob
      fullBlob = imageBlob;
    }

    // Step down quality if over 800KB
    if (fullBlob.size > 800 * 1024 && quality > 0.6) {
      quality = 0.7;
      const smallerBlob = await canvasToBlobSafe(canvas, mime, quality);
      if (smallerBlob && smallerBlob.size > 0) {
        fullBlob = smallerBlob;
      }
    }

    // 2. Create 320px thumbnail
    const thumbMax = 320;
    let thumbWidth = origWidth;
    let thumbHeight = origHeight;
    if (origWidth >= origHeight) {
      thumbWidth = thumbMax;
      thumbHeight = Math.round((origHeight * thumbMax) / origWidth);
    } else {
      thumbHeight = thumbMax;
      thumbWidth = Math.round((origWidth * thumbMax) / origHeight);
    }

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(drawSource as CanvasImageSource, 0, 0, thumbWidth, thumbHeight);
    }

    let thumbnailBlob = await canvasToBlobSafe(thumbCanvas, mime, 0.7);
    if (!thumbnailBlob || thumbnailBlob.size === 0) {
      thumbnailBlob = fullBlob;
    }

    // Clean up bitmap if possible
    if ('close' in drawSource && typeof (drawSource as any).close === 'function') {
      try {
        (drawSource as any).close();
      } catch {
        // Ignore
      }
    }

    // Compute sha256
    const arrayBuffer = await fullBlob.arrayBuffer();
    const sha256 = await computeSha256(arrayBuffer);

    const cleanTitle = (txMeta.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16);
    const ext = mime === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${txMeta.date}_${txMeta.type.toLowerCase()}_${txMeta.amountMinor}_${cleanTitle}_${sha256.slice(0, 8)}.${ext}`;

    const imageId = `img_${sha256.slice(0, 16)}`;

    const record: ImageRecord = {
      id: imageId,
      transactionId,
      mime,
      width: targetWidth,
      height: targetHeight,
      bytes: fullBlob.size,
      fileName,
      sha256,
      createdAt: Date.now()
    };

    const b64 = await blobToBase64(fullBlob);
    const thumbB64 = await blobToBase64(thumbnailBlob);
    const dataUrl = `data:${mime};base64,${b64}`;
    const thumbnailDataUrl = `data:${mime};base64,${thumbB64}`;

    // Store in IndexedDB
    await storeImageInIdb(record, fullBlob, thumbnailBlob, thumbnailDataUrl, dataUrl);

    // Store in Visible Folder (non-blocking for web/native)
    try {
      await appFolder.saveImageFile(fileName, b64);
    } catch (e) {
      console.warn('[processor] Non-critical: appFolder.saveImageFile failed:', e);
    }

    return {
      record,
      fullBlob,
      thumbnailBlob
    };
  } catch (err) {
    console.warn('[processor] Canvas processing encountered error, falling back to raw imageBlob:', err);
    const arrayBuffer = await imageBlob.arrayBuffer();
    const sha256 = await computeSha256(arrayBuffer);
    const imageId = `img_${sha256.slice(0, 16)}`;
    const record: ImageRecord = {
      id: imageId,
      transactionId,
      mime: imageBlob.type || 'image/jpeg',
      width: 800,
      height: 600,
      bytes: imageBlob.size,
      fileName: `img_${sha256.slice(0, 8)}.jpg`,
      sha256,
      createdAt: Date.now()
    };
    try {
      const b64 = await blobToBase64(imageBlob);
      const dataUrl = `data:${record.mime};base64,${b64}`;
      await storeImageInIdb(record, imageBlob, imageBlob, dataUrl, dataUrl);
    } catch {
      await storeImageInIdb(record, imageBlob, imageBlob);
    }
    return { record, fullBlob: imageBlob, thumbnailBlob: imageBlob };
  }
}

// Generate high quality canvas badge thumbnail for non-image attachments
export function createBadgeThumbnailBlob(label: string, bgColor: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.resolve(new Blob([], { type: 'image/png' }));
  }

  // Rounded rectangle
  ctx.fillStyle = bgColor;
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(160 - r, 0);
  ctx.quadraticCurveTo(160, 0, 160, r);
  ctx.lineTo(160, 160 - r);
  ctx.quadraticCurveTo(160, 160, 160 - r, 160);
  ctx.lineTo(r, 160);
  ctx.quadraticCurveTo(0, 160, 0, 160 - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Corner fold
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(160, 50);
  ctx.lineTo(110, 50);
  ctx.closePath();
  ctx.fill();

  // Text label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 80, 88);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob([], { type: 'image/png' })), 'image/png');
  });
}

// Universal attachment processor: detects images vs PDFs vs Excel vs general documents
export async function processAttachmentBytes(
  fileBlob: Blob,
  originalName: string,
  transactionId: string,
  txMeta: { date: string; type: string; amountMinor: number; title: string }
): Promise<ProcessedImageResult> {
  const nameLower = originalName.toLowerCase();
  const mimeLower = (fileBlob.type || '').toLowerCase();

  const isImage =
    mimeLower.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(nameLower);

  if (isImage) {
    return processImageBytes(fileBlob, transactionId, txMeta);
  }

  const isPdf = mimeLower === 'application/pdf' || nameLower.endsWith('.pdf');
  const isExcel =
    mimeLower.includes('spreadsheet') ||
    mimeLower.includes('excel') ||
    mimeLower === 'text/csv' ||
    /\.(xlsx|xls|csv)$/i.test(nameLower);

  let fileType: 'pdf' | 'excel' | 'document' = 'document';
  let badgeLabel = 'DOC';
  let badgeColor = '#1976d2'; // blue
  let ext = 'bin';

  if (isPdf) {
    fileType = 'pdf';
    badgeLabel = 'PDF';
    badgeColor = '#d32f2f'; // red
    ext = 'pdf';
  } else if (isExcel) {
    fileType = 'excel';
    badgeLabel = 'XLS';
    badgeColor = '#2e7d32'; // green
    ext = nameLower.endsWith('.csv') ? 'csv' : 'xlsx';
  } else {
    const matchedExt = nameLower.split('.').pop();
    if (matchedExt && matchedExt.length <= 5) ext = matchedExt;
  }

  const thumbnailBlob = await createBadgeThumbnailBlob(badgeLabel, badgeColor);

  const arrayBuffer = await fileBlob.arrayBuffer();
  const sha256 = await computeSha256(arrayBuffer);

  const cleanTitle = (txMeta.title || 'doc')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  const fileName = `${txMeta.date}_${txMeta.type.toLowerCase()}_${txMeta.amountMinor}_${cleanTitle}_${sha256.slice(0, 8)}.${ext}`;
  const attachmentId = `att_${sha256.slice(0, 16)}`;

  const record: ImageRecord = {
    id: attachmentId,
    transactionId,
    mime: fileBlob.type || (isPdf ? 'application/pdf' : isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream'),
    width: 160,
    height: 160,
    bytes: fileBlob.size,
    fileName,
    sha256,
    createdAt: Date.now(),
    originalName,
    fileType
  };

  const b64 = await blobToBase64(fileBlob);
  const thumbB64 = await blobToBase64(thumbnailBlob);
  const dataUrl = `data:${fileBlob.type || 'application/octet-stream'};base64,${b64}`;
  const thumbnailDataUrl = `data:image/png;base64,${thumbB64}`;

  // Store in IndexedDB
  await storeImageInIdb(record, fileBlob, thumbnailBlob, thumbnailDataUrl, dataUrl);

  // Store in Visible Folder
  await appFolder.saveImageFile(fileName, b64);

  return {
    record,
    fullBlob: fileBlob,
    thumbnailBlob
  };
}


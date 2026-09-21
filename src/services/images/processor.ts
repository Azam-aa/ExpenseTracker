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

// Process and compress image
export async function processImageBytes(
  imageBlob: Blob,
  transactionId: string,
  txMeta: { date: string; type: string; amountMinor: number; title: string }
): Promise<ProcessedImageResult> {
  // 1. Create ImageBitmap with EXIF orientation correction
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(imageBlob, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await createImageBitmap(imageBlob);
  }

  const origWidth = bitmap.width;
  const origHeight = bitmap.height;

  // Max 1600px long edge
  let targetWidth = origWidth;
  let targetHeight = origHeight;
  const maxDimension = 1600;

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
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  // Encode WebP or JPEG
  let mime: 'image/webp' | 'image/jpeg' = 'image/webp';
  let quality = 0.82;
  let fullBlob: Blob | null = null;

  try {
    fullBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
  } catch {
    // Fallback to JPEG
  }

  if (!fullBlob || fullBlob.type !== 'image/webp') {
    mime = 'image/jpeg';
    quality = 0.85;
    fullBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
  }

  if (!fullBlob) {
    throw new Error('Image compression failed to produce blob');
  }

  // Step down quality if over 800KB
  if (fullBlob.size > 800 * 1024 && quality > 0.6) {
    quality = 0.7;
    const smallerBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, quality)
    );
    if (smallerBlob) {
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
    thumbCtx.drawImage(bitmap, 0, 0, thumbWidth, thumbHeight);
  }

  const thumbnailBlob = await new Promise<Blob>((resolve) =>
    thumbCanvas.toBlob((b) => resolve(b || fullBlob!), mime, 0.7)
  );

  // Clean up bitmap
  bitmap.close();

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

  // Store in IndexedDB
  await storeImageInIdb(record, fullBlob, thumbnailBlob);

  // Store in Visible Folder
  const b64 = await blobToBase64(fullBlob);
  await appFolder.saveImageFile(fileName, b64);

  return {
    record,
    fullBlob,
    thumbnailBlob
  };
}

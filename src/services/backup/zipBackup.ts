import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { FullBackupPayload } from '../../models/types';
import { appFolder } from '../storage/appFolder';
import { getImageFromIdb, storeImageInIdb } from '../storage/indexedDbImages';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { blobToBase64 } from '../images/processor';

export async function createFullBackupZip(payload: FullBackupPayload): Promise<Blob> {
  const zipFiles: Record<string, Uint8Array> = {};

  // 1. Add data.json
  const dataJsonStr = JSON.stringify(payload, null, 2);
  zipFiles['data.json'] = strToU8(dataJsonStr);

  // 2. Add images from IndexedDB
  for (const imgRec of payload.images) {
    const idbData = await getImageFromIdb(imgRec.id);
    if (idbData && idbData.blob) {
      const buffer = await idbData.blob.arrayBuffer();
      zipFiles[`images/${imgRec.fileName}`] = new Uint8Array(buffer);
    }
  }

  // 3. Compress
  const zipped = zipSync(zipFiles, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

export async function shareBackupFile(payload: FullBackupPayload): Promise<boolean> {
  try {
    const zipBlob = await createFullBackupZip(payload);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const fileName = `DayToDayExpenses_Backup_${dateStr}.zip`;

    if (Capacitor.isNativePlatform()) {
      const base64Data = await blobToBase64(zipBlob);

      await Filesystem.writeFile({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`,
        data: base64Data
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`
      });

      await Share.share({
        title: 'Day to Day Expenses Backup',
        text: 'Local backup containing expenses and receipts.',
        url: uriResult.uri,
        dialogTitle: 'Share Backup File'
      });
    } else {
      // Browser download
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    }

    return true;
  } catch (e) {
    console.error('[Backup] Share backup failed:', e);
    return false;
  }
}

export async function extractBackupZip(file: File): Promise<FullBackupPayload> {
  const buffer = await file.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(buffer));

  const dataFile = unzipped['data.json'];
  if (!dataFile) {
    throw new Error('Invalid backup file: data.json not found in archive');
  }

  const jsonStr = strFromU8(dataFile);
  const payload: FullBackupPayload = JSON.parse(jsonStr);

  // Restore images into IndexedDB and visible folder
  if (payload.images && payload.images.length > 0) {
    for (const imgRec of payload.images) {
      const path = `images/${imgRec.fileName}`;
      const imgBytes = unzipped[path];
      if (imgBytes) {
        const mime = imgRec.mime || 'image/webp';
        const imgBlob = new Blob([imgBytes.buffer as ArrayBuffer], { type: mime });

        // Store into IndexedDB
        await storeImageInIdb(imgRec, imgBlob, imgBlob);

        // Store into phone folder
        const b64 = await blobToBase64(imgBlob);
        await appFolder.saveImageFile(imgRec.fileName, b64);
      }
    }
  }

  return payload;
}

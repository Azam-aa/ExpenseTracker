import { openDB, IDBPDatabase } from 'idb';
import { ImageRecord } from '../../models/types';

interface ImageStoreEntry {
  id: string;
  blob: Blob;
  thumbnailBlob: Blob;
  thumbnailDataUrl?: string;
  dataUrl?: string;
  record: ImageRecord;
}

const DB_NAME = 'dte_images_db';
const DB_VERSION = 2;
const STORE_NAME = 'images';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    }).catch((err) => {
      dbPromise = null;
      console.error('[IndexedDB] Failed to open DB:', err);
      throw err;
    });
  }
  return dbPromise;
}

export async function storeImageInIdb(
  record: ImageRecord,
  blob: Blob,
  thumbnailBlob: Blob,
  thumbnailDataUrl?: string,
  dataUrl?: string
): Promise<void> {
  const entry: Record<string, any> = {
    id: record.id,
    blob,
    thumbnailBlob,
    record
  };
  if (thumbnailDataUrl) entry.thumbnailDataUrl = thumbnailDataUrl;
  if (dataUrl) entry.dataUrl = dataUrl;

  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    if (store.keyPath) {
      await store.put(entry);
    } else {
      await store.put(entry, record.id);
    }
    await tx.done;
  } catch (err) {
    console.error('[IndexedDB] storeImageInIdb idb wrapper failed, attempting raw IDB write:', err);
    // Raw IDB fallback
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onsuccess = () => {
        const rawDb = req.result;
        const tx = rawDb.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const putReq = store.keyPath ? store.put(entry) : store.put(entry, record.id);
        putReq.onsuccess = () => {
          resolve();
        };
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export async function getImageFromIdb(
  id: string
): Promise<{ blob: Blob; thumbnailBlob: Blob; thumbnailDataUrl?: string; dataUrl?: string; record: ImageRecord } | null> {
  try {
    const db = await getDb();
    const entry = await db.get(STORE_NAME, id);
    if (entry) {
      return entry as ImageStoreEntry;
    }
  } catch (e) {
    console.error('[IndexedDB] Failed to get image:', id, e);
  }
  return null;
}

export async function getImageThumbnailUrl(id: string): Promise<string | null> {
  const data = await getImageFromIdb(id);
  if (!data) return null;
  if (data.thumbnailDataUrl) return data.thumbnailDataUrl;
  if (data.thumbnailBlob) return URL.createObjectURL(data.thumbnailBlob);
  if (data.dataUrl) return data.dataUrl;
  if (data.blob) return URL.createObjectURL(data.blob);
  return null;
}

export async function getImageFullUrl(id: string): Promise<string | null> {
  const data = await getImageFromIdb(id);
  if (!data) return null;
  if (data.blob) return URL.createObjectURL(data.blob);
  if (data.dataUrl) return data.dataUrl;
  if (data.thumbnailDataUrl) return data.thumbnailDataUrl;
  return null;
}

export async function getMultipleThumbnails(ids: string[]): Promise<Array<{ id: string; url: string }>> {
  if (!ids || ids.length === 0) return [];
  const results = await Promise.all(
    ids.map(async (id) => {
      const url = await getImageThumbnailUrl(id);
      return url ? { id, url } : null;
    })
  );
  return results.filter((r): r is { id: string; url: string } => r !== null);
}

export async function deleteImageFromIdb(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function listAllIdbImageIds(): Promise<string[]> {
  const db = await getDb();
  return (await db.getAllKeys(STORE_NAME)) as string[];
}

export async function clearAllIdbImages(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}

export async function getAllImageRecordsFromIdb(): Promise<Record<string, ImageRecord>> {
  try {
    const db = await getDb();
    const entries = (await db.getAll(STORE_NAME)) as ImageStoreEntry[];
    const result: Record<string, ImageRecord> = {};
    for (const entry of entries) {
      if (entry && entry.id && entry.record) {
        result[entry.id] = entry.record;
      }
    }
    return result;
  } catch (e) {
    console.error('[IndexedDB] Failed to get all image records:', e);
    return {};
  }
}

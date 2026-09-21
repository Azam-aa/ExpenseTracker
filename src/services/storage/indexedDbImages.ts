import { openDB, IDBPDatabase } from 'idb';
import { ImageRecord } from '../../models/types';

interface ImageStoreEntry {
  id: string;
  blob: Blob;
  thumbnailBlob: Blob;
  record: ImageRecord;
}

const DB_NAME = 'dte_images_db';
const DB_VERSION = 1;
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
    });
  }
  return dbPromise;
}

export async function storeImageInIdb(
  record: ImageRecord,
  blob: Blob,
  thumbnailBlob: Blob
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, {
    id: record.id,
    blob,
    thumbnailBlob,
    record
  });
}

export async function getImageFromIdb(
  id: string
): Promise<{ blob: Blob; thumbnailBlob: Blob; record: ImageRecord } | null> {
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
  if (data && data.thumbnailBlob) {
    return URL.createObjectURL(data.thumbnailBlob);
  }
  return null;
}

export async function getImageFullUrl(id: string): Promise<string | null> {
  const data = await getImageFromIdb(id);
  if (data && data.blob) {
    return URL.createObjectURL(data.blob);
  }
  return null;
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

import { Transaction, Settings, Category, Note } from '../../models/types';
import { DEFAULT_CATEGORIES } from '../../models/defaultCategories';

export interface MetaShard {
  schemaVersion: number;
  revision: number;
  settings: Settings;
  categories: Category[];
  updatedAt: number;
}

const META_KEY = 'dte.v1.meta';
const TX_PREFIX = 'dte.v1.tx.';
const NOTES_KEY = 'dte.v1.notes';
const DRAFT_KEY = 'dte.v1.draft';

export const defaultSettings: Settings = {
  schemaVersion: 1,
  language: 'en',
  currency: 'INR',
  appLock: {
    enabled: false,
    salt: '',
    hash: '',
    iterations: 100000
  },
  fiscalStartMonth: 1,
  carryForward: true,
  openingBalanceMinor: 0,
  theme: 'dark',
  defaultType: 'EXPENSE',
  autoBackup: true,
  lastBackupAt: null
};

// Requests persistent storage
export async function requestStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const persisted = await navigator.storage.persist();
      if (persisted) {
        console.log('[Storage] Persistent storage granted');
      }
      return persisted;
    } catch {
      // Ignored in non-secure or restricted environments
    }
  }
  return false;
}

// Safely writes to localStorage catching QuotaExceededError
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`[Storage] QuotaExceededError or write failure for ${key}:`, e);
    return false;
  }
}

// Read Meta Shard
export function loadMetaShard(): MetaShard {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        schemaVersion: parsed.schemaVersion || 1,
        revision: parsed.revision || 1,
        settings: { ...defaultSettings, ...(parsed.settings || {}) },
        categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
        updatedAt: parsed.updatedAt || Date.now()
      };
    }
  } catch (e) {
    console.error('[Storage] Error reading meta shard:', e);
  }

  return {
    schemaVersion: 1,
    revision: 1,
    settings: defaultSettings,
    categories: DEFAULT_CATEGORIES,
    updatedAt: Date.now()
  };
}

// Save Meta Shard
export function saveMetaShard(meta: MetaShard): boolean {
  return safeSetItem(META_KEY, JSON.stringify(meta));
}

// Load all transactions across month shards
export function loadAllTransactions(): { transactions: Transaction[]; shards: Record<string, Transaction[]> } {
  const shards: Record<string, Transaction[]> = {};
  const transactions: Transaction[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TX_PREFIX)) {
        const monthKey = key.substring(TX_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Transaction[] = JSON.parse(raw);
          shards[monthKey] = list;
          transactions.push(...list);
        }
      }
    }
  } catch (e) {
    console.error('[Storage] Error reading tx shards:', e);
  }

  return { transactions, shards };
}

// Save a single month shard
export function saveMonthShard(monthKey: string, txList: Transaction[]): boolean {
  const key = `${TX_PREFIX}${monthKey}`;
  if (txList.length === 0) {
    localStorage.removeItem(key);
    return true;
  }
  return safeSetItem(key, JSON.stringify(txList));
}

// Load Notes
export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Storage] Error reading notes:', e);
  }
  return [];
}

// Save Notes
export function saveNotes(notes: Note[]): boolean {
  return safeSetItem(NOTES_KEY, JSON.stringify(notes));
}

// Draft save & load for Add sheet crash recovery
export function saveDraft(draft: unknown): boolean {
  return safeSetItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Ignore draft parse failure
  }
  return null;
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// Clear all app local storage
export function clearAllShards(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('dte.v1.') || key === DRAFT_KEY)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

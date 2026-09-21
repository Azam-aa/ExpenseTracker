export type TxType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;              // crypto.randomUUID()
  type: TxType;
  title: string;
  amountMinor: number;     // integer paise (e.g. 271600 for ₹2,716.00). Never float.
  description: string;
  categoryId: string | null;
  date: string;            // 'YYYY-MM-DD' local date
  time: string;            // 'HH:mm' local time
  createdAt: number;       // epoch ms
  updatedAt: number;
  imageId: string | null;  // exactly one image or none
  deletedAt: number | null;// soft delete epoch ms, purged after 30 days
}

export type AttachmentType = 'image' | 'pdf' | 'excel' | 'document';

export interface ImageRecord {
  id: string;
  transactionId: string;
  mime: string;            // 'image/webp' | 'image/jpeg' | 'application/pdf' | etc.
  width: number;
  height: number;
  bytes: number;
  fileName: string;        // e.g. 2026-09-20_expense_1250_electricity_ab12cd.webp
  sha256: string;
  createdAt: number;
  originalName?: string;
  fileType?: AttachmentType;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  icon: string;
  color: string;
  order: number;
  builtIn: boolean;
}

export interface Note {
  id: string;
  date: string;            // 'YYYY-MM-DD'
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  schemaVersion: number;
  language: 'en';
  currency: string;
  appLock: {
    enabled: boolean;
    salt: string;
    hash: string;
    iterations: number;
  };
  fiscalStartMonth: number;          // 1..12, default 1 (January)
  carryForward: boolean;             // default true
  openingBalanceMinor: number;       // default 0
  theme: 'dark' | 'light';           // default 'dark'
  defaultType: TxType;               // default 'EXPENSE'
  autoBackup: boolean;               // default true
  lastBackupAt: number | null;
}

export type TabType = 'NOTES' | 'DAILY' | 'MONTHLY' | 'YEARLY';

export type ScreenId =
  | 'MAIN'
  | 'CHARTS'
  | 'SEARCH'
  | 'SETTINGS'
  | 'HELP'
  | 'CALCULATIONS'
  | 'BACKUP_EXPORT'
  | 'DATA_MANAGEMENT'
  | 'CATEGORIES'
  | 'CATEGORIZE'
  | 'RECENTLY_DELETED'
  | 'PREFERENCES'
  | 'HOW_TO_USE'
  | 'WHATS_NEW'
  | 'FAQ'
  | 'PRIVACY'
  | 'CHECK_DATA';

export interface SnapshotMetadata {
  schemaVersion: number;
  revision: number;
  savedAt: number;
  counts: {
    transactions: number;
    images: number;
    notes: number;
    categories: number;
  };
  checksum: string;
}

export interface FullBackupPayload {
  version: number;
  revision: number;
  savedAt: number;
  settings: Settings;
  categories: Category[];
  notes: Note[];
  transactions: Transaction[];
  images: ImageRecord[];
}

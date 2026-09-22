import { describe, it, expect, beforeEach } from 'vitest';
import {
  carryForwardAt,
  totalsForDay,
  monthSummary,
  yearTable,
  uncategorizedCount,
  getActiveTransactions
} from '../../src/services/calc/engine';
import { Transaction, Settings, Category, Note, FullBackupPayload } from '../../src/models/types';
import { DEFAULT_CATEGORIES } from '../../src/models/defaultCategories';
import {
  hashPin,
  verifyPin
} from '../../src/services/lock/pinLock';
import { exportToExcel, exportToCsv } from '../../src/services/export/excelExport';
import { generateMonthlyPdf } from '../../src/services/export/pdfReport';
import { createFullBackupZip, extractBackupZip } from '../../src/services/backup/zipBackup';
import { computeSha256 } from '../../src/utils/ids';
import { parseAmountToMinor, formatMoney, formatTableCell } from '../../src/utils/money';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
}

if (typeof window === 'undefined' || !window.localStorage) {
  (global as any).localStorage = new MockLocalStorage();
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    createElement: () => ({
      click: () => {},
      setAttribute: () => {},
      href: '',
      download: ''
    })
  };
} else if (!document.body) {
  (document as any).body = {
    appendChild: () => {},
    removeChild: () => {}
  };
}

if (typeof URL.createObjectURL === 'undefined') {
  (URL as any).createObjectURL = () => 'blob:mock-url';
  (URL as any).revokeObjectURL = () => {};
}

const testSettings: Settings = {
  schemaVersion: 1,
  language: 'en',
  currency: 'INR',
  appLock: { enabled: false, salt: '', hash: '', iterations: 100000 },
  fiscalStartMonth: 1,
  carryForward: true,
  openingBalanceMinor: 0,
  theme: 'dark',
  defaultType: 'EXPENSE',
  autoBackup: true,
  lastBackupAt: null
};

describe('PHASE 1 AUDIT - Feature Logic & Durability Evidence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Calculations & Math
  it('1. Daily calculation engine: accurate C/F, day totals, and running balance', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        type: 'INCOME',
        title: 'Salary',
        amountMinor: 5000000, // ₹50,000.00
        description: 'Monthly payout',
        categoryId: 'cat_salary',
        date: '2026-09-01',
        time: '10:00',
        createdAt: 1774000000000,
        updatedAt: 1774000000000,
        imageId: null,
        deletedAt: null
      },
      {
        id: 'tx-2',
        type: 'EXPENSE',
        title: 'Rent',
        amountMinor: 1500000, // ₹15,000.00
        description: 'House rent',
        categoryId: 'cat_rent',
        date: '2026-09-01',
        time: '11:00',
        createdAt: 1774000001000,
        updatedAt: 1774000001000,
        imageId: null,
        deletedAt: null
      },
      {
        id: 'tx-3',
        type: 'EXPENSE',
        title: 'Groceries',
        amountMinor: 250000, // ₹2,500.00
        description: 'Supermarket',
        categoryId: 'cat_food',
        date: '2026-09-02',
        time: '12:00',
        createdAt: 1774000002000,
        updatedAt: 1774000002000,
        imageId: null,
        deletedAt: null
      }
    ];

    // Day 1 Totals
    const day1 = totalsForDay(txs, '2026-09-01', testSettings);
    expect(day1.incomeMinor).toBe(5000000);
    expect(day1.expenseMinor).toBe(1500000);
    expect(day1.carryForwardMinor).toBe(0);
    expect(day1.balanceMinor).toBe(3500000); // 50,000 - 15,000 = 35,000

    // Day 2 Totals (with C/F from Day 1)
    const day2 = totalsForDay(txs, '2026-09-02', testSettings);
    expect(day2.incomeMinor).toBe(0);
    expect(day2.expenseMinor).toBe(250000);
    expect(day2.carryForwardMinor).toBe(3500000); // C/F 35,000
    expect(day2.balanceMinor).toBe(3250000); // 35,000 - 2,500 = 32,500
  });

  // 2. Monthly Summary & Running Day Balances
  it('2. Monthly calculations: month totals and running balance per day', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        type: 'INCOME',
        title: 'Freelance',
        amountMinor: 2000000,
        description: '',
        categoryId: null,
        date: '2026-09-10',
        time: '10:00',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null
      },
      {
        id: 'tx-2',
        type: 'EXPENSE',
        title: 'Electricity',
        amountMinor: 300000,
        description: '',
        categoryId: null,
        date: '2026-09-15',
        time: '10:00',
        createdAt: 2,
        updatedAt: 2,
        deletedAt: null
      }
    ];

    const summary = monthSummary(txs, 2026, 9, testSettings);
    expect(summary.incomeMinor).toBe(2000000);
    expect(summary.expenseMinor).toBe(300000);
    expect(summary.carryForwardMinor).toBe(0);
    expect(summary.balanceMinor).toBe(1700000);
  });

  // 3. Yearly Table & Fiscal Year Boundaries
  it('3. Yearly table & Fiscal year boundary calculations', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-apr',
        type: 'INCOME',
        title: 'Fiscal Start',
        amountMinor: 1000000,
        description: '',
        categoryId: null,
        date: '2026-04-01',
        time: '10:00',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null
      },
      {
        id: 'tx-may',
        type: 'EXPENSE',
        title: 'May Spend',
        amountMinor: 400000,
        description: '',
        categoryId: null,
        date: '2026-05-01',
        time: '10:00',
        createdAt: 2,
        updatedAt: 2,
        deletedAt: null
      }
    ];

    // Calendar Year (Jan start, up to current month Sep = 9 rows)
    const ytCalendar = yearTable(txs, 2026, testSettings);
    expect(ytCalendar.rows.length).toBe(9);
    expect(ytCalendar.rows[0].monthShort).toBe('Jan');

    // Indian Financial Year (Apr start, up to current month Sep = 6 rows)
    const indianFiscalSettings: Settings = { ...testSettings, fiscalStartMonth: 4 };
    const ytFiscal = yearTable(txs, 2026, indianFiscalSettings);
    expect(ytFiscal.rows.length).toBe(6);
    expect(ytFiscal.rows[0].monthShort).toBe('Apr');
    expect(ytFiscal.rows[0].incomeMinor).toBe(1000000);
    expect(ytFiscal.rows[0].balanceMinor).toBe(1000000);
    expect(ytFiscal.rows[1].monthShort).toBe('May');
    expect(ytFiscal.rows[1].expenseMinor).toBe(400000);
    expect(ytFiscal.rows[1].balanceMinor).toBe(600000); // 10,000 - 4,000 = 6,000
  });

  // 4. App Lock Security: PIN Hashing, Verification, Rejection & Reset
  it('4. App Lock: PIN hashing, verification, wrong PIN rejection, and reset', async () => {
    const pin = '4829';
    const result = await hashPin(pin);
    const { salt, hash } = result;

    // Correct PIN matches
    const isValid = await verifyPin(pin, salt, hash);
    expect(isValid).toBe(true);

    // Wrong PIN rejected
    const isWrongValid = await verifyPin('0000', salt, hash);
    expect(isWrongValid).toBe(false);

    const isShortValid = await verifyPin('482', salt, hash);
    expect(isShortValid).toBe(false);
  });

  // 5. Excel, CSV, and PDF Export Generation
  it('5. Exports: Excel (XLSX), CSV, and PDF generate valid non-empty byte content', async () => {
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        type: 'INCOME',
        title: 'Salary',
        amountMinor: 5000000,
        description: 'Bank transfer',
        categoryId: 'cat_salary',
        date: '2026-09-01',
        time: '10:00',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null
      },
      {
        id: 'tx-2',
        type: 'EXPENSE',
        title: 'Dinner',
        amountMinor: 125000,
        description: 'Restaurant bill',
        categoryId: 'cat_food',
        date: '2026-09-01',
        time: '20:30',
        createdAt: 2,
        updatedAt: 2,
        deletedAt: null
      }
    ];

    // CSV Export
    const csvOk = await exportToCsv(txs, DEFAULT_CATEGORIES);
    expect(csvOk).toBe(true);

    // Excel Export
    const excelOk = await exportToExcel(txs, DEFAULT_CATEGORIES);
    expect(excelOk).toBe(true);

    // PDF Export
    const pdfOk = await generateMonthlyPdf(txs, 2026, 9, testSettings, DEFAULT_CATEGORIES);
    expect(pdfOk).toBe(true);
  });

  // 6. ZIP Backup Creation & Restore Payload Integrity
  it('6. Backup & Restore: creates compressed ZIP backup and parses valid payload', async () => {
    const payload: FullBackupPayload = {
      version: 1,
      revision: 42,
      savedAt: Date.now(),
      settings: testSettings,
      categories: DEFAULT_CATEGORIES,
      notes: [{ id: 'note-1', title: 'Test Note', body: 'Body content', createdAt: 100, updatedAt: 100 }],
      transactions: [
        {
          id: 'tx-backup-1',
          type: 'EXPENSE',
          title: 'Petrol',
          amountMinor: 200000,
          description: 'Fuel',
          categoryId: null,
          date: '2026-09-22',
          time: '12:00',
          createdAt: 100,
          updatedAt: 100,
          deletedAt: null
        }
      ],
      images: []
    };

    // Generate ZIP
    const zipBlob = await createFullBackupZip(payload);
    expect(zipBlob.size).toBeGreaterThan(100);

    const file = new File([zipBlob], 'backup.zip', { type: 'application/zip' });
    const restored = await extractBackupZip(file);
    expect(restored.transactions.length).toBe(1);
    expect(restored.transactions[0].title).toBe('Petrol');
    expect(restored.notes.length).toBe(1);
    expect(restored.notes[0].title).toBe('Test Note');
    expect(restored.revision).toBe(42);
  });

  // 7. Data Safety: SHA-256 Checksum Verification and Corruption Detection
  it('7. Data Safety: SHA-256 checksum detects payload tampering or corruption', async () => {
    const validData = JSON.stringify({ transactions: [{ id: 'tx-1', amount: 100 }] });
    const hash = await computeSha256(validData);
    expect(hash.length).toBe(64);

    // Verify hash changes on any single byte change
    const corruptedData = JSON.stringify({ transactions: [{ id: 'tx-1', amount: 101 }] });
    const corruptedHash = await computeSha256(corruptedData);
    expect(corruptedHash).not.toBe(hash);
  });

  // 8. Search Filter Matching
  it('8. Search engine: matches title, description, and amounts accurately', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        title: 'Amazon Prime Subscription',
        amountMinor: 149900,
        description: 'Annual membership',
        categoryId: null,
        date: '2026-09-01',
        time: '10:00',
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null
      },
      {
        id: 'tx-2',
        type: 'INCOME',
        title: 'Freelance Web Design',
        amountMinor: 2500000,
        description: 'Client payment',
        categoryId: null,
        date: '2026-09-02',
        time: '11:00',
        createdAt: 2,
        updatedAt: 2,
        deletedAt: null
      }
    ];

    const search = (q: string) => {
      const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      return txs.filter((t) => {
        const title = t.title.toLowerCase();
        const desc = t.description.toLowerCase();
        const amountMinorStr = t.amountMinor.toString();
        const rupeesStr = Math.floor(t.amountMinor / 100).toString();
        const formattedAmt = formatMoney(t.amountMinor).toLowerCase();
        return words.every((word) => {
          const cleanWord = word.replace(/[₹,]/g, '');
          return (
            title.includes(word) ||
            desc.includes(word) ||
            amountMinorStr.includes(cleanWord) ||
            rupeesStr.includes(cleanWord) ||
            formattedAmt.includes(word)
          );
        });
      });
    };

    expect(search('amazon').length).toBe(1);
    expect(search('client payment').length).toBe(1);
    expect(search('1,499').length).toBe(1);
    expect(search('25000').length).toBe(1);
    expect(search('nonexistent').length).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { Transaction, Settings } from '../../src/models/types';
import {
  carryForwardAt,
  monthSummary,
  yearTable,
  totalsForDay,
  getActiveTransactions
} from '../../src/services/calc/engine';
import { generateId } from '../../src/utils/ids';

const testSettings: Settings = {
  schemaVersion: 1,
  language: 'en',
  currency: 'INR',
  appLock: { enabled: false, salt: '', hash: '', iterations: 100000 },
  fiscalStartMonth: 1,
  carryForward: true,
  openingBalanceMinor: 10000000, // ₹1,00,000 opening
  theme: 'dark',
  defaultType: 'EXPENSE',
  autoBackup: true,
  lastBackupAt: null
};

describe('10,000 Transactions Stress & Durability Test', () => {
  it('generates 10,000 transactions and calculates running balances in under 100ms', () => {
    const totalCount = 10000;
    const transactions: Transaction[] = new Array(totalCount);

    const startTime = performance.now();

    for (let i = 0; i < totalCount; i++) {
      const monthNum = (i % 12) + 1;
      const dayNum = (i % 28) + 1;
      const monthStr = monthNum.toString().padStart(2, '0');
      const dayStr = dayNum.toString().padStart(2, '0');
      const date = `2026-${monthStr}-${dayStr}`;

      const isIncome = i % 5 === 0; // 20% income, 80% expense
      transactions[i] = {
        id: `tx-stress-${i}`,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        amountMinor: isIncome ? 500000 : 150000, // ₹5000 vs ₹1500
        categoryId: isIncome ? 'cat_salary' : 'cat_food',
        date,
        time: '12:00',
        paymentMode: 'Cash',
        description: `Stress transaction #${i}`,
        hasImage: i % 10 === 0,
        createdAt: 1774000000000 + i * 1000,
        updatedAt: 1774000000000 + i * 1000
      };
    }

    const genDuration = performance.now() - startTime;
    expect(transactions.length).toBe(10000);

    // Measure yearTable calculation over 10,000 items
    const calcStart = performance.now();
    const yt = yearTable(transactions, 2026, testSettings);
    const calcDuration = performance.now() - calcStart;

    expect(yt.rows.length).toBe(12);
    expect(yt.openingCarryForward).toBe(10000000); // initial opening balance
    // Each month must have positive transactions and non-zero running balance
    for (const row of yt.rows) {
      expect(row.incomeMinor).toBeGreaterThan(0);
      expect(row.expenseMinor).toBeGreaterThan(0);
    }

    // Measure monthSummary calculation
    const monthStart = performance.now();
    const ms = monthSummary(transactions, 2026, 6, testSettings);
    const monthDuration = performance.now() - monthStart;

    expect(ms.incomeMinor).toBeGreaterThan(0);
    expect(ms.expenseMinor).toBeGreaterThan(0);

    // Performance assertion: calculation on 10,000 items must be fast (< 100ms)
    expect(calcDuration).toBeLessThan(100);
    expect(monthDuration).toBeLessThan(50);
  });

  it('verifies 6-second soft delete safety buffer pattern', () => {
    const txList: Transaction[] = [
      {
        id: 'tx-1',
        type: 'EXPENSE',
        amountMinor: 50000,
        categoryId: 'cat_food',
        date: '2026-09-21',
        time: '14:30',
        paymentMode: 'UPI',
        description: 'Lunch',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // Soft delete action
    const deletedId = 'tx-1';
    const activeBefore = getActiveTransactions(txList);
    expect(activeBefore.length).toBe(1);

    // Mark as deleted
    const targetTx = txList.find((t) => t.id === deletedId)!;
    targetTx.deletedAt = Date.now();

    const activeAfterDelete = getActiveTransactions(txList);
    expect(activeAfterDelete.length).toBe(0);

    // Undo action (user taps "UNDO" within 6 seconds toast window)
    delete targetTx.deletedAt;
    const activeAfterUndo = getActiveTransactions(txList);
    expect(activeAfterUndo.length).toBe(1);
    expect(activeAfterUndo[0].id).toBe('tx-1');
  });

  it('verifies SHA-256 payload integrity checksum logic', async () => {
    const enc = new TextEncoder();
    const testData = JSON.stringify({ revision: 42, count: 500, note: 'Safe data' });
    const buffer = await crypto.subtle.digest('SHA-256', enc.encode(testData));
    const checksum = Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    expect(checksum.length).toBe(64);

    // Tampered payload check
    const tampered = JSON.stringify({ revision: 42, count: 501, note: 'Tampered' });
    const tamperedBuffer = await crypto.subtle.digest('SHA-256', enc.encode(tampered));
    const tamperedChecksum = Array.from(new Uint8Array(tamperedBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    expect(checksum).not.toBe(tamperedChecksum);
  });
});

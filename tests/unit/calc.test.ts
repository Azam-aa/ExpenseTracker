import { describe, it, expect } from 'vitest';
import {
  carryForwardAt,
  totalsForDay,
  monthSummary,
  yearTable,
  uncategorizedCount
} from '../../src/services/calc/engine';
import { Settings } from '../../src/models/types';
import { formatMoney, formatTableCell, parseAmountToMinor } from '../../src/utils/money';
import { getDevSeedTransactions } from '../../src/seed/devSeed';

const defaultSettings: Settings = {
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

describe('Calculation Engine & Monetary Math', () => {
  it('formats money with Indian grouping', () => {
    expect(formatMoney(271600)).toBe('₹2,716.00');
    expect(formatMoney(120000)).toBe('₹1,200.00');
    expect(formatMoney(10000000)).toBe('₹1,00,000.00');
    expect(formatMoney(1000000000)).toBe('₹1,00,00,000.00');
    expect(formatTableCell(271600)).toBe('2,716.00');
  });

  it('parses user input strings into minor paise', () => {
    expect(parseAmountToMinor('2716')).toBe(271600);
    expect(parseAmountToMinor('2,716.00')).toBe(271600);
    expect(parseAmountToMinor('₹1,200.50')).toBe(120050);
    expect(parseAmountToMinor('0')).toBe(null);
    expect(parseAmountToMinor('-50')).toBe(null);
  });

  it('dev seed data exactly matches screenshot totals and counts', () => {
    const seed = getDevSeedTransactions();

    // 1. September 2026 month summary
    const sepSummary = monthSummary(seed, 2026, 9, defaultSettings);
    expect(sepSummary.carryForwardMinor).toBe(544300); // C/F ₹5,443.00
    expect(sepSummary.incomeMinor).toBe(3490000);      // Total Income ₹34,900.00
    expect(sepSummary.expenseMinor).toBe(3762700);     // Total Expense ₹37,627.00
    expect(sepSummary.balanceMinor).toBe(271600);      // Balance ₹2,716.00

    // 2. Uncategorized count in September: exactly 30 items
    const uncatExp = uncategorizedCount(seed, 'EXPENSE', { year: 2026, month: 9 });
    expect(uncatExp).toBe(30);

    // 3. Yearly table running balance checks
    const yt = yearTable(seed, 2026, defaultSettings);
    const aprRow = yt.rows.find((r) => r.monthShort === 'Apr');
    expect(aprRow?.incomeMinor).toBe(5650000);
    expect(aprRow?.expenseMinor).toBe(2857500);
    expect(aprRow?.balanceMinor).toBe(2802500); // 28,025.00

    const mayRow = yt.rows.find((r) => r.monthShort === 'May');
    expect(mayRow?.incomeMinor).toBe(7310000);
    expect(mayRow?.expenseMinor).toBe(6696500);
    expect(mayRow?.balanceMinor).toBe(3416000); // 34,160.00

    const sepRow = yt.rows.find((r) => r.monthShort === 'Sep');
    expect(sepRow?.incomeMinor).toBe(3490000);
    expect(sepRow?.expenseMinor).toBe(3762700);
    expect(sepRow?.balanceMinor).toBe(271600);  // 2,716.00

    // 4. Daily balance on 21 Sep (no transactions) equals C/F 2,716
    const day21 = totalsForDay(seed, '2026-09-21', defaultSettings);
    expect(day21.incomeMinor).toBe(0);
    expect(day21.expenseMinor).toBe(0);
    expect(day21.carryForwardMinor).toBe(271600);
    expect(day21.balanceMinor).toBe(271600);
  });
});

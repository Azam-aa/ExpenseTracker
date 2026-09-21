import { Transaction, Settings, TxType } from '../../models/types';
import { dateToEpochDays, getDaysInMonth } from '../../utils/dates';

export interface DayTotals {
  incomeMinor: number;
  expenseMinor: number;
  carryForwardMinor: number;
  balanceMinor: number;
}

export interface MonthSummary {
  incomeMinor: number;
  expenseMinor: number;
  carryForwardMinor: number;
  balanceMinor: number;
}

export interface YearTableRow {
  monthIndex: number; // 1..12
  monthShort: string;
  year: number;
  incomeMinor: number;
  expenseMinor: number;
  balanceMinor: number; // running balance at end of month
}

export interface ChartGroup {
  label: string;
  dateKey: string;
  incomeMinor: number;
  expenseMinor: number;
}

/**
 * Filter active (non-soft-deleted) transactions
 */
export function getActiveTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => !t.deletedAt);
}

/**
 * Computes the start date of the fiscal year for a given date string 'YYYY-MM-DD'
 */
export function getFiscalYearStartDate(dateStr: string, fiscalStartMonth: number = 1): string {
  const [year, month] = dateStr.split('-').map(Number);
  let fiscalYear = year;
  if (month < fiscalStartMonth) {
    fiscalYear = year - 1;
  }
  return `${fiscalYear}-${fiscalStartMonth.toString().padStart(2, '0')}-01`;
}

/**
 * Computes carry forward balance strictly before a given date.
 * If carryForward is false, transactions strictly before the start of the current fiscal year are ignored.
 */
export function carryForwardAt(
  transactions: Transaction[],
  dateStr: string,
  settings: Settings
): number {
  const targetEpochDays = dateToEpochDays(dateStr);
  const activeTx = getActiveTransactions(transactions);

  let limitEpochDays = -Infinity;
  if (!settings.carryForward) {
    const fiscalStartDate = getFiscalYearStartDate(dateStr, settings.fiscalStartMonth);
    limitEpochDays = dateToEpochDays(fiscalStartDate);
  }

  let totalPaise = settings.openingBalanceMinor;

  for (const tx of activeTx) {
    const txDays = dateToEpochDays(tx.date);
    if (txDays < targetEpochDays && txDays >= limitEpochDays) {
      if (tx.type === 'INCOME') {
        totalPaise += tx.amountMinor;
      } else {
        totalPaise -= tx.amountMinor;
      }
    }
  }

  return totalPaise;
}

/**
 * Computes income and expense totals for a specific date
 */
export function totalsForDay(
  transactions: Transaction[],
  dateStr: string,
  settings: Settings
): DayTotals {
  const activeTx = getActiveTransactions(transactions);
  let incomeMinor = 0;
  let expenseMinor = 0;

  for (const tx of activeTx) {
    if (tx.date === dateStr) {
      if (tx.type === 'INCOME') {
        incomeMinor += tx.amountMinor;
      } else {
        expenseMinor += tx.amountMinor;
      }
    }
  }

  const carryForwardMinor = carryForwardAt(transactions, dateStr, settings);
  const balanceMinor = carryForwardMinor + incomeMinor - expenseMinor;

  return {
    incomeMinor,
    expenseMinor,
    carryForwardMinor,
    balanceMinor
  };
}

/**
 * End-of-day balance formula: C/F + Income - Expense
 */
export function balanceEndOfDay(
  transactions: Transaction[],
  dateStr: string,
  settings: Settings
): number {
  return totalsForDay(transactions, dateStr, settings).balanceMinor;
}

/**
 * Computes monthly summary:
 * C/F is at first day of month ('YYYY-MM-01').
 * Income and Expense sum for month.
 * Balance = C/F + Income - Expense.
 */
export function monthSummary(
  transactions: Transaction[],
  year: number,
  month: number,
  settings: Settings
): MonthSummary {
  const firstDayStr = `${year}-${month.toString().padStart(2, '0')}-01`;
  const cf = carryForwardAt(transactions, firstDayStr, settings);

  const activeTx = getActiveTransactions(transactions);
  const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;

  let incomeMinor = 0;
  let expenseMinor = 0;

  for (const tx of activeTx) {
    if (tx.date.startsWith(monthPrefix)) {
      if (tx.type === 'INCOME') {
        incomeMinor += tx.amountMinor;
      } else {
        expenseMinor += tx.amountMinor;
      }
    }
  }

  return {
    incomeMinor,
    expenseMinor,
    carryForwardMinor: cf,
    balanceMinor: cf + incomeMinor - expenseMinor
  };
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Yearly table data:
 * Sequence of months in fiscal year up to current month for the current year.
 * Running balance at the end of each month.
 */
export function yearTable(
  transactions: Transaction[],
  fiscalYear: number,
  settings: Settings
): { openingCarryForward: number; rows: YearTableRow[] } {
  const startMonth = settings.fiscalStartMonth || 1;
  const openingDateStr = `${fiscalYear}-${startMonth.toString().padStart(2, '0')}-01`;
  const openingCarryForward = carryForwardAt(transactions, openingDateStr, settings);

  const activeTx = getActiveTransactions(transactions);

  // Month list for fiscal year
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startMonth === 1 ? fiscalYear : (m < startMonth ? fiscalYear + 1 : fiscalYear);
    months.push({ year: y, month: m });
  }

  // Filter out future months if this is the current year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let runningBalance = openingCarryForward;
  const rows: YearTableRow[] = [];

  for (const { year, month } of months) {
    // If year is in the future, stop
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      // Check if there is data in future months
      const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
      const hasTx = activeTx.some((t) => t.date.startsWith(monthPrefix));
      if (!hasTx) {
        continue;
      }
    }

    const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
    let incomeMinor = 0;
    let expenseMinor = 0;

    for (const tx of activeTx) {
      if (tx.date.startsWith(monthPrefix)) {
        if (tx.type === 'INCOME') {
          incomeMinor += tx.amountMinor;
        } else {
          expenseMinor += tx.amountMinor;
        }
      }
    }

    runningBalance = runningBalance + incomeMinor - expenseMinor;

    rows.push({
      monthIndex: month,
      monthShort: MONTH_SHORT[month - 1],
      year,
      incomeMinor,
      expenseMinor,
      balanceMinor: runningBalance
    });
  }

  return {
    openingCarryForward,
    rows
  };
}

/**
 * Chart series grouping
 */
export function chartSeries(
  transactions: Transaction[],
  period: { mode: 'MONTH' | 'YEAR' | 'ALL'; year: number; month?: number }
): ChartGroup[] {
  const activeTx = getActiveTransactions(transactions);

  if (period.mode === 'MONTH' && period.month) {
    // Group by day of month
    const year = period.year;
    const month = period.month;
    const daysCount = getDaysInMonth(year, month);
    const groups: ChartGroup[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const dayStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const label = `${day.toString().padStart(2, '0')} ${MONTH_SHORT[month - 1]}`;

      let inc = 0;
      let exp = 0;
      for (const tx of activeTx) {
        if (tx.date === dayStr) {
          if (tx.type === 'INCOME') inc += tx.amountMinor;
          else exp += tx.amountMinor;
        }
      }

      groups.push({
        label,
        dateKey: dayStr,
        incomeMinor: inc,
        expenseMinor: exp
      });
    }

    return groups;
  }

  if (period.mode === 'YEAR') {
    // Group by 12 months
    const groups: ChartGroup[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${period.year}-${m.toString().padStart(2, '0')}`;
      const label = `${MONTH_SHORT[m - 1]} ${period.year.toString().slice(-2)}`;

      let inc = 0;
      let exp = 0;
      for (const tx of activeTx) {
        if (tx.date.startsWith(monthPrefix)) {
          if (tx.type === 'INCOME') inc += tx.amountMinor;
          else exp += tx.amountMinor;
        }
      }

      groups.push({
        label,
        dateKey: monthPrefix,
        incomeMinor: inc,
        expenseMinor: exp
      });
    }
    return groups;
  }

  // ALL mode: group by existing months
  const monthsFound = new Set<string>();
  for (const tx of activeTx) {
    monthsFound.add(tx.date.slice(0, 7));
  }
  const sortedMonths = Array.from(monthsFound).sort();
  if (sortedMonths.length === 0) {
    const now = new Date();
    sortedMonths.push(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
  }

  return sortedMonths.map((mKey) => {
    const [y, m] = mKey.split('-').map(Number);
    const label = `${MONTH_SHORT[m - 1]} ${y.toString().slice(-2)}`;
    let inc = 0;
    let exp = 0;
    for (const tx of activeTx) {
      if (tx.date.startsWith(mKey)) {
        if (tx.type === 'INCOME') inc += tx.amountMinor;
        else exp += tx.amountMinor;
      }
    }
    return {
      label,
      dateKey: mKey,
      incomeMinor: inc,
      expenseMinor: exp
    };
  });
}

/**
 * Counts uncategorized transactions for a given period and type
 */
export function uncategorizedCount(
  transactions: Transaction[],
  type: TxType,
  period?: { year: number; month?: number }
): number {
  const activeTx = getActiveTransactions(transactions);
  return activeTx.filter((tx) => {
    if (tx.type !== type) return false;
    if (tx.categoryId !== null && tx.categoryId !== '') return false;
    if (period) {
      if (period.month) {
        const prefix = `${period.year}-${period.month.toString().padStart(2, '0')}`;
        if (!tx.date.startsWith(prefix)) return false;
      } else {
        if (!tx.date.startsWith(`${period.year}-`)) return false;
      }
    }
    return true;
  }).length;
}

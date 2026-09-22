import * as XLSX from 'xlsx';
import { Transaction, Category } from '../../models/types';
import { getActiveTransactions } from '../calc/engine';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { blobToBase64 } from '../images/processor';

export interface ExportOptions {
  imageRecords?: Record<string, any>;
  openingBalanceMinor?: number;
}

export async function exportToExcel(
  transactions: Transaction[],
  categories: Category[],
  options: ExportOptions = {}
): Promise<boolean> {
  return exportAccountStatementExcel(transactions, categories, options);
}

export async function exportAccountStatementExcel(
  transactions: Transaction[],
  categories: Category[],
  options: ExportOptions = {}
): Promise<boolean> {
  try {
    const activeTx = getActiveTransactions(transactions).sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time || '').localeCompare(b.time || '');
    });

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => categoryMap.set(c.id, c.name));

    // Calculate totals and running balances
    let runningBalance = (options.openingBalanceMinor || 0) / 100;
    let totalCredit = 0;
    let totalDebit = 0;
    let totalAttachments = 0;

    const statementRows: any[] = [];
    const monthlyGroups = new Map<string, {
      monthKey: string;
      monthName: string;
      txs: typeof activeTx;
      totalCredit: number;
      totalDebit: number;
      attachmentCount: number;
    }>();

    for (const tx of activeTx) {
      const catName = (tx.categoryId && categoryMap.get(tx.categoryId)) || '-';
      const amount = tx.amountMinor / 100;
      const isIncome = tx.type === 'INCOME';

      if (isIncome) {
        runningBalance += amount;
        totalCredit += amount;
      } else {
        runningBalance -= amount;
        totalDebit += amount;
      }

      // Format month key "YYYY-MM" and nice month name "Sep 2026"
      // Track attachments
      const imgRec = tx.imageId && options.imageRecords ? options.imageRecords[tx.imageId] : undefined;
      const attachmentType = imgRec ? imgRec.fileType?.toUpperCase() || 'IMAGE' : tx.imageId ? 'IMAGE' : 'None';
      const attachmentName = imgRec?.originalName || (tx.imageId ? 'Attached receipt' : '-');
      if (tx.imageId) totalAttachments++;

      const [y, m] = tx.date.split('-');
      const monthDisplay = `${y}-${m}`;
      const monthKey = monthDisplay;

      statementRows.push({
        'Date': tx.date,
        'Time': tx.time || '12:00',
        'Month': monthDisplay,
        'Type': isIncome ? 'Income' : 'Expense',
        'Particulars': tx.title || 'Untitled',
        'Category': catName,
        'Description': tx.description || '',
        'Expense (INR)': isIncome ? '' : Number(amount.toFixed(2)),
        'Income (INR)': isIncome ? Number(amount.toFixed(2)) : '',
        'Running Balance (INR)': Number(runningBalance.toFixed(2)),
        'Attachment Type': attachmentType,
        'Attachment File': attachmentName
      });

      // Group for monthly sheets
      if (!monthlyGroups.has(monthKey)) {
        monthlyGroups.set(monthKey, {
          monthKey,
          monthName: monthDisplay,
          txs: [],
          totalCredit: 0,
          totalDebit: 0,
          attachmentCount: 0
        });
      }
      const group = monthlyGroups.get(monthKey)!;
      group.txs.push(tx);
      if (isIncome) group.totalCredit += amount;
      else group.totalDebit += amount;
      if (tx.imageId) group.attachmentCount++;
    }

    // Add Statement Total Row
    statementRows.push({
      'Date': 'TOTAL',
      'Time': '',
      'Month': '',
      'Type': '',
      'Particulars': `Total Transactions: ${activeTx.length}`,
      'Category': '',
      'Description': '',
      'Expense (INR)': Number(totalDebit.toFixed(2)),
      'Income (INR)': Number(totalCredit.toFixed(2)),
      'Running Balance (INR)': Number((totalCredit - totalDebit).toFixed(2)),
      'Attachment Type': '',
      'Attachment File': ''
    });

    const workbook = XLSX.utils.book_new();

    // 1. Full Statement Worksheet
    const wsStatement = XLSX.utils.json_to_sheet(statementRows);
    wsStatement['!cols'] = [
      { wch: 12 }, // Date
      { wch: 8 },  // Time
      { wch: 12 }, // Month
      { wch: 16 }, // Type
      { wch: 26 }, // Particulars
      { wch: 18 }, // Category
      { wch: 32 }, // Description
      { wch: 18 }, // Debit
      { wch: 18 }, // Credit
      { wch: 18 }, // Balance
      { wch: 16 }, // Attachment Type
      { wch: 28 }  // Attachment File
    ];
    XLSX.utils.book_append_sheet(workbook, wsStatement, 'Account Statement');

    // 2. Monthly Summary Worksheet
    const monthlySummaryRows: any[] = [];
    const sortedMonthKeys = Array.from(monthlyGroups.keys()).sort();

    for (const mKey of sortedMonthKeys) {
      const g = monthlyGroups.get(mKey)!;
      const net = g.totalCredit - g.totalDebit;
      monthlySummaryRows.push({
        'Month': g.monthName,
        'Total Income / Credit (INR)': Number(g.totalCredit.toFixed(2)),
        'Total Expense / Debit (INR)': Number(g.totalDebit.toFixed(2)),
        'Net Savings / Cashflow (INR)': Number(net.toFixed(2)),
        'Transactions': g.txs.length,
        'Attachments': g.attachmentCount
      });
    }

    // Monthly summary grand total row
    monthlySummaryRows.push({
      'Month': 'GRAND TOTAL',
      'Total Income / Credit (INR)': Number(totalCredit.toFixed(2)),
      'Total Expense / Debit (INR)': Number(totalDebit.toFixed(2)),
      'Net Savings / Cashflow (INR)': Number((totalCredit - totalDebit).toFixed(2)),
      'Transactions': activeTx.length,
      'Attachments': activeTx.filter(t => Boolean(t.imageId)).length
    });

    const wsMonthlySummary = XLSX.utils.json_to_sheet(monthlySummaryRows);
    wsMonthlySummary['!cols'] = [
      { wch: 18 }, // Month
      { wch: 24 }, // Credit
      { wch: 24 }, // Debit
      { wch: 24 }, // Net
      { wch: 14 }, // Tx count
      { wch: 14 }  // Attachments
    ];
    XLSX.utils.book_append_sheet(workbook, wsMonthlySummary, 'Monthly Summary');

    // 3. Separate Sheet per Month
    for (const mKey of sortedMonthKeys) {
      const g = monthlyGroups.get(mKey)!;
      let monthRunning = 0;
      const mRows = g.txs.map((tx) => {
        const catName = (tx.categoryId && categoryMap.get(tx.categoryId)) || '-';
        const amount = tx.amountMinor / 100;
        const isIncome = tx.type === 'INCOME';
        if (isIncome) monthRunning += amount;
        else monthRunning -= amount;

        return {
          'Date': tx.date,
          'Time': tx.time || '12:00',
          'Type': isIncome ? 'Income' : 'Expense',
          'Particulars': tx.title || 'Untitled',
          'Category': catName,
          'Description': tx.description || '',
          'Expense (INR)': isIncome ? '' : Number(amount.toFixed(2)),
          'Income (INR)': isIncome ? Number(amount.toFixed(2)) : '',
          'Month Balance': Number(monthRunning.toFixed(2)),
          'Has Attachment': tx.imageId ? 'Yes' : 'No'
        };
      });

      // Subtotal row
      mRows.push({
        'Date': 'MONTH TOTAL',
        'Time': '',
        'Type': '',
        'Particulars': `Transactions: ${g.txs.length}`,
        'Category': '',
        'Description': '',
        'Expense (INR)': Number(g.totalDebit.toFixed(2)),
        'Income (INR)': Number(g.totalCredit.toFixed(2)),
        'Month Balance': Number((g.totalCredit - g.totalDebit).toFixed(2)),
        'Has Attachment': `${g.attachmentCount} files`
      });

      const wsMonth = XLSX.utils.json_to_sheet(mRows);
      wsMonth['!cols'] = [
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 24 },
        { wch: 18 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 14 }
      ];
      // Excel sheet name max length 31 chars
      const sheetName = g.monthName.slice(0, 30);
      XLSX.utils.book_append_sheet(workbook, wsMonth, sheetName);
    }

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const fileName = `Account_Statement_${dateStr}.xlsx`;

    if (Capacitor.isNativePlatform()) {
      const b64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`,
        data: b64,
        recursive: true
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`
      });

      await Share.share({
        title: 'Account Statement Excel',
        url: uriResult.uri,
        dialogTitle: 'Open or Share Account Statement'
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (e) {
    console.error('[Excel] Account Statement export failed:', e);
    return false;
  }
}

export async function exportToCsv(
  transactions: Transaction[],
  categories: Category[]
): Promise<boolean> {
  try {
    const activeTx = getActiveTransactions(transactions).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const headers = ['Date', 'Time', 'Type', 'Title', 'Amount', 'Description', 'Category', 'Has Image'];
    const lines = [headers.join(',')];

    for (const tx of activeTx) {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      lines.push(
        [
          tx.date,
          tx.time,
          tx.type,
          escape(tx.title),
          (tx.amountMinor / 100).toFixed(2),
          escape(tx.description),
          escape(cat ? cat.name : '-'),
          tx.imageId ? 'Yes' : 'No'
        ].join(',')
      );
    }

    // UTF-8 with BOM for Excel compatibility
    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const fileName = `DayToDayExpenses_${dateStr}.csv`;

    if (Capacitor.isNativePlatform()) {
      const b64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`,
        data: b64
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: `DayToDayExpenses/exports/${fileName}`
      });

      await Share.share({
        title: 'Exported Expenses CSV',
        url: uriResult.uri,
        dialogTitle: 'Share CSV File'
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (e) {
    console.error('[CSV] Export failed:', e);
    return false;
  }
}

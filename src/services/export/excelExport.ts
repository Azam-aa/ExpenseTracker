import * as XLSX from 'xlsx';
import { Transaction, Category } from '../../models/types';
import { getActiveTransactions } from '../calc/engine';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { blobToBase64 } from '../images/processor';

export async function exportToExcel(
  transactions: Transaction[],
  categories: Category[]
): Promise<boolean> {
  try {
    const activeTx = getActiveTransactions(transactions).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const rows = activeTx.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      return {
        Date: tx.date,
        Time: tx.time,
        Type: tx.type === 'INCOME' ? 'Income' : 'Expense',
        Title: tx.title || 'Untitled',
        'Amount (INR)': (tx.amountMinor / 100).toFixed(2),
        Description: tx.description || '',
        Category: cat ? cat.name : 'Uncategorized',
        'Has Image': tx.imageId ? 'Yes' : 'No'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const fileName = `DayToDayExpenses_${dateStr}.xlsx`;

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
        title: 'Exported Expenses Excel',
        url: uriResult.uri,
        dialogTitle: 'Share Excel File'
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
    console.error('[Excel] Export failed:', e);
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
          escape(cat ? cat.name : 'Uncategorized'),
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

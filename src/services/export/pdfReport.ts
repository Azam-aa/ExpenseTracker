import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Settings, Category } from '../../models/types';
import { formatMoney, formatIndianNumber } from '../../utils/money';
import { monthSummary, getActiveTransactions } from '../calc/engine';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { blobToBase64 } from '../images/processor';

export async function generateMonthlyPdf(
  transactions: Transaction[],
  year: number,
  month: number,
  settings: Settings,
  categories: Category[]
): Promise<boolean> {
  try {
    const doc = new jsPDF();
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;

    const summary = monthSummary(transactions, year, month, settings);

    // Title
    doc.setFontSize(18);
    doc.text('Day to Day Expenses - Monthly Report', 14, 18);
    doc.setFontSize(12);
    doc.text(`Period: ${periodLabel}`, 14, 26);

    // Summary Box
    doc.setFontSize(10);
    doc.text(`Total Income: ${formatMoney(summary.incomeMinor)}`, 14, 34);
    doc.text(`Total Expense: ${formatMoney(summary.expenseMinor)}`, 70, 34);
    doc.text(`Carry Forward: ${formatMoney(summary.carryForwardMinor)}`, 130, 34);
    doc.text(`Net Balance: ${formatMoney(summary.balanceMinor)}`, 14, 40);

    // Filter transactions for month
    const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
    const monthTx = getActiveTransactions(transactions)
      .filter((t) => t.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = summary.carryForwardMinor;

    const tableRows = monthTx.map((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (tx.type === 'INCOME') runningBalance += tx.amountMinor;
      else runningBalance -= tx.amountMinor;

      return [
        tx.date,
        tx.title || 'Untitled',
        cat ? cat.name : 'Uncategorized',
        tx.type === 'INCOME' ? formatIndianNumber(tx.amountMinor) : '-',
        tx.type === 'EXPENSE' ? formatIndianNumber(tx.amountMinor) : '-',
        formatIndianNumber(runningBalance)
      ];
    });

    autoTable(doc, {
      startY: 46,
      head: [['Date', 'Title', 'Category', 'Income (INR)', 'Expense (INR)', 'Balance (INR)']],
      body: tableRows,
      theme: 'striped',
      styles: { fontSize: 9 }
    });

    const pdfBlob = doc.output('blob');
    const fileName = `Expenses_Report_${year}_${month.toString().padStart(2, '0')}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const b64 = await blobToBase64(pdfBlob);
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
        title: `Expenses Report - ${periodLabel}`,
        url: uriResult.uri,
        dialogTitle: 'Share PDF Report'
      });
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (e) {
    console.error('[PDF] Generation error:', e);
    return false;
  }
}

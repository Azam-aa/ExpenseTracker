import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { TopBar } from '../components/TopBar';
import { TabStrip } from '../components/TabStrip';
import { ThreeDotMenu } from '../components/ThreeDotMenu';
import { Fab } from '../components/Fab';
import { formatMoney, formatTableCell } from '../utils/money';
import { yearTable } from '../services/calc/engine';
import { generateMonthlyPdf } from '../services/export/pdfReport';
import { MdChevronLeft, MdChevronRight, MdPictureAsPdf } from 'react-icons/md';

export const YearlyScreen: React.FC = () => {
  const { transactions, settings, categories, selectedYear, setSelectedYear, showToast } =
    useAppStore();

  const tableData = yearTable(transactions, selectedYear, settings);

  const handlePrevYear = () => setSelectedYear(selectedYear - 1);
  const handleNextYear = () => setSelectedYear(selectedYear + 1);

  const yearLabel =
    settings.fiscalStartMonth && settings.fiscalStartMonth !== 1
      ? `${selectedYear}-${(selectedYear + 1).toString().slice(-2)}`
      : selectedYear.toString();

  const handlePdfExport = async () => {
    showToast('Generating PDF report...');
    const ok = await generateMonthlyPdf(transactions, selectedYear, 9, settings, categories);
    if (!ok) showToast('Could not generate PDF');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--color-bg)'
      }}
    >
      <TopBar />
      <TabStrip />
      <ThreeDotMenu />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '96px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Year Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 32px',
            height: '56px'
          }}
        >
          <button
            onClick={handlePrevYear}
            aria-label="Previous year"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronLeft />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text)' }}>
            {yearLabel}
          </span>
          <button
            onClick={handleNextYear}
            aria-label="Next year"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronRight />
          </button>
        </div>

        {/* Table Container */}
        <div style={{ padding: '0 12px', width: '100%', overflowX: 'auto' }}>
          {/* Header Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1.2fr 1.2fr 1.2fr',
              padding: '10px 0',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-text)',
              borderBottom: '1px solid var(--color-outline)'
            }}
          >
            <span />
            <span style={{ textAlign: 'right' }}>Income (Credit)</span>
            <span style={{ textAlign: 'right' }}>Expense (Debit)</span>
            <span style={{ textAlign: 'right' }}>Balance</span>
          </div>

          {/* C/F Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1.2fr 1.2fr 1.2fr',
              padding: '12px 0',
              fontSize: '14px',
              fontWeight: 400,
              color: 'var(--color-primary)',
              borderBottom: '1px solid var(--color-outline)'
            }}
          >
            <span>C/F</span>
            <span />
            <span />
            <span style={{ textAlign: 'right' }}>{formatMoney(tableData.openingCarryForward)}</span>
          </div>

          {/* Month Rows */}
          {tableData.rows.map((row) => (
            <div
              key={`${row.year}-${row.monthIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 1.2fr 1.2fr 1.2fr',
                padding: '12px 0',
                fontSize: '14px',
                color: 'var(--color-text)',
                borderBottom: '1px solid var(--color-outline)'
              }}
            >
              <span>{row.monthShort}</span>
              <span style={{ textAlign: 'right' }}>
                {row.incomeMinor === 0 ? '0.00' : formatTableCell(row.incomeMinor)}
              </span>
              <span style={{ textAlign: 'right' }}>
                {row.expenseMinor === 0 ? '0.00' : formatTableCell(row.expenseMinor)}
              </span>
              <span style={{ textAlign: 'right' }}>
                {row.balanceMinor === 0 ? '0.00' : formatTableCell(row.balanceMinor)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Fab icon={<MdPictureAsPdf />} onClick={handlePdfExport} ariaLabel="Generate yearly PDF" />
    </div>
  );
};

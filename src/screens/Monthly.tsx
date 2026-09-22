import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { TopBar } from '../components/TopBar';
import { TabStrip } from '../components/TabStrip';
import { ThreeDotMenu } from '../components/ThreeDotMenu';
import { Fab } from '../components/Fab';
import { formatMoney, formatTableCell } from '../utils/money';
import { parseDateInfo, formatMonthYear, getPrevMonth, getNextMonth } from '../utils/dates';
import { monthSummary, balanceEndOfDay, getActiveTransactions } from '../services/calc/engine';
import { generateMonthlyPdf } from '../services/export/pdfReport';
import { MdChevronLeft, MdChevronRight, MdPictureAsPdf, MdAttachFile } from 'react-icons/md';
import { getTransactionAttachmentIds } from '../models/types';
import { getImageFullUrl } from '../services/storage/indexedDbImages';

export const MonthlyScreen: React.FC = () => {
  const {
    transactions,
    settings,
    categories,
    selectedMonth,
    setSelectedMonth,
    openDetailsSheet,
    openEditSheet,
    openViewer,
    imageRecords,
    showToast
  } = useAppStore();

  const { year, month } = selectedMonth;

  const summary = monthSummary(transactions, year, month, settings);

  const handlePrevMonth = () => {
    const prev = getPrevMonth(year, month);
    setSelectedMonth(prev.year, prev.month);
  };

  const handleNextMonth = () => {
    const next = getNextMonth(year, month);
    setSelectedMonth(next.year, next.month);
  };

  // Group active transactions by day for selected month
  const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
  const activeTx = getActiveTransactions(transactions).filter((t) =>
    t.date.startsWith(monthPrefix)
  );

  const daysMap = new Map<string, typeof activeTx>();
  for (const tx of activeTx) {
    if (!daysMap.has(tx.date)) {
      daysMap.set(tx.date, []);
    }
    daysMap.get(tx.date)!.push(tx);
  }

  // Sort days descending (newest first)
  const sortedDates = Array.from(daysMap.keys()).sort((a, b) => b.localeCompare(a));

  const handlePdfExport = async () => {
    showToast('Generating PDF...');
    const ok = await generateMonthlyPdf(transactions, year, month, settings, categories);
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
        {/* Month Selector Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            height: '56px'
          }}
        >
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronLeft />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
            {formatMonthYear(year, month)}
          </span>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            style={{ color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdChevronRight />
          </button>
        </div>

        {/* Summary Card */}
        <div
          style={{
            margin: '0 10px 14px 10px',
            backgroundColor: 'var(--color-accent-card)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Row 1: Total Income & Total Expense */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                Total Income
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginTop: '2px'
                }}
              >
                {formatMoney(summary.incomeMinor)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                Total Expense
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginTop: '2px'
                }}
              >
                {formatMoney(summary.expenseMinor)}
              </div>
            </div>
          </div>

          {/* Row 2: C/F & Balance */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>C/F</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginTop: '2px'
                }}
              >
                {formatMoney(summary.carryForwardMinor)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>Balance</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginTop: '2px'
                }}
              >
                {formatMoney(summary.balanceMinor)}
              </div>
            </div>
          </div>
        </div>

        {/* Day Cards or Empty State */}
        {sortedDates.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--color-text-dim)',
              fontSize: '16px'
            }}
          >
            No transactions found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedDates.map((dateStr) => {
              const dayTxList = daysMap.get(dateStr) || [];
              const dateInfo = parseDateInfo(dateStr);
              const dayIncomeTx = dayTxList.filter((t) => t.type === 'INCOME');
              const dayExpenseTx = dayTxList.filter((t) => t.type === 'EXPENSE');

              const dayIncomeTotal = dayIncomeTx.reduce((sum, t) => sum + t.amountMinor, 0);
              const dayExpenseTotal = dayExpenseTx.reduce((sum, t) => sum + t.amountMinor, 0);
              const dayEndBalance = balanceEndOfDay(transactions, dateStr, settings);

              return (
                <div
                  key={dateStr}
                  style={{
                    margin: '0 8px',
                    borderRadius: '16px',
                    border: '2px solid var(--color-outline)',
                    padding: '12px 14px',
                    backgroundColor: 'transparent',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Date Title Centered */}
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: 400,
                      color: 'var(--color-text)',
                      marginBottom: '10px'
                    }}
                  >
                    {dateInfo.dayCardTitle}
                  </div>

                  {/* Two Columns: Income | Expense */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Income Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--color-text)',
                          textAlign: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        Income
                      </div>

                      {dayIncomeTx.map((tx) => {
                        const attIds = getTransactionAttachmentIds(tx);
                        return (
                        <div
                          key={tx.id}
                          data-testid="monthly-tx-row"
                          onClick={() => {
                            openDetailsSheet(tx);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openEditSheet(tx);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 0',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.title || 'Untitled'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexShrink: 0 }}>
                            {attIds.length > 0 && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const fullUrl = await getImageFullUrl(attIds[0]);
                                  const rec = imageRecords[attIds[0]];
                                  if (fullUrl) {
                                    openViewer(fullUrl, tx, rec, 0, attIds);
                                  }
                                }}
                                aria-label="View attachment"
                                title="View attachment"
                                style={{
                                  background: 'rgba(23, 162, 184, 0.18)',
                                  border: '1px solid var(--color-primary)',
                                  borderRadius: '6px',
                                  padding: '2px 4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  color: 'var(--color-primary)',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                <MdAttachFile size={14} />
                                {attIds.length > 1 && <span>{attIds.length}</span>}
                              </button>
                            )}
                            <span style={{ color: 'var(--color-text)' }}>
                              {formatTableCell(tx.amountMinor)}
                            </span>
                          </div>
                        </div>
                        );
                      })}

                      {/* Income Column Total */}
                      {dayIncomeTx.length > 0 && (
                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-income)',
                            marginTop: '6px'
                          }}
                        >
                          {formatMoney(dayIncomeTotal)}
                        </div>
                      )}
                    </div>

                    {/* Expense Column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--color-text)',
                          textAlign: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        Expense
                      </div>

                      {dayExpenseTx.map((tx) => {
                        const attIds = getTransactionAttachmentIds(tx);
                        return (
                        <div
                          key={tx.id}
                          data-testid="monthly-tx-row"
                          onClick={() => {
                            openDetailsSheet(tx);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openEditSheet(tx);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 0',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.title || 'Untitled'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexShrink: 0 }}>
                            {attIds.length > 0 && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const fullUrl = await getImageFullUrl(attIds[0]);
                                  const rec = imageRecords[attIds[0]];
                                  if (fullUrl) {
                                    openViewer(fullUrl, tx, rec, 0, attIds);
                                  }
                                }}
                                aria-label="View attachment"
                                title="View attachment"
                                style={{
                                  background: 'rgba(23, 162, 184, 0.18)',
                                  border: '1px solid var(--color-primary)',
                                  borderRadius: '6px',
                                  padding: '2px 4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  color: 'var(--color-primary)',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                <MdAttachFile size={14} />
                                {attIds.length > 1 && <span>{attIds.length}</span>}
                              </button>
                            )}
                            <span style={{ color: 'var(--color-text)' }}>
                              {formatTableCell(tx.amountMinor)}
                            </span>
                          </div>
                        </div>
                        );
                      })}

                      {/* Expense Column Total */}
                      {dayExpenseTx.length > 0 && (
                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-expense)',
                            marginTop: '6px'
                          }}
                        >
                          {formatMoney(dayExpenseTotal)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day End Balance at Bottom Right */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '10px',
                      paddingTop: '6px'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Balance</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {formatMoney(dayEndBalance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Fab icon={<MdPictureAsPdf />} onClick={handlePdfExport} ariaLabel="Generate monthly PDF" />
    </div>
  );
};

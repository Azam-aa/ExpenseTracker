import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { TopBar } from '../components/TopBar';
import { TabStrip } from '../components/TabStrip';
import { DateCard } from '../components/DateCard';
import { SectionBar } from '../components/SectionBar';
import { TxRow } from '../components/TxRow';
import { Fab } from '../components/Fab';
import { ThreeDotMenu } from '../components/ThreeDotMenu';
import { formatMoney } from '../utils/money';
import { carryForwardAt, totalsForDay } from '../services/calc/engine';
import { MdAdd } from 'react-icons/md';

export const DailyScreen: React.FC = () => {
  const { transactions, selectedDate, settings, openAddSheet } = useAppStore();

  const cf = carryForwardAt(transactions, selectedDate, settings);
  const dayTotals = totalsForDay(transactions, selectedDate, settings);

  const activeTx = transactions.filter((t) => t.date === selectedDate && !t.deletedAt);
  const incomeTx = activeTx.filter((t) => t.type === 'INCOME');
  const expenseTx = activeTx.filter((t) => t.type === 'EXPENSE');

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
        <DateCard />

        {/* C/F Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px 6px 14px'
          }}
        >
          <span style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 400 }}>
            C/F
          </span>
          <span style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 400 }}>
            {formatMoney(cf)}
          </span>
        </div>

        {/* Income Section */}
        <SectionBar title="Income" totalMinor={dayTotals.incomeMinor} />
        {incomeTx.length === 0 ? (
          <div
            style={{
              padding: '14px 28px',
              fontSize: '13px',
              color: 'var(--color-text-dim)',
              lineHeight: 1.4
            }}
          >
            Tap on '+' to add new item and long press an entry to<br />edit.
          </div>
        ) : (
          <div>
            {incomeTx.map((tx) => (
              <TxRow key={tx.id} transaction={tx} />
            ))}
          </div>
        )}

        {/* Expense Section */}
        <SectionBar title="Expense" totalMinor={dayTotals.expenseMinor} />
        {expenseTx.length === 0 ? (
          <div
            style={{
              padding: '14px 28px',
              fontSize: '13px',
              color: 'var(--color-text-dim)',
              lineHeight: 1.4
            }}
          >
            Tap on '+' to add new item and long press an entry to<br />edit.
          </div>
        ) : (
          <div>
            {expenseTx.map((tx) => (
              <TxRow key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>

      <Fab icon={<MdAdd />} onClick={openAddSheet} ariaLabel="Add transaction" />
    </div>
  );
};

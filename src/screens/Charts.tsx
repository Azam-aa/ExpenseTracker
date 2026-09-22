import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Fab } from '../components/Fab';
import { TxType } from '../models/types';
import { formatMoney, formatShortMoney } from '../utils/money';
import { chartSeries, uncategorizedCount, getActiveTransactions } from '../services/calc/engine';
import { generateMonthlyPdf } from '../services/export/pdfReport';
import {
  MdArrowBack,
  MdChevronLeft,
  MdChevronRight,
  MdWarning,
  MdPictureAsPdf,
  MdCheck
} from 'react-icons/md';

export const ChartsScreen: React.FC = () => {
  const { transactions, settings, categories, goBack, navigate, showToast } = useAppStore();

  const [periodMode, setPeriodMode] = useState<'MONTH' | 'YEAR' | 'ALL'>('MONTH');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(9); // September
  const [selectedType, setSelectedType] = useState<TxType>('EXPENSE');
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    inc: number;
    exp: number;
  } | null>(null);

  const groups = chartSeries(transactions, {
    mode: periodMode,
    year: selectedYear,
    month: selectedMonth
  });

  const uncatCount = uncategorizedCount(transactions, selectedType, {
    year: selectedYear,
    month: periodMode === 'MONTH' ? selectedMonth : undefined
  });

  // Calculate dynamic scale for Y-axis
  const maxPaise = Math.max(
    ...groups.map((g) => Math.max(g.incomeMinor, g.expenseMinor)),
    1500000 // default minimum 15K
  );

  // Round up to nice intervals (e.g. 3K, 6K, 9K, 12K, 15K)
  const stepPaise = Math.ceil(maxPaise / 5 / 100000) * 100000;
  const yTicks = [0, stepPaise, stepPaise * 2, stepPaise * 3, stepPaise * 4, stepPaise * 5];
  const chartMax = stepPaise * 5;

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Category breakdown data
  const activeTx = getActiveTransactions(transactions).filter((t) => {
    if (t.type !== selectedType) return false;
    if (periodMode === 'MONTH') {
      return t.date.startsWith(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`);
    } else if (periodMode === 'YEAR') {
      return t.date.startsWith(`${selectedYear}-`);
    }
    return true;
  });

  const catSums: Record<string, number> = {};
  let totalCatPaise = 0;
  for (const t of activeTx) {
    const key = t.categoryId || 'uncategorized';
    catSums[key] = (catSums[key] || 0) + t.amountMinor;
    totalCatPaise += t.amountMinor;
  }

  const breakdownRows = Object.entries(catSums)
    .map(([catId, amt]) => {
      const cat = categories.find((c) => c.id === catId);
      const name = catId === 'uncategorized' ? 'Uncategorized' : cat?.name || 'Other';
      const color = catId === 'uncategorized' ? '#ff9800' : cat?.color || 'var(--color-primary)';
      const percent = totalCatPaise > 0 ? Math.round((amt / totalCatPaise) * 100) : 0;
      return { id: catId, name, color, amt, percent };
    })
    .sort((a, b) => b.amt - a.amt);

  const handlePdfExport = async () => {
    showToast('Generating report PDF...');
    await generateMonthlyPdf(transactions, selectedYear, selectedMonth, settings, categories);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)',
        position: 'relative'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '16px',
          borderBottom: '1px solid var(--color-outline)',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => goBack()}
          aria-label="Back"
          style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px' }}
        >
          <MdArrowBack />
        </button>
        <span style={{ fontSize: '22px', fontWeight: 400, color: 'var(--color-text)' }}>
          Charts
        </span>
      </div>

      {/* Scrolling Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 10px 96px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Horizontal Filter Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}
        >
          {/* All Time Chip */}
          <button
            onClick={() => setPeriodMode('ALL')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: `2px solid ${periodMode === 'ALL' ? 'var(--color-primary)' : 'var(--color-outline)'}`,
              backgroundColor: periodMode === 'ALL' ? 'var(--color-accent-card)' : 'transparent',
              color: 'var(--color-text)',
              fontSize: '15px',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            All time
          </button>

          {/* Month Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-accent-card)',
              borderRadius: '12px',
              padding: '2px 8px',
              border: `2px solid ${periodMode === 'MONTH' ? 'var(--color-primary)' : 'transparent'}`
            }}
          >
            <button
              onClick={() => {
                setPeriodMode('MONTH');
                if (selectedMonth === 1) {
                  setSelectedYear((y) => y - 1);
                  setSelectedMonth(12);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
              style={{ color: 'var(--color-text)', fontSize: '20px' }}
            >
              <MdChevronLeft />
            </button>
            <button
              onClick={() => setPeriodMode('MONTH')}
              style={{
                padding: '6px 12px',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap'
              }}
            >
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </button>
            <button
              onClick={() => {
                setPeriodMode('MONTH');
                if (selectedMonth === 12) {
                  setSelectedYear((y) => y + 1);
                  setSelectedMonth(1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
              style={{ color: 'var(--color-text)', fontSize: '20px' }}
            >
              <MdChevronRight />
            </button>
          </div>

          {/* Year Chip (Peeks from right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-accent-card)',
              borderRadius: '12px',
              padding: '2px 8px',
              border: `2px solid ${periodMode === 'YEAR' ? 'var(--color-primary)' : 'transparent'}`
            }}
          >
            <button
              onClick={() => {
                setPeriodMode('YEAR');
                setSelectedYear((y) => y - 1);
              }}
              style={{ color: 'var(--color-text)', fontSize: '20px' }}
            >
              <MdChevronLeft />
            </button>
            <button
              onClick={() => setPeriodMode('YEAR')}
              style={{
                padding: '6px 12px',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap'
              }}
            >
              Year {selectedYear}
            </button>
            <button
              onClick={() => {
                setPeriodMode('YEAR');
                setSelectedYear((y) => y + 1);
              }}
              style={{ color: 'var(--color-text)', fontSize: '20px' }}
            >
              <MdChevronRight />
            </button>
          </div>
        </div>

        {/* Card 1: Segmented Control & Categorization Warning */}
        <div
          style={{
            borderRadius: '18px',
            border: '2px solid var(--color-outline)',
            padding: '14px',
            backgroundColor: 'transparent'
          }}
        >
          {/* Segmented Control */}
          <div
            style={{
              display: 'flex',
              height: '46px',
              borderRadius: '24px',
              border: '2px solid var(--color-segment-border)',
              overflow: 'hidden',
              marginBottom: uncatCount > 0 ? '14px' : '0'
            }}
          >
            <button
              onClick={() => setSelectedType('INCOME')}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: selectedType === 'INCOME' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500,
                gap: '6px'
              }}
            >
              {selectedType === 'INCOME' && <MdCheck size={20} color="var(--color-primary)" />}
              Income
            </button>

            <button
              onClick={() => setSelectedType('EXPENSE')}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: selectedType === 'EXPENSE' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500,
                gap: '6px'
              }}
            >
              {selectedType === 'EXPENSE' && <MdCheck size={20} color="var(--color-primary)" />}
              Expense
            </button>
          </div>

          {/* Categorization Warning */}
          {uncatCount > 0 && (
            <div
              onClick={() => navigate('CATEGORIZE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                paddingTop: '6px'
              }}
            >
              <MdWarning size={28} color="var(--color-warning)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.4 }}>
                {uncatCount} items are not categorized. Click here to categorize.
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Hand-built SVG Bar Chart */}
        <div
          style={{
            borderRadius: '18px',
            border: '2px solid var(--color-outline)',
            padding: '14px 10px',
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          {/* Scrollable Chart Area */}
          <div style={{ width: '100%', overflowX: 'auto', display: 'flex' }}>
            {/* Fixed Y-Axis Labels */}
            <div
              style={{
                width: '42px',
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingRight: '6px',
                paddingBottom: '30px',
                color: 'var(--color-text-dim)',
                fontSize: '11px',
                flexShrink: 0
              }}
            >
              {yTicks.slice().reverse().map((tick) => (
                <span key={tick}>{formatShortMoney(tick)}</span>
              ))}
            </div>

            {/* SVG Chart */}
            <svg
              width={Math.max(groups.length * 64, 300)}
              height={240}
              style={{ flexShrink: 0 }}
            >
              {/* Dashed Horizontal Grid Lines */}
              {yTicks.map((tick, i) => {
                const y = 210 - (i / 5) * 190;
                return (
                  <line
                    key={tick}
                    x1={0}
                    y1={y}
                    x2={Math.max(groups.length * 64, 300)}
                    y2={y}
                    stroke="var(--color-outline)"
                    strokeDasharray={i === 0 ? 'none' : '4 4'}
                    strokeWidth={i === 0 ? 2 : 1}
                  />
                );
              })}

              {/* Bars and X Labels */}
              {groups.map((g, idx) => {
                const groupX = idx * 64 + 10;
                const incHeight = Math.max(0, (g.incomeMinor / chartMax) * 190);
                const expHeight = Math.max(0, (g.expenseMinor / chartMax) * 190);

                const incY = 210 - incHeight;
                const expY = 210 - expHeight;

                return (
                  <g key={g.dateKey}>
                    {/* Income Bar (Green) */}
                    {incHeight > 0 && (
                      <rect
                        x={groupX}
                        y={incY}
                        width={18}
                        height={incHeight}
                        fill="var(--color-income)"
                        rx={2}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTooltip({
                            x: rect.left,
                            y: rect.top - 40,
                            label: g.label,
                            inc: g.incomeMinor,
                            exp: g.expenseMinor
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    )}

                    {/* Expense Bar (Coral) */}
                    {expHeight > 0 && (
                      <rect
                        x={groupX + 22}
                        y={expY}
                        width={18}
                        height={expHeight}
                        fill="var(--color-expense)"
                        rx={2}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveTooltip({
                            x: rect.left,
                            y: rect.top - 40,
                            label: g.label,
                            inc: g.incomeMinor,
                            exp: g.expenseMinor
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    )}

                    {/* X Label */}
                    <text
                      x={groupX + 20}
                      y={228}
                      fill="var(--color-text-dim)"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {g.label.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-income)'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Income</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-expense)'
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>Expense</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div
          style={{
            borderRadius: '18px',
            border: '2px solid var(--color-outline)',
            padding: '14px',
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            Category Breakdown ({selectedType === 'INCOME' ? 'Income' : 'Expense'})
          </span>

          {breakdownRows.length === 0 ? (
            <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
              No categorized entries for this period.
            </span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {breakdownRows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: row.color
                      }}
                    />
                    <span style={{ color: 'var(--color-text)' }}>{row.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '13px' }}>
                      {row.percent}%
                    </span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                      {formatMoney(row.amt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bar Tooltip */}
      {activeTooltip && (
        <div
          onClick={() => setActiveTooltip(null)}
          style={{
            position: 'fixed',
            left: Math.max(10, activeTooltip.x - 60),
            top: Math.max(10, activeTooltip.y),
            backgroundColor: 'var(--color-menu)',
            border: '1px solid var(--color-outline)',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-menu)',
            zIndex: 100,
            fontSize: '12px',
            color: 'var(--color-text)'
          }}
        >
          <div><strong>{activeTooltip.label}</strong></div>
          <div style={{ color: 'var(--color-income)' }}>Income: {formatMoney(activeTooltip.inc)}</div>
          <div style={{ color: 'var(--color-expense)' }}>Expense: {formatMoney(activeTooltip.exp)}</div>
        </div>
      )}

      <Fab icon={<MdPictureAsPdf />} onClick={handlePdfExport} ariaLabel="Generate report PDF" />
    </div>
  );
};

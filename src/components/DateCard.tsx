import React from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useAppStore } from '../store/useAppStore';
import { parseDateInfo, addDays } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { balanceEndOfDay } from '../services/calc/engine';

export const DateCard: React.FC = () => {
  const { selectedDate, setSelectedDate, transactions, settings } = useAppStore();
  const dateInfo = parseDateInfo(selectedDate);
  const endOfDayBalance = balanceEndOfDay(transactions, selectedDate, settings);

  const handlePrevDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleOpenDatePicker = () => {
    useAppStore.setState({ activeDialog: 'DATE_PICKER' });
  };

  return (
    <div
      style={{
        margin: '10px 10px 0 10px',
        backgroundColor: 'var(--color-accent-card)',
        borderRadius: '8px',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        justifyContent: 'space-between',
        flexShrink: 0
      }}
    >
      <button
        onClick={handlePrevDay}
        aria-label="Previous day"
        style={{
          width: '36px',
          height: '48px',
          color: 'var(--color-text)',
          fontSize: '24px'
        }}
      >
        <MdChevronLeft />
      </button>

      {/* Date Box Trigger */}
      <div
        onClick={handleOpenDatePicker}
        role="button"
        tabIndex={0}
        style={{
          width: '46px',
          height: '46px',
          border: '2px solid var(--color-primary-active)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 400,
          color: 'var(--color-text)',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {dateInfo.day}
      </div>

      {/* Date & Weekday text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginLeft: '10px',
          flex: 1
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.4px',
            color: 'var(--color-text)'
          }}
        >
          {dateInfo.monthYearHeader}
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text-dim)',
            marginTop: '2px'
          }}
        >
          {dateInfo.weekday}
        </div>
      </div>

      {/* Balance */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginRight: '6px'
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text)'
          }}
        >
          Balance
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text)',
            marginTop: '2px'
          }}
        >
          {formatMoney(endOfDayBalance)}
        </div>
      </div>

      <button
        onClick={handleNextDay}
        aria-label="Next day"
        style={{
          width: '36px',
          height: '48px',
          color: 'var(--color-text)',
          fontSize: '24px'
        }}
      >
        <MdChevronRight />
      </button>
    </div>
  );
};

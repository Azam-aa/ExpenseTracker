import React, { useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useAppStore } from '../store/useAppStore';
import { parseDateInfo, getDaysInMonth } from '../utils/dates';

interface DatePickerDialogProps {
  onClose: () => void;
}

export const DatePickerDialog: React.FC<DatePickerDialogProps> = ({ onClose }) => {
  const { selectedDate, setSelectedDate } = useAppStore();
  const info = parseDateInfo(selectedDate);

  const [viewYear, setViewYear] = useState(info.year);
  const [viewMonth, setViewMonth] = useState(info.month);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysCount = getDaysInMonth(viewYear, viewMonth);
  // Weekday of 1st day of month: 0=Sun, 1=Mon, ...
  const firstDayWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();

  const handleSelectDay = (day: number) => {
    const dStr = `${viewYear}-${viewMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dStr);
    onClose();
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '350px',
          backgroundColor: 'var(--color-sheet)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow-menu)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}
        >
          <button onClick={handlePrevMonth} style={{ color: 'var(--color-text)', fontSize: '24px' }}>
            <MdChevronLeft />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button onClick={handleNextMonth} style={{ color: 'var(--color-text)', fontSize: '24px' }}>
            <MdChevronRight />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-text-dim)'
          }}
        >
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>

        {/* Days Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            textAlign: 'center'
          }}
        >
          {Array.from({ length: firstDayWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysCount }).map((_, i) => {
            const day = i + 1;
            const isSelected =
              viewYear === info.year && viewMonth === info.month && day === info.day;

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleSelectDay(day)}
                style={{
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? 'var(--color-on-primary)' : 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: isSelected ? 700 : 400
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
          <button onClick={onClose} style={{ padding: '6px 12px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

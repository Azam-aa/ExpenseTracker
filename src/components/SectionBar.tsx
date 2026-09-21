import React from 'react';
import { formatMoney } from '../utils/money';

interface SectionBarProps {
  title: string;
  totalMinor: number;
}

export const SectionBar: React.FC<SectionBarProps> = ({ title, totalMinor }) => {
  return (
    <div
      style={{
        margin: '10px 10px 0 10px',
        backgroundColor: 'var(--color-section)',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        flexShrink: 0
      }}
    >
      <span
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text)'
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--color-text)'
        }}
      >
        {formatMoney(totalMinor)}
      </span>
    </div>
  );
};

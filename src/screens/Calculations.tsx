import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MdArrowBack } from 'react-icons/md';
import { parseAmountToMinor, minorToInputValue } from '../utils/money';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalculationsScreen: React.FC = () => {
  const { settings, updateSettings, goBack, showToast } = useAppStore();

  const [fiscalMonth, setFiscalMonth] = useState(settings.fiscalStartMonth || 1);
  const [carryForward, setCarryForward] = useState(settings.carryForward);
  const [openingBalanceStr, setOpeningBalanceStr] = useState(
    minorToInputValue(settings.openingBalanceMinor || 0)
  );

  const handleSave = () => {
    const minor = parseAmountToMinor(openingBalanceStr) || 0;
    updateSettings({
      fiscalStartMonth: fiscalMonth,
      carryForward,
      openingBalanceMinor: minor
    });
    showToast('Calculation settings updated');
    goBack();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)'
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
          Calculations
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Fiscal Year Start */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Fiscal year starts in
          </div>
          <select
            value={fiscalMonth}
            onChange={(e) => setFiscalMonth(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text)',
              borderRadius: '8px',
              border: '1px solid var(--color-outline)',
              fontSize: '15px'
            }}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1} style={{ backgroundColor: 'var(--color-sheet)' }}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Carry Forward Toggle */}
        <div
          onClick={() => setCarryForward(!carryForward)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '10px 0'
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Carry forward
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Carries prior net balances forward into subsequent days and months.
            </div>
          </div>
          <input
            type="checkbox"
            checked={carryForward}
            onChange={(e) => setCarryForward(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
        </div>

        {/* Opening Balance Input */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Opening balance
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={openingBalanceStr}
            onChange={(e) => setOpeningBalanceStr(e.target.value)}
            placeholder="0.00"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text)',
              borderRadius: '8px',
              border: '1px solid var(--color-outline)',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: '16px',
            height: '48px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

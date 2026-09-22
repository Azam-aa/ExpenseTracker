import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { MdArrowBack } from 'react-icons/md';
import { TxType } from '../models/types';

export const PreferencesScreen: React.FC = () => {
  const { settings, updateSettings, goBack, showToast } = useAppStore();

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
    showToast(`Theme set to ${theme}`);
  };

  const handleDefaultTypeChange = (type: TxType) => {
    updateSettings({ defaultType: type });
    showToast(`Default type set to ${type === 'EXPENSE' ? 'Expense' : 'Income'}`);
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
          Preferences
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Theme Preference */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Theme
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '10px',
                border: `2px solid ${settings.theme === 'dark' ? 'var(--color-primary)' : 'var(--color-outline)'}`,
                backgroundColor: settings.theme === 'dark' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500
              }}
            >
              Dark (Default)
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '10px',
                border: `2px solid ${settings.theme === 'light' ? 'var(--color-primary)' : 'var(--color-outline)'}`,
                backgroundColor: settings.theme === 'light' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500
              }}
            >
              Light
            </button>
          </div>
        </div>

        {/* Default Transaction Type */}
        <div>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Default type when adding
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleDefaultTypeChange('EXPENSE')}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '10px',
                border: `2px solid ${settings.defaultType === 'EXPENSE' ? 'var(--color-primary)' : 'var(--color-outline)'}`,
                backgroundColor: settings.defaultType === 'EXPENSE' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500
              }}
            >
              Expense
            </button>
            <button
              onClick={() => handleDefaultTypeChange('INCOME')}
              style={{
                flex: 1,
                height: '46px',
                borderRadius: '10px',
                border: `2px solid ${settings.defaultType === 'INCOME' ? 'var(--color-primary)' : 'var(--color-outline)'}`,
                backgroundColor: settings.defaultType === 'INCOME' ? 'var(--color-accent-card)' : 'transparent',
                color: 'var(--color-text)',
                fontSize: '15px',
                fontWeight: 500
              }}
            >
              Income
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

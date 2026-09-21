import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  MdArrowBack,
  MdLanguage,
  MdAttachMoney,
  MdFingerprint,
  MdCalculate,
  MdCloudUpload,
  MdTableChart,
  MdGridView,
  MdSettings,
  MdHelpOutline
} from 'react-icons/md';
import { hashPin } from '../services/lock/pinLock';
import { exportAccountStatementExcel } from '../services/export/excelExport';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    transactions,
    categories,
    imageRecords,
    goBack,
    navigate,
    showToast
  } = useAppStore();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupPin, setSetupPin] = useState('');

  const handleToggleLock = async () => {
    if (settings.appLock.enabled) {
      updateSettings({
        appLock: {
          ...settings.appLock,
          enabled: false
        }
      });
      showToast('App lock turned off');
    } else {
      setShowPinSetup(true);
    }
  };

  const handleConfirmPin = async () => {
    if (setupPin.length !== 4) {
      showToast('Enter 4 digits');
      return;
    }
    const hashRes = await hashPin(setupPin);
    updateSettings({
      appLock: {
        enabled: true,
        salt: hashRes.salt,
        hash: hashRes.hash,
        iterations: hashRes.iterations
      }
    });
    setShowPinSetup(false);
    showToast('App lock enabled');
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
          Settings
        </span>
      </div>

      {/* Settings Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* 1. App Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <MdLanguage size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              App Language
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              English (English)
            </div>
          </div>
        </div>

        {/* 2. Currency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <MdAttachMoney size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Currency
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              INR - Indian Rupee
            </div>
          </div>
        </div>

        {/* 3. App Lock */}
        <div
          onClick={handleToggleLock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minHeight: '74px',
            cursor: 'pointer'
          }}
        >
          <MdFingerprint size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              App lock
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '2px', lineHeight: 1.3 }}>
              Helps you protect your data from being viewed by others accidentally.
            </div>
          </div>

          {/* Screenshot Checkbox Square */}
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '4px',
              border: '2px solid var(--color-segment-border)',
              backgroundColor: settings.appLock.enabled ? 'var(--color-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {settings.appLock.enabled && (
              <div
                style={{
                  width: '6px',
                  height: '10px',
                  border: 'solid var(--color-on-primary)',
                  borderWidth: '0 2px 2px 0',
                  transform: 'rotate(45deg)',
                  marginBottom: '2px'
                }}
              />
            )}
          </div>
        </div>

        {/* 4. Full-width divider */}
        <div style={{ height: '2px', backgroundColor: 'var(--color-outline)', margin: '10px 0' }} />

        {/* 5. Calculations */}
        <div
          onClick={() => navigate('CALCULATIONS')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdCalculate size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Calculations
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Fiscal year, carry forward.
            </div>
          </div>
        </div>

        {/* 6. Backup and export */}
        <div
          onClick={() => navigate('BACKUP_EXPORT')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdCloudUpload size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Backup and export
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Local backup, restore, export as excel.
            </div>
          </div>
        </div>

        {/* 6b. Account Statement (Excel) */}
        <div
          onClick={async () => {
            showToast('Generating Account Statement (Excel)...');
            const ok = await exportAccountStatementExcel(transactions, categories, {
              imageRecords,
              openingBalanceMinor: settings.openingBalanceMinor
            });
            if (!ok) showToast('Export failed');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdTableChart size={28} color="var(--color-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Account Statement (Excel)
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-primary)', marginTop: '2px' }}>
              Download month-wise statement with debits, credits, and attachments.
            </div>
          </div>
        </div>

        {/* 7. Data Management */}
        <div
          onClick={() => navigate('DATA_MANAGEMENT')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdGridView size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Data Management
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Categories, carry forward, recently deleted, clear data.
            </div>
          </div>
        </div>

        {/* 8. Preferences */}
        <div
          onClick={() => navigate('PREFERENCES')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdSettings size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Preferences
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Themes and more.
            </div>
          </div>
        </div>

        {/* 9. Help and Feedback */}
        <div
          onClick={() => navigate('HELP')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdHelpOutline size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Help and Feedback
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Help, contact us, privacy policy.
            </div>
          </div>
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '340px',
              width: '90%'
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
              Set 4-digit PIN
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
              Enter a 4-digit code to protect your offline expenses.
            </div>
            <input
              type="password"
              maxLength={4}
              value={setupPin}
              onChange={(e) => setSetupPin(e.target.value)}
              placeholder="0000"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '8px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowPinSetup(false)}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPin}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Save PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

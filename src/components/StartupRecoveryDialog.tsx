import React from 'react';
import { FullBackupPayload } from '../models/types';
import { useAppStore } from '../store/useAppStore';

interface StartupRecoveryDialogProps {
  savedData: FullBackupPayload;
  onResolve: () => void;
}

export const StartupRecoveryDialog: React.FC<StartupRecoveryDialogProps> = ({
  savedData,
  onResolve
}) => {
  const { restoreFullPayload, showToast } = useAppStore();

  const handleRestore = async () => {
    await restoreFullPayload(savedData);
    showToast('Data restored successfully');
    onResolve();
  };

  const handleStartFresh = () => {
    showToast('Starting fresh with an empty database');
    onResolve();
  };

  const txCount = savedData.transactions?.length || 0;
  const imgCount = savedData.images?.length || 0;
  const dateStr = savedData.savedAt ? new Date(savedData.savedAt).toLocaleDateString() : 'earlier';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-sheet)',
          borderRadius: '16px',
          padding: '22px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: 'var(--shadow-menu)'
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>
          Saved Data Found
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', lineHeight: 1.5, marginBottom: '22px' }}>
          Found saved data in your phone Documents folder:
          <br /><br />
          • <strong>{txCount}</strong> transactions<br />
          • <strong>{imgCount}</strong> attached receipts<br />
          • Last saved: <strong>{dateStr}</strong>
          <br /><br />
          Would you like to restore your expenses and receipts?
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={handleStartFresh}
            style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
          >
            Start fresh
          </button>
          <button
            onClick={handleRestore}
            style={{
              padding: '10px 18px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

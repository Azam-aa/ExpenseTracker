import React, { useState } from 'react';
import { MdBackup, MdShare, MdSettings, MdClose, MdRestore } from 'react-icons/md';
import { useAppStore } from '../store/useAppStore';
import { shareBackupFile } from '../services/backup/zipBackup';
import { FullBackupPayload } from '../models/types';

interface CloudBackupSheetProps {
  onClose: () => void;
}

export const CloudBackupSheet: React.FC<CloudBackupSheetProps> = ({ onClose }) => {
  const { settings, revision, categories, notes, transactions, imageRecords, navigate, showToast } =
    useAppStore();
  const [isSharing, setIsSharing] = useState(false);

  const handleBackupNow = async () => {
    await useAppStore.getState().flushMirrorNow();
    showToast('Saved to Documents/DayToDayExpenses');
    onClose();
  };

  const handleShareBackup = async () => {
    setIsSharing(true);
    const payload: FullBackupPayload = {
      version: settings.schemaVersion,
      revision,
      savedAt: Date.now(),
      settings,
      categories,
      notes,
      transactions,
      images: Object.values(imageRecords)
    };
    const success = await shareBackupFile(payload);
    setIsSharing(false);
    if (success) {
      showToast('Backup prepared');
      onClose();
    } else {
      showToast('Could not share backup file');
    }
  };

  const handleOpenSettings = () => {
    onClose();
    navigate('BACKUP_EXPORT');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: 'var(--color-sheet)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '16px 16px calc(var(--safe-bottom) + 20px) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 12px 8px',
            borderBottom: '1px solid var(--color-outline)'
          }}
        >
          <div>
            <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text)' }}>
              Local Backup
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Works 100% offline. Files stay on your device.
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}>
            <MdClose />
          </button>
        </div>

        <button
          onClick={handleBackupNow}
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '15px',
            color: 'var(--color-text)'
          }}
        >
          <MdBackup size={22} color="var(--color-primary)" />
          Backup now
        </button>

        <button
          onClick={handleShareBackup}
          disabled={isSharing}
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '15px',
            color: 'var(--color-text)'
          }}
        >
          <MdShare size={22} color="var(--color-primary)" />
          {isSharing ? 'Compressing zip...' : 'Share backup file'}
        </button>

        <button
          onClick={() => {
            onClose();
            navigate('BACKUP_EXPORT');
          }}
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '15px',
            color: 'var(--color-text)'
          }}
        >
          <MdRestore size={22} color="var(--color-primary)" />
          Restore from app folder list
        </button>

        <button
          onClick={handleOpenSettings}
          style={{
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontSize: '15px',
            color: 'var(--color-text)'
          }}
        >
          <MdSettings size={22} color="var(--color-primary)" />
          Open backup settings
        </button>
      </div>
    </div>
  );
};

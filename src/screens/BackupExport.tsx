import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { appFolder } from '../services/storage/appFolder';
import { shareBackupFile, extractBackupZip } from '../services/backup/zipBackup';
import { exportToExcel, exportToCsv } from '../services/export/excelExport';
import { FullBackupPayload } from '../models/types';
import {
  MdArrowBack,
  MdBackup,
  MdFolder,
  MdRestore,
  MdShare,
  MdUploadFile,
  MdTableChart,
  MdCheckCircle,
  MdClose
} from 'react-icons/md';

export const BackupExportScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    revision,
    categories,
    notes,
    transactions,
    imageRecords,
    restoreFullPayload,
    goBack,
    navigate,
    showToast
  } = useAppStore();

  const [snapshots, setSnapshots] = useState<{ name: string; size: number; mtime: number }[]>([]);
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    appFolder.listSnapshots().then(setSnapshots);
  }, []);

  const handleBackupNow = async () => {
    await useAppStore.getState().flushMirrorNow();
    updateSettings({ lastBackupAt: Date.now() });
    showToast('Saved to Documents/DayToDayExpenses');
    appFolder.listSnapshots().then(setSnapshots);
  };

  const handleCopyFolderPath = () => {
    navigator.clipboard.writeText(appFolder.getActiveLocation());
    showToast('Folder path copied');
  };

  const handleShareZip = async () => {
    showToast('Preparing backup zip...');
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
    const ok = await shareBackupFile(payload);
    if (!ok) showToast('Share failed');
  };

  const handleRestoreSnapshot = async (filename: string) => {
    const payload = await appFolder.readSnapshot(filename);
    if (payload) {
      await restoreFullPayload(payload);
      setShowSnapshotsModal(false);
      showToast('Restored from snapshot');
    } else {
      showToast('Could not read snapshot');
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Reading backup file...');
      let payload: FullBackupPayload;
      if (file.name.endsWith('.zip')) {
        payload = await extractBackupZip(file);
      } else {
        const text = await file.text();
        payload = JSON.parse(text);
      }

      await restoreFullPayload(payload);
      showToast('Backup restored successfully');
    } catch (err) {
      console.error('[Restore] File restore failed:', err);
      showToast('Invalid or corrupted backup file');
    }
  };

  const handleExportExcel = async () => {
    showToast('Generating Excel (.xlsx)...');
    const ok = await exportToExcel(transactions, categories);
    if (!ok) showToast('Excel export failed');
  };

  const handleExportCsv = async () => {
    showToast('Generating CSV...');
    const ok = await exportToCsv(transactions, categories);
    if (!ok) showToast('CSV export failed');
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
          Backup and export
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json"
        style={{ display: 'none' }}
        onChange={handleFileRestore}
      />

      {/* List items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* 1. Backup now */}
        <div
          onClick={handleBackupNow}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdBackup size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Backup now
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              {settings.lastBackupAt
                ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleString()}`
                : 'Tap to save a fresh snapshot'}
            </div>
          </div>
        </div>

        {/* 2. Auto backup */}
        <div
          onClick={() => updateSettings({ autoBackup: !settings.autoBackup })}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdCheckCircle size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Auto backup
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Saves a safety copy after every change.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
            style={{ width: '20px', height: '20px' }}
          />
        </div>

        {/* 3. App folder */}
        <div
          onClick={handleCopyFolderPath}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdFolder size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              App folder
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-primary)', marginTop: '2px' }}>
              {appFolder.getActiveLocation()} (Tap to copy)
            </div>
          </div>
        </div>

        {/* 4. Restore from app folder */}
        <div
          onClick={() => setShowSnapshotsModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdRestore size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Restore from app folder
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              {snapshots.length > 0 ? `${snapshots.length} safety snapshots available` : 'Browse snapshots'}
            </div>
          </div>
        </div>

        {/* 5. Share backup file */}
        <div
          onClick={handleShareZip}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdShare size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Share backup file
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Create full zip with data and all receipt images.
            </div>
          </div>
        </div>

        {/* 6. Restore from file */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdUploadFile size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Restore from file
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Pick a .zip or .json backup from your device.
            </div>
          </div>
        </div>

        {/* 7. Export as Excel */}
        <div
          onClick={handleExportExcel}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdTableChart size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Export as Excel (.xlsx)
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Spreadsheet with all transactions and details.
            </div>
          </div>
        </div>

        {/* 8. Export as CSV */}
        <div
          onClick={handleExportCsv}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdTableChart size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Export as CSV
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              UTF-8 CSV format with Rupee symbol.
            </div>
          </div>
        </div>

        {/* 9. Check data and images */}
        <div
          onClick={() => navigate('CHECK_DATA')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdCheckCircle size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Check data and images
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Run integrity check and repair missing receipt links.
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Modal */}
      {showSnapshotsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px'
          }}
          onClick={() => setShowSnapshotsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '420px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)' }}>
                Restore Snapshot
              </span>
              <button onClick={() => setShowSnapshotsModal(false)} style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}>
                <MdClose />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {snapshots.length === 0 ? (
                <div style={{ color: 'var(--color-text-dim)', padding: '20px 0', textAlign: 'center' }}>
                  No snapshots saved yet.
                </div>
              ) : (
                snapshots.map((s) => (
                  <div
                    key={s.name}
                    onClick={() => setSelectedSnapshot(s.name)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: selectedSnapshot === s.name ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-outline)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                      Size: {Math.round(s.size / 1024)} KB &nbsp;•&nbsp; {new Date(s.mtime).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedSnapshot && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestoreSnapshot(selectedSnapshot)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  Restore This Snapshot
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

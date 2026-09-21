import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  MdArrowBack,
  MdCategory,
  MdForward,
  MdDeleteSweep,
  MdCheckCircle,
  MdDeleteForever
} from 'react-icons/md';

export const DataManagementScreen: React.FC = () => {
  const { clearAllData, goBack, navigate, showToast } = useAppStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteFolderToo, setDeleteFolderToo] = useState(false);

  const handleClearEverything = async () => {
    await clearAllData(deleteFolderToo);
    setShowClearConfirm(false);
    showToast('All local data cleared');
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
          Data Management
        </span>
      </div>

      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* 1. Categories */}
        <div
          onClick={() => navigate('CATEGORIES')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdCategory size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Categories
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Manage income and expense categories.
            </div>
          </div>
        </div>

        {/* 2. Carry forward */}
        <div
          onClick={() => navigate('CALCULATIONS')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdForward size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Carry forward
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Opening balance and fiscal year rules.
            </div>
          </div>
        </div>

        {/* 3. Recently deleted */}
        <div
          onClick={() => navigate('RECENTLY_DELETED')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdDeleteSweep size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Recently deleted
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Restore deleted entries within 30 days.
            </div>
          </div>
        </div>

        {/* 4. Check data and images */}
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
              Run integrity diagnostic on storage and photos.
            </div>
          </div>
        </div>

        {/* 5. Clear all data */}
        <div
          onClick={() => setShowClearConfirm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer', marginTop: '12px' }}
        >
          <MdDeleteForever size={28} color="var(--color-expense)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-expense)' }}>
              Clear all data
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Permanently delete all transactions, notes, and local settings.
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 250,
            padding: '20px'
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>
              Clear All Data
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', lineHeight: 1.4, marginBottom: '16px' }}>
              This will permanently delete all local application data inside the app.
              {!deleteFolderToo && (
                <div style={{ color: 'var(--color-primary)', marginTop: '6px' }}>
                  A safety backup snapshot will be saved in Documents/DayToDayExpenses/backups before clearing.
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setDeleteFolderToo(!deleteFolderToo)}
            >
              <input
                type="checkbox"
                checked={deleteFolderToo}
                onChange={(e) => setDeleteFolderToo(e.target.checked)}
                id="delFolder"
              />
              <label htmlFor="delFolder" style={{ fontSize: '13px', color: 'var(--color-expense)' }}>
                Also delete the backup folder (cannot be undone)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearEverything}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-expense)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

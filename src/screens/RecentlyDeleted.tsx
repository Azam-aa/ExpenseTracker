import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatMoney } from '../utils/money';
import { MdArrowBack, MdRestore, MdDeleteForever } from 'react-icons/md';

export const RecentlyDeletedScreen: React.FC = () => {
  const { transactions, restoreTransaction, permanentlyDeleteTransaction, goBack, showToast } =
    useAppStore();

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const deletedTxList = transactions.filter((t) => {
    if (!t.deletedAt) return false;
    return now - t.deletedAt < thirtyDaysMs;
  });

  const handleRestore = (id: string) => {
    restoreTransaction(id);
    showToast('Transaction restored');
  };

  const handlePermanentDelete = (id: string) => {
    permanentlyDeleteTransaction(id);
    showToast('Permanently deleted');
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
        <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)' }}>
          Recently Deleted ({deletedTxList.length})
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {deletedTxList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--color-text-dim)',
              fontSize: '16px'
            }}
          >
            No recently deleted transactions.
          </div>
        ) : (
          deletedTxList.map((tx) => {
            const daysLeft = Math.max(
              0,
              Math.ceil((thirtyDaysMs - (now - (tx.deletedAt || now))) / (24 * 60 * 60 * 1000))
            );

            return (
              <div
                key={tx.id}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--color-outline)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
                    {tx.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                    {tx.date} &nbsp;•&nbsp; {formatMoney(tx.amountMinor)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '2px' }}>
                    Auto-purges in {daysLeft} days
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleRestore(tx.id)}
                    aria-label="Restore"
                    style={{ width: '40px', height: '40px', color: 'var(--color-primary)', fontSize: '22px' }}
                  >
                    <MdRestore />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(tx.id)}
                    aria-label="Permanently delete"
                    style={{ width: '40px', height: '40px', color: 'var(--color-expense)', fontSize: '22px' }}
                  >
                    <MdDeleteForever />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

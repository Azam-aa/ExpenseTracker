import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Transaction } from '../models/types';
import { formatMoney } from '../utils/money';
import { CategoryPicker } from '../components/CategoryPicker';
import { MdArrowBack } from 'react-icons/md';

export const CategorizeScreen: React.FC = () => {
  const { transactions, updateTransaction, goBack, showToast } = useAppStore();

  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [applyToAll, setApplyToAll] = useState(true);

  // Uncategorized transactions
  const uncatList = transactions.filter(
    (t) => !t.deletedAt && (!t.categoryId || t.categoryId === '')
  );

  const matchingCount = activeTx
    ? uncatList.filter((t) => t.title === activeTx.title).length
    : 0;

  const handleSelectCategory = (catId: string | null) => {
    if (!activeTx) return;

    if (applyToAll && activeTx.title) {
      const titleToMatch = activeTx.title;
      uncatList
        .filter((t) => t.title === titleToMatch)
        .forEach((t) => {
          updateTransaction({
            ...t,
            categoryId: catId,
            updatedAt: Date.now()
          });
        });
      showToast(`Categorized ${matchingCount} items`);
    } else {
      updateTransaction({
        ...activeTx,
        categoryId: catId,
        updatedAt: Date.now()
      });
      showToast('Categorized 1 item');
    }

    setActiveTx(null);
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
          Categorize ({uncatList.length})
        </span>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {uncatList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--color-text-dim)',
              fontSize: '16px'
            }}
          >
            All transactions are categorized!
          </div>
        ) : (
          uncatList.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setActiveTx(tx)}
              style={{
                borderRadius: '12px',
                border: '1px solid var(--color-outline)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
                  {tx.title || 'Untitled'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                  {tx.date} &nbsp;•&nbsp; Tap to assign category
                </div>
              </div>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: tx.type === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)'
                }}
              >
                {formatMoney(tx.amountMinor)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Category Picker with Bulk Option */}
      {activeTx && (
        <div>
          <CategoryPicker
            type={activeTx.type}
            selectedCategoryId={null}
            onSelect={handleSelectCategory}
            onClose={() => setActiveTx(null)}
          />

          {/* Bulk Checkbox Banner */}
          {matchingCount > 1 && (
            <div
              style={{
                position: 'fixed',
                bottom: 'calc(var(--safe-bottom) + 80px)',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-menu)',
                border: '1px solid var(--color-outline)',
                padding: '10px 16px',
                borderRadius: '12px',
                zIndex: 110,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text)',
                fontSize: '13px',
                boxShadow: 'var(--shadow-menu)'
              }}
            >
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                id="applyAll"
              />
              <label htmlFor="applyAll">
                Apply to all {matchingCount} items titled "{activeTx.title}"
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

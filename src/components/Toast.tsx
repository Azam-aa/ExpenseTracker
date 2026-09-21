import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const Toast: React.FC = () => {
  const { toastMessage, undoTx, undoDeleteTransaction } = useAppStore();

  if (!toastMessage && !undoTx) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--safe-bottom) + 84px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#202825',
        color: '#ffffff',
        padding: '12px 18px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        zIndex: 140,
        maxWidth: '90%',
        border: '1px solid var(--color-outline)'
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {undoTx ? 'Transaction deleted' : toastMessage}
      </span>
      {undoTx && (
        <button
          onClick={undoDeleteTransaction}
          style={{
            color: 'var(--color-primary)',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 4px'
          }}
        >
          UNDO
        </button>
      )}
    </div>
  );
};

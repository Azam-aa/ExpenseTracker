import React, { useRef } from 'react';
import { MdAttachFile } from 'react-icons/md';
import { Transaction, getTransactionAttachmentIds } from '../models/types';
import { formatMoney } from '../utils/money';
import { useAppStore } from '../store/useAppStore';
import { getImageFullUrl } from '../services/storage/indexedDbImages';

interface TxRowProps {
  transaction: Transaction;
}

export const TxRow: React.FC<TxRowProps> = ({ transaction }) => {
  const { openEditSheet, openDetailsSheet, openViewer, imageRecords } = useAppStore();
  const timerRef = useRef<number | null>(null);
  const isLongPress = useRef(false);

  const attIds = getTransactionAttachmentIds(transaction);

  const handleTouchStart = () => {
    isLongPress.current = false;
    timerRef.current = window.setTimeout(() => {
      isLongPress.current = true;
      openEditSheet(transaction);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    if (isLongPress.current) return;
    openDetailsSheet(transaction);
  };

  const handleAttachmentClick = async (e: React.MouseEvent, index: number, id: string) => {
    e.stopPropagation();
    const fullUrl = await getImageFullUrl(id);
    const rec = imageRecords[id];
    if (fullUrl) {
      openViewer(fullUrl, transaction, rec, index, attIds);
    }
  };

  const isIncome = transaction.type === 'INCOME';

  return (
    <div
      data-testid="tx-row"
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        openEditSheet(transaction);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        margin: '0 10px',
        padding: '10px 12px',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid var(--color-outline)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '12px', minWidth: 0 }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 400,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {transaction.title || 'Untitled'}
        </span>
        {transaction.description ? (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-dim)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {transaction.description}
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
        {attIds.length > 0 && (
          <button
            type="button"
            onClick={(e) => handleAttachmentClick(e, 0, attIds[0])}
            aria-label="View attachment"
            title="View attachment"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(23, 162, 184, 0.18)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <MdAttachFile size={16} />
            {attIds.length > 1 && <span>{attIds.length}</span>}
          </button>
        )}
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
            whiteSpace: 'nowrap'
          }}
        >
          {formatMoney(transaction.amountMinor)}
        </span>
      </div>
    </div>
  );
};

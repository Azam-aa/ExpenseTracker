import React, { useRef, useState, useEffect } from 'react';
import { MdAttachFile } from 'react-icons/md';
import { Transaction } from '../models/types';
import { formatMoney } from '../utils/money';
import { useAppStore } from '../store/useAppStore';
import { getImageFullUrl, getImageThumbnailUrl } from '../services/storage/indexedDbImages';

interface TxRowProps {
  transaction: Transaction;
}

export const TxRow: React.FC<TxRowProps> = ({ transaction }) => {
  const { openEditSheet, openViewer } = useAppStore();
  const timerRef = useRef<number | null>(null);
  const isLongPress = useRef(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (transaction.imageId) {
      getImageThumbnailUrl(transaction.imageId).then((url) => {
        if (active && url) setThumbUrl(url);
      });
    } else {
      setThumbUrl(null);
    }
    return () => {
      active = false;
    };
  }, [transaction.imageId]);

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
    // Directly open edit sheet on click as requested
    openEditSheet(transaction);
  };

  const handleAttachmentClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transaction.imageId) {
      const url = await getImageFullUrl(transaction.imageId);
      if (url) {
        openViewer(url, transaction);
      } else if (thumbUrl) {
        openViewer(thumbUrl, transaction);
      }
    }
  };

  const isIncome = transaction.type === 'INCOME';

  return (
    <div
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '12px' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {transaction.imageId && (
          <div
            onClick={handleAttachmentClick}
            role="button"
            aria-label="View attached receipt image"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--color-primary)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt="Receipt"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <MdAttachFile size={18} color="var(--color-primary)" />
            )}
          </div>
        )}
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: isIncome ? 'var(--color-income)' : 'var(--color-expense)'
          }}
        >
          {formatMoney(transaction.amountMinor)}
        </span>
      </div>
    </div>
  );
};

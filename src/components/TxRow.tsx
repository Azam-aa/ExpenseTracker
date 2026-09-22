import React, { useRef, useState, useEffect } from 'react';
import { MdPictureAsPdf, MdAttachFile } from 'react-icons/md';
import { Transaction, getTransactionAttachmentIds } from '../models/types';
import { formatMoney } from '../utils/money';
import { useAppStore } from '../store/useAppStore';
import { getImageFullUrl, getMultipleThumbnails } from '../services/storage/indexedDbImages';

interface TxRowProps {
  transaction: Transaction;
}

export const TxRow: React.FC<TxRowProps> = ({ transaction }) => {
  const { openEditSheet, openViewer, imageRecords } = useAppStore();
  const timerRef = useRef<number | null>(null);
  const isLongPress = useRef(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; url: string }>>([]);

  const attIds = getTransactionAttachmentIds(transaction);

  useEffect(() => {
    let active = true;
    if (attIds.length > 0) {
      getMultipleThumbnails(attIds).then((items) => {
        if (active) setAttachments(items);
      });
    } else {
      setAttachments([]);
    }
    return () => {
      active = false;
    };
  }, [transaction.imageId, JSON.stringify(transaction.attachmentIds)]);

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
    openEditSheet(transaction);
  };

  const handleAttachmentClick = async (e: React.MouseEvent, index: number, id: string) => {
    e.stopPropagation();
    const fullUrl = await getImageFullUrl(id);
    const rec = imageRecords[id];
    const targetUrl = fullUrl || attachments[index]?.url;
    if (targetUrl) {
      openViewer(targetUrl, transaction, rec, index, attIds);
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

        {/* Inline Image / Attachment Strip: Visible directly on the entry */}
        {attachments.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: '2px'
            }}
          >
            {attachments.map((item, idx) => {
              const rec = imageRecords[item.id];
              const isPdf = rec?.fileType === 'pdf' || rec?.fileName?.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={(e) => handleAttachmentClick(e, idx, item.id)}
                  role="button"
                  aria-label={`View attachment ${idx + 1}`}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid var(--color-primary)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {isPdf ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e53935'
                      }}
                    >
                      <MdPictureAsPdf size={22} />
                      <span style={{ fontSize: '8px', color: '#fff', fontWeight: 600 }}>PDF</span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Receipt ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  )}
                </div>
              );
            })}
            {attachments.length > 1 && (
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0 }}>
                {attachments.length} files
              </span>
            )}
          </div>
        )}
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

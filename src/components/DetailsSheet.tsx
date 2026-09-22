import React, { useEffect, useState } from 'react';
import { Transaction, getTransactionAttachmentIds } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import { formatMoney } from '../utils/money';
import { getImageFullUrl, getMultipleThumbnails } from '../services/storage/indexedDbImages';
import { MdClose, MdEdit, MdPictureAsPdf, MdVisibility } from 'react-icons/md';

interface DetailsSheetProps {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
}

export const DetailsSheet: React.FC<DetailsSheetProps> = ({
  transaction,
  onClose,
  onEdit
}) => {
  const { openViewer, imageRecords } = useAppStore();
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

  const isIncome = transaction.type === 'INCOME';

  const handleThumbClick = async (index: number, id: string) => {
    const fullUrl = await getImageFullUrl(id);
    const rec = imageRecords[id];
    const targetUrl = fullUrl || attachments[index]?.url;
    if (targetUrl) {
      openViewer(targetUrl, transaction, rec, index, attIds);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: 'var(--color-sheet)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '16px 20px calc(var(--safe-bottom) + 20px) 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--shadow-sheet)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text)' }}>
            Transaction Details
          </span>
          <button onClick={onClose} aria-label="Close details" style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}>
            <MdClose />
          </button>
        </div>

        {/* Title and Amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text)' }}>
              {transaction.title || 'Untitled'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              {transaction.type === 'INCOME' ? 'Income' : 'Expense'}
            </div>
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: isIncome ? 'var(--color-income)' : 'var(--color-expense)'
            }}
          >
            {formatMoney(transaction.amountMinor)}
          </div>
        </div>

        {/* Date and Time */}
        <div style={{ fontSize: '14px', color: 'var(--color-text-dim)' }}>
          {transaction.date} &nbsp;•&nbsp; {transaction.time}
        </div>

        {/* Description */}
        {transaction.description ? (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--color-text)'
            }}
          >
            {transaction.description}
          </div>
        ) : null}

        {/* Attachments Section with prominent View Document button */}
        {attachments.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-primary)'
            }}
          >
            <button
              onClick={() => handleThumbClick(0, attIds[0])}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(23, 162, 184, 0.2)',
                border: '1.5px solid var(--color-primary)',
                color: 'var(--color-primary)',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <MdVisibility size={20} />
              <span>View Document {attachments.length > 1 ? `(${attachments.length})` : ''}</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                overflowX: 'auto',
                padding: '2px 0',
                scrollbarWidth: 'none'
              }}
            >
              {attachments.map((item, idx) => {
                const rec = imageRecords[item.id];
                const isPdf = rec?.fileType === 'pdf' || rec?.fileName?.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => handleThumbClick(idx, item.id)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid var(--color-primary)',
                      backgroundColor: '#121212',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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
                        <MdPictureAsPdf size={26} />
                        <span style={{ fontSize: '8px', color: '#fff', fontWeight: 600 }}>PDF</span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Attachment ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-accent-card)',
              color: 'var(--color-text)',
              fontSize: '15px',
              fontWeight: 500,
              gap: '6px'
            }}
          >
            <MdEdit size={18} />
            Edit
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--color-text)',
              fontSize: '15px'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

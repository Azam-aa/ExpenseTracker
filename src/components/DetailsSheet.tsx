import React, { useEffect, useState } from 'react';
import { Transaction } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import { formatMoney } from '../utils/money';
import { getImageThumbnailUrl, getImageFullUrl } from '../services/storage/indexedDbImages';
import { getCategoryIcon } from './CategoryPicker';
import { MdClose, MdEdit } from 'react-icons/md';

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
  const { categories, openViewer } = useAppStore();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (transaction.imageId) {
      getImageThumbnailUrl(transaction.imageId).then((url) => {
        if (url) setThumbUrl(url);
      });
    }
  }, [transaction.imageId]);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const isIncome = transaction.type === 'INCOME';

  const handleThumbClick = async () => {
    if (transaction.imageId) {
      const fullUrl = await getImageFullUrl(transaction.imageId);
      const { imageRecords } = useAppStore.getState();
      const rec = imageRecords[transaction.imageId];
      if (fullUrl) {
        openViewer(fullUrl, transaction, rec);
      } else if (thumbUrl) {
        openViewer(thumbUrl, transaction, rec);
      }
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
          <button onClick={onClose} style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}>
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
              {transaction.type === 'INCOME' ? 'Income (Credit)' : 'Expense (Debit)'}
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

        {/* Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: category?.color || 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            {category ? getCategoryIcon(category.icon, 18) : <MdClose size={18} />}
          </div>
          <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
            {category?.name || 'Uncategorized'}
          </span>
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

        {/* Image Thumbnail */}
        {thumbUrl && (
          <div
            onClick={handleThumbClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-primary)',
              cursor: 'pointer'
            }}
          >
            <img
              src={thumbUrl}
              alt="Receipt"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Attached Document / Receipt
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '2px' }}>
                Tap here to view full screen
              </div>
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

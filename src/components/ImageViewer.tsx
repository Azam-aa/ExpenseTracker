import React, { useState } from 'react';
import { Transaction } from '../models/types';
import { formatMoney } from '../utils/money';
import { MdArrowBack, MdDelete, MdPhotoCamera } from 'react-icons/md';
import { PhotoPicker } from './PhotoPicker';
import { processImageBytes } from '../services/images/processor';
import { useAppStore } from '../store/useAppStore';

interface ImageViewerProps {
  imageUrl: string;
  transaction: Transaction;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  transaction,
  onClose
}) => {
  const { updateTransaction, showToast } = useAppStore();
  const [scale, setScale] = useState(1);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleDoubleTap = () => {
    setScale((prev) => (prev > 1.2 ? 1 : 2.2));
  };

  const handleRemoveImage = () => {
    updateTransaction({
      ...transaction,
      imageId: null,
      updatedAt: Date.now()
    });
    showToast('Image removed');
    onClose();
  };

  const handleReplaceImage = async (blob: Blob) => {
    try {
      const res = await processImageBytes(blob, transaction.id, {
        date: transaction.date,
        type: transaction.type,
        amountMinor: transaction.amountMinor,
        title: transaction.title || 'receipt'
      });
      updateTransaction(
        {
          ...transaction,
          imageId: res.record.id,
          updatedAt: Date.now()
        },
        res.record
      );
      showToast('Image replaced');
      onClose();
    } catch {
      showToast('Could not replace image');
    }
  };

  const isIncome = transaction.type === 'INCOME';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid var(--color-outline)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            aria-label="Back"
            style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px' }}
          >
            <MdArrowBack />
          </button>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>
              {transaction.title || 'Receipt Image'}
            </div>
            <div style={{ fontSize: '13px', color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatMoney(transaction.amountMinor)} &nbsp;•&nbsp; {transaction.date}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPhotoPicker(true)}
            aria-label="Replace image"
            style={{ width: '44px', height: '44px', color: 'var(--color-primary)', fontSize: '22px' }}
          >
            <MdPhotoCamera />
          </button>
          <button
            onClick={() => setShowRemoveConfirm(true)}
            aria-label="Remove image"
            style={{ width: '44px', height: '44px', color: 'var(--color-expense)', fontSize: '22px' }}
          >
            <MdDelete />
          </button>
        </div>
      </div>

      {/* Main Image Area with Double Tap Zoom */}
      <div
        onDoubleClick={handleDoubleTap}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          padding: '12px'
        }}
      >
        <img
          src={imageUrl}
          alt={transaction.title || 'Receipt'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale})`,
            transition: 'transform 0.25s ease-out',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Details Footer Overlay */}
      {transaction.description && (
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            fontSize: '14px',
            color: 'var(--color-text)'
          }}
        >
          {transaction.description}
        </div>
      )}

      {/* Replace Image Picker */}
      {showPhotoPicker && (
        <PhotoPicker
          onImagePicked={handleReplaceImage}
          onClose={() => setShowPhotoPicker(false)}
        />
      )}

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 220
          }}
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '85%',
              maxWidth: '340px',
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '10px' }}>
              Remove this image?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', marginBottom: '20px' }}>
              The attached image will be detached from this transaction.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '15px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveImage}
                style={{
                  padding: '8px 14px',
                  color: 'var(--color-expense)',
                  fontWeight: 500,
                  fontSize: '15px'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

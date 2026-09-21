import React, { useState, useEffect, useRef } from 'react';
import {
  MdKeyboardArrowDown,
  MdCheck,
  MdOutlineModeEdit,
  MdImage,
  MdDeleteOutline,
  MdCategory
} from 'react-icons/md';
import { TxType, Transaction, ImageRecord } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import { parseAmountToMinor, minorToInputValue } from '../utils/money';
import { getTodayDateString, getCurrentTimeString } from '../utils/dates';
import { generateId } from '../utils/ids';
import { CategoryPicker, getCategoryIcon } from './CategoryPicker';
import { PhotoPicker } from './PhotoPicker';
import { processImageBytes } from '../services/images/processor';
import { getImageThumbnailUrl } from '../services/storage/indexedDbImages';
import { saveDraft, loadDraft, clearDraft } from '../services/storage/localStorageShards';

interface AddEditSheetProps {
  onClose: () => void;
}

interface DraftData {
  type: TxType;
  title: string;
  amount: string;
  description: string;
  categoryId: string | null;
}

export const AddEditSheet: React.FC<AddEditSheetProps> = ({ onClose }) => {
  const {
    editingTransaction,
    selectedDate,
    settings,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    showToast,
    openViewer
  } = useAppStore();

  const isEdit = Boolean(editingTransaction);

  const [type, setType] = useState<TxType>(
    editingTransaction ? editingTransaction.type : settings.defaultType
  );
  const [title, setTitle] = useState(editingTransaction ? editingTransaction.title : '');
  const [amountStr, setAmountStr] = useState(
    editingTransaction ? minorToInputValue(editingTransaction.amountMinor) : ''
  );
  const [description, setDescription] = useState(
    editingTransaction ? editingTransaction.description : ''
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    editingTransaction ? editingTransaction.categoryId : null
  );
  const [date, setDate] = useState(
    editingTransaction ? editingTransaction.date : selectedDate || getTodayDateString()
  );
  const [time, setTime] = useState(
    editingTransaction ? editingTransaction.time : getCurrentTimeString()
  );

  // Image states
  const [attachedImageBlob, setAttachedImageBlob] = useState<Blob | null>(null);
  const [attachedThumbnailUrl, setAttachedThumbnailUrl] = useState<string | null>(null);
  const [pendingImageRecord, setPendingImageRecord] = useState<ImageRecord | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sub-pickers
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const draftTimerRef = useRef<number | null>(null);

  // Load existing image if in edit mode
  useEffect(() => {
    if (editingTransaction && editingTransaction.imageId) {
      getImageThumbnailUrl(editingTransaction.imageId).then((url) => {
        if (url) {
          setAttachedThumbnailUrl(url);
        }
      });
    } else if (!isEdit) {
      // Check for saved draft
      const draft = loadDraft<DraftData>();
      if (draft) {
        setType(draft.type || settings.defaultType);
        setTitle(draft.title || '');
        setAmountStr(draft.amount || '');
        setDescription(draft.description || '');
        setCategoryId(draft.categoryId || null);
      }
    }
  }, [editingTransaction, isEdit, settings.defaultType]);

  // Debounced auto-save draft while typing (for Add mode)
  useEffect(() => {
    if (isEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    draftTimerRef.current = window.setTimeout(() => {
      if (title || amountStr || description || categoryId) {
        saveDraft({
          type,
          title,
          amount: amountStr,
          description,
          categoryId
        });
      }
    }, 300);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [type, title, amountStr, description, categoryId, isEdit]);

  const handleImagePicked = async (blob: Blob) => {
    try {
      setIsProcessingImage(true);
      setAttachedImageBlob(blob);
      const tempUrl = URL.createObjectURL(blob);
      setAttachedThumbnailUrl(tempUrl);

      // Process image in background
      const amtMinor = parseAmountToMinor(amountStr) || 0;
      const res = await processImageBytes(blob, editingTransaction ? editingTransaction.id : generateId(), {
        date,
        type,
        amountMinor: amtMinor,
        title: title || 'receipt'
      });
      setPendingImageRecord(res.record);
    } catch (e) {
      console.error('[AddEditSheet] Image processing failed:', e);
      showToast('Could not attach image');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImageBlob(null);
    setAttachedThumbnailUrl(null);
    setPendingImageRecord(null);
  };

  const handleSave = async () => {
    const minor = parseAmountToMinor(amountStr);
    if (!minor) {
      setValidationError('Enter a valid amount');
      return;
    }
    setValidationError(null);

    const now = Date.now();
    let finalImageId = editingTransaction ? editingTransaction.imageId : null;

    if (pendingImageRecord) {
      finalImageId = pendingImageRecord.id;
    } else if (!attachedThumbnailUrl && !attachedImageBlob) {
      finalImageId = null;
    }

    if (isEdit && editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        type,
        title: title.trim(),
        amountMinor: minor,
        description: description.trim(),
        categoryId,
        date,
        time,
        updatedAt: now,
        imageId: finalImageId
      };
      updateTransaction(updatedTx, pendingImageRecord || undefined);
      showToast('Saved');
    } else {
      const newTx: Transaction = {
        id: generateId(),
        type,
        title: title.trim(),
        amountMinor: minor,
        description: description.trim(),
        categoryId,
        date,
        time,
        createdAt: now,
        updatedAt: now,
        imageId: finalImageId,
        deletedAt: null
      };
      addTransaction(newTx, pendingImageRecord || undefined);
      clearDraft();
      showToast('Added');
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction) {
      deleteTransaction(editingTransaction.id);
      showToast('Transaction deleted');
      onClose();
    }
  };

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
          padding: '12px 18px calc(var(--safe-bottom) + 16px) 18px',
          maxHeight: 'calc(100vh - var(--safe-top) - 20px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sheet)'
        }}
      >
        {/* Collapse Handle Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <button
            onClick={onClose}
            aria-label="Collapse sheet"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-handle)',
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MdKeyboardArrowDown size={22} />
          </button>
        </div>

        {/* Type Selector (Segmented Pill) */}
        <div
          style={{
            display: 'flex',
            height: '46px',
            borderRadius: '24px',
            border: '2px solid var(--color-segment-border)',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          {/* Income Button */}
          <button
            onClick={() => setType('INCOME')}
            style={{
              flex: 1,
              height: '100%',
              backgroundColor: type === 'INCOME' ? 'var(--color-accent-card)' : 'transparent',
              color: 'var(--color-text)',
              fontSize: '15px',
              fontWeight: 500,
              gap: '6px'
            }}
          >
            {type === 'INCOME' && <MdCheck size={20} color="var(--color-primary)" />}
            Income (Credit)
          </button>

          {/* Expense Button */}
          <button
            onClick={() => setType('EXPENSE')}
            style={{
              flex: 1,
              height: '100%',
              backgroundColor: type === 'EXPENSE' ? 'var(--color-accent-card)' : 'transparent',
              color: 'var(--color-text)',
              fontSize: '15px',
              fontWeight: 500,
              gap: '6px'
            }}
          >
            {type === 'EXPENSE' && <MdCheck size={20} color="var(--color-primary)" />}
            Expense (Debit)
          </button>
        </div>

        {/* Row 2: Category Icon + Title + Amount + Mint Check Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
            minHeight: '48px'
          }}
        >
          {/* Category Trigger Icon */}
          <button
            onClick={() => setShowCategoryPicker(true)}
            aria-label="Select category"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: currentCategory ? currentCategory.color : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              flexShrink: 0
            }}
          >
            {currentCategory ? getCategoryIcon(currentCategory.icon, 22) : <MdCategory size={22} />}
          </button>

          {/* Title Field */}
          <div style={{ flex: 1.2, position: 'relative' }}>
            <input
              type="text"
              placeholder="Enter Text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                fontSize: '16px',
                padding: '8px 2px',
                borderBottom: '2px solid var(--color-outline)'
              }}
            />
          </div>

          {/* Amount Field */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Amount"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                if (validationError) setValidationError(null);
              }}
              style={{
                width: '100%',
                fontSize: '16px',
                padding: '8px 2px',
                borderBottom: `2px solid ${validationError ? 'var(--color-expense)' : 'var(--color-outline)'}`
              }}
            />
            {validationError && (
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  fontSize: '11px',
                  color: 'var(--color-expense)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap'
                }}
              >
                {validationError}
              </span>
            )}
          </div>

          {/* Mint Circular Check Save Button */}
          <button
            onClick={handleSave}
            aria-label="Save transaction"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              flexShrink: 0,
              fontSize: '28px'
            }}
          >
            <MdCheck />
          </button>
        </div>

        {/* Row 3: Description */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingLeft: '4px'
          }}
        >
          <MdOutlineModeEdit size={24} color="var(--color-text-dim)" />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              flex: 1,
              fontSize: '15px',
              padding: '8px 2px',
              borderBottom: '1px solid var(--color-outline)'
            }}
          />
        </div>

        {/* Row 4: Image Attachment */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingLeft: '4px'
          }}
        >
          {attachedThumbnailUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
              <img
                src={attachedThumbnailUrl}
                alt="Receipt thumbnail"
                onClick={() => {
                  if (editingTransaction) {
                    openViewer(attachedThumbnailUrl, editingTransaction);
                  }
                }}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '1px solid var(--color-outline)'
                }}
              />
              <span style={{ fontSize: '14px', color: 'var(--color-text)', flex: 1 }}>
                {isProcessingImage ? 'Compressing...' : 'Image attached'}
              </span>
              <button
                onClick={() => setShowPhotoPicker(true)}
                style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 500 }}
              >
                Change
              </button>
              <button
                onClick={handleRemoveImage}
                style={{ color: 'var(--color-expense)', fontSize: '14px', fontWeight: 500 }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPhotoPicker(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '15px',
                color: 'var(--color-text-dim)',
                padding: '6px 0'
              }}
            >
              <MdImage size={24} color="var(--color-text-dim)" />
              Add Image
            </button>
          )}
        </div>

        {/* Edit Mode Extras: Date, Time & Delete Button */}
        {isEdit && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--color-outline)',
              paddingTop: '14px',
              marginTop: '8px'
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-expense)',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <MdDeleteOutline size={20} />
              Delete
            </button>
          </div>
        )}

        {/* Sub-pickers */}
        {showCategoryPicker && (
          <CategoryPicker
            type={type}
            selectedCategoryId={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              setShowCategoryPicker(false);
            }}
            onClose={() => setShowCategoryPicker(false)}
          />
        )}

        {showPhotoPicker && (
          <PhotoPicker
            onImagePicked={handleImagePicked}
            onClose={() => setShowPhotoPicker(false)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 120
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '85%',
                maxWidth: '360px',
                backgroundColor: 'var(--color-sheet)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-menu)'
              }}
            >
              <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '12px' }}>
                Delete this transaction?
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', marginBottom: '20px' }}>
                This item will be moved to Recently Deleted for 30 days and can be restored.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '15px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px 14px',
                    color: 'var(--color-expense)',
                    fontWeight: 500,
                    fontSize: '15px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  MdKeyboardArrowDown,
  MdCheck,
  MdOutlineModeEdit,
  MdAttachFile,
  MdDeleteOutline,
  MdCategory,
  MdVisibility
} from 'react-icons/md';
import { TxType, Transaction, ImageRecord } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import { parseAmountToMinor, minorToInputValue } from '../utils/money';
import { getTodayDateString, getCurrentTimeString } from '../utils/dates';
import { generateId } from '../utils/ids';
import { CategoryPicker, getCategoryIcon } from './CategoryPicker';
import { PhotoPicker } from './PhotoPicker';
import { processAttachmentBytes } from '../services/images/processor';
import { getImageThumbnailUrl, getImageFromIdb } from '../services/storage/indexedDbImages';
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
  const processingPromiseRef = useRef<Promise<ImageRecord | null> | null>(null);
  const assignedTxIdRef = useRef<string>(editingTransaction ? editingTransaction.id : generateId());

  // Load existing thumbnail & record if editing
  useEffect(() => {
    if (editingTransaction && editingTransaction.imageId) {
      getImageThumbnailUrl(editingTransaction.imageId).then((url) => {
        if (url) setAttachedThumbnailUrl(url);
      });
      getImageFromIdb(editingTransaction.imageId).then((entry) => {
        if (entry && entry.record) {
          setPendingImageRecord(entry.record);
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

  const handleFilePicked = (blob: Blob, originalName?: string) => {
    setIsProcessingImage(true);
    setAttachedImageBlob(blob);
    const fileName = originalName || (blob instanceof File ? blob.name : 'attachment');
    const tempUrl = URL.createObjectURL(blob);
    setAttachedThumbnailUrl(tempUrl);

    const txId = assignedTxIdRef.current;
    const promise = (async () => {
      try {
        const amtMinor = parseAmountToMinor(amountStr) || 0;
        const res = await processAttachmentBytes(blob, fileName, txId, {
          date,
          type,
          amountMinor: amtMinor,
          title: title.trim() || 'attachment'
        });
        setPendingImageRecord(res.record);
        if (res.thumbnailBlob) {
          const thumbUrl = URL.createObjectURL(res.thumbnailBlob);
          setAttachedThumbnailUrl(thumbUrl);
        }
        return res.record;
      } catch (e) {
        console.error('[AddEditSheet] Attachment processing failed:', e);
        showToast('Could not attach file');
        return null;
      } finally {
        setIsProcessingImage(false);
      }
    })();

    processingPromiseRef.current = promise;
    return promise;
  };


  const handleOpenPhotoPicker = () => {
    setShowPhotoPicker(true);
  };

  const handleRemoveImage = () => {
    setAttachedImageBlob(null);
    setAttachedThumbnailUrl(null);
    setPendingImageRecord(null);
    processingPromiseRef.current = null;
  };

  const handleSave = async () => {
    const minor = parseAmountToMinor(amountStr);
    if (!minor) {
      setValidationError('Enter a valid amount');
      return;
    }
    setValidationError(null);

    // Wait for in-flight image compression & storage if user saved quickly
    let activeRecord = pendingImageRecord;
    if (processingPromiseRef.current) {
      setIsProcessingImage(true);
      const res = await processingPromiseRef.current;
      if (res) activeRecord = res;
      setIsProcessingImage(false);
    }

    const now = Date.now();
    let finalImageId = editingTransaction ? editingTransaction.imageId : null;

    if (activeRecord) {
      finalImageId = activeRecord.id;
    } else if (!attachedThumbnailUrl && !attachedImageBlob) {
      finalImageId = null;
    }

    if (isEdit && editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        type,
        title: title.trim() || 'Untitled',
        amountMinor: minor,
        description: description.trim(),
        categoryId,
        date,
        time,
        updatedAt: now,
        imageId: finalImageId
      };
      updateTransaction(updatedTx, activeRecord || undefined);
      showToast('Saved');
    } else {
      const newTx: Transaction = {
        id: assignedTxIdRef.current,
        type,
        title: title.trim() || 'Untitled',
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
      addTransaction(newTx, activeRecord || undefined);
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

          {/* Title Field with prominent white line */}
          <div style={{ flex: 1.2, position: 'relative' }}>
            <input
              type="text"
              placeholder="Enter Text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                fontSize: '16px',
                padding: '8px 4px',
                borderBottom: '2px solid rgba(255, 255, 255, 0.85)',
                color: '#ffffff',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Amount Field with prominent white line */}
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
                padding: '8px 4px',
                borderBottom: validationError ? '2px solid var(--color-expense)' : '2px solid rgba(255, 255, 255, 0.85)',
                color: '#ffffff',
                backgroundColor: 'transparent'
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

        {/* Row 3: Attachment (Photo, PDF, Excel, Document) - "First, keep the image" */}
        <div
          style={{
            marginBottom: '16px',
            paddingLeft: '4px'
          }}
        >
          {attachedThumbnailUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--color-primary)'
              }}
            >
              <div
                onClick={() => {
                  openViewer(
                    attachedThumbnailUrl,
                    editingTransaction || {
                      id: assignedTxIdRef.current,
                      type,
                      title: title || 'Attachment Preview',
                      amountMinor: parseAmountToMinor(amountStr) || 0,
                      description: description || '',
                      categoryId,
                      date,
                      time,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      imageId: pendingImageRecord ? pendingImageRecord.id : null,
                      deletedAt: null
                    },
                    pendingImageRecord || undefined
                  );
                }}
                style={{
                  position: 'relative',
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1.5px solid var(--color-primary)',
                  flexShrink: 0
                }}
              >
                <img
                  src={attachedThumbnailUrl}
                  alt="Attachment thumbnail"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <MdVisibility size={18} />
                </div>
              </div>

              <div
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => {
                  openViewer(
                    attachedThumbnailUrl,
                    editingTransaction || {
                      id: assignedTxIdRef.current,
                      type,
                      title: title || 'Attachment Preview',
                      amountMinor: parseAmountToMinor(amountStr) || 0,
                      description: description || '',
                      categoryId,
                      date,
                      time,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      imageId: pendingImageRecord ? pendingImageRecord.id : null,
                      deletedAt: null
                    },
                    pendingImageRecord || undefined
                  );
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pendingImageRecord?.originalName || (pendingImageRecord?.fileType ? `${pendingImageRecord.fileType.toUpperCase()} file` : 'Attachment')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdVisibility size={14} />
                  <span>{isProcessingImage ? 'Saving...' : 'Tap to view full screen'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleOpenPhotoPicker}
                  style={{
                    color: 'var(--color-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(23, 162, 184, 0.12)'
                  }}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    color: 'var(--color-expense)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(235, 87, 87, 0.12)'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenPhotoPicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                color: 'var(--color-primary)',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed var(--color-outline)',
                fontWeight: 500,
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <MdAttachFile size={22} color="var(--color-primary)" />
              <span>Add Attachment (Photo, PDF, Excel)</span>
            </button>
          )}
        </div>

        {/* Row 4: Description with prominent white line - "then keep the description" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingLeft: '4px'
          }}
        >
          <MdOutlineModeEdit size={24} color="rgba(255, 255, 255, 0.7)" />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              flex: 1,
              fontSize: '15px',
              padding: '8px 4px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.7)',
              color: '#ffffff',
              backgroundColor: 'transparent'
            }}
          />
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
            onFilePicked={handleFilePicked}
            onImagePicked={(blob) => handleFilePicked(blob, 'photo.jpg')}
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

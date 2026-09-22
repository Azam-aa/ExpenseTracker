import React, { useState, useEffect, useRef } from 'react';
import {
  MdKeyboardArrowDown,
  MdCheck,
  MdOutlineModeEdit,
  MdAttachFile,
  MdDeleteOutline,
  MdVisibility,
  MdAdd,
  MdClose,
  MdPictureAsPdf
} from 'react-icons/md';
import { TxType, Transaction, ImageRecord, getTransactionAttachmentIds } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import { parseAmountToMinor, minorToInputValue } from '../utils/money';
import { getTodayDateString, getCurrentTimeString } from '../utils/dates';
import { generateId } from '../utils/ids';
import { PhotoPicker } from './PhotoPicker';
import { processAttachmentBytes } from '../services/images/processor';
import { getImageThumbnailUrl, getImageFromIdb } from '../services/storage/indexedDbImages';
import { saveDraft, loadDraft, clearDraft } from '../services/storage/localStorageShards';

export interface AttachedItem {
  id: string;
  url: string;
  blob?: Blob;
  record?: ImageRecord;
  name: string;
  fileType?: string;
  isProcessing?: boolean;
}

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

  const [date, setDate] = useState(
    editingTransaction ? editingTransaction.date : selectedDate || getTodayDateString()
  );
  const [time, setTime] = useState(
    editingTransaction ? editingTransaction.time : getCurrentTimeString()
  );

  // Multi-attachment state
  const [attachedItems, setAttachedItems] = useState<AttachedItem[]>([]);

  // Sub-pickers
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const draftTimerRef = useRef<number | null>(null);
  const inFlightPromisesRef = useRef<Map<string, Promise<ImageRecord | null>>>(new Map());
  const assignedTxIdRef = useRef<string>(editingTransaction ? editingTransaction.id : generateId());

  // Handle switching Income/Expense
  const handleTypeChange = (newType: TxType) => {
    setType(newType);
  };

  // Load existing thumbnail & record if editing
  useEffect(() => {
    if (editingTransaction) {
      const attIds = getTransactionAttachmentIds(editingTransaction);
      if (attIds.length > 0) {
        Promise.all(
          attIds.map(async (id) => {
            const entry = await getImageFromIdb(id);
            const thumbUrl = await getImageThumbnailUrl(id);
            if (thumbUrl) {
              return {
                id,
                url: thumbUrl,
                blob: entry?.blob,
                record: entry?.record,
                name: entry?.record?.originalName || entry?.record?.fileName || 'Attachment',
                fileType: entry?.record?.fileType || 'image',
                isProcessing: false
              } as AttachedItem;
            }
            return null;
          })
        ).then((items) => {
          const valid = items.filter((it): it is AttachedItem => it !== null);
          setAttachedItems(valid);
        });
      }
    } else if (!isEdit) {
      // Check for saved draft
      const draft = loadDraft<DraftData>();
      if (draft) {
        setType(draft.type || settings.defaultType);
        setTitle(draft.title || '');
        setAmountStr(draft.amount || '');
        setDescription(draft.description || '');
      }
    }
  }, [editingTransaction, isEdit, settings.defaultType]);

  // Debounced auto-save draft while typing (for Add mode)
  useEffect(() => {
    if (isEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    draftTimerRef.current = window.setTimeout(() => {
      if (title || amountStr || description) {
        saveDraft({
          type,
          title,
          amount: amountStr,
          description,
          categoryId: null
        });
      }
    }, 300);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [type, title, amountStr, description, isEdit]);

  const processAndAddFile = (blob: Blob, originalName?: string) => {
    const fileName = originalName || (blob instanceof File ? blob.name : 'photo.jpg');
    const tempUrl = URL.createObjectURL(blob);
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';

    const newItem: AttachedItem = {
      id: tempId,
      url: tempUrl,
      blob,
      name: fileName,
      fileType: isPdf ? 'pdf' : 'image',
      isProcessing: true
    };

    setAttachedItems((prev) => [...prev, newItem]);

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

        setAttachedItems((prev) =>
          prev.map((it) =>
            it.id === tempId
              ? {
                  ...it,
                  id: res.record.id,
                  record: res.record,
                  url: res.thumbnailBlob ? URL.createObjectURL(res.thumbnailBlob) : it.url,
                  isProcessing: false
                }
              : it
          )
        );
        return res.record;
      } catch (e) {
        console.error('[AddEditSheet] Attachment processing failed:', e);
        showToast('Could not attach file');
        setAttachedItems((prev) => prev.filter((it) => it.id !== tempId));
        return null;
      } finally {
        inFlightPromisesRef.current.delete(tempId);
      }
    })();

    inFlightPromisesRef.current.set(tempId, promise);
  };

  const handleMultiplePicked = (files: Array<{ blob: Blob; name: string }>) => {
    files.forEach((f) => processAndAddFile(f.blob, f.name));
  };

  const handleSinglePicked = (file: File | Blob, name: string) => {
    processAndAddFile(file, name);
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setAttachedItems((prev) => prev.filter((it) => it.id !== idToRemove));
    inFlightPromisesRef.current.delete(idToRemove);
  };

  const handleOpenPhotoPicker = () => {
    setShowPhotoPicker(true);
  };

  const handleSave = async () => {
    const minor = parseAmountToMinor(amountStr);
    if (!minor) {
      setValidationError('Enter a valid amount');
      return;
    }
    setValidationError(null);

    // Wait for in-flight image processing if user saved quickly
    if (inFlightPromisesRef.current.size > 0) {
      await Promise.all(Array.from(inFlightPromisesRef.current.values()));
    }

    const now = Date.now();
    const finalAttachmentIds = attachedItems.map((it) => it.id).filter((id) => !id.startsWith('temp_'));
    const finalImageId = finalAttachmentIds.length > 0 ? finalAttachmentIds[0] : null;
    const recordsToSave = attachedItems.map((it) => it.record).filter((r): r is ImageRecord => Boolean(r));

    if (isEdit && editingTransaction) {
      const updatedTx: Transaction = {
        ...editingTransaction,
        type,
        title: title.trim() || 'Untitled',
        amountMinor: minor,
        description: description.trim(),
        categoryId: null,
        date,
        time,
        updatedAt: now,
        imageId: finalImageId,
        attachmentIds: finalAttachmentIds
      };
      updateTransaction(updatedTx, recordsToSave);
      showToast('Saved');
    } else {
      const newTx: Transaction = {
        id: assignedTxIdRef.current,
        type,
        title: title.trim() || 'Untitled',
        amountMinor: minor,
        description: description.trim(),
        categoryId: null,
        date,
        time,
        createdAt: now,
        updatedAt: now,
        imageId: finalImageId,
        attachmentIds: finalAttachmentIds,
        deletedAt: null
      };
      addTransaction(newTx, recordsToSave);
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
            onClick={() => handleTypeChange('INCOME')}
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
            Income
          </button>

          {/* Expense Button */}
          <button
            onClick={() => handleTypeChange('EXPENSE')}
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
            Expense
          </button>
        </div>

        {/* Row 2: Title + Amount + Mint Check Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
            minHeight: '48px'
          }}
        >
          {/* Title Field with prominent white line */}
          <div style={{ flex: 1.4, position: 'relative' }}>
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

        {/* Row 3: Attachment (Photo, PDF) - "First, keep the image" */}
        <div
          style={{
            marginBottom: '16px',
            paddingLeft: '4px'
          }}
        >
          {attachedItems.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--color-primary)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const syntheticTx: Transaction = editingTransaction || {
                      id: assignedTxIdRef.current,
                      type,
                      title: title || 'Attachment Preview',
                      amountMinor: parseAmountToMinor(amountStr) || 0,
                      description: description || '',
                      categoryId: null,
                      date,
                      time,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      imageId: attachedItems[0].id,
                      attachmentIds: attachedItems.map((a) => a.id),
                      deletedAt: null
                    };
                    openViewer(attachedItems[0].url, syntheticTx, attachedItems[0].record, 0, attachedItems.map((a) => a.id));
                  }}
                  style={{
                    flex: 1,
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(23, 162, 184, 0.2)',
                    border: '1.5px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <MdVisibility size={20} />
                  <span>View Document {attachedItems.length > 1 ? `(${attachedItems.length})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenPhotoPicker}
                  aria-label="Add more attachments"
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--color-text)',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <MdAdd size={16} color="var(--color-primary)" />
                  <span>Add More</span>
                </button>
              </div>

              {/* Horizontal Scrollable Thumbnails Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '4px 2px 8px 2px',
                  scrollbarWidth: 'none'
                }}
              >
                {attachedItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      position: 'relative',
                      width: '64px',
                      height: '64px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1.5px solid var(--color-primary)',
                      backgroundColor: '#121212',
                      cursor: 'pointer'
                    }}
                  >
                    {item.fileType === 'pdf' ? (
                      <div
                        onClick={() => {
                          const syntheticTx: Transaction = editingTransaction || {
                            id: assignedTxIdRef.current,
                            type,
                            title: title || 'Attachment Preview',
                            amountMinor: parseAmountToMinor(amountStr) || 0,
                            description: description || '',
                            categoryId: null,
                            date,
                            time,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            imageId: item.id,
                            attachmentIds: attachedItems.map((a) => a.id),
                            deletedAt: null
                          };
                          openViewer(item.url, syntheticTx, item.record, idx, attachedItems.map((a) => a.id));
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#e53935',
                          fontSize: '10px'
                        }}
                      >
                        <MdPictureAsPdf size={28} />
                        <span style={{ color: '#fff', fontSize: '9px', marginTop: '2px', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name}
                        onClick={() => {
                          const syntheticTx: Transaction = editingTransaction || {
                            id: assignedTxIdRef.current,
                            type,
                            title: title || 'Attachment Preview',
                            amountMinor: parseAmountToMinor(amountStr) || 0,
                            description: description || '',
                            categoryId: null,
                            date,
                            time,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            imageId: item.id,
                            attachmentIds: attachedItems.map((a) => a.id),
                            deletedAt: null
                          };
                          openViewer(item.url, syntheticTx, item.record, idx, attachedItems.map((a) => a.id));
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    {/* Remove button (X) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAttachment(item.id);
                      }}
                      aria-label="Remove attachment"
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <MdClose size={14} />
                    </button>

                    {item.isProcessing && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      >
                        Saving...
                      </div>
                    )}
                  </div>
                ))}

                {/* Card to add another item directly in strip */}
                <button
                  type="button"
                  onClick={handleOpenPhotoPicker}
                  aria-label="Add another attachment"
                  style={{
                    width: '64px',
                    height: '64px',
                    flexShrink: 0,
                    borderRadius: '10px',
                    border: '1.5px dashed var(--color-outline)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <MdAdd size={22} />
                  <span style={{ fontSize: '10px', fontWeight: 500 }}>Add</span>
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
              <span>Attach Photo or Document</span>
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

        {showPhotoPicker && (
          <PhotoPicker
            onFilePicked={handleSinglePicked}
            onImagePicked={(blob) => handleSinglePicked(blob, 'photo.jpg')}
            onMultiplePicked={handleMultiplePicked}
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

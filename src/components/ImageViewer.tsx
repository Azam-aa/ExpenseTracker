import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Transaction, ImageRecord, getTransactionAttachmentIds } from '../models/types';
import { formatMoney } from '../utils/money';
import {
  MdArrowBack,
  MdDelete,
  MdAttachFile,
  MdOpenInNew,
  MdShare,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import { PhotoPicker } from './PhotoPicker';
import { processAttachmentBytes, blobToBase64 } from '../services/images/processor';
import { getImageFromIdb } from '../services/storage/indexedDbImages';
import { useAppStore } from '../store/useAppStore';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface ImageViewerProps {
  imageUrl: string;
  transaction: Transaction;
  imageRecord?: ImageRecord | null;
  initialIndex?: number;
  allAttachmentIds?: string[];
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  transaction,
  imageRecord,
  initialIndex = 0,
  allAttachmentIds,
  onClose
}) => {
  const { updateTransaction, showToast } = useAppStore();
  const [scale, setScale] = useState(1);
  const [showPicker, setShowPicker] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Determine list of attachment IDs
  const rawIds = allAttachmentIds && allAttachmentIds.length > 0
    ? allAttachmentIds
    : getTransactionAttachmentIds(transaction);
  const [attachmentIds, setAttachmentIds] = useState<string[]>(rawIds);
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialIndex >= 0 && initialIndex < rawIds.length) return initialIndex;
    return 0;
  });

  const currentId = attachmentIds[currentIndex] || transaction.imageId || null;

  const [record, setRecord] = useState<ImageRecord | null>(imageRecord || null);
  const [fullBlob, setFullBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>(imageUrl);
  const [excelRows, setExcelRows] = useState<any[][] | null>(null);

  // Load active attachment whenever currentId changes
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setScale(1);

    if (currentId) {
      getImageFromIdb(currentId).then(async (entry) => {
        if (!active || !entry) return;
        setRecord(entry.record);
        setFullBlob(entry.blob);

        if (entry.dataUrl) {
          setBlobUrl(entry.dataUrl);
        } else if (entry.blob) {
          createdUrl = URL.createObjectURL(entry.blob);
          setBlobUrl(createdUrl);
        }

        const isExcel =
          entry.record.fileType === 'excel' ||
          /\.(xlsx|xls|csv)$/i.test(entry.record.fileName) ||
          entry.record.mime?.includes('spreadsheet') ||
          entry.record.mime?.includes('excel');

        if (isExcel) {
          try {
            const buf = await entry.blob.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            if (sheet) {
              const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              if (active) setExcelRows(rows.slice(0, 60));
            }
          } catch (e) {
            console.warn('[Viewer] Could not parse Excel for preview:', e);
          }
        }
      });
    }

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [currentId]);

  const handleDoubleTap = () => {
    setScale((prev) => (prev > 1.2 ? 1 : 2.2));
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < attachmentIds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRemoveImage = () => {
    if (!currentId) {
      onClose();
      return;
    }
    const nextIds = attachmentIds.filter((id) => id !== currentId);
    setAttachmentIds(nextIds);
    const nextPrimaryId = nextIds.length > 0 ? nextIds[0] : null;

    updateTransaction({
      ...transaction,
      imageId: nextPrimaryId,
      attachmentIds: nextIds,
      updatedAt: Date.now()
    });

    showToast('Attachment removed');
    if (nextIds.length === 0) {
      onClose();
    } else {
      setShowRemoveConfirm(false);
      setCurrentIndex((prev) => Math.min(prev, nextIds.length - 1));
    }
  };

  const handleReplaceAttachment = async (fileOrBlob: Blob, originalName?: string) => {
    try {
      const fileName = originalName || (fileOrBlob instanceof File ? fileOrBlob.name : 'attachment');
      const res = await processAttachmentBytes(fileOrBlob, fileName, transaction.id, {
        date: transaction.date,
        type: transaction.type,
        amountMinor: transaction.amountMinor,
        title: transaction.title || 'attachment'
      });

      const nextIds = [...attachmentIds];
      if (currentIndex >= 0 && currentIndex < nextIds.length) {
        nextIds[currentIndex] = res.record.id;
      } else {
        nextIds.push(res.record.id);
      }
      setAttachmentIds(nextIds);

      updateTransaction(
        {
          ...transaction,
          imageId: nextIds[0],
          attachmentIds: nextIds,
          updatedAt: Date.now()
        },
        res.record
      );
      showToast('Attachment replaced');
      setShowPicker(false);
    } catch {
      showToast('Could not replace attachment');
    }
  };

  const handleOpenWithApp = async () => {
    if (!fullBlob) {
      window.open(blobUrl, '_blank');
      return;
    }

    try {
      const ext = record?.fileType === 'pdf' ? 'pdf' : record?.fileType === 'excel' ? 'xlsx' : 'jpg';
      const cleanName = record?.fileName || `attachment_${transaction.id}.${ext}`;

      if (Capacitor.isNativePlatform()) {
        const b64 = await blobToBase64(fullBlob);
        await Filesystem.writeFile({
          directory: Directory.Cache,
          path: cleanName,
          data: b64
        });

        const uriRes = await Filesystem.getUri({
          directory: Directory.Cache,
          path: cleanName
        });

        await Share.share({
          title: cleanName,
          url: uriRes.uri,
          dialogTitle: 'Open with phone app'
        });
      } else {
        const url = URL.createObjectURL(fullBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = cleanName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('[Viewer] Open with app failed:', err);
      showToast('Could not open file in external app');
    }
  };

  const isIncome = transaction.type === 'INCOME';
  const fileType = record?.fileType || (record?.mime === 'application/pdf' ? 'pdf' : 'image');

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
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          borderBottom: '1px solid var(--color-outline)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <button
            onClick={onClose}
            aria-label="Back"
            style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px', flexShrink: 0 }}
          >
            <MdArrowBack />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record?.originalName || transaction.title || 'Attachment'}
              {attachmentIds.length > 1 && (
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', marginLeft: '6px' }}>
                  ({currentIndex + 1}/{attachmentIds.length})
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatMoney(transaction.amountMinor)} &nbsp;•&nbsp; {transaction.date}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={handleOpenWithApp}
            title="Open in Phone App"
            aria-label="Open in external app"
            style={{ width: '40px', height: '40px', color: 'var(--color-primary)', fontSize: '22px' }}
          >
            <MdOpenInNew />
          </button>
          <button
            onClick={handleOpenWithApp}
            title="Share"
            aria-label="Share file"
            style={{ width: '40px', height: '40px', color: 'var(--color-text)', fontSize: '20px' }}
          >
            <MdShare />
          </button>
          <button
            onClick={() => setShowPicker(true)}
            title="Replace Attachment"
            aria-label="Replace attachment"
            style={{ width: '40px', height: '40px', color: 'var(--color-primary)', fontSize: '22px' }}
          >
            <MdAttachFile />
          </button>
          <button
            onClick={() => setShowRemoveConfirm(true)}
            title="Remove"
            aria-label="Remove attachment"
            style={{ width: '40px', height: '40px', color: 'var(--color-expense)', fontSize: '22px' }}
          >
            <MdDelete />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121212'
        }}
      >
        {fileType === 'pdf' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>PDF Document Preview</span>
              <button
                onClick={handleOpenWithApp}
                style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}
              >
                Open with phone PDF viewer
              </button>
            </div>
            <iframe
              src={blobUrl}
              title="PDF Document"
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        ) : fileType === 'excel' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>Spreadsheet Preview</span>
              <button
                onClick={handleOpenWithApp}
                style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}
              >
                Open with Excel app
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
              {excelRows && excelRows.length > 0 ? (
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', color: '#e0e0e0' }}>
                  <tbody>
                    {excelRows.map((row, rIdx) => (
                      <tr key={rIdx} style={{ backgroundColor: rIdx === 0 ? 'rgba(255,255,255,0.1)' : rIdx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                        {Array.isArray(row) &&
                          row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              style={{
                                border: '1px solid rgba(255,255,255,0.15)',
                                padding: '6px 10px',
                                whiteSpace: 'nowrap',
                                fontWeight: rIdx === 0 ? 600 : 400
                              }}
                            >
                              {cell !== undefined && cell !== null ? String(cell) : ''}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                  Loading spreadsheet data...
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Standard Image Viewer with Double Tap Zoom */
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
              data-testid="viewer-main-image"
              src={blobUrl}
              alt={transaction.title || 'Attachment'}
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
        )}

        {/* Previous Navigation Arrow (Multi-attachment) */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            aria-label="Previous attachment"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            <MdChevronLeft size={30} />
          </button>
        )}

        {/* Next Navigation Arrow (Multi-attachment) */}
        {currentIndex < attachmentIds.length - 1 && (
          <button
            onClick={handleNext}
            aria-label="Next attachment"
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            <MdChevronRight size={30} />
          </button>
        )}
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

      {/* Replace Attachment Picker */}
      {showPicker && (
        <PhotoPicker
          onFilePicked={handleReplaceAttachment}
          onImagePicked={(b) => handleReplaceAttachment(b, 'photo.jpg')}
          onClose={() => setShowPicker(false)}
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
              Remove this attachment?
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', marginBottom: '20px' }}>
              {attachmentIds.length > 1
                ? `Attachment ${currentIndex + 1} of ${attachmentIds.length} will be detached from this transaction.`
                : 'The attached file will be detached from this transaction.'}
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

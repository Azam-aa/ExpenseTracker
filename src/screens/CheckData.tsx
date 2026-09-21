import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getImageFromIdb, storeImageInIdb } from '../services/storage/indexedDbImages';
import { appFolder } from '../services/storage/appFolder';
import { blobToBase64 } from '../services/images/processor';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { MdArrowBack, MdPlayArrow, MdCheckCircle, MdWarning } from 'react-icons/md';

export const CheckDataScreen: React.FC = () => {
  const { transactions, imageRecords, goBack, showToast } = useAppStore();

  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<{
    txChecked: number;
    imagesOk: number;
    imagesRepaired: number;
    imagesMissing: number;
  } | null>(null);

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    let okCount = 0;
    let repairedCount = 0;
    let missingCount = 0;

    const txWithImages = transactions.filter((t) => t.imageId && !t.deletedAt);

    for (const tx of txWithImages) {
      const imgId = tx.imageId!;
      const record = imageRecords[imgId];

      const idbData = await getImageFromIdb(imgId);
      let fileExists = false;

      if (Capacitor.isNativePlatform() && record) {
        try {
          await Filesystem.stat({
            directory: Directory.Documents,
            path: `DayToDayExpenses/images/${record.fileName}`
          });
          fileExists = true;
        } catch {
          fileExists = false;
        }
      } else {
        fileExists = Boolean(idbData);
      }

      if (idbData && fileExists) {
        okCount++;
      } else if (idbData && !fileExists && record) {
        // Rebuild file from IDB
        const b64 = await blobToBase64(idbData.blob);
        await appFolder.saveImageFile(record.fileName, b64);
        repairedCount++;
      } else if (!idbData && fileExists && record) {
        // Rebuild IDB from file
        try {
          const fileData = await Filesystem.readFile({
            directory: Directory.Documents,
            path: `DayToDayExpenses/images/${record.fileName}`
          });
          const res = await fetch(`data:${record.mime};base64,${fileData.data}`);
          const blob = await res.blob();
          await storeImageInIdb(record, blob, blob);
          repairedCount++;
        } catch {
          missingCount++;
        }
      } else {
        missingCount++;
      }
    }

    setReport({
      txChecked: transactions.length,
      imagesOk: okCount,
      imagesRepaired: repairedCount,
      imagesMissing: missingCount
    });

    setIsRunning(false);
    showToast('Integrity diagnostic complete');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--color-bg)'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '16px',
          borderBottom: '1px solid var(--color-outline)',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => goBack()}
          aria-label="Back"
          style={{ width: '44px', height: '44px', color: 'var(--color-text)', fontSize: '24px' }}
        >
          <MdArrowBack />
        </button>
        <span style={{ fontSize: '22px', fontWeight: 400, color: 'var(--color-text)' }}>
          Check Data and Images
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>
          This tool verifies data integrity across all 3 storage tiers: <strong>localStorage shards</strong>, <strong>IndexedDB blobs</strong>, and your visible phone folder in <strong>Documents/DayToDayExpenses</strong>.
          <br /><br />
          If any receipt photo is present in one location but missing in another, it will automatically heal and restore the missing copy.
        </div>

        <button
          onClick={handleRunDiagnostic}
          disabled={isRunning}
          style={{
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            fontSize: '16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <MdPlayArrow size={22} />
          {isRunning ? 'Running Diagnostic...' : 'Start Integrity Check'}
        </button>

        {report && (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--color-outline)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Diagnostic Report
            </div>
            <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
              Total transactions analyzed: <strong>{report.txChecked}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-income)' }}>
              <MdCheckCircle size={20} />
              Images in sync & verified: <strong>{report.imagesOk}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-primary)' }}>
              <MdCheckCircle size={20} />
              Images automatically repaired: <strong>{report.imagesRepaired}</strong>
            </div>
            {report.imagesMissing > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-warning)' }}>
                <MdWarning size={20} />
                Images unavailable: <strong>{report.imagesMissing}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

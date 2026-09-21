import React, { useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  MdCameraAlt,
  MdPhotoLibrary,
  MdPictureAsPdf,
  MdTableChart,
  MdInsertDriveFile,
  MdClose
} from 'react-icons/md';

export interface AttachmentPickerProps {
  onFilePicked: (file: File | Blob, originalName: string) => void;
  onImagePicked?: (blob: Blob) => void;
  onClose: () => void;
}

export const PhotoPicker: React.FC<AttachmentPickerProps> = ({
  onFilePicked,
  onImagePicked,
  onClose
}) => {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const anyFileInputRef = useRef<HTMLInputElement | null>(null);

  const deliverFile = (blob: Blob, name: string) => {
    if (onFilePicked) {
      onFilePicked(blob, name);
    } else if (onImagePicked) {
      onImagePicked(blob);
    }
    onClose();
  };

  const handleTakePhoto = () => {
    if (!Capacitor.isNativePlatform()) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
      return;
    }

    Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: false
    })
      .then(async (photo) => {
        if (photo.webPath) {
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          deliverFile(blob, 'camera_photo.jpg');
        }
      })
      .catch((e) => {
        console.warn('[Camera] User cancelled or error:', e);
        onClose();
      });
  };

  const handleChooseGallery = () => {
    if (!Capacitor.isNativePlatform()) {
      if (galleryInputRef.current) {
        galleryInputRef.current.click();
      }
      return;
    }

    Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    })
      .then(async (photo) => {
        if (photo.webPath) {
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          deliverFile(blob, 'gallery_photo.jpg');
        }
      })
      .catch((e) => {
        console.warn('[Gallery] User cancelled or error:', e);
        onClose();
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      deliverFile(file, file.name);
    }
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 250
      }}
      onClick={onClose}
    >
      {/* Hidden file inputs for distinct file filters */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        data-testid="camera-input"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        data-testid="gallery-input"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf,.pdf"
        data-testid="pdf-input"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <input
        type="file"
        ref={excelInputRef}
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        data-testid="excel-input"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <input
        type="file"
        ref={anyFileInputRef}
        accept="*/*"
        data-testid="any-file-input"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: 'var(--color-sheet)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '18px 16px calc(var(--safe-bottom) + 20px) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', padding: '0 8px 6px 8px' }}>
          Attach Receipt or Document
        </div>

        {/* 1. Camera */}
        <button
          onClick={handleTakePhoto}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '15px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdCameraAlt size={24} color="var(--color-primary)" />
          Take Photo (Camera)
        </button>

        {/* 2. Gallery */}
        <button
          onClick={handleChooseGallery}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '15px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdPhotoLibrary size={24} color="#64b5f6" />
          Choose Photo from Gallery
        </button>

        {/* 3. PDF Document */}
        <button
          onClick={() => pdfInputRef.current?.click()}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '15px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdPictureAsPdf size={24} color="#e57373" />
          Attach PDF Document (.pdf)
        </button>

        {/* 4. Excel / Spreadsheet */}
        <button
          onClick={() => excelInputRef.current?.click()}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '15px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdTableChart size={24} color="#81c784" />
          Attach Excel / Spreadsheet (.xlsx, .csv)
        </button>

        {/* 5. Any Document */}
        <button
          onClick={() => anyFileInputRef.current?.click()}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '15px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdInsertDriveFile size={24} color="#ba68c8" />
          Attach Any Document / File
        </button>

        <button
          onClick={onClose}
          style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '15px',
            color: 'var(--color-text-dim)',
            marginTop: '4px'
          }}
        >
          <MdClose size={20} />
          Cancel
        </button>
      </div>
    </div>
  );
};

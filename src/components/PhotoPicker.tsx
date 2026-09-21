import React from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { MdCameraAlt, MdPhotoLibrary, MdClose } from 'react-icons/md';

interface PhotoPickerProps {
  onImagePicked: (blob: Blob) => void;
  onClose: () => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({ onImagePicked, onClose }) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTakePhoto = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: false // As required in 8.5, do not clutter phone gallery
        });

        if (photo.webPath) {
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          onImagePicked(blob);
          onClose();
        }
      } else {
        // Fallback for desktop/browser
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('capture');
          fileInputRef.current.click();
        }
      }
    } catch (e) {
      console.warn('[Camera] User cancelled or error:', e);
      onClose();
    }
  };

  const handleChooseGallery = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos
        });

        if (photo.webPath) {
          const res = await fetch(photo.webPath);
          const blob = await res.blob();
          onImagePicked(blob);
          onClose();
        }
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('capture');
          fileInputRef.current.click();
        }
      }
    } catch (e) {
      console.warn('[Gallery] User cancelled or error:', e);
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImagePicked(file);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 110
      }}
      onClick={onClose}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: 'var(--color-sheet)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '16px 16px calc(var(--safe-bottom) + 20px) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <button
          onClick={handleTakePhoto}
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '16px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdCameraAlt size={24} color="var(--color-primary)" />
          Take Photo
        </button>

        <button
          onClick={handleChooseGallery}
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 16px',
            fontSize: '16px',
            color: 'var(--color-text)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <MdPhotoLibrary size={24} color="var(--color-primary)" />
          Choose from Gallery
        </button>

        <button
          onClick={onClose}
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '16px',
            color: 'var(--color-text-dim)',
            marginTop: '8px'
          }}
        >
          <MdClose size={20} />
          Cancel
        </button>
      </div>
    </div>
  );
};

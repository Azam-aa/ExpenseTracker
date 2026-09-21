import React from 'react';
import { MdCloudUpload, MdSearch, MdMoreVert } from 'react-icons/md';
import { useAppStore } from '../store/useAppStore';

export const TopBar: React.FC = () => {
  const { isMenuOpen, openMenu, closeMenu, navigate } = useAppStore();

  const handleCloudClick = () => {
    useAppStore.setState({ activeSheet: 'CLOUD_BACKUP' });
  };

  const handleSearchClick = () => {
    navigate('SEARCH');
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return (
    <div
      style={{
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        backgroundColor: 'var(--color-bg)',
        borderBottom: 'none',
        flexShrink: 0
      }}
    >
      <div
        style={{
          fontSize: '17px',
          fontWeight: 500,
          color: 'var(--color-text)',
          letterSpacing: '0.2px'
        }}
      >
        Day to Day Expenses
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleCloudClick}
          aria-label="Local backup and export"
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--color-text-dim)',
            fontSize: '24px'
          }}
        >
          <MdCloudUpload />
        </button>

        <button
          onClick={handleSearchClick}
          aria-label="Search transactions"
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--color-text-dim)',
            fontSize: '24px'
          }}
        >
          <MdSearch />
        </button>

        <button
          onClick={handleMenuClick}
          aria-label="More options"
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--color-text-dim)',
            fontSize: '24px'
          }}
        >
          <MdMoreVert />
        </button>
      </div>
    </div>
  );
};

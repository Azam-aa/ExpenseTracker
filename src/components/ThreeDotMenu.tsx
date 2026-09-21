import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const ThreeDotMenu: React.FC = () => {
  const { isMenuOpen, closeMenu, navigate } = useAppStore();

  useEffect(() => {
    const handleOutside = () => {
      if (isMenuOpen) closeMenu();
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [isMenuOpen, closeMenu]);

  if (!isMenuOpen) return null;

  const handleItemClick = (screen: 'CHARTS' | 'HELP' | 'SETTINGS') => {
    closeMenu();
    navigate(screen);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '60px',
        right: '12px',
        width: '180px',
        backgroundColor: 'var(--color-menu)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-menu)',
        border: '1px solid var(--color-outline)',
        zIndex: 150,
        overflow: 'hidden',
        padding: '6px 0'
      }}
    >
      <button
        onClick={() => handleItemClick('CHARTS')}
        style={{
          width: '100%',
          height: '48px',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--color-text)',
          textAlign: 'left'
        }}
      >
        Charts
      </button>

      <button
        onClick={() => handleItemClick('HELP')}
        style={{
          width: '100%',
          height: '48px',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--color-text)',
          textAlign: 'left'
        }}
      >
        Help and Feedback
      </button>

      <button
        onClick={() => handleItemClick('SETTINGS')}
        style={{
          width: '100%',
          height: '48px',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--color-text)',
          textAlign: 'left'
        }}
      >
        Settings
      </button>
    </div>
  );
};

import React from 'react';

interface FabProps {
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}

export const Fab: React.FC<FabProps> = ({ icon, onClick, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--safe-bottom) + 18px)',
        right: '18px',
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        backgroundColor: 'var(--color-fab)',
        color: 'var(--color-on-fab)',
        fontSize: '28px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      {icon}
    </button>
  );
};

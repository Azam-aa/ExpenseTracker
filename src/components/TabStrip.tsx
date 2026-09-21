import React from 'react';
import { MdEdit } from 'react-icons/md';
import { TabType } from '../models/types';
import { useAppStore } from '../store/useAppStore';

const TABS: { id: TabType; label?: string; icon?: React.ReactNode }[] = [
  { id: 'NOTES', icon: <MdEdit size={22} /> },
  { id: 'DAILY', label: 'Daily' },
  { id: 'MONTHLY', label: 'Monthly' },
  { id: 'YEARLY', label: 'Yearly' }
];

export const TabStrip: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--color-bg)',
        borderBottom: '2px solid var(--color-outline)',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', width: '100%', height: '48px' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label || 'Notes'}
              data-tab={tab.id}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text)',
                fontSize: '14px',
                fontWeight: 500,
                position: 'relative',
                height: '100%'
              }}
            >
              {tab.icon ? tab.icon : tab.label}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '2px 2px 0 0'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

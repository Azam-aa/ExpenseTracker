import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  MdArrowBack,
  MdPlayCircleOutline,
  MdStars,
  MdWbSunny,
  MdShare,
  MdLockOutline,
  MdEmail,
  MdFormatListNumbered,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';

export const HelpScreen: React.FC = () => {
  const { goBack, showToast } = useAppStore();
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'HOW_TO_USE' | 'WHATS_NEW' | 'FAQ' | 'PRIVACY'
  >('NONE');

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleShare = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Daily Expenses',
          text: 'Daily Expenses - A private, completely offline expense tracker with receipt attachments and local safety backups.',
          dialogTitle: 'Share App'
        });
      } else {
        await navigator.clipboard.writeText(
          'Daily Expenses - 100% Offline Expense Tracker'
        );
        showToast('App info copied to clipboard');
      }
    } catch {
      // User cancelled
    }
  };

  const handleContactUs = () => {
    window.location.href = 'tel:+919008713616';
    showToast('Developer: Azam Pasha (+91-9008713616)');
  };

  const FAQ_ITEMS = [
    {
      q: 'What happens if I delete photos from my phone gallery or WhatsApp?',
      a: 'Your receipts in Day to Day Expenses are completely safe! When you attach an image, the app compresses and saves its own independent copy directly inside the app database and in Documents/DayToDayExpenses/images. Deleting or cleaning photos in your gallery, WhatsApp, or Downloads has ZERO effect on this app.'
    },
    {
      q: 'Where is my backup folder located?',
      a: 'All automatic safety copies, snapshots, receipts, and export files are kept in your phone visible folder at Documents/DayToDayExpenses. You can view or copy this folder using the phone Files app or by connecting your phone to a PC.'
    },
    {
      q: 'How do I restore my data if I reinstall the app?',
      a: 'Whenever you open the app after a fresh install, it automatically looks for Documents/DayToDayExpenses. If saved data is found, it will ask if you want to restore it. You can also go to Settings > Backup and export > Restore from file at any time to pick a .zip or .json backup.'
    },
    {
      q: 'Does this app send any data over the internet?',
      a: 'No! This app is 100% offline. It has no remote servers, no tracking, no analytics, no ads, and no user accounts. Your financial information never leaves your device.'
    }
  ];

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
          Help and Feedback
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* 1. How to use */}
        <div
          onClick={() => setActiveModal('HOW_TO_USE')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdPlayCircleOutline size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              How to use
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Illustrated guide to tracking expenses and receipts.
            </div>
          </div>
        </div>

        {/* 2. What's new */}
        <div
          onClick={() => setActiveModal('WHATS_NEW')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdStars size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              What's new
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Offline durability, receipt attachments, Samsung safe areas.
            </div>
          </div>
        </div>

        {/* 3. Frequently asked questions */}
        <div
          onClick={() => setActiveModal('FAQ')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdWbSunny size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Frequently asked questions
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Gallery deletion safety, backups, and data protection.
            </div>
          </div>
        </div>

        {/* 4. Share */}
        <div
          onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdShare size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Share
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Share this offline expense tracker with family and friends.
            </div>
          </div>
        </div>

        {/* 5. Privacy policy */}
        <div
          onClick={() => setActiveModal('PRIVACY')}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdLockOutline size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Privacy policy
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              100% offline. Zero remote tracking or servers.
            </div>
          </div>
        </div>

        {/* 6. Contact Us */}
        <div
          onClick={handleContactUs}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px', cursor: 'pointer' }}
        >
          <MdEmail size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Contact Us
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Send an email to support.
            </div>
          </div>
        </div>

        {/* 7. App Version */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '64px' }}>
          <MdFormatListNumbered size={28} color="var(--color-text-dim)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
              Daily Expenses v1.0.0
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Developer: Azam Pasha (+91-9008713616)
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialogs */}
      {activeModal !== 'NONE' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '20px'
          }}
          onClick={() => setActiveModal('NONE')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '440px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            {activeModal === 'HOW_TO_USE' && (
              <div>
                <h3 style={{ marginBottom: '12px', color: 'var(--color-text)' }}>How to use</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  <strong>Adding an expense or income:</strong> Tap the green '+' button on the Daily tab. Choose Income or Expense, enter text and amount, select a category, and optionally attach a receipt photo. Tap the mint checkmark to save.
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  <strong>Editing & Deleting:</strong> Long press any row to edit or delete it. Single tap opens the details sheet.
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  <strong>Monthly & Yearly Reports:</strong> View cards grouped by date in the Monthly tab or year summary in the Yearly tab. Tap the PDF button to export printable reports.
                </p>
              </div>
            )}

            {activeModal === 'WHATS_NEW' && (
              <div>
                <h3 style={{ marginBottom: '12px', color: 'var(--color-text)' }}>What's New in v1.0.0</h3>
                <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-dim)', paddingLeft: '18px' }}>
                  <li><strong>Receipt Image Attachments:</strong> Attach crisp receipts with camera or gallery photos.</li>
                  <li><strong>Crash-Proof Safety System:</strong> Visible phone folder with rotating snapshots and 30-day trash recovery.</li>
                  <li><strong>Full Screen Image Viewer:</strong> Double-tap zoom, replace, and pan.</li>
                  <li><strong>Edge-to-Edge Android Safe Areas:</strong> Native bridge for Samsung Galaxy S24 and gesture bars.</li>
                </ul>
              </div>
            )}

            {activeModal === 'FAQ' && (
              <div>
                <h3 style={{ marginBottom: '14px', color: 'var(--color-text)' }}>Frequently Asked Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '10px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                            {item.q}
                          </span>
                          {isOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                        </div>
                        {isOpen && (
                          <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', lineHeight: 1.4, marginTop: '8px' }}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeModal === 'PRIVACY' && (
              <div>
                <h3 style={{ marginBottom: '12px', color: 'var(--color-text)' }}>Privacy Policy</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-dim)', marginBottom: '12px' }}>
                  <strong>Your data belongs to you:</strong> Day to Day Expenses operates 100% locally on your device. We do not have servers, accounts, or databases in the cloud.
                </p>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-dim)' }}>
                  No tracking scripts, advertisements, or third-party analytics are embedded. When you share a backup, you choose the destination app.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                onClick={() => setActiveModal('NONE')}
                style={{ padding: '8px 16px', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

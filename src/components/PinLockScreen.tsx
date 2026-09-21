import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { verifyPin } from '../services/lock/pinLock';
import { MdBackspace } from 'react-icons/md';

export const PinLockScreen: React.FC = () => {
  const { settings, unlockApp, clearAllData } = useAppStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [eraseInput, setEraseInput] = useState('');

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      const { salt, hash } = settings.appLock;
      const isValid = await verifyPin(newPin, salt, hash);
      if (isValid) {
        unlockApp();
      } else {
        setErrorMsg('Incorrect PIN. Try again.');
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleResetErase = async () => {
    if (eraseInput.trim() === 'ERASE') {
      await clearAllData(false); // keep folder copies safe!
      setShowForgotModal(false);
      unlockApp();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
        Day to Day Expenses
      </div>
      <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', marginBottom: '32px' }}>
        Enter 4-digit PIN
      </div>

      {/* 4 Dots Indicator */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        {[0, 1, 2, 3].map((i) => {
          const isFilled = i < pin.length;
          return (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: isFilled ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.2)',
                border: '1px solid var(--color-outline)'
              }}
            />
          );
        })}
      </div>

      {errorMsg && (
        <div style={{ color: 'var(--color-expense)', fontSize: '13px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {/* Numeric Keypad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '280px',
          marginBottom: '24px'
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            style={{
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              fontSize: '24px',
              fontWeight: 400,
              color: 'var(--color-text)'
            }}
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          style={{
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            fontSize: '24px',
            fontWeight: 400,
            color: 'var(--color-text)'
          }}
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          aria-label="Backspace"
          style={{
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            fontSize: '26px',
            color: 'var(--color-text-dim)'
          }}
        >
          <MdBackspace />
        </button>
      </div>

      <button
        onClick={() => setShowForgotModal(true)}
        style={{ color: 'var(--color-primary)', fontSize: '14px', marginTop: '10px' }}
      >
        Forgot PIN?
      </button>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 350
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-sheet)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-menu)'
            }}
          >
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '10px' }}>
              Reset Application Lock
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', lineHeight: 1.5, marginBottom: '16px' }}>
              Your PIN cannot be recovered online. Resetting the app erases internal app data so you can regain access.
              <br /><br />
              <strong>Good news:</strong> Backups and images in <code>Documents/DayToDayExpenses</code> are NOT deleted and can be restored afterwards!
            </div>

            <div style={{ fontSize: '13px', color: 'var(--color-expense)', marginBottom: '8px' }}>
              Type <strong>ERASE</strong> to confirm:
            </div>
            <input
              type="text"
              value={eraseInput}
              onChange={(e) => setEraseInput(e.target.value)}
              placeholder="ERASE"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                border: '1px solid var(--color-outline)',
                marginBottom: '16px',
                fontSize: '14px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ padding: '8px 14px', color: 'var(--color-text-dim)', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetErase}
                disabled={eraseInput.trim() !== 'ERASE'}
                style={{
                  padding: '8px 14px',
                  backgroundColor: eraseInput.trim() === 'ERASE' ? 'var(--color-expense)' : 'transparent',
                  color: eraseInput.trim() === 'ERASE' ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Reset App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

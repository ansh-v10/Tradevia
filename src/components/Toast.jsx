import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const accentColor = isSuccess ? '#22c55e' : '#ef4444';

  return (
    <div style={{
      position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#f1f5f9',
      padding: '14px 24px',
      borderRadius: '14px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'toastUp 0.35s ease',
      maxWidth: '90vw',
      letterSpacing: '0.01em'
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        {isSuccess ? (
          <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
        ) : (
          <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
        )}
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8',
        cursor: 'pointer', fontSize: '16px', padding: '2px 8px', borderRadius: '8px',
        lineHeight: '1.4', transition: '0.15s'
      }}>&times;</button>
      <style>{`
        @keyframes toastUp {
          from { transform: translateX(-50%) translateY(24px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

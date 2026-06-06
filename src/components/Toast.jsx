import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
      color: 'white', padding: '12px 20px', borderRadius: '8px',
      fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'slideIn 0.3s ease'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: '1' }}>&times;</button>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

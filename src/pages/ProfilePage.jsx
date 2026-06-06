import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../util/supabaseClient';

export default function ProfilePage({ user, onUpdateUser }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBusinessName(user.businessName || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
      setGstin(user.gstin || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Sign in to view your profile</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '24px' }}>Access your business profile, manage contact details, and update preferences.</p>
        <button className="primary-b2b-btn" onClick={() => navigate('/')}>Go to Home</button>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !businessName.trim() || !mobile.trim() || !email.trim()) {
      setError('All fields are required');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setSaving(true);
    if (onUpdateUser) {
      await onUpdateUser({ ...user, name: name.trim(), businessName: businessName.trim(), mobile: mobile.trim(), email: email.trim(), gstin: gstin.trim() });
    }
    setSaving(false);
    setEditing(false);
  };

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: user.email });
    if (err) {
      setVerifyMsg(err.message);
    } else {
      setVerifyMsg('Verification email sent! Check your inbox.');
    }
    setVerifyLoading(false);
  };

  const handleChangePassword = async () => {
    const { error: err } = await supabase.auth.resetPasswordForEmail(user.email);
    if (err) {
      alert(err.message);
    } else {
      alert('Password reset link sent to your email!');
    }
  };

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      {!user.emailConfirmed && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#92400e' }}><strong>Email not verified.</strong> Check your inbox for the confirmation link.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {verifyMsg && <span style={{ fontSize: '12px', color: verifyMsg.includes('sent') ? '#16a34a' : '#dc2626' }}>{verifyMsg}</span>}
            <button type="button" disabled={verifyLoading} onClick={handleResendVerification} style={{ fontSize: '12px', fontWeight: 600, padding: '6px 14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: verifyLoading ? 0.6 : 1 }}>
              {verifyLoading ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>My Profile</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>Manage your personal and business information</p>
        </div>
        <button className="secondary-b2b-btn" onClick={() => navigate('/account')}>Account Settings</button>
      </div>

      <div className="summary-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>{user.name || 'User'}</h3>
            <p style={{ margin: '0 0 2px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{user.businessName || 'No business name'}</p>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>{user.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)' }}>Contact Person</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="pincode-input" style={{ width: '100%', height: '40px', padding: '0 12px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)' }}>Business Name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="pincode-input" style={{ width: '100%', height: '40px', padding: '0 12px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)' }}>Mobile</label>
              <input type="text" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="pincode-input" style={{ width: '100%', height: '40px', padding: '0 12px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pincode-input" style={{ width: '100%', height: '40px', padding: '0 12px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)' }}>GSTIN</label>
              <input type="text" maxLength={15} value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} className="pincode-input" style={{ width: '100%', height: '40px', padding: '0 12px' }} placeholder="e.g. 07AABCU9603R1ZN" />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="submit" disabled={saving} className="primary-b2b-btn" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="secondary-b2b-btn" onClick={() => { setEditing(false); setName(user.name || ''); setBusinessName(user.businessName || ''); setMobile(user.mobile || ''); setEmail(user.email || ''); }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>Contact Person</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{user.name || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>Business Name</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{user.businessName || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>Mobile</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{user.mobile || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{user.email}
                    {user.emailConfirmed && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Verified</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>GSTIN</div>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>{user.gstin || '-'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="primary-b2b-btn" onClick={() => setEditing(true)}>Edit Profile</button>
              <button className="secondary-b2b-btn" onClick={handleChangePassword}>Change Password</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

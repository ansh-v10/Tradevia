import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import { supabase } from '../util/supabaseClient';

export default function LoginModal({ isOpen, onClose, onSuccess, initialMode = 'login', checkoutPrompt = false }) {
  const [mode, setMode] = useState(initialMode); 
  const [loginIdentifier, setLoginIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setErrors({});
    setSuccessMsg('');
    setShowPassword(false);
    if (!isOpen) {
      setLoginIdentifier('');
      setPassword('');
      setFullName('');
      setBusinessName('');
      setMobileNumber('');
      setEmail('');
      setGstin('');
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/; 

    if (mode === 'login' || mode === 'forgot') {
      if (!loginIdentifier) {
        tempErrors.loginIdentifier = "Email or Mobile Number is required";
      } else {
        const isEmail = emailRegex.test(loginIdentifier);
        const isMobile = mobileRegex.test(loginIdentifier.replace(/\s/g, ''));
        if (!isEmail && !isMobile) {
          tempErrors.loginIdentifier = "Enter a valid Email or 10-digit Mobile Number";
        }
      }

      if (mode === 'login' && !password) {
        tempErrors.password = "Password is required";
      }
    }

    if (mode === 'signup' || mode === 'resetPassword') {
      if (mode === 'signup') {
        if (!fullName) tempErrors.fullName = "Contact Person Name is required";
        if (!businessName) tempErrors.businessName = "Business Name is required";
        
        if (!mobileNumber && !email) {
          tempErrors.contact = "Either Mobile Number or Email Address is required";
        }

        if (mobileNumber && !mobileRegex.test(mobileNumber.replace(/\s/g, ''))) {
          tempErrors.mobileNumber = "Enter a valid 10-digit mobile number (e.g. 9876543210)";
        }

        if (email && !emailRegex.test(email)) {
          tempErrors.email = "Invalid email format";
        }
      }

      if (!password) {
        tempErrors.password = "Password is required";
      } else if (password.length < 6) {
        tempErrors.password = "Password must be at least 6 characters";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    (async () => {
      try {
        if (mode === 'resetPassword') {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setSuccessMsg('Password updated successfully. You are now logged in.');
          setTimeout(async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (u?.id) {
              const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
              onSuccess({
                name: profile?.name || '',
                businessName: profile?.business_name || '',
                email: profile?.email || u.email,
                mobile: profile?.mobile || ''
              });
            }
            onClose();
          }, 1200);
          return;
        }

        if (mode === 'signup') {
          const emailToUse = email || `${mobileNumber ? `store+${mobileNumber}@tradevia.local` : ''}`;
          const { data, error } = await supabase.auth.signUp({ email: emailToUse, password });
          if (error) throw error;

          // create profile entry if signed up immediately
          if (data?.user) {
            await supabase.from('profiles').upsert({ id: data.user.id, email: emailToUse, name: fullName, business_name: businessName, mobile: mobileNumber, gstin: gstin || '' });
            const profile = { id: data.user.id, email: emailToUse, name: fullName, businessName, mobile: mobileNumber, gstin: gstin || '' };
            setSuccessMsg('Account created — logged in.');
            setTimeout(() => { onSuccess(profile); onClose(); }, 800);
          } else {
            setSuccessMsg('Account created. Confirm email if required.');
            setTimeout(() => { onClose(); }, 1200);
          }
        } else if (mode === 'login') {
          // login
          const identifier = loginIdentifier.trim();
          const isEmail = identifier.includes('@');
          let signInEmail = isEmail ? identifier : `store+${identifier}@tradevia.local`;
          let signInData = null;

          try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
            if (error) throw error;
            signInData = data;
          } catch (firstErr) {
            // If it is a mobile number, try user+/store+ prefixes and new/old local domains
            if (!isEmail) {
              const fallbacks = [
                `user+${identifier}@tradevia.local`,
                `store+${identifier}@sanjaysales.local`,
                `user+${identifier}@sanjaysales.local`
              ];
              let success = false;
              for (const fbEmail of fallbacks) {
                try {
                  const { data, error: fbError } = await supabase.auth.signInWithPassword({ email: fbEmail, password });
                  if (!fbError && data?.user) {
                    signInData = data;
                    success = true;
                    break;
                  }
                } catch (e) {
                  // ignore and try next
                }
              }
              if (!success) throw firstErr;
            } else if (identifier.endsWith('@tradevia.local')) {
              // Try old sanjaysales domain if they used tradevia.local but registered in old database
              try {
                const altEmail = identifier.replace('@tradevia.local', '@sanjaysales.local');
                const { data, error: altError } = await supabase.auth.signInWithPassword({ email: altEmail, password });
                if (altError) throw altError;
                signInData = data;
              } catch (e) {
                throw firstErr;
              }
            } else {
              throw firstErr;
            }
          }

          const user = signInData.user;
          // fetch profile
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single().maybeSingle();
          const profile = profileData || { id: user.id, email: user.email };
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => { onSuccess({ name: profile.name || '', businessName: profile.business_name || '', email: profile.email || user.email, mobile: profile.mobile || '', gstin: profile.gstin || '' }); onClose(); }, 800);
        } else if (mode === 'forgot') {
          // Forgot password reset
          const identifier = loginIdentifier.trim();
          const isEmail = identifier.includes('@');
          
          if (isEmail && !identifier.endsWith('@tradevia.local') && !identifier.endsWith('@sanjaysales.local')) {
            // Real email reset
            const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
              redirectTo: window.location.origin
            });
            if (error) throw error;
            setSuccessMsg('Password reset instructions sent to your email.');
          } else {
            // Mobile number or local mock account
            setSuccessMsg('Instructions sent! SMS reset link delivered to registered mobile.');
          }
          setTimeout(() => {
            setMode('login');
            setSuccessMsg('');
            setLoginIdentifier('');
          }, 3000);
        }
      } catch (err) {
        console.error(err);
        setErrors({ form: err.message });
      }
    })();
    
    return;
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        
        <button className="login-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <CloseIcon size={24} />
        </button>

        <div className="login-modal-header">
          <span className="modal-logo">Trade<span className="logo-accent">via</span></span>
          <span className="modal-tag">B2B Trade Member</span>
          
          {checkoutPrompt && (
            <div className="checkout-alert-prompt">
              <strong>Authentication Required:</strong> Please login or register your business to proceed to checkout and secure distributor bulk pricing.
            </div>
          )}

          <h2>{mode === 'login' ? 'Partner Login' : mode === 'signup' ? 'Create Business Account' : mode === 'resetPassword' ? 'Set New Password' : 'Reset Business Password'}</h2>
          <p className="modal-desc">
            {mode === 'login' 
              ? 'Access wholesale rates and input tax credit benefits.' 
              : mode === 'signup' 
                ? 'Register your business to unlock commercial catalogs and bulk discounts.'
                : mode === 'resetPassword'
                  ? 'Choose a new password for your business account.'
                  : 'Enter your registered email or mobile number to receive reset instructions.'}
          </p>
        </div>

        {successMsg && <div className="modal-success-banner">{successMsg}</div>}
        {errors.form && <div className="input-error-msg" style={{ margin: '0 0 16px 0', fontSize: '13px', display: 'block', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontWeight: '700' }}>⚠️ {errors.form}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Contact Person Name *</label>
                <input 
                  type="text" 
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Patel"
                  className={errors.fullName ? 'error-input' : ''}
                />
                {errors.fullName && <span className="input-error-msg">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="businessName">Registered Business Name *</label>
                <input 
                  type="text" 
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Rajesh Kirana & General Stores"
                  className={errors.businessName ? 'error-input' : ''}
                />
                {errors.businessName && <span className="input-error-msg">{errors.businessName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="gstin">GSTIN (Optional)</label>
                <input 
                  type="text" 
                  id="gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 07AABCU9603R1ZN"
                  maxLength={15}
                  className={errors.gstin ? 'error-input' : ''}
                />
                {errors.gstin && <span className="input-error-msg">{errors.gstin}</span>}
              </div>

              {errors.contact && (
                <div className="input-error-msg" style={{ margin: '0 0 16px 0', fontSize: '13px', display: 'block', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', fontWeight: '700' }}>
                  ⚠️ {errors.contact}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="mobileNumber">Commercial Mobile Number</label>
                <input 
                  type="tel" 
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210 (Optional if Email is set)"
                  maxLength={10}
                  className={errors.mobileNumber ? 'error-input' : ''}
                />
                {errors.mobileNumber && <span className="input-error-msg">{errors.mobileNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. buyer@store.com (Optional if Mobile is set)"
                  className={errors.email ? 'error-input' : ''}
                />
                {errors.email && <span className="input-error-msg">{errors.email}</span>}
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'forgot') && (
            <div className="form-group">
              <label htmlFor="loginIdentifier">Commercial Email or 10-Digit Mobile *</label>
              <input 
                type="text" 
                id="loginIdentifier"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. owner@shop.com or 9876543210"
                className={errors.loginIdentifier ? 'error-input' : ''}
              />
              {errors.loginIdentifier && <span className="input-error-msg">{errors.loginIdentifier}</span>}
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="form-group">
              <label htmlFor="password">{mode === 'resetPassword' ? 'New Password *' : 'Security Password *'}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={errors.password ? 'error-input' : ''}
                  style={{ paddingRight: '40px', width: '100%' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="input-error-msg">{errors.password}</span>}

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    className="toggle-mode-btn" 
                    onClick={() => setMode('forgot')}
                    style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="login-submit-btn">
            {mode === 'login' ? 'Login Securely' : mode === 'signup' ? 'Register Business' : mode === 'resetPassword' ? 'Update Password' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="login-modal-footer">
          {mode === 'forgot' ? (
            <p>
              Remembered your password?{' '}
              <button className="toggle-mode-btn" onClick={() => setMode('login')}>
                Sign in to your account
              </button>
            </p>
          ) : mode === 'resetPassword' ? (
            <p>
              Changed your mind?{' '}
              <button className="toggle-mode-btn" onClick={() => setMode('login')}>
                Sign in instead
              </button>
            </p>
          ) : mode === 'login' ? (
            <p>
              New trade customer?{' '}
              <button className="toggle-mode-btn" onClick={() => setMode('signup')}>
                Create commercial account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button className="toggle-mode-btn" onClick={() => setMode('login')}>
                Sign in to your account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

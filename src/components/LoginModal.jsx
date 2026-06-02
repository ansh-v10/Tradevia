import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

export default function LoginModal({ isOpen, onClose, onSuccess, initialMode = 'login', checkoutPrompt = false }) {
  const [mode, setMode] = useState(initialMode); 
  const [loginIdentifier, setLoginIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setErrors({});
    setSuccessMsg('');
    if (!isOpen) {
      setLoginIdentifier('');
      setPassword('');
      setFullName('');
      setBusinessName('');
      setMobileNumber('');
      setEmail('');
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/; 

    if (mode === 'login') {
      if (!loginIdentifier) {
        tempErrors.loginIdentifier = "Email or Mobile Number is required";
      } else {
        const isEmail = emailRegex.test(loginIdentifier);
        const isMobile = mobileRegex.test(loginIdentifier.replace(/\s/g, ''));
        if (!isEmail && !isMobile) {
          tempErrors.loginIdentifier = "Enter a valid Email or 10-digit Mobile Number";
        }
      }

      if (!password) {
        tempErrors.password = "Password is required";
      }
    }

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

    if (mode === 'signup') {
      const userData = {
        name: fullName,
        businessName,
        email: email || '',
        mobile: mobileNumber ? mobileNumber.replace(/\s/g, '') : '',
      };
      
      setSuccessMsg("Business Account registered successfully!");
      setTimeout(() => {
        onSuccess(userData);
        onClose();
      }, 1200);

    } else {
      const cleanIdentifier = loginIdentifier.replace(/\s/g, '');
      const isMobile = /^\d+$/.test(cleanIdentifier);
      
      const demoBusinessName = isMobile 
        ? "Retailer Depot (" + cleanIdentifier.slice(-4) + ")"
        : cleanIdentifier.split('@')[0].toUpperCase() + " Retailers";

      const userData = {
        name: fullName || (isMobile ? "Store Owner" : cleanIdentifier.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
        businessName: businessName || demoBusinessName,
        email: isMobile ? `store-${cleanIdentifier.slice(-4)}@sanjaysales.com` : cleanIdentifier,
        mobile: isMobile ? cleanIdentifier : "9988776655",
      };

      setSuccessMsg("Logged in successfully!");
      setTimeout(() => {
        onSuccess(userData);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        
        <button className="login-modal-close-btn" onClick={onClose} aria-label="Close modal">
          <CloseIcon size={24} />
        </button>

        <div className="login-modal-header">
          <span className="modal-logo">Sanjay<span className="logo-accent">Sales</span></span>
          <span className="modal-tag">B2B Trade Member</span>
          
          {checkoutPrompt && (
            <div className="checkout-alert-prompt">
              <strong>Authentication Required:</strong> Please login or register your business to proceed to checkout and secure distributor bulk pricing.
            </div>
          )}

          <h2>{mode === 'login' ? 'Partner Login' : 'Create Business Account'}</h2>
          <p className="modal-desc">
            {mode === 'login' 
              ? 'Access wholesale rates and input tax credit benefits.' 
              : 'Register your business to unlock commercial catalogs and bulk discounts.'}
          </p>
        </div>

        {successMsg && <div className="modal-success-banner">{successMsg}</div>}

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
                  placeholder="e.g. Sanjay Patel"
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
                  placeholder="e.g. Sanjay Kirana & General Stores"
                  className={errors.businessName ? 'error-input' : ''}
                />
                {errors.businessName && <span className="input-error-msg">{errors.businessName}</span>}
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

          {mode === 'login' && (
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

          <div className="form-group">
            <label htmlFor="password">Security Password *</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className={errors.password ? 'error-input' : ''}
            />
            {errors.password && <span className="input-error-msg">{errors.password}</span>}
          </div>

          <button type="submit" className="login-submit-btn">
            {mode === 'login' ? 'Login Securely' : 'Register Business'}
          </button>
        </form>

        <div className="login-modal-footer">
          {mode === 'login' ? (
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

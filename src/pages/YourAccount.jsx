import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function YourAccount({
  user,
  onUpdateUser,
  addresses = [],
  onAddAddress,
  onDeleteAddress,
  orders = [],
  cart = [],
  onOpenLoginModal
}) {
  const navigate = useNavigate();

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBusiness, setEditBusiness] = useState(user?.businessName || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Address Add Form states
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrBusiness, setAddrBusiness] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  // Quick calculations
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cart.reduce((acc, item) => acc + (item.product.wholesalePrice * item.quantity), 0);

  // Sync edits if user prop changes
  React.useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditBusiness(user.businessName);
      setEditMobile(user.mobile);
      setEditEmail(user.email);
    }
  }, [user]);

  // Handlers
  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim()) {
      setProfileError('FullName/Contact Person cannot be empty.');
      return;
    }
    if (!editBusiness.trim()) {
      setProfileError('Business Name cannot be empty.');
      return;
    }
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!editMobile || !mobileRegex.test(editMobile.trim())) {
      setProfileError('Enter a valid 10-digit mobile number.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editEmail || !emailRegex.test(editEmail.trim())) {
      setProfileError('Enter a valid email address.');
      return;
    }

    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: editName.trim(),
        businessName: editBusiness.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim(),
      });
      setProfileSuccess('Account profile updated successfully!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess('');
      }, 1200);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!addrName.trim() || !addrBusiness.trim() || !addrLine.trim() || !addrCity.trim() || !addrState.trim() || !addrPincode.trim() || !addrPhone.trim()) {
      setAddressError('Please fill out all address fields.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(addrPhone.trim())) {
      setAddressError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (addrPincode.trim().length !== 6) {
      setAddressError('Please enter a valid 6-digit Pincode.');
      return;
    }

    const newAddr = {
      name: addrName.trim(),
      businessName: addrBusiness.trim(),
      addressLine: addrLine.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      phone: addrPhone.trim()
    };

    if (onAddAddress) {
      onAddAddress(newAddr);
      setAddressSuccess('Address added to your account!');
      
      // Reset form
      setAddrName('');
      setAddrBusiness('');
      setAddrLine('');
      setAddrCity('');
      setAddrState('');
      setAddrPincode('');
      setAddrPhone('');
      
      setTimeout(() => {
        setShowAddAddressForm(false);
        setAddressSuccess('');
      }, 1200);
    }
  };

  if (!user) {
    return (
      <div className="account-page-guest-wrapper navbar-width-limiter" style={{ padding: '64px 0', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-cart-card" style={{ maxWidth: '480px', padding: '40px' }}>
          <div style={{ marginBottom: '24px', color: 'var(--color-primary)' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'inline-block' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Access Your Business Account</h2>
          <p>Please sign in to view your account details, manage shipment addresses, and access past wholesale orders.</p>
          <button className="primary-b2b-btn" style={{ width: '100%', marginTop: '16px' }} onClick={onOpenLoginModal}>
            Sign In / Register Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-wrapper navbar-width-limiter" style={{ padding: '32px 0 64px', textAlign: 'left' }}>
      
      {/* Page Header */}
      <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-main-title">Your Wholesale Account</h2>
          <p className="page-main-subtitle">Manage business profile details, GST locations, and review wholesale stats.</p>
        </div>
        <button className="secondary-b2b-btn" onClick={() => navigate('/browse')}>
          ← Back to Catalog
        </button>
      </div>

      <div className="account-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
        
        {/* Card 1: Account Profile Details */}
        <div className="summary-card" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Business Profile</h3>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>FullName/Contact Person</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '38px', padding: '0 12px' }}
                  required
                />
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Business Name</label>
                <input 
                  type="text"
                  value={editBusiness}
                  onChange={(e) => setEditBusiness(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '38px', padding: '0 12px' }}
                  required
                />
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Mobile Number</label>
                <input 
                  type="text"
                  maxLength={10}
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))}
                  className="pincode-input"
                  style={{ width: '100%', height: '38px', padding: '0 12px' }}
                  required
                />
              </div>

              <div>
                <label className="filter-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Email Address</label>
                <input 
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '38px', padding: '0 12px' }}
                  required
                />
              </div>

              {profileError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 'bold' }}>
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: 'bold' }}>
                  {profileSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="submit" className="primary-b2b-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Save Changes
                </button>
                <button type="button" className="secondary-b2b-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Business Unit</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)' }}>{user.businessName}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Contact Partner</span>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>{user.name}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mobile Contact</span>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>📞 {user.mobile || 'Not set'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Billing Email</span>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>✉ {user.email || 'Not set'}</span>
              </div>

              <button 
                className="secondary-b2b-btn" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 0', marginTop: '8px' }}
                onClick={() => {
                  setEditName(user.name || '');
                  setEditBusiness(user.businessName || '');
                  setEditMobile(user.mobile || '');
                  setEditEmail(user.email || '');
                  setIsEditingProfile(true);
                  setProfileError('');
                  setProfileSuccess('');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile Details
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Saved Addresses Management */}
        <div className="summary-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Business Addresses</h3>
            </div>
            
            {!showAddAddressForm && (
              <button 
                className="primary-b2b-btn" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setShowAddAddressForm(true)}
              >
                + Add Address
              </button>
            )}
          </div>

          {showAddAddressForm ? (
            <form onSubmit={handleAddressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--color-border)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '700' }}>New Shipping Location</h4>
              
              <div>
                <input 
                  type="text" 
                  placeholder="Recipient Name (e.g. Store Manager)" 
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder="Business Name (e.g. Retailer Depot Store)" 
                  value={addrBusiness}
                  onChange={(e) => setAddrBusiness(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder="Address Line (e.g. Sabzi mandi)" 
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="City (e.g. Jhajjar)" 
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
                <input 
                  type="text" 
                  placeholder="State (e.g. Haryana)" 
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Pincode (e.g. 124103)" 
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, ''))}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
                <input 
                  type="text" 
                  maxLength={10}
                  placeholder="Phone Number" 
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, ''))}
                  className="pincode-input"
                  style={{ width: '100%', height: '34px', fontSize: '13px' }}
                  required
                />
              </div>

              {addressError && <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'bold' }}>{addressError}</span>}
              {addressSuccess && <span style={{ color: 'var(--color-success)', fontSize: '12px', fontWeight: 'bold' }}>{addressSuccess}</span>}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="primary-b2b-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Save Location
                </button>
                <button type="button" className="secondary-b2b-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowAddAddressForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {/* List of Saved Addresses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
            {addresses.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic', margin: '10px 0' }}>No addresses saved yet.</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', position: 'relative', backgroundColor: 'var(--color-bg-light)' }}>
                  {addresses.length > 1 && (
                    <button 
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Remove Address"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this shipping location?")) {
                          onDeleteAddress(addr.id);
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', width: '85%' }}>{addr.businessName}</h4>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '500' }}>Contact: {addr.name}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>{addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600' }}>📞 {addr.phone}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Metrics & Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Cart Status Widget */}
          <div className="summary-card" style={{ padding: '24px', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', gap: '12px', marginBottom: '16px' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Wholesale Cart</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Cart Status:</span>
                <span style={{ fontWeight: '700' }}>{totalCartItems > 0 ? `${totalCartItems} Items` : 'Empty'}</span>
              </div>
              {totalCartItems > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Total Value:</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>₹{totalCartValue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <button 
              className="primary-b2b-btn" 
              style={{ width: '100%', padding: '10px 0' }}
              onClick={() => navigate('/cart')}
            >
              Go to Cart
            </button>
          </div>

          {/* Orders Status Widget */}
          <div className="summary-card" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', gap: '12px', marginBottom: '16px' }}>
              <div style={{ color: '#f59e0b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Orders History</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Total Orders Placed:</span>
                <span style={{ fontWeight: '700' }}>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              {orders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>LATEST ORDER:</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Order #{orders[orders.length - 1].id}</span>
                    <span style={{ fontWeight: '700' }}>₹{orders[orders.length - 1].totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              className="primary-b2b-btn" 
              style={{ width: '100%', backgroundColor: '#f59e0b', borderColor: '#f59e0b', padding: '10px 0' }}
              onClick={() => navigate('/orders')}
            >
              View Order History
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

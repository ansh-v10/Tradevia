import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ProfileIcon, CartIcon, PinIcon, CaretDownIcon, CloseIcon } from './Icons';

// Instant local mapping for common commercial hubs to prevent delay
const pincodeFallback = {
  '400001': 'Mumbai',
  '110001': 'New Delhi',
  '560001': 'Bengaluru',
  '700001': 'Kolkata',
  '600001': 'Chennai',
  '500001': 'Hyderabad',
  '380001': 'Ahmedabad',
  '400709': 'Navi Mumbai',
  '302001': 'Jaipur',
  '452001': 'Indore',
  '500081': 'Madhapur',
  '110020': 'Okhla'
};

export default function Navbar({
  user,
  onUpdateUser,
  onLogout,
  onOpenLoginModal,
  cart,
  currentPage,
  searchQuery,
  setSearchQuery,
  setSelectedCategories
}) {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState(searchQuery || '');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [pincode, setPincode] = useState('400001'); // default Mumbai business pincode
  const [cityName, setCityName] = useState('Mumbai'); // fetched city state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Add profile editing states
  const [editingField, setEditingField] = useState(null); // 'email' or 'mobile'
  const [fieldValue, setFieldValue] = useState('');
  const [editError, setEditError] = useState('');

  // Reset field editors if dropdown is closed
  useEffect(() => {
    if (!profileDropdownOpen) {
      setEditingField(null);
      setFieldValue('');
      setEditError('');
    }
  }, [profileDropdownOpen]);

  const profileContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSaveField = (e) => {
    e.stopPropagation();
    if (editingField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!fieldValue || !emailRegex.test(fieldValue)) {
        setEditError('Enter a valid email address');
        return;
      }
      if (onUpdateUser) {
        onUpdateUser(prev => ({ ...prev, email: fieldValue }));
      }
      setEditingField(null);
    } else if (editingField === 'mobile') {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!fieldValue || !mobileRegex.test(fieldValue)) {
        setEditError('Enter a valid 10-digit mobile');
        return;
      }
      if (onUpdateUser) {
        onUpdateUser(prev => ({ ...prev, mobile: fieldValue }));
      }
      setEditingField(null);
    }
  };

  // Motion UI Search states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Calculate cart metrics
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.wholesalePrice * item.quantity), 0);

  // Sync temp search when parent state updates
  useEffect(() => {
    setTempSearch(searchQuery || '');
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(tempSearch);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    navigate('/browse');
  };

  const handleTrendingClick = (keyword) => {
    setTempSearch(keyword);
    setSearchQuery(keyword);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    navigate('/browse');
  };

  const handleLogoClick = () => {
    setTempSearch('');
    setSearchQuery('');
    if (setSelectedCategories) setSelectedCategories([]);
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  // Async Pincode API Fetch Handler
  const handlePincodeSubmit = async (e) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setLocationError("Enter a valid 6-digit pincode.");
      return;
    }
    
    setIsLoadingLocation(true);
    setLocationError('');

    // Instant local mapping check for speed
    if (pincodeFallback[pincode]) {
      setCityName(pincodeFallback[pincode]);
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (!response.ok) throw new Error("Network response error");
      
      const data = await response.json();
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffice = data[0].PostOffice[0];
        const city = postOffice.District || postOffice.Region || postOffice.Circle || "India";
        setCityName(city);
        setLocationError('');
        setShowLocationPopup(false);
      } else {
        if (pincodeFallback[pincode]) {
          setShowLocationPopup(false);
        } else {
          setLocationError("Pincode details not found in database.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch location from pin code:", err);
      if (pincodeFallback[pincode]) {
        setShowLocationPopup(false);
      } else {
        setLocationError("Network error. Using fallback.");
        setTimeout(() => {
          setCityName("India");
          setShowLocationPopup(false);
        }, 1200);
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const triggerMobileSearch = () => {
    setIsMobileSearchOpen(true);
    setTimeout(() => {
      if (mobileInputRef.current) {
        mobileInputRef.current.focus();
      }
    }, 150);
  };

  return (
    <header className="navbar-container">
      {/* Top Bar for B2B Alerts and Locations */}
      <div className="navbar-top-bar">
        <div className="navbar-width-limiter top-bar-flex">
          <div className="top-bar-left">
            <span className="b2b-badge">WHOLESALE B2B</span>
            <span className="text-muted text-sm">GST invoice benefits on all bulk purchases. Welcome to Sanjay Sales!</span>
          </div>
          <div className="top-bar-right">
            <a href="#help" onClick={(e) => { e.preventDefault(); alert("Customer Support:\nPhone: +917496865205\nEmail: wholesale@sanjaysales.com\nHours: Mon - Sat: 9:00 AM - 5:00 PM"); }} className="top-link">Support</a>
            <span className="divider">|</span>
            <a href="#store" onClick={(e) => { e.preventDefault(); alert("Operational in Jhajjar, Delhi only. Operational in other cities soon."); }} className="top-link">Wholesale Hubs</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main">
        <div className="navbar-width-limiter main-nav-flex">
          
          {/* Logo */}
          <div className="brand-logo-container" onClick={handleLogoClick}>
            <span className="logo-text">Sanjay<span className="logo-accent">Sales</span></span>
            <span className="logo-subtext">B2B Wholesale</span>
          </div>

          {/* Delivery Location Pin */}
          <div className="delivery-location-widget" onClick={() => setShowLocationPopup(!showLocationPopup)}>
            <div className="pin-icon-wrap">
              <PinIcon className="pin-svg" />
            </div>
            <div className="delivery-text-wrap">
              <span className="delivery-label">Deliver to</span>
              <span className="delivery-pincode">
                {cityName} {pincode}{' '}
                <CaretDownIcon size={12} className="inline-caret" />
              </span>
            </div>
            
            {showLocationPopup && (
              <div className="location-bubble-popup" onClick={(e) => e.stopPropagation()}>
                <h4>Update Business Location</h4>
                <p>Enter your 6-digit Indian Pincode to resolve your local delivery hub:</p>
                <form onSubmit={handlePincodeSubmit} className="pincode-form">
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 400709" 
                    className="pincode-input"
                  />
                  <button type="submit" className="pincode-btn" disabled={isLoadingLocation}>
                    {isLoadingLocation ? 'Loading...' : 'Verify'}
                  </button>
                </form>
                {isLoadingLocation && (
                  <span className="input-hint-text text-blue">Resolving location details from Postal Services...</span>
                )}
                {locationError && (
                  <span className="gstin-alert-txt">{locationError}</span>
                )}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className={`search-form-relative-container ${isSearchFocused ? 'search-active-glow' : ''}`}>
            <form className="search-form-container" onSubmit={handleSearchSubmit}>
              <input 
                ref={searchInputRef}
                type="text" 
                className="search-input" 
                placeholder="Search wholesale brands, products, snacks or categories..."
                value={tempSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setTempSearch(e.target.value)}
              />
              <button type="submit" className="search-submit-button" aria-label="Submit search">
                <SearchIcon size={20} />
              </button>
            </form>

            {/* Spotlight Search Overlay */}
            {isSearchFocused && (
              <div className="search-spotlight-suggestions">
                <div className="suggestion-section">
                  <h5>Popular Wholesale Searches</h5>
                  <div className="trending-tags-flex">
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Haldiram's")}>Haldiram Namkeen</button>
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Amul")}>Amul Butter</button>
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Colgate")}>Colgate Bulk</button>
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Surf Excel")}>Surf Excel</button>
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Red Bull")}>Red Bull</button>
                    <button type="button" className="trend-tag" onClick={() => handleTrendingClick("Dairy Milk")}>Dairy Milk</button>
                  </div>
                </div>
                <div className="suggestion-section mt-2">
                  <h5>Quick Category Links</h5>
                  <ul className="quick-cat-suggest-list">
                    <li onClick={() => { setSelectedCategories(["Sweets & Namkeen"]); navigate('/browse'); }}>Sweets & Namkeen (Carton rates)</li>
                    <li onClick={() => { setSelectedCategories(["Daily Use"]); navigate('/browse'); }}>Toiletries & Soaps</li>
                    <li onClick={() => { setSelectedCategories(["Home Essentials"]); navigate('/browse'); }}>Cleaning Supplies</li>
                    <li onClick={() => { setSelectedCategories(["Chocolates & Candies"]); navigate('/browse'); }}>Chocolates & Candy jars</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Compact Mobile Search Button */}
          <button 
            type="button" 
            className="mobile-search-trigger-btn"
            onClick={triggerMobileSearch}
            aria-label="Open search"
          >
            <SearchIcon size={24} />
          </button>

          {/* Nav Actions */}
          <div className="nav-actions-container">
            
            {/* User Profile dropdown */}
            <div 
              ref={profileContainerRef}
              className="user-profile-menu-container" 
              onMouseEnter={() => setProfileDropdownOpen(true)}
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div 
                className="profile-trigger-flex" 
                onClick={user ? () => setProfileDropdownOpen(!profileDropdownOpen) : onOpenLoginModal}
              >
                <ProfileIcon className="profile-svg" />
                <div className="profile-text-wrap">
                  <span className="profile-greeting">
                    {user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, Sign In'}
                  </span>
                  <span className="profile-subtext">
                    {user ? 'Account & Orders' : 'Login / SignUp'} <CaretDownIcon size={12} className="inline-caret" />
                  </span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="profile-actions-dropdown">
                  {user ? (
                    <>
                      <div className="dropdown-user-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className="user-biz-name" style={{ fontSize: '13px', fontWeight: '800' }}>{user.businessName || 'Business Owner'}</span>
                        
                        {/* Email display / addition */}
                        {user.email ? (
                          <span className="user-email-text" style={{ display: 'block', fontSize: '11px' }}>✉ {user.email}</span>
                        ) : (
                          editingField === 'email' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                              <input 
                                type="email"
                                placeholder="Enter Email"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                className="pincode-input"
                                style={{ fontSize: '11px', padding: '4px 8px', height: '28px', border: '1px solid var(--color-border)', width: '100%' }}
                              />
                              {editError && <span className="input-error-msg" style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{editError}</span>}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="pincode-btn" style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--color-primary)', color: 'white' }} onClick={handleSaveField}>Save</button>
                                <button className="pincode-btn" style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#e2e8f0', color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); setEditingField(null); }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              className="dropdown-action-btn" 
                              style={{ padding: '2px 0', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                              onClick={(e) => { e.stopPropagation(); setEditingField('email'); setFieldValue(''); setEditError(''); }}
                            >
                              + Add Email Address
                            </button>
                          )
                        )}

                        {/* Mobile display / addition */}
                        {user.mobile ? (
                          <span className="user-email-text" style={{ display: 'block', fontSize: '11px' }}>📞 {user.mobile}</span>
                        ) : (
                          editingField === 'mobile' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                              <input 
                                type="text"
                                maxLength={10}
                                placeholder="Enter 10-Digit Mobile"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value.replace(/\D/g, ''))}
                                className="pincode-input"
                                style={{ fontSize: '11px', padding: '4px 8px', height: '28px', border: '1px solid var(--color-border)', width: '100%' }}
                              />
                              {editError && <span className="input-error-msg" style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{editError}</span>}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="pincode-btn" style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--color-primary)', color: 'white' }} onClick={handleSaveField}>Save</button>
                                <button className="pincode-btn" style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#e2e8f0', color: '#1e293b' }} onClick={(e) => { e.stopPropagation(); setEditingField(null); }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              className="dropdown-action-btn" 
                              style={{ padding: '2px 0', fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}
                              onClick={(e) => { e.stopPropagation(); setEditingField('mobile'); setFieldValue(''); setEditError(''); }}
                            >
                              + Add Mobile Number
                            </button>
                          )
                        )}
                      </div>
                      <div className="dropdown-divider"></div>
                      <button 
                        className="dropdown-action-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/account');
                        }}
                        style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}
                      >
                        🔒 Your Account
                      </button>
                      <button 
                        className="dropdown-action-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/browse');
                          if (setSelectedCategories) setSelectedCategories([]);
                          setSearchQuery('');
                          setTempSearch('');
                        }}
                      >
                        Browse Wholesale Catalog
                      </button>
                      <button 
                        className="dropdown-action-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/cart');
                        }}
                      >
                        My Wholesale Cart
                      </button>
                      <button 
                        className="dropdown-action-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/orders');
                        }}
                      >
                        Your Orders
                      </button>
                      <div className="dropdown-divider"></div>
                      <button 
                        className="dropdown-logout-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                      >
                        Sign Out Business
                      </button>
                    </>
                  ) : (
                    <div className="dropdown-sign-in-prompt">
                      <p>Sign in to view commercial pricing & tax-saving offers.</p>
                      <button 
                        className="dropdown-login-trigger" 
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenLoginModal();
                        }}
                      >
                        Sign In / Register
                      </button>
                      <span className="new-customer-text">New business? <a href="#register" onClick={(e) => { e.preventDefault(); setProfileDropdownOpen(false); onOpenLoginModal(); }}>Register here</a></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Widget */}
            <div className={`navbar-cart-widget ${currentPage === 'cart' ? 'active' : ''}`} onClick={handleCartClick}>
              <div className="cart-icon-wrapper">
                <CartIcon className="cart-svg" />
                <span className="cart-count-badge">{totalItems}</span>
              </div>
              <div className="cart-text-wrapper">
                <span className="cart-label">Wholesale Cart</span>
                <span className="cart-amount">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Expandable Search Bar Drawer */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay-fullscreen">
          <div className="mobile-search-sliding-header">
            
            <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
              <button type="submit" className="mobile-search-submit-btn" aria-label="Search">
                <SearchIcon size={20} />
              </button>
              <input 
                ref={mobileInputRef}
                type="text" 
                className="mobile-search-input-box" 
                placeholder="Search brands, snacks, groceries..."
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
              />
              <button 
                type="button" 
                className="mobile-search-close-btn"
                onClick={() => setIsMobileSearchOpen(false)}
                aria-label="Close search"
              >
                <CloseIcon size={20} />
              </button>
            </form>

            <div className="mobile-search-drawer-body">
              <h5>Trending Wholesales</h5>
              <div className="mobile-trending-tags">
                <button type="button" className="mob-trend-tag" onClick={() => handleTrendingClick("Haldiram's")}>Haldiram Namkeen</button>
                <button type="button" className="mob-trend-tag" onClick={() => handleTrendingClick("Amul")}>Amul Butter</button>
                <button type="button" className="mob-trend-tag" onClick={() => handleTrendingClick("Colgate")}>Colgate Tube</button>
                <button type="button" className="mob-trend-tag" onClick={() => handleTrendingClick("Surf Excel")}>Surf Excel</button>
                <button type="button" className="mob-trend-tag" onClick={() => handleTrendingClick("Red Bull")}>Red Bull</button>
              </div>

              <h5 className="mt-4">Search by Segment</h5>
              <div className="mobile-search-categories-shortcuts">
                <div className="mob-cat-link" onClick={() => { setSelectedCategories(["Sweets & Namkeen"]); navigate('/browse'); setIsMobileSearchOpen(false); }}>Sweets & Namkeen</div>
                <div className="mob-cat-link" onClick={() => { setSelectedCategories(["Daily Use"]); navigate('/browse'); setIsMobileSearchOpen(false); }}>Daily Use (Toiletries)</div>
                <div className="mob-cat-link" onClick={() => { setSelectedCategories(["Home Essentials"]); navigate('/browse'); setIsMobileSearchOpen(false); }}>Cleaning Supplies</div>
                <div className="mob-cat-link" onClick={() => { setSelectedCategories(["Chocolates & Candies"]); navigate('/browse'); setIsMobileSearchOpen(false); }}>Chocolates & Candies</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}

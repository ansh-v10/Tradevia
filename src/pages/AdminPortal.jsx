import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPortal({ 
  products, 
  categories, 
  orders = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onUpdateCategories, 
  onBulkAdjustPrices,
  onResetCatalog
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'bulk', 'orders'
  
  // Admin Login/Signup Authentication States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  
  const [registeredAdmins, setRegisteredAdmins] = useState(() => {
    const saved = localStorage.getItem('sanjay_sales_admins');
    const defaults = [
      { id: 'admin', password: 'admin' },
      { id: 'vansh2005', password: 'Vansh@2005' }
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = [...parsed];
          defaults.forEach(def => {
            if (!merged.some(a => a.id.toLowerCase() === def.id.toLowerCase())) {
              merged.push(def);
            }
          });
          return merged;
        }
      } catch (e) {
        console.error("Failed to parse admins database", e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('sanjay_sales_admins', JSON.stringify(registeredAdmins));
  }, [registeredAdmins]);

  // Manage Admins tab states
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminAccId, setAdminAccId] = useState('');
  const [adminAccPassword, setAdminAccPassword] = useState('');

  const handleAdminAccountSubmit = (e) => {
    e.preventDefault();
    const cleanId = adminAccId.trim();
    const cleanPassword = adminAccPassword.trim();
    if (!cleanId || !cleanPassword) return;

    if (editingAdminId) {
      setRegisteredAdmins(prev => 
        prev.map(a => a.id.toLowerCase() === editingAdminId.toLowerCase() ? { id: a.id, password: cleanPassword } : a)
      );
      setActionSuccess(`Password for admin "${editingAdminId}" updated successfully!`);
      setEditingAdminId(null);
    } else {
      const exists = registeredAdmins.some(
        a => a.id.toLowerCase() === cleanId.toLowerCase()
      );
      if (exists) {
        alert("This Admin ID is already registered.");
        return;
      }
      setRegisteredAdmins(prev => [...prev, { id: cleanId, password: cleanPassword }]);
      setActionSuccess(`Admin "${cleanId}" registered successfully!`);
    }
    setAdminAccId('');
    setAdminAccPassword('');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleEditAdminClick = (adminAcc) => {
    setEditingAdminId(adminAcc.id);
    setAdminAccId(adminAcc.id);
    setAdminAccPassword(adminAcc.password);
  };

  const handleCancelEditAdmin = () => {
    setEditingAdminId(null);
    setAdminAccId('');
    setAdminAccPassword('');
  };

  const handleDeleteAdminClick = (adminId) => {
    if (registeredAdmins.length <= 1) {
      alert("Cannot delete the last admin account! At least one administrator account must exist.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete admin account "${adminId}"?`)) {
      setRegisteredAdmins(prev => prev.filter(a => a.id.toLowerCase() !== adminId.toLowerCase()));
      setActionSuccess(`Admin account "${adminId}" deleted successfully!`);
      setTimeout(() => setActionSuccess(''), 2000);
    }
  };

  const [authId, setAuthId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authSecretKey, setAuthSecretKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      const match = registeredAdmins.find(
        a => a.id.toLowerCase() === authId.trim().toLowerCase() && a.password === authPassword
      );
      if (match) {
        setIsAdminAuthenticated(true);
        setActionSuccess('Login Successful! Welcome to Admin Panel.');
        setAuthId('');
        setAuthPassword('');
      } else {
        setAuthError('Invalid Admin ID or Password. Please try again.');
      }
    } else {
      if (!authId.trim() || !authPassword) {
        setAuthError('Please enter a valid Admin ID and Password.');
        return;
      }
      const normalizedKey = authSecretKey.trim().toUpperCase();
      if (normalizedKey !== 'SANJAY_ADMIN' && normalizedKey !== 'ADMIN' && normalizedKey !== 'SANJAY_ADMIN_SECRET') {
        setAuthError('Unauthorized registration! Invalid Admin Secret Security Code.');
        return;
      }
      const exists = registeredAdmins.some(
        a => a.id.toLowerCase() === authId.trim().toLowerCase()
      );
      if (exists) {
        setAuthError('Admin ID already registered. Try logging in.');
        return;
      }
      setRegisteredAdmins(prev => [...prev, { id: authId.trim(), password: authPassword }]);
      setAuthSuccess('Admin Account Registered Successfully! You can now log in.');
      setAuthMode('login');
      setAuthSecretKey('');
      setAuthPassword('');
    }
  };

  // Product Form states
  const [editingId, setEditingId] = useState(null); // null if adding
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(() => {
    return categories && categories.length > 0 ? categories[0].name : '';
  });
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [packSize, setPackSize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isMostBought, setIsMostBought] = useState(false);
  const [moq, setMoq] = useState('10');
  const [inventory, setInventory] = useState('100');
  const [tier2Price, setTier2Price] = useState('');
  const [tier3Price, setTier3Price] = useState('');
  const [tier2Moq, setTier2Moq] = useState('');
  const [tier3Moq, setTier3Moq] = useState('');
  const [errors, setErrors] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');

  // Image Source Tab: 'link' or 'upload'
  const [imageSourceType, setImageSourceType] = useState('link');

  // Category Manager states
  const [localCategories, setLocalCategories] = useState(() => categories || []);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [newCatShowOnHome, setNewCatShowOnHome] = useState(true);
  const [newCatShowProductsOnHome, setNewCatShowProductsOnHome] = useState(false);

  // Sync with categories prop
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Keep form selection valid if categories change
  useEffect(() => {
    if (categories && categories.length > 0 && (!category || !categories.some(c => c.name === category))) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  // Bulk rate adjustment states
  const [priceAdjPercent, setPriceAdjPercent] = useState('5');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Search filter inside admin catalog
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  const handleSearchSubmit = () => {
    setAdminSearch(adminSearchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // FileReader handler for base64 conversions
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (localStorage max capacity ~5MB, we check up to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("This file is too large. Please select an image file under 5 MB.");
      e.target.value = ""; // clear input
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result); // Base64 data string
    };
    reader.readAsDataURL(file);
  };

  // Edit action
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setRetailPrice(product.retailPrice.toString());
    setWholesalePrice(product.wholesalePrice.toString());
    setPackSize(product.packSize);
    setImageUrl(product.imageUrl);
    setIsMostBought(product.isMostBought || false);
    setMoq(product.moq ? product.moq.toString() : '10');
    setInventory(product.inventory !== undefined ? product.inventory.toString() : '100');
    setTier2Price(product.tier2Price !== undefined && product.tier2Price !== null ? product.tier2Price.toString() : '');
    setTier3Price(product.tier3Price !== undefined && product.tier3Price !== null ? product.tier3Price.toString() : '');
    setTier2Moq(product.tier2Moq !== undefined && product.tier2Moq !== null ? product.tier2Moq.toString() : '');
    setTier3Moq(product.tier3Moq !== undefined && product.tier3Moq !== null ? product.tier3Moq.toString() : '');
    
    // Auto-detect image source type
    if (product.imageUrl && product.imageUrl.startsWith('data:')) {
      setImageSourceType('upload');
    } else {
      setImageSourceType('link');
    }

    setErrors({});
    
    // scroll to form
    const formElem = document.getElementById('admin-product-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setBrand('');
    setCategory(categories && categories.length > 0 ? categories[0].name : '');
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');
    setInventory('100');
    setTier2Price('');
    setTier3Price('');
    setTier2Moq('');
    setTier3Moq('');
    setErrors({});
  };

  // Submit product additions/edits
  const handleProductSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!name) tempErrors.name = "Product name is required";
    if (!brand) tempErrors.brand = "Brand name is required";
    if (!packSize) tempErrors.packSize = "Pack size is required (e.g. Box of 12)";
    
    const retail = parseFloat(retailPrice);
    const wholesale = parseFloat(wholesalePrice);
    const minOrderQty = parseInt(moq);
    const stockQty = parseInt(inventory);
    const t2 = tier2Price !== '' ? parseFloat(tier2Price) : null;
    const t3 = tier3Price !== '' ? parseFloat(tier3Price) : null;
    const t2Moq = tier2Moq !== '' ? parseInt(tier2Moq) : null;
    const t3Moq = tier3Moq !== '' ? parseInt(tier3Moq) : null;

    if (isNaN(retail) || retail <= 0) tempErrors.retailPrice = "Enter valid retail price";
    if (isNaN(wholesale) || wholesale <= 0) tempErrors.wholesalePrice = "Enter valid wholesale price";
    if (wholesale >= retail) tempErrors.wholesalePrice = "Wholesale price must be lower than MRP";
    if (isNaN(minOrderQty) || minOrderQty <= 0) tempErrors.moq = "Enter valid MOQ (at least 1)";
    if (isNaN(stockQty) || stockQty < 0) tempErrors.inventory = "Enter valid inventory quantity (0 or more)";
    
    if (t2 !== null && (isNaN(t2) || t2 <= 0 || t2 >= wholesale)) {
      tempErrors.tier2Price = "Tier 2 rate must be lower than base wholesale price";
    }
    if (t3 !== null && (isNaN(t3) || t3 <= 0 || (t2 !== null ? t3 >= t2 : t3 >= wholesale))) {
      tempErrors.tier3Price = "Tier 3 rate must be lower than Tier 2 rate / base wholesale price";
    }

    if (t2Moq !== null && (isNaN(t2Moq) || t2Moq <= minOrderQty)) {
      tempErrors.tier2Moq = "Tier 2 MOQ must be greater than base MOQ";
    }
    if (t3Moq !== null && (isNaN(t3Moq) || t3Moq <= (t2Moq !== null ? t2Moq : minOrderQty))) {
      tempErrors.tier3Moq = "Tier 3 MOQ must be greater than Tier 2 MOQ / base MOQ";
    }

    if (!imageUrl) tempErrors.imageUrl = "Product image file or web URL is required";

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    const productPayload = {
      name,
      brand,
      category,
      retailPrice: retail,
      wholesalePrice: wholesale,
      packSize,
      imageUrl,
      isMostBought,
      moq: minOrderQty || 10,
      inventory: stockQty >= 0 ? stockQty : 100,
      tier2Price: t2,
      tier3Price: t3,
      tier2Moq: t2Moq,
      tier3Moq: t3Moq,
      rating: editingId ? (products.find(p => p.id === editingId)?.rating || 4.5) : 4.5,
      reviewsCount: editingId ? (products.find(p => p.id === editingId)?.reviewsCount || 100) : 100
    };

    if (editingId) {
      onUpdateProduct({ ...productPayload, id: editingId });
      setActionSuccess("Product updated in wholesale catalog successfully!");
      setEditingId(null);
    } else {
      onAddProduct(productPayload);
      setActionSuccess("New product added to catalog successfully!");
    }

    // Clear form
    setName('');
    setBrand('');
    setCategory(categories && categories.length > 0 ? categories[0].name : '');
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');
    setInventory('100');
    setTier2Price('');
    setTier3Price('');
    setTier2Moq('');
    setTier3Moq('');

    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleDeleteClick = (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the wholesale catalog?`)) {
      onDeleteProduct(productId);
      setActionSuccess("Product deleted successfully!");
      setTimeout(() => setActionSuccess(''), 2000);
    }
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    const nameTrimmed = newCatName.trim();
    const urlTrimmed = newCatImageUrl.trim();
    if (!nameTrimmed || !urlTrimmed) return;

    // Check if name already exists in localCategories
    const exists = localCategories.some(
      c => c.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      alert(`Category "${nameTrimmed}" already exists.`);
      return;
    }

    const newCat = {
      name: nameTrimmed,
      imageUrl: urlTrimmed,
      showOnHome: newCatShowOnHome,
      showProductsOnHome: newCatShowProductsOnHome
    };

    setLocalCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatImageUrl('');
    setNewCatShowOnHome(true);
    setNewCatShowProductsOnHome(false);
    
    setActionSuccess(`Category "${nameTrimmed}" added to local draft! Remember to save changes.`);
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleLocalCatImageChange = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, imageUrl: value } : cat));
  };

  const handleLocalCatShowOnHomeToggle = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, showOnHome: value } : cat));
  };

  const handleLocalCatShowProductsOnHomeToggle = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, showProductsOnHome: value } : cat));
  };

  const handleLocalCatDelete = (name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This will affect product listings.`)) {
      setLocalCategories(prev => prev.filter(cat => cat.name !== name));
    }
  };

  const handleSaveCategoriesConfig = () => {
    onUpdateCategories(localCategories);
    setBulkSuccess("Wholesale categories updated successfully!");
    setTimeout(() => setBulkSuccess(''), 2000);
  };

  const handleRevertCategories = () => {
    if (window.confirm("Revert category changes back to saved settings?")) {
      setLocalCategories(categories || []);
    }
  };

  const handleBulkRateSubmit = (e) => {
    e.preventDefault();
    const percent = parseFloat(priceAdjPercent);
    if (isNaN(percent) || percent === 0) {
      alert("Please enter a valid non-zero percentage adjustment.");
      return;
    }
    onBulkAdjustPrices(percent);
    setBulkSuccess(`Wholesale rates adjusted globally by ${percent > 0 ? '+' : ''}${percent}%!`);
    setTimeout(() => setBulkSuccess(''), 3000);
  };

  const handleResetCatalogSubmit = () => {
    if (window.confirm("This will revert all product listings and category images to default distributor database. Continue?")) {
      onResetCatalog();
      setBulkSuccess("Wholesale database restored to factory settings!");
      setTimeout(() => setBulkSuccess(''), 3000);
    }
  };

  // Filter products by search query inside table
  const filteredProducts = products.filter(p => {
    const q = adminSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  if (!isAdminAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--color-bg-main)'
      }}>
        <div className="admin-login-card" style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--color-border)',
          padding: '40px 32px',
          textAlign: 'center'
        }}>
          <div className="login-logo-container" style={{ marginBottom: '24px' }}>
            <span style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-accent)', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              fontWeight: '800', 
              fontSize: '20px',
              letterSpacing: '1px',
              display: 'inline-block',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              SANJAY SALES
            </span>
            <h3 style={{ marginTop: '16px', fontSize: '22px', fontWeight: '800', color: 'var(--color-text-main)' }}>
              Admin Control Panel
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              {authMode === 'login' ? 'Please log in to manage your wholesale catalog' : 'Register new authorized admin credentials'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {authError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: 'var(--color-danger)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ {authError}
              </div>
            )}
            {authSuccess && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #d1fae5',
                color: 'var(--color-success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✓ {authSuccess}
              </div>
            )}

            <div>
              <label htmlFor="admin-auth-id" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                Admin ID / Username
              </label>
              <input 
                id="admin-auth-id"
                type="text" 
                placeholder="e.g. admin"
                value={authId}
                onChange={(e) => setAuthId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '14px',
                  color: 'var(--color-text-main)',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
              />
            </div>

            <div>
              <label htmlFor="admin-auth-password" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="admin-auth-password"
                  type={showAdminPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '40px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showAdminPassword ? "Hide password" : "Show password"}
                >
                  {showAdminPassword ? (
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
            </div>

            {authMode === 'signup' && (
              <div>
                <label htmlFor="admin-auth-secret" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                  Admin Security Secret Key
                </label>
                <input 
                  id="admin-auth-secret"
                  type="password" 
                  placeholder="Enter admin verification key"
                  value={authSecretKey}
                  onChange={(e) => setAuthSecretKey(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                />
              </div>
            )}

            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              {authMode === 'login' ? 'Access Control Desk' : 'Register Admin Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {authMode === 'login' ? (
                <>
                  Need to add a new admin?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Log In
                  </button>
                </>
              )}
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              ← Back to Shop front
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper navbar-width-limiter text-left">
      <div className="admin-header-row" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-main-title">Sanjay Sales Admin Control Desk</h2>
          <p className="page-main-subtitle">Commercial panel to manage inventory products, adjust wholesale prices, and configure frontpage layouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="secondary-b2b-btn" 
            onClick={() => {
              setIsAdminAuthenticated(false);
              setActionSuccess('Logged out successfully.');
            }}
            style={{ backgroundColor: '#fee2e2', color: 'var(--color-danger)', borderColor: '#fca5a5' }}
          >
            🔒 Log Out Admin
          </button>
          <button className="secondary-b2b-btn" onClick={() => navigate('/')}>
            ← Back to Shop front
          </button>
        </div>
      </div>

      {/* Admin Panel Tab toggles */}
      <div className="admin-tabs-row">
        <button 
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Manage Catalog Products
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Category Circle Images
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Rates Adjuster
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders Placed Log ({orders.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          Admin Accounts ({registeredAdmins.length})
        </button>
      </div>

      {/* SUCCESS POPUP MESSAGE */}
      {actionSuccess && <div className="modal-success-banner mt-4">{actionSuccess}</div>}
      {bulkSuccess && <div className="modal-success-banner mt-4">{bulkSuccess}</div>}

      {/* TAB 1: PRODUCT CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="admin-grid-layout mt-6">
          
          {/* Left Form: Add/Edit products */}
          <div className="admin-form-column">
            <div className="summary-card" id="admin-product-form">
              <h3>{editingId ? 'Edit Product Details' : 'Add New Wholesale Product'}</h3>
              <p className="gst-disclaimer">Create or modify inventory listings served to trade buyers.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleProductSubmit} className="login-form">
                
                <div className="form-group">
                  <label htmlFor="prod-name">Product Label/Name *</label>
                  <input 
                    type="text" 
                    id="prod-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cadbury Gems Mega Jar"
                    className={errors.name ? 'error-input' : ''}
                  />
                  {errors.name && <span className="input-error-msg">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="prod-brand">Manufacturer / Brand *</label>
                  <input 
                    type="text" 
                    id="prod-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Cadbury"
                    className={errors.brand ? 'error-input' : ''}
                  />
                  {errors.brand && <span className="input-error-msg">{errors.brand}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="prod-cat">Wholesale Category *</label>
                  <select 
                    id="prod-cat" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="pincode-input font-bold"
                    style={{ height: '42px', padding: '8px' }}
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-pack">Trade Pack Size *</label>
                  <input 
                    type="text" 
                    id="prod-pack"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. Carton of 24 packets"
                    className={errors.packSize ? 'error-input' : ''}
                  />
                  {errors.packSize && <span className="input-error-msg">{errors.packSize}</span>}
                </div>

                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-moq">Minimum Order Quantity (MOQ) *</label>
                    <input 
                      type="number" 
                      id="prod-moq"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      placeholder="e.g. 10"
                      className={errors.moq ? 'error-input' : ''}
                    />
                    {errors.moq && <span className="input-error-msg">{errors.moq}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-inv">Quantity / Stock Inventory *</label>
                    <input 
                      type="number" 
                      id="prod-inv"
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                      placeholder="e.g. 100"
                      className={errors.inventory ? 'error-input' : ''}
                    />
                    {errors.inventory && <span className="input-error-msg">{errors.inventory}</span>}
                  </div>
                </div>

                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-mrp">Standard MRP (₹) *</label>
                    <input 
                      type="number" 
                      id="prod-mrp"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      placeholder="MRP per pack"
                      className={errors.retailPrice ? 'error-input' : ''}
                    />
                    {errors.retailPrice && <span className="input-error-msg">{errors.retailPrice}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-whol">Distributor Rate (₹) *</label>
                    <input 
                      type="number" 
                      id="prod-whol"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Bulk rate ex. GST"
                      className={errors.wholesalePrice ? 'error-input' : ''}
                    />
                    {errors.wholesalePrice && <span className="input-error-msg">{errors.wholesalePrice}</span>}
                  </div>
                </div>

                {/* Tier 2 Configuration */}
                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-t2">Tier 2 Rate (₹)</label>
                    <input 
                      type="number" 
                      id="prod-t2"
                      value={tier2Price}
                      onChange={(e) => setTier2Price(e.target.value)}
                      placeholder="Leave blank for auto-5% off"
                      className={errors.tier2Price ? 'error-input' : ''}
                    />
                    {errors.tier2Price && <span className="input-error-msg">{errors.tier2Price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-t2-moq">Tier 2 MOQ (Qty Threshold)</label>
                    <input 
                      type="number" 
                      id="prod-t2-moq"
                      value={tier2Moq}
                      onChange={(e) => setTier2Moq(e.target.value)}
                      placeholder="Leave blank for base MOQ + 15"
                      className={errors.tier2Moq ? 'error-input' : ''}
                    />
                    {errors.tier2Moq && <span className="input-error-msg">{errors.tier2Moq}</span>}
                  </div>
                </div>

                {/* Tier 3 Configuration */}
                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-t3">Tier 3 Rate (₹)</label>
                    <input 
                      type="number" 
                      id="prod-t3"
                      value={tier3Price}
                      onChange={(e) => setTier3Price(e.target.value)}
                      placeholder="Leave blank for auto-10% off"
                      className={errors.tier3Price ? 'error-input' : ''}
                    />
                    {errors.tier3Price && <span className="input-error-msg">{errors.tier3Price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-t3-moq">Tier 3 MOQ (Qty Threshold)</label>
                    <input 
                      type="number" 
                      id="prod-t3-moq"
                      value={tier3Moq}
                      onChange={(e) => setTier3Moq(e.target.value)}
                      placeholder="Leave blank for base MOQ + 40"
                      className={errors.tier3Moq ? 'error-input' : ''}
                    />
                    {errors.tier3Moq && <span className="input-error-msg">{errors.tier3Moq}</span>}
                  </div>
                </div>

                {/* Product Image Source Selector (URL vs Upload) */}
                <div className="form-group">
                  <label>Product Image Source *</label>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setImageSourceType('link')}
                      className={`sort-tab-btn ${imageSourceType === 'link' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '11px', flex: 1 }}
                    >
                      Web URL Link
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setImageSourceType('upload')}
                      className={`sort-tab-btn ${imageSourceType === 'upload' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '11px', flex: 1 }}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageSourceType === 'link' ? (
                    <input 
                      type="text" 
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className={errors.imageUrl ? 'error-input' : ''}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className={errors.imageUrl ? 'error-input' : ''}
                        style={{ fontSize: '12px', padding: '6px' }}
                      />
                      {imageUrl && imageUrl.startsWith('data:') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={imageUrl} alt="Uploaded preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>✓ Image loaded successfully</span>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.imageUrl && <span className="input-error-msg">{errors.imageUrl}</span>}
                </div>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={isMostBought}
                    onChange={(e) => setIsMostBought(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Feature as Kirana Bestseller</span>
                </label>

                <div className="admin-form-actions-row">
                  <button type="submit" className="checkout-proceed-btn" style={{ flex: 2 }}>
                    {editingId ? 'Save Changes' : 'Publish Product'}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      className="drawer-clear-btn" 
                      onClick={handleCancelEdit}
                      style={{ flex: 1, padding: '0 12px' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* Right Column: Listing Table */}
          <div className="admin-table-column">
            <div className="summary-card" style={{ padding: '20px' }}>
              <div className="admin-search-header-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Active Store Inventory ({products.length})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={adminSearchInput}
                    onChange={(e) => setAdminSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    placeholder="Search active listings..."
                    className="pincode-input"
                    style={{ maxWidth: '200px', padding: '6px 12px', margin: 0 }}
                  />
                  <button 
                    type="button"
                    onClick={handleSearchSubmit}
                    className="pincode-btn font-bold"
                    style={{ padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Search
                  </button>
                  {adminSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSearchInput('');
                        setAdminSearch('');
                      }}
                      className="pincode-btn"
                      style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="admin-desktop-table-view">
                <div className="admin-table-scroll-container" style={{ overflowX: 'auto', maxHeight: '600px' }}>
                  <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Label & Brand</th>
                        <th>Segment</th>
                        <th className="text-right">MRP</th>
                        <th className="text-right">Dist. Rate</th>
                        <th className="text-center">MOQ</th>
                        <th className="text-center">Quantity (Stock)</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(prod => (
                        <tr key={prod.id}>
                          <td>
                            <div className="admin-item-details-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={prod.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                              <div>
                                <strong>{prod.name}</strong>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)' }}>Brand: {prod.brand} | {prod.packSize}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="gst-info-bubble">{prod.category}</span></td>
                          <td className="text-right">₹{prod.retailPrice}</td>
                          <td className="text-right font-bold">₹{prod.wholesalePrice}</td>
                          <td className="text-center">{prod.moq || 10}</td>
                          <td className="text-center font-bold" style={{ color: (prod.inventory !== undefined ? prod.inventory : 100) <= 0 ? 'var(--color-danger)' : (prod.inventory !== undefined ? prod.inventory : 100) < 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {prod.inventory !== undefined ? prod.inventory : 100}
                          </td>
                          <td className="text-center">
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                className="pincode-btn" 
                                onClick={() => handleEditClick(prod)}
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)' }}
                              >
                                Edit
                              </button>
                              <button 
                                className="pincode-btn" 
                                onClick={() => handleDeleteClick(prod.id, prod.name)}
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center" style={{ padding: '24px 0', color: 'var(--color-text-muted)' }}>
                            No active listings match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="admin-mobile-cards-view">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredProducts.map(prod => (
                    <div key={prod.id} className="admin-mobile-product-card" style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={prod.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ flexGrow: 1 }}>
                          <strong style={{ fontSize: '13px', display: 'block', textAlign: 'left' }}>{prod.name}</strong>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'left' }}>Brand: {prod.brand} | {prod.packSize}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          Segment: <span className="gst-info-bubble">{prod.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>MRP: <strong>₹{prod.retailPrice}</strong></span>
                          <span>Rate: <strong style={{ color: 'var(--color-primary)' }}>₹{prod.wholesalePrice}</strong></span>
                          <span>MOQ: <strong>{prod.moq || 10}</strong></span>
                          <span>Quantity: <strong style={{ color: (prod.inventory !== undefined ? prod.inventory : 100) <= 0 ? 'var(--color-danger)' : (prod.inventory !== undefined ? prod.inventory : 100) < 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>{prod.inventory !== undefined ? prod.inventory : 100}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button 
                          className="pincode-btn" 
                          onClick={() => handleEditClick(prod)}
                          style={{ flex: 1, padding: '8px', fontSize: '11px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit Product
                        </button>
                        <button 
                          className="pincode-btn" 
                          onClick={() => handleDeleteClick(prod.id, prod.name)}
                          style={{ flex: 1, padding: '8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', padding: '20px' }}>
                      No active listings match your filters.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: WHOLESALE CATEGORIES MANAGER */}
      {activeTab === 'categories' && (
        <div className="admin-grid-layout mt-6">
          {/* Left Form: Add New Category */}
          <div className="admin-form-column">
            <div className="summary-card">
              <h3>Create Wholesale Category</h3>
              <p className="gst-disclaimer">Add a new market segment to the distributor catalog.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleAddCategorySubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="new-cat-name">Category Title / Name *</label>
                  <input 
                    type="text" 
                    id="new-cat-name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Instant Food"
                    required
                    className="pincode-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-cat-img">Category Image URL *</label>
                  <input 
                    type="text" 
                    id="new-cat-img"
                    value={newCatImageUrl}
                    onChange={(e) => setNewCatImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/..."
                    required
                    className="pincode-input"
                  />
                </div>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={newCatShowOnHome}
                    onChange={(e) => setNewCatShowOnHome(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Show on Homepage Category Bar</span>
                </label>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={newCatShowProductsOnHome}
                    onChange={(e) => setNewCatShowProductsOnHome(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Show Product Slider on Homepage</span>
                </label>

                <div className="admin-form-actions-row">
                  <button type="submit" className="checkout-proceed-btn" style={{ flex: 1 }}>
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Listing & Edits */}
          <div className="admin-table-column">
            <div className="summary-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ margin: 0 }}>Wholesale Segments ({localCategories.length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="pincode-btn font-bold" 
                    onClick={handleSaveCategoriesConfig}
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="pincode-btn font-bold" 
                    onClick={handleRevertCategories}
                    style={{ backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Revert
                  </button>
                </div>
              </div>
              <div className="divider-card"></div>

              <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Category Name</th>
                      <th>Image URL Path</th>
                      <th className="text-center" style={{ width: '110px' }}>Show on Home</th>
                      <th className="text-center" style={{ width: '110px' }}>Product Slider</th>
                      <th className="text-center" style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCategories.map((cat, idx) => (
                      <tr key={cat.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={cat.imageUrl} 
                              alt="" 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Category';
                              }}
                            />
                            <strong>{cat.name}</strong>
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={cat.imageUrl} 
                            onChange={(e) => handleLocalCatImageChange(idx, e.target.value)}
                            placeholder="Image URL"
                            className="pincode-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px', margin: 0 }}
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={cat.showOnHome} 
                            onChange={(e) => handleLocalCatShowOnHomeToggle(idx, e.target.checked)}
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={cat.showProductsOnHome || false} 
                            onChange={(e) => handleLocalCatShowProductsOnHomeToggle(idx, e.target.checked)}
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="text-center">
                          <button 
                            type="button" 
                            className="pincode-btn" 
                            onClick={() => handleLocalCatDelete(cat.name)}
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {localCategories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ padding: '24px 0', color: 'var(--color-text-muted)' }}>
                          No categories defined. Add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK RATE MODIFIER & FACTORY RESET */}
      {activeTab === 'bulk' && (
        <div className="admin-grid-layout mt-6">
          
          {/* Rate adjuster */}
          <div className="summary-card">
            <h3>Mass Rate Revision Desk</h3>
            <p className="gst-disclaimer">Simulate instant percentage wholesale rate updates across the entire Sanjay Sales database.</p>
            <div className="divider-card"></div>

            <form onSubmit={handleBulkRateSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="bulk-percent">Pricing Revision Percentage (%) *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    id="bulk-percent" 
                    value={priceAdjPercent}
                    onChange={(e) => setPriceAdjPercent(e.target.value)}
                    placeholder="e.g. 5 for +5%, -10 for -10%"
                    className="pincode-input font-bold"
                  />
                  <span className="font-bold">%</span>
                </div>
                <span className="input-hint-text">
                  Entering positive numbers (e.g. <strong>5</strong>) hikes all distributor prices by 5% to handle raw material costs. Negative numbers discount all items globally.
                </span>
              </div>

              <button type="submit" className="checkout-proceed-btn mt-4" style={{ backgroundColor: 'var(--color-primary)' }}>
                Apply global rate shift
              </button>
            </form>
          </div>

          {/* Database Reset panel */}
          <div className="summary-card" style={{ borderColor: 'var(--color-danger)' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>Factory Database Reset</h3>
            <p className="gst-disclaimer">Revert all user-made modifications to the catalog list and category images back to factory original settings.</p>
            <div className="divider-card"></div>
            
            <p className="text-sm text-muted" style={{ marginBottom: '20px' }}>
              Warning: Resetting the database will delete any custom products, erase custom category images, and revert all pricing sheets back to original rates. This action is irreversible.
            </p>

            <button 
              type="button" 
              className="checkout-proceed-btn" 
              style={{ backgroundColor: 'var(--color-danger)', border: 'none', color: 'white' }}
              onClick={handleResetCatalogSubmit}
            >
              Restore Original Distributor Database
            </button>
          </div>

        </div>
      )}

      {/* TAB 4: INCOMING ORDERS LOG */}
      {activeTab === 'orders' && (
        <div className="summary-card mt-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Incoming Wholesale Order Shipments</h3>
              <p className="gst-disclaimer">Review compliance tax invoices and dispatch details for all placed orders.</p>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              Total Placed Orders: {orders.length}
            </div>
          </div>
          <div className="divider-card"></div>

          {orders.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>No orders have been placed yet.</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Orders checked out on the shopfront will populate here automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                return (
                  <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>ORDER ID: {order.id}</span>
                        <strong style={{ display: 'block', fontSize: '14px', marginTop: '2px' }}>
                          Placed on: {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </strong>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Client Business: <strong>{order.address?.businessName || order.address?.name}</strong> | Phone: <strong>{order.address?.phone}</strong>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>BILLING AMOUNT</span>
                        <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</span>
                        <span className="invoice-status-paid" style={{ display: 'inline-block', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '10px', marginTop: '4px' }}>PAID</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', textAlign: 'left' }}>
                        <strong>Delivery Destination:</strong> {order.address?.addressLine}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ display: 'block', fontSize: '12px', textAlign: 'left', marginBottom: '4px' }}>Items Summary ({itemsCount} units):</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', backgroundColor: 'white', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                              <span style={{ textAlign: 'left' }}>
                                <strong>{item.name}</strong> ({item.packSize}) x {item.quantity} packs
                              </span>
                              <strong>₹{(item.wholesalePrice * item.quantity).toLocaleString('en-IN')}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ADMIN ACCOUNTS PERSISTENCE & MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="admin-grid-layout mt-6">
          {/* Left Form: Add/Edit Admin Account */}
          <div className="admin-form-column">
            <div className="summary-card">
              <h3>{editingAdminId ? 'Edit Admin Credentials' : 'Register New Admin Account'}</h3>
              <p className="gst-disclaimer">Create, edit, or remove administrative users allowed to access this Control Desk.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleAdminAccountSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="admin-acc-id">Admin Username / ID *</label>
                  <input 
                    type="text" 
                    id="admin-acc-id"
                    value={adminAccId}
                    onChange={(e) => setAdminAccId(e.target.value.replace(/\s/g, ''))}
                    placeholder="e.g. vansh2005"
                    required
                    disabled={editingAdminId !== null}
                    className="pincode-input"
                    style={{ width: '100%', height: '42px', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-pass">Admin Password *</label>
                  <input 
                    type="text"
                    id="admin-acc-pass"
                    value={adminAccPassword}
                    onChange={(e) => setAdminAccPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="pincode-input"
                    style={{ width: '100%', height: '42px', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="submit" 
                    className="pincode-btn" 
                    style={{ flex: 1, backgroundColor: 'var(--color-primary)', color: 'white', height: '40px', fontWeight: 'bold' }}
                  >
                    {editingAdminId ? 'Save Changes' : 'Create Admin'}
                  </button>
                  {editingAdminId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEditAdmin} 
                      className="pincode-btn" 
                      style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#1e293b', height: '40px', fontWeight: 'bold' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Table: List of Admin Accounts */}
          <div className="admin-table-column">
            <div className="summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Registered Admins Database</h3>
                <span className="b2b-badge">{registeredAdmins.length} Active Accounts</span>
              </div>
              <div className="divider-card"></div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '12px' }}>Admin ID</th>
                      <th style={{ padding: '12px' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredAdmins.map((adminAcc) => (
                      <tr key={adminAcc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{adminAcc.id}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>{adminAcc.password}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            type="button"
                            onClick={() => handleEditAdminClick(adminAcc)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-primary)', 
                              fontWeight: 'bold', 
                              marginRight: '12px', 
                              cursor: 'pointer' 
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteAdminClick(adminAcc.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-danger)', 
                              fontWeight: 'bold', 
                              cursor: 'pointer' 
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

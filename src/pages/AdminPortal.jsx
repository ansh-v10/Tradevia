import React, { useState } from 'react';
import { allCategories } from '../util/productsData';

export default function AdminPortal({ 
  products, 
  categoryImages, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onUpdateCategoryImages, 
  onBulkAdjustPrices,
  onResetCatalog,
  setCurrentPage 
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'bulk'
  
  // Product Form states
  const [editingId, setEditingId] = useState(null); // null if adding
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(allCategories[0]);
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [packSize, setPackSize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isMostBought, setIsMostBought] = useState(false);
  const [moq, setMoq] = useState('10');
  const [errors, setErrors] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');

  // Image Source Tab: 'link' or 'upload'
  const [imageSourceType, setImageSourceType] = useState('link');

  // Category Form states
  const [localCategoryImages, setLocalCategoryImages] = useState({ ...categoryImages });

  // Bulk rate adjustment states
  const [priceAdjPercent, setPriceAdjPercent] = useState('5');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Search filter inside admin catalog
  const [adminSearch, setAdminSearch] = useState('');

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
    setCategory(allCategories[0]);
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');
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
    if (isNaN(retail) || retail <= 0) tempErrors.retailPrice = "Enter valid retail price";
    if (isNaN(wholesale) || wholesale <= 0) tempErrors.wholesalePrice = "Enter valid wholesale price";
    if (wholesale >= retail) tempErrors.wholesalePrice = "Wholesale price must be lower than MRP";
    if (isNaN(minOrderQty) || minOrderQty <= 0) tempErrors.moq = "Enter valid MOQ (at least 1)";

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
    setCategory(allCategories[0]);
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');

    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleDeleteClick = (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the wholesale catalog?`)) {
      onDeleteProduct(productId);
      setActionSuccess("Product deleted successfully!");
      setTimeout(() => setActionSuccess(''), 2000);
    }
  };

  const handleCategoryImageChange = (catName, url) => {
    setLocalCategoryImages(prev => ({ ...prev, [catName]: url }));
  };

  const handleCategorySave = (e) => {
    e.preventDefault();
    onUpdateCategoryImages(localCategoryImages);
    setBulkSuccess("Category circle images updated successfully!");
    setTimeout(() => setBulkSuccess(''), 2000);
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
      setLocalCategoryImages({
        "Chocolates & Candies": "cadbury_category.jpg",
        "Daily Use": "mop_category.jpg",
        "Home Essentials": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80",
        "Preservatives": "chips_category.jpg",
        "Sweets & Namkeen": "rasgulla_category.jpg",
        "Beverages": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80",
        "Grains & Masalas": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=150&q=80",
        "More": ""
      });
      setBulkSuccess("Wholesale database restored to factory settings!");
      setTimeout(() => setBulkSuccess(''), 3000);
    }
  };

  // Filter products by search query inside table
  const filteredProducts = products.filter(p => {
    const q = adminSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page-wrapper navbar-width-limiter text-left">
      <div className="admin-header-row" style={{ marginTop: '24px' }}>
        <div>
          <h2 className="page-main-title">Sanjay Sales Admin Control Desk</h2>
          <p className="page-main-subtitle">Commercial panel to manage inventory products, adjust wholesale prices, and configure frontpage layouts.</p>
        </div>
        <button className="secondary-b2b-btn" onClick={() => setCurrentPage('home')}>
          ← Back to Shop front
        </button>
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
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
              <div className="admin-search-header-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Active Store Inventory ({products.length})</h3>
                <input 
                  type="text" 
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Filter active listings..."
                  className="pincode-input"
                  style={{ maxWidth: '220px', padding: '6px 12px' }}
                />
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
                          <td colSpan={6} className="text-center" style={{ padding: '24px 0', color: 'var(--color-text-muted)' }}>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span>MRP: <strong>₹{prod.retailPrice}</strong></span>
                          <span>Rate: <strong style={{ color: 'var(--color-primary)' }}>₹{prod.wholesalePrice}</strong></span>
                          <span>MOQ: <strong>{prod.moq || 10}</strong></span>
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

      {/* TAB 2: CATEGORY CIRCLE IMAGES */}
      {activeTab === 'categories' && (
        <div className="summary-card mt-6" style={{ maxWidth: '800px' }}>
          <h3>Category Circle Media Manager</h3>
          <p className="gst-disclaimer">Swap the circular layout images featured on the home page dynamically.</p>
          <div className="divider-card"></div>

          <form onSubmit={handleCategorySave} className="login-form">
            <div className="admin-category-form-grid">
              {Object.keys(localCategoryImages).map(catName => {
                if (catName === 'More') return null; // "More" uses styled text
                return (
                  <div className="form-group" key={catName}>
                    <label>{catName}</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <img 
                        src={localCategoryImages[catName]} 
                        alt="" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', objectFit: 'cover' }} 
                      />
                      <input 
                        type="text" 
                        value={localCategoryImages[catName]} 
                        onChange={(e) => handleCategoryImageChange(catName, e.target.value)}
                        placeholder="Image URL or Path"
                        className="pincode-input"
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="submit" className="checkout-proceed-btn mt-6" style={{ maxWidth: '250px' }}>
              Save Category Images
            </button>
          </form>
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

    </div>
  );
}

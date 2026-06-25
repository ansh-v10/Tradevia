import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  allBrands,
  getTieredWholesalePrice,
  getPackMultiplier,
  getPackContainerName
} from '../util/productsData';
import { 
  StarIcon, 
  FilterIcon, 
  SortIcon, 
  CloseIcon, 
  SearchIcon 
} from '../components/Icons';

export default function Browse({ 
  products,
  searchQuery, 
  setSearchQuery, 
  selectedCategories, 
  setSelectedCategories, 
  selectedBrands,
  setSelectedBrands,
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  categories
}) {
  const categoriesList = categories ? categories.map(c => c.name) : [];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortOption, setSortOption] = useState('most-bought'); // 'alpha', 'price-low', 'price-high', 'most-bought'
  const [quantities, setQuantities] = useState({}); // { productId: qty }
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(true);

  // Mobile Bottom Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // true/false
  const [mobileDrawerTab, setMobileDrawerTab] = useState('category'); // 'category', 'brand', 'sort'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      setBrowseLoading(false);
    }
  }, [products]);

  // Read URL params on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
    const cat = searchParams.get('category');
    if (cat && !selectedCategories.includes(cat)) {
      setSelectedCategories([cat]);
    }
    const brand = searchParams.get('brand');
    if (brand && !selectedBrands.includes(brand)) {
      setSelectedBrands([brand]);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedBrands, showInStockOnly, sortOption]);

  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleBrandToggle = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSearchQuery('');
    setSortOption('most-bought');
    setShowInStockOnly(false);
  };

  // Filter and Sort Logic consuming dynamic products prop
  const filteredProducts = products
    .filter(product => {
      if (!product) return false;
      // 1. Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesCat) return false;
      }

      // 2. Category Filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(product.category)) return false;
      }

      // 3. Brand Filter
      if (selectedBrands.length > 0) {
        if (!selectedBrands.includes(product.brand)) return false;
      }

      // 4. In Stock Filter
      if (showInStockOnly) {
        const stockCount = product.inventory !== undefined ? product.inventory : 100;
        if (stockCount <= 0) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Out of stock sorting: sort out-of-stock (inventory <= 0) to the bottom
      const isOutOfStockA = (a.inventory !== undefined ? a.inventory : 100) <= 0 ? 1 : 0;
      const isOutOfStockB = (b.inventory !== undefined ? b.inventory : 100) <= 0 ? 1 : 0;
      
      if (isOutOfStockA !== isOutOfStockB) {
        return isOutOfStockA - isOutOfStockB; // 0 (in-stock) comes before 1 (out-of-stock)
      }

      // 5. Sort Option Logic
      if (sortOption === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'price-low') {
        return a.wholesalePrice - b.wholesalePrice;
      }
      if (sortOption === 'price-high') {
        return b.wholesalePrice - a.wholesalePrice;
      }
      if (sortOption === 'most-bought') {
        const isBestsellerA = a.isMostBought ? 1 : 0;
        const isBestsellerB = b.isMostBought ? 1 : 0;
        if (isBestsellerB !== isBestsellerA) {
          return isBestsellerB - isBestsellerA;
        }
        return b.reviewsCount - a.reviewsCount;
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openMobileDrawer = (tab) => {
    setMobileDrawerTab(tab);
    setMobileDrawerOpen(true);
  };

  if (browseLoading) {
    return (
      <div className="browse-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Loading products...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page-wrapper">
      <div className="navbar-width-limiter browse-flex-layout">
        
        {/* Left Sidebar Filter Panel (Desktop Only) */}
        <aside className="browse-sidebar">
          
          <div className="sidebar-header-flex">
            <h3>Filter Products</h3>
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery || showInStockOnly) && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="search-query-card">
              <span>Search query: <strong>"{searchQuery}"</strong></span>
              <button className="clear-search-x" onClick={() => setSearchQuery('')}>×</button>
            </div>
          )}

          {/* Availability Filter Group */}
          <div className="filter-group-wrapper" style={{ marginBottom: '20px' }}>
            <h4 className="filter-group-title">Availability</h4>
            <div className="filter-checkbox-list">
              <label className="checkbox-label-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  className="custom-checkbox"
                />
                <span className="checkbox-text-label" style={{ fontWeight: '700', color: 'var(--color-success)' }}>In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Category Filter Group */}
          <div className="filter-group-wrapper">
            <h4 className="filter-group-title">Wholesale Segment</h4>
            <div className="filter-checkbox-list">
              {categoriesList.map((category) => (
                <label key={category} className="checkbox-label-row">
                  <input 
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter Group */}
          <div className="filter-group-wrapper mt-6">
            <h4 className="filter-group-title">Commercial Brands</h4>
            <div className="filter-checkbox-list scrollable-brand-list">
              {allBrands.map((brand) => (
                <label key={brand} className="checkbox-label-row">
                  <input 
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* B2B Promo Side Banner */}
          <div className="b2b-sidebar-promo-card">
            <h5>Bulk Carton Shipping</h5>
            <p>Combine multiple brands in a single pallet order. Unlock free freight at ₹25,000.</p>
          </div>

        </aside>

        {/* Main Product Catalog Section */}
        <main className="browse-main-content">
          
          {/* Header Controls Bar */}
          <div className="catalog-header-controls">
            <div className="catalog-title-wrap">
              <h2>{searchQuery ? `Search: "${searchQuery}"` : 'Commercial Catalog'}</h2>
              <p className="catalog-counter-text">
                <strong>{filteredProducts.length}</strong> result{filteredProducts.length !== 1 ? 's' : ''}
                {searchQuery && ' found'}
                {!searchQuery && selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
              </p>
            </div>

            {/* Desktop Sorting Controls */}
            <div className="desktop-sorting-actions">
              <span className="sort-label">Sort By:</span>
              <button 
                className={`sort-tab-btn ${sortOption === 'most-bought' ? 'active' : ''}`}
                onClick={() => setSortOption('most-bought')}
              >
                Most Bought
              </button>
              <button 
                className={`sort-tab-btn ${sortOption === 'price-low' ? 'active' : ''}`}
                onClick={() => setSortOption('price-low')}
              >
                Price: Low to High
              </button>
              <button 
                className={`sort-tab-btn ${sortOption === 'price-high' ? 'active' : ''}`}
                onClick={() => setSortOption('price-high')}
              >
                Price: High to Low
              </button>
              <button 
                className={`sort-tab-btn ${sortOption === 'alpha' ? 'active' : ''}`}
                onClick={() => setSortOption('alpha')}
              >
                Alphabetical (A-Z)
              </button>
            </div>
          </div>

          {/* Empty Results State */}
          {filteredProducts.length === 0 && (
            <div className="empty-catalog-results">
              <SearchIcon size={48} className="empty-search-svg" />
              <h3>No wholesale items matched your filters</h3>
              <p>Try clearing your active filters or expanding search terms to explore general wholesale catalogs.</p>
              <button className="primary-b2b-btn" onClick={clearAllFilters}>
                View All Products
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="products-grid-layout">
            {paginatedProducts.map((product) => {
              const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
              const unitDiscount = product.retailPrice - product.wholesalePrice;
              
              return (
                <div key={product.id} className="product-card-unit" style={{ position: 'relative' }}>
                  {product.isMostBought && (
                    <span className="card-tag bestseller-tag">Bestseller</span>
                  )}
                  {unitDiscount > 30 && (
                    <span className="card-tag saver-tag">Super Saver</span>
                  )}

                  {/* Wishlist heart */}
                  {onToggleWishlist && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                      aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Product Image */}
                  <div className="product-image-container" onClick={() => navigate('/product/' + product.id)} style={{ cursor: 'pointer' }}>
                    <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                  </div>

                  {/* Product details */}
                  <div className="product-details-container">
                    <span className="product-brand-tag">{product.brand}</span>
                    <h3 className="product-name-heading" onClick={() => navigate('/product/' + product.id)} style={{ cursor: 'pointer' }}>{product.name}</h3>
                    <span className="product-pack-size">{product.packSize}</span>

                    {/* Ratings */}
                    <div className="product-rating-row">
                      <div className="stars-wrap">
                        <StarIcon className="star-icon" />
                        <span className="rating-val">{product.rating}</span>
                      </div>
                      <span className="reviews-cnt">({product.reviewsCount} orders)</span>
                    </div>

                    <div className="divider-card"></div>

                    {/* B2B Margin Savings indicator */}
                    <div className="b2b-savings-indicator-block">
                      <span className="bulk-save-label">Wholesale Savings:</span>
                      <span className="bulk-save-value">Save ₹{unitDiscount} per unit (MRP ₹{product.retailPrice})</span>
                    </div>

                    {/* Price Selector */}
                    <div className="price-checkout-row">
                      <div className="price-stack">
                        <span className="wholesale-deal-price">
                          ₹{getTieredWholesalePrice(product, qty)} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(₹{(getTieredWholesalePrice(product, qty) * getPackMultiplier(product.packSize)).toLocaleString('en-IN')}/{getPackContainerName(product.packSize)})</span>
                        </span>
                        <span className="price-gst-sub">excl. 18% GST (MRP ₹{product.retailPrice}/unit, ₹{product.retailPrice * getPackMultiplier(product.packSize)}/{getPackContainerName(product.packSize)})</span>
                      </div>
                    </div>

                    {/* Volume Price Breaks (ex. GST) */}
                    {(() => {
                      const baseMoq = product.moq || 10;
                      const t2Moq = product.tier2Moq !== undefined && product.tier2Moq !== null && product.tier2Moq !== ""
                        ? parseInt(product.tier2Moq)
                        : baseMoq + 15;
                      const t3Moq = product.tier3Moq !== undefined && product.tier3Moq !== null && product.tier3Moq !== ""
                        ? parseInt(product.tier3Moq)
                        : baseMoq + 40;
                      const currentQty = parseInt(qty) || 0;
                      const multiplier = getPackMultiplier(product.packSize);
                      const container = getPackContainerName(product.packSize);

                      return (
                        <div className="tiered-pricing-breaks" style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', margin: '8px 0 12px', border: '1px dashed var(--color-border)' }}>
                          <div style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--color-text-main)', textAlign: 'left' }}>Volume Price Breaks (ex. GST):</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>MOQ ({baseMoq}{t2Moq - 1 > baseMoq ? ` - ${t2Moq - 1}` : ''} packs):</span>
                            <strong style={{ color: currentQty < t2Moq ? 'var(--color-primary)' : 'inherit' }}>₹{product.wholesalePrice}/unit (₹{product.wholesalePrice * multiplier}/{container})</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>Medium ({t2Moq}{t3Moq - 1 > t2Moq ? ` - ${t3Moq - 1}` : ''} packs):</span>
                            <strong style={{ color: currentQty >= t2Moq && currentQty < t3Moq ? 'var(--color-primary)' : 'inherit' }}>₹{getTieredWholesalePrice(product, t2Moq)}/unit (₹{getTieredWholesalePrice(product, t2Moq) * multiplier}/{container})</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Bulk ({t3Moq}+ packs):</span>
                            <strong style={{ color: currentQty >= t3Moq ? 'var(--color-primary)' : 'inherit' }}>₹{getTieredWholesalePrice(product, t3Moq)}/unit (₹{getTieredWholesalePrice(product, t3Moq) * multiplier}/{container})</strong>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stock Status Indicator */}
                    <div style={{ marginTop: '4px', marginBottom: '8px', fontSize: '12px', textAlign: 'left' }}>
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>❌ Out of Stock</span>
                      ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>left in stock : {product.inventory}</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock ({product.inventory !== undefined ? product.inventory : 100} packs)</span>
                      )}
                    </div>

                    {/* Add to Cart button widget */}
                    <div className="b2b-action-row-inline" style={{ marginTop: '12px' }}>
                      <div className="qty-selector-container">
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) - 1)}
                          disabled={(parseInt(qty) || 0) <= (product.moq || 10)}
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          className="qty-input"
                          value={qty}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const parsed = parseInt(valStr);
                            handleQuantityChange(product.id, valStr === '' ? '' : (isNaN(parsed) ? valStr : parsed));
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            const moqVal = product.moq || 10;
                            if (isNaN(val) || val < moqVal) {
                              handleQuantityChange(product.id, moqVal);
                            } else {
                              handleQuantityChange(product.id, val);
                            }
                          }}
                        />
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        className="add-to-cart-b2b-btn"
                        onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                        disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
                        style={(product.inventory !== undefined ? product.inventory : 100) <= 0 ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' } : {}}
                      >
                        ADD
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: currentPage === 1 ? '#f1f5f9' : '#fff',
                  color: currentPage === 1 ? '#94a3b8' : 'var(--color-text-main)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: currentPage === page ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: '6px',
                        background: currentPage === page ? 'var(--color-primary)' : '#fff',
                        color: currentPage === page ? '#fff' : 'var(--color-text-main)',
                        cursor: 'pointer',
                        fontWeight: currentPage === page ? '700' : '400',
                        fontSize: '13px'
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? '#f1f5f9' : '#fff',
                  color: currentPage === totalPages ? '#94a3b8' : 'var(--color-text-main)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                Next
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Floating Responsive Mobile Filter Menu Bar (Sticky Bottom) */}
      <div className="mobile-floating-bar-wrapper">
        <div className="mobile-action-bar">
          <button className="mobile-action-tab" onClick={() => openMobileDrawer('category')}>
            <FilterIcon size={16} />
            <span>Category ({selectedCategories.length})</span>
          </button>
          <span className="bar-split">|</span>
          <button className="mobile-action-tab" onClick={() => openMobileDrawer('brand')}>
            <FilterIcon size={16} />
            <span>Brands ({selectedBrands.length})</span>
          </button>
          <span className="bar-split">|</span>
          <button className="mobile-action-tab" onClick={() => openMobileDrawer('sort')}>
            <SortIcon size={16} />
            <span>Sort By</span>
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Bottom Sheet Overlay */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="drawer-header-row">
              <h3>
                {mobileDrawerTab === 'category' && 'Filter Categories'}
                {mobileDrawerTab === 'brand' && 'Filter Brands'}
                {mobileDrawerTab === 'sort' && 'Sort Catalog'}
              </h3>
              <button className="close-drawer-btn" onClick={() => setMobileDrawerOpen(false)}>
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Common Filter Options inside Drawer */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center' }}>
              <label className="drawer-label-row" style={{ margin: 0, width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  className="custom-checkbox"
                />
                <span className="checkbox-text-label" style={{ fontWeight: '700', color: 'var(--color-success)', fontSize: '13px' }}>✓ Show In-Stock Products Only</span>
              </label>
            </div>

            {/* Drawer Content */}
            <div className="drawer-content-scrollable">
              
              {/* Tab 1: Categories checkboxes */}
              {mobileDrawerTab === 'category' && (
                <div className="drawer-checkbox-list">
                  {categoriesList.map((category) => (
                    <label key={category} className="drawer-label-row">
                      <input 
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-text-label">{category}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Tab 2: Brands checkboxes */}
              {mobileDrawerTab === 'brand' && (
                <div className="drawer-checkbox-list">
                  {allBrands.map((brand) => (
                    <label key={brand} className="drawer-label-row">
                      <input 
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-text-label">{brand}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Tab 3: Sort Options Radios */}
              {mobileDrawerTab === 'sort' && (
                <div className="drawer-radio-list">
                  <label className="drawer-label-row">
                    <input 
                      type="radio" 
                      name="mobile-sort"
                      checked={sortOption === 'most-bought'}
                      onChange={() => setSortOption('most-bought')}
                      className="custom-radio"
                    />
                    <span className="checkbox-text-label">Most Bought</span>
                  </label>
                  <label className="drawer-label-row">
                    <input 
                      type="radio" 
                      name="mobile-sort"
                      checked={sortOption === 'price-low'}
                      onChange={() => setSortOption('price-low')}
                      className="custom-radio"
                    />
                    <span className="checkbox-text-label">Price: Low to High</span>
                  </label>
                  <label className="drawer-label-row">
                    <input 
                      type="radio" 
                      name="mobile-sort"
                      checked={sortOption === 'price-high'}
                      onChange={() => setSortOption('price-high')}
                      className="custom-radio"
                    />
                    <span className="checkbox-text-label">Price: High to Low</span>
                  </label>
                  <label className="drawer-label-row">
                    <input 
                      type="radio" 
                      name="mobile-sort"
                      checked={sortOption === 'alpha'}
                      onChange={() => setSortOption('alpha')}
                      className="custom-radio"
                    />
                    <span className="checkbox-text-label">Alphabetical (A-Z)</span>
                  </label>
                </div>
              )}

            </div>

            {/* Drawer Actions */}
            <div className="drawer-footer-actions">
              <button className="drawer-clear-btn" onClick={clearAllFilters}>
                Reset
              </button>
              <button className="drawer-apply-btn" onClick={() => setMobileDrawerOpen(false)}>
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

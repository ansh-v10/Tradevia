import React, { useState, useEffect } from 'react';
import { 
  allCategories, 
  allBrands,
  getTieredWholesalePrice
} from '../util/productsData';
import { 
  StarIcon, 
  FilterIcon, 
  SortIcon, 
  CloseIcon, 
  SearchIcon 
} from '../components/Icons';

export default function Browse({ 
  products, // dynamic state array passed from App.jsx
  searchQuery, 
  setSearchQuery, 
  selectedCategories, 
  setSelectedCategories, 
  selectedBrands,
  setSelectedBrands,
  onAddToCart 
}) {
  const [sortOption, setSortOption] = useState('most-bought'); // 'alpha', 'price-low', 'price-high', 'most-bought'
  const [quantities, setQuantities] = useState({}); // { productId: qty }

  // Mobile Bottom Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // true/false
  const [mobileDrawerTab, setMobileDrawerTab] = useState('category'); // 'category', 'brand', 'sort'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const handleQuantityChange = (productId, val, moqVal = 10) => {
    const qty = Math.max(moqVal, parseInt(val) || moqVal);
    setQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSearchQuery('');
    setSortOption('most-bought');
  };

  // Filter and Sort Logic consuming dynamic products prop
  const filteredProducts = products
    .filter(product => {
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

      return true;
    })
    .sort((a, b) => {
      // 4. Sort Logic
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

  const openMobileDrawer = (tab) => {
    setMobileDrawerTab(tab);
    setMobileDrawerOpen(true);
  };

  return (
    <div className="browse-page-wrapper">
      <div className="navbar-width-limiter browse-flex-layout">
        
        {/* Left Sidebar Filter Panel (Desktop Only) */}
        <aside className="browse-sidebar">
          
          <div className="sidebar-header-flex">
            <h3>Filter Products</h3>
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery) && (
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

          {/* Category Filter Group */}
          <div className="filter-group-wrapper">
            <h4 className="filter-group-title">Wholesale Segment</h4>
            <div className="filter-checkbox-list">
              {allCategories.map((category) => (
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
              <h2>Commercial Catalog</h2>
              <p className="catalog-counter-text">
                Showing <strong>{filteredProducts.length}</strong> items 
                {selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
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
            {filteredProducts.map((product) => {
              const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
              const unitDiscount = product.retailPrice - product.wholesalePrice;
              
              return (
                <div key={product.id} className="product-card-unit">
                  {product.isMostBought && (
                    <span className="card-tag bestseller-tag">Bestseller</span>
                  )}
                  {unitDiscount > 30 && (
                    <span className="card-tag saver-tag">Super Saver</span>
                  )}
                  
                  {/* Product Image */}
                  <div className="product-image-container">
                    <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                  </div>

                  {/* Product details */}
                  <div className="product-details-container">
                    <span className="product-brand-tag">{product.brand}</span>
                    <h3 className="product-name-heading">{product.name}</h3>
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

                    {/* Price & Quantity Selector */}
                    <div className="price-checkout-row">
                      <div className="price-stack">
                        <span className="wholesale-deal-price">₹{getTieredWholesalePrice(product, qty)}</span>
                        <span className="price-gst-sub">excl. 18% GST</span>
                      </div>

                      {/* Quantity Incrementor */}
                      <div className="qty-selector-container">
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(product.id, qty - 1, product.moq || 10)}
                          disabled={qty <= (product.moq || 10)}
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          className="qty-input"
                          value={qty}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value, product.moq || 10)}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (isNaN(val) || val < (product.moq || 10)) {
                              handleQuantityChange(product.id, product.moq || 10, product.moq || 10);
                            }
                          }}
                        />
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(product.id, qty + 1, product.moq || 10)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Volume Price Breaks (ex. GST) */}
                    <div className="tiered-pricing-breaks" style={{ fontSize: '11px', color: 'var(--color-text-muted)', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', margin: '8px 0 12px', border: '1px dashed var(--color-border)' }}>
                      <div style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--color-text-main)', textAlign: 'left' }}>Volume Price Breaks (ex. GST):</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>MOQ ({product.moq || 10} - { (product.moq || 10) + 14 } packs):</span>
                        <strong style={{ color: qty < (product.moq || 10) + 15 ? 'var(--color-primary)' : 'inherit' }}>₹{product.wholesalePrice}/pack</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Medium ({ (product.moq || 10) + 15 } - { (product.moq || 10) + 39 } packs):</span>
                        <strong style={{ color: qty >= (product.moq || 10) + 15 && qty < (product.moq || 10) + 40 ? 'var(--color-primary)' : 'inherit' }}>₹{getTieredWholesalePrice(product, (product.moq || 10) + 15)}/pack</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Bulk ({ (product.moq || 10) + 40 }+ packs):</span>
                        <strong style={{ color: qty >= (product.moq || 10) + 40 ? 'var(--color-primary)' : 'inherit' }}>₹{getTieredWholesalePrice(product, (product.moq || 10) + 40)}/pack</strong>
                      </div>
                    </div>

                    {/* Stock Status Indicator */}
                    <div style={{ marginTop: '4px', marginBottom: '8px', fontSize: '12px', textAlign: 'left' }}>
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>❌ Out of Stock</span>
                      ) : (product.inventory !== undefined ? product.inventory : 100) < 30 ? (
                        <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>⚠️ Only {product.inventory} bulk packs left!</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock ({product.inventory !== undefined ? product.inventory : 100} packs)</span>
                      )}
                    </div>

                    {/* Add to Cart button */}
                    <button 
                      className="add-to-cart-b2b-btn"
                      onClick={() => onAddToCart(product, qty)}
                      disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
                      style={(product.inventory !== undefined ? product.inventory : 100) <= 0 ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' } : {}}
                    >
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? 'Out of Stock' : `Add Bulk Pack (${qty})`}
                    </button>

                  </div>
                </div>
              );
            })}
          </div>

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

            {/* Drawer Content */}
            <div className="drawer-content-scrollable">
              
              {/* Tab 1: Categories checkboxes */}
              {mobileDrawerTab === 'category' && (
                <div className="drawer-checkbox-list">
                  {allCategories.map((category) => (
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

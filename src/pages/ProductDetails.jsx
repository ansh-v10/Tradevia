import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTieredWholesalePrice } from '../util/productsData';

export default function ProductDetails({
  products = [],
  cart = [],
  onAddToCart,
  onOpenLoginModal
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const product = products.find((p) => p.id === parseInt(id));
  
  const [qty, setQty] = useState(product?.moq || 10);
  const [successMsg, setSuccessMsg] = useState('');
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  // Sync quantity MOQ when product changes and scroll to top
  useEffect(() => {
    if (product) {
      setQty(product.moq || 10);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product, id]);

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 8);

  const bestSellers = products
    .filter((p) => p.isMostBought && p.id !== product.id)
    .slice(0, 8);

  if (!product) {
    return (
      <div className="navbar-width-limiter" style={{ padding: '64px 0', textAlign: 'center', minHeight: '60vh' }}>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist or has been removed from the wholesale catalog.</p>
        <button className="primary-b2b-btn" style={{ marginTop: '16px' }} onClick={() => navigate('/browse')}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const moqVal = product.moq || 10;
  const t2Moq = product.tier2Moq !== undefined && product.tier2Moq !== null && product.tier2Moq !== ""
    ? parseInt(product.tier2Moq)
    : moqVal + 15;
  const t3Moq = product.tier3Moq !== undefined && product.tier3Moq !== null && product.tier3Moq !== ""
    ? parseInt(product.tier3Moq)
    : moqVal + 40;

  const priceTier1 = product.wholesalePrice;
  const priceTier2 = getTieredWholesalePrice(product, t2Moq);
  const priceTier3 = getTieredWholesalePrice(product, t3Moq);

  const activePrice = getTieredWholesalePrice(product, qty);
  const totalCost = activePrice * qty;
  const marginPerUnit = product.retailPrice - activePrice;
  const marginPercent = Math.round((marginPerUnit / product.retailPrice) * 100);
  const totalSavings = (product.retailPrice - activePrice) * qty;

  const handleQtyChange = (val) => {
    if (val === '') {
      setQty('');
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setQty(parsed);
    }
  };

  const handleQtyBlur = () => {
    const parsed = parseInt(qty);
    if (isNaN(parsed) || parsed < moqVal) {
      setQty(moqVal);
    } else {
      setQty(parsed);
    }
  };

  const handleAddToCartClick = () => {
    const finalQty = parseInt(qty) || moqVal;
    if (onAddToCart) {
      onAddToCart(product, finalQty);
      setSuccessMsg(`Added ${finalQty} packs of ${product.name} to your wholesale cart!`);
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }
  };

  return (
    <div className="product-details-page-wrapper navbar-width-limiter" style={{ padding: '32px 0 64px', textAlign: 'left' }}>
      
      {/* Breadcrumbs */}
      <div className="breadcrumbs-row" style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px', flexWrap: 'wrap' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/browse')}>{product.category}</span>
        <span>/</span>
        <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{product.name}</span>
      </div>

      <div className="details-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: Product Image Card */}
        <div className="summary-card" style={{ padding: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', minHeight: '350px' }}>
          {marginPercent >= 18 && (
            <span className="card-tag saver-tag" style={{ backgroundColor: 'var(--color-success)', color: 'white', fontWeight: '800', position: 'absolute', top: '16px', left: '16px', fontSize: '11px', padding: '4px 10px', borderRadius: '4px' }}>
              HIGH MARGIN ({marginPercent}%)
            </span>
          )}
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', padding: '16px' }} 
          />
        </div>

        {/* Right Column: Information Desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {product.brand} Wholesale
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 4px', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              <span>Pack Size: <strong>{product.packSize}</strong></span>
              <span>•</span>
              <span>Category: <strong>{product.category}</strong></span>
            </div>
          </div>

          <div className="divider-card" style={{ margin: '4px 0' }}></div>

          {/* Stock Level and Savings Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Currently Out of Stock</span>
              ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>⚠️ Low Stock: Only {product.inventory} packs left</span>
              ) : (
                <span style={{ color: 'var(--color-success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
                  In stock (Ready to dispatch)
                </span>
              )}
            </div>

            {/* B2B Margin Savings Box */}
            <div className="savings-badge-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-muted)' }}>Retail Margin (MRP vs Trade rate)</span>
                <span style={{ fontSize: '12px', backgroundColor: 'var(--color-success)', color: 'white', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                  {marginPercent}% MARGIN
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)', marginTop: '8px' }}>
                Save ₹{marginPerUnit.toLocaleString('en-IN')} per pack
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                (Standard Store MRP: ₹{product.retailPrice} | Base wholesale rate: ₹{product.wholesalePrice})
              </div>
            </div>
          </div>

          {/* Pricing Tiers Table */}
          <div className="summary-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-primary)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700', color: 'var(--color-primary-dark)' }}>
              Volume Price Breaks
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: qty < t2Moq ? '700' : '400', color: qty < t2Moq ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                <span>Base Tier ({moqVal} - {t2Moq - 1} packs):</span>
                <span>₹{priceTier1} / pack</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: qty >= t2Moq && qty < t3Moq ? '700' : '400', color: qty >= t2Moq && qty < t3Moq ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                <span>Medium Tier ({t2Moq} - {t3Moq - 1} packs):</span>
                <span>₹{priceTier2} / pack <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>(~5% Off)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: qty >= t3Moq ? '700' : '400', color: qty >= t3Moq ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                <span>Bulk Tier ({t3Moq}+ packs):</span>
                <span>₹{priceTier3} / pack <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>(~10% Off)</span></span>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '8px' }}>
              *Price breaks apply dynamically based on quantity set below. Excludes 18% GST.
            </div>
          </div>

          {/* Action Row */}
          <div className="product-action-block" style={{ border: '1px solid var(--color-border)', padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-main)' }}>
            
            {/* Live Calculation preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Estimated Subtotal ({qty} packs):</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                  ₹{totalCost.toLocaleString('en-IN')}
                </span>
                {totalSavings > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '700' }}>
                    Saves ₹{totalSavings.toLocaleString('en-IN')} on MRP!
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              
              {/* Custom Quantity increment/decrement bar */}
              <div className="qty-selector-container" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '6px', height: '44px', overflow: 'hidden', backgroundColor: '#ffffff', width: '130px' }}>
                <button 
                  type="button" 
                  onClick={() => setQty((prev) => Math.max(moqVal, (parseInt(prev) || moqVal) - 1))}
                  disabled={(parseInt(qty) || 0) <= moqVal}
                  style={{ border: 'none', background: 'none', width: '36px', height: '100%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                  -
                </button>
                <input 
                  type="text" 
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  onBlur={handleQtyBlur}
                  style={{ width: '100%', border: 'none', background: 'none', textAlign: 'center', fontWeight: '800', fontSize: '15px', padding: 0 }}
                />
                <button 
                  type="button" 
                  onClick={() => setQty((prev) => (parseInt(prev) || moqVal) + 1)}
                  style={{ border: 'none', background: 'none', width: '36px', height: '100%', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                  +
                </button>
              </div>

              {/* ADD Button */}
              <button 
                className="add-to-cart-b2b-btn"
                onClick={handleAddToCartClick}
                disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
                style={{ 
                  height: '44px', 
                  flex: '1', 
                  fontSize: '15px', 
                  fontWeight: '800', 
                  borderRadius: '6px',
                  backgroundColor: (product.inventory !== undefined ? product.inventory : 100) <= 0 ? '#cbd5e1' : 'var(--color-primary)', 
                  color: (product.inventory !== undefined ? product.inventory : 100) <= 0 ? '#64748b' : 'white', 
                  cursor: (product.inventory !== undefined ? product.inventory : 100) <= 0 ? 'not-allowed' : 'pointer', 
                  border: 'none',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? 'OUT OF STOCK' : 'ADD'}
              </button>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'left' }}>
              *Minimum Order Quantity for this product is <strong>{moqVal} packs</strong>.
            </div>
          </div>

          {successMsg && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', fontSize: '14px', animation: 'fadeIn 0.2s ease' }}>
              {successMsg}
            </div>
          )}

          {/* Specs List */}
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Wholesale Specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Brand:</span>
                <span style={{ fontWeight: '600' }}>{product.brand}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Pack Unit:</span>
                <span style={{ fontWeight: '600' }}>{product.packSize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Min Order MOQ:</span>
                <span style={{ fontWeight: '600' }}>{moqVal} packs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>GST Classification:</span>
                <span style={{ fontWeight: '600' }}>18% Standard GST</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* More from this category */}
      {relatedProducts.length > 0 && (
        <section className="super-saver-section" style={{ marginTop: '48px', padding: '0' }}>
          <div className="section-header-flex">
            <div>
              <h2 className="section-title text-left" style={{ fontSize: '22px', fontWeight: '800' }}>More from {product.category}</h2>
              <p className="section-subtitle text-left">Explore other wholesale deals in this segment</p>
            </div>
          </div>

          <div className="products-horizontal-scroller">
            {relatedProducts.map((p) => {
              const margin = Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100);
              const cardQty = quantities[p.id] !== undefined ? quantities[p.id] : (p.moq || 10);
              const discountPercent = Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100);
              return (
                <div key={p.id} className="product-card-unit home-scroll-card">
                  <div className="margin-overlay-badge">{margin}% Margin</div>
                  {discountPercent > 18 && (
                    <div className="bestseller-ribbon" style={{ top: '34px' }}>Saver Deal</div>
                  )}
                  <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + p.id)}>
                    <img src={p.imageUrl} alt={p.name} className="product-card-img" />
                  </div>
                  <div className="product-details-container">
                    <h3 className="product-name-heading" onClick={() => navigate('/product/' + p.id)}>
                      {p.name}
                    </h3>
                    
                    <div className="divider-card" style={{ margin: '8px 0' }}></div>

                    <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                      {(p.inventory !== undefined ? p.inventory : 100) <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                      ) : (p.inventory !== undefined ? p.inventory : 100) < 10 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {p.inventory}</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                      )}
                    </div>

                    <div className="price-actions-flex-row-blinkit">
                      <div className="price-stack">
                        <span className="mrp-txt">MRP ₹{p.retailPrice}</span>
                        <span className="wholesale-deal-price" style={{ margin: 0 }}>₹{getTieredWholesalePrice(p, cardQty)}</span>
                      </div>

                      <div className="b2b-action-row-inline">
                        <div className="qty-selector-container">
                          <button 
                            className="qty-btn"
                            type="button"
                            onClick={() => handleQuantityChange(p.id, (parseInt(cardQty) || 10) - 1)}
                            disabled={(parseInt(cardQty) || 0) <= (p.moq || 10)}
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            className="qty-input"
                            value={cardQty}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const parsed = parseInt(valStr);
                              handleQuantityChange(p.id, valStr === '' ? '' : (isNaN(parsed) ? valStr : parsed));
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              const moqVal = p.moq || 10;
                              if (isNaN(val) || val < moqVal) {
                                handleQuantityChange(p.id, moqVal);
                              } else {
                                handleQuantityChange(p.id, val);
                              }
                            }}
                          />
                          <button 
                            className="qty-btn"
                            type="button"
                            onClick={() => handleQuantityChange(p.id, (parseInt(cardQty) || 10) + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button 
                          className="add-to-cart-b2b-btn" 
                          onClick={() => onAddToCart(p, parseInt(cardQty) || p.moq || 10)}
                          disabled={(p.inventory !== undefined ? p.inventory : 100) <= 0}
                        >
                          ADD
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="most-bought-section" style={{ marginTop: '48px', padding: '0' }}>
          <div className="section-header-flex">
            <div>
              <h2 className="section-title text-left" style={{ fontSize: '22px', fontWeight: '800' }}>Kirana Bestsellers</h2>
              <p className="section-subtitle text-left">Top-selling wholesale products in Sanjay Sales</p>
            </div>
          </div>

          <div className="products-horizontal-scroller">
            {bestSellers.map((p) => {
              const margin = Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100);
              const cardQty = quantities[p.id] !== undefined ? quantities[p.id] : (p.moq || 10);
              return (
                <div key={p.id} className="product-card-unit home-scroll-card">
                  <div className="margin-overlay-badge">{margin}% Margin</div>
                  <div className="bestseller-ribbon">Bestseller</div>
                  <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + p.id)}>
                    <img src={p.imageUrl} alt={p.name} className="product-card-img" />
                  </div>
                  <div className="product-details-container">
                    <h3 className="product-name-heading" onClick={() => navigate('/product/' + p.id)}>
                      {p.name}
                    </h3>
                    
                    <div className="divider-card" style={{ margin: '8px 0' }}></div>

                    <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                      {(p.inventory !== undefined ? p.inventory : 100) <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                      ) : (p.inventory !== undefined ? p.inventory : 100) < 10 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {p.inventory}</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                      )}
                    </div>

                    <div className="price-actions-flex-row-blinkit">
                      <div className="price-stack">
                        <span className="mrp-txt">MRP ₹{p.retailPrice}</span>
                        <span className="wholesale-deal-price" style={{ margin: 0 }}>₹{getTieredWholesalePrice(p, cardQty)}</span>
                      </div>

                      <div className="b2b-action-row-inline">
                        <div className="qty-selector-container">
                          <button 
                            className="qty-btn"
                            type="button"
                            onClick={() => handleQuantityChange(p.id, (parseInt(cardQty) || 10) - 1)}
                            disabled={(parseInt(cardQty) || 0) <= (p.moq || 10)}
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            className="qty-input"
                            value={cardQty}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const parsed = parseInt(valStr);
                              handleQuantityChange(p.id, valStr === '' ? '' : (isNaN(parsed) ? valStr : parsed));
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              const moqVal = p.moq || 10;
                              if (isNaN(val) || val < moqVal) {
                                handleQuantityChange(p.id, moqVal);
                              } else {
                                handleQuantityChange(p.id, val);
                              }
                            }}
                          />
                          <button 
                            className="qty-btn"
                            type="button"
                            onClick={() => handleQuantityChange(p.id, (parseInt(cardQty) || 10) + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button 
                          className="add-to-cart-b2b-btn" 
                          onClick={() => onAddToCart(p, parseInt(cardQty) || p.moq || 10)}
                          disabled={(p.inventory !== undefined ? p.inventory : 100) <= 0}
                        >
                          ADD
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

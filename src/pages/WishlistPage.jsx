import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTieredWholesalePrice } from '../util/productsData';

export default function WishlistPage({ products = [], wishlist = [], onToggleWishlist, onAddToCart }) {
  const navigate = useNavigate();
  const [addedMsg, setAddedMsg] = useState({});

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddToCart = (product) => {
    const qty = product.moq || 10;
    if (onAddToCart) onAddToCart(product, qty);
    setAddedMsg((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMsg((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  return (
    <div className="navbar-width-limiter" style={{ padding: '32px 0 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-main-title">My Wishlist</h2>
          <p className="page-main-subtitle">{wishlistProducts.length} saved product{wishlistProducts.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="secondary-b2b-btn" onClick={() => navigate('/browse')}>Browse Catalog</button>
      </div>

      {wishlistProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', display: 'inline-block' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love by tapping the heart icon on any product card.</p>
        </div>
      ) : (
        <div className="products-grid-layout">
          {wishlistProducts.map((product) => {
            const price = getTieredWholesalePrice(product, product.moq || 10);
            return (
              <div key={product.id} className="product-card-unit" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                  aria-label="Remove from wishlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <div className="product-image-container" onClick={() => navigate('/product/' + product.id)} style={{ cursor: 'pointer' }}>
                  <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                </div>
                <div className="product-card-info">
                  <span className="card-brand-tag">{product.brand}</span>
                  <h4 className="card-product-name">{product.name}</h4>
                  <span className="card-pack-size">{product.packSize}</span>
                  <div className="card-price-row">
                    <span className="card-wholesale-price">₹{price}</span>
                    <span className="card-retail-price">MRP ₹{product.retailPrice}</span>
                  </div>
                  <div className="card-savings-row">
                    Save ₹{product.retailPrice - price} per pack
                  </div>
                  {addedMsg[product.id] ? (
                    <span style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: 'var(--color-success)', fontWeight: '600', padding: '8px' }}>Added!</span>
                  ) : (
                    <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

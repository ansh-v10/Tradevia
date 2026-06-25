import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTieredWholesalePrice,
  getPackMultiplier,
  getPackContainerName
} from '../util/productsData';
import { supabase } from '../util/supabaseClient';
import { StarIcon } from '../components/Icons';


export default function ProductDetails({
  products = [],
  cart = [],
  onAddToCart,
  onOpenLoginModal,
  wishlist = [],
  onToggleWishlist
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const product = products.find((p) => p.id === parseInt(id));
  
  const [qty, setQty] = useState(product?.moq || 10);
  const [quantities, setQuantities] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  useEffect(() => {
    if (!product?.id) return;
    try {
      const prev = JSON.parse(localStorage.getItem('ss_recently_viewed') || '[]');
      const updated = [{ id: product.id, name: product.name, imageUrl: product.imageUrl, wholesalePrice: product.wholesalePrice, retailPrice: product.retailPrice, category: product.category }, ...prev.filter(p => p.id !== product.id)].slice(0, 10);
      localStorage.setItem('ss_recently_viewed', JSON.stringify(updated));
    } catch (e) {}
  }, [product?.id]);

  // Load reviews from Supabase
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && isMounted) setReviews(data);
    });
    return () => { isMounted = false; };
  }, [product?.id]);

  const relatedProducts = products
    .filter((p) => p && p.category === product.category && p.id !== product.id)
    .slice(0, 8);

  const bestSellers = products
    .filter((p) => p && p.isMostBought && p.id !== product.id)
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

  const variantAdjust = selectedVariant?.priceAdjust || 0;

  const priceTier1 = product.wholesalePrice + variantAdjust;
  const priceTier2 = getTieredWholesalePrice(product, t2Moq) + variantAdjust;
  const priceTier3 = getTieredWholesalePrice(product, t3Moq) + variantAdjust;

  const activePrice = getTieredWholesalePrice(product, qty) + variantAdjust;
  const totalCost = activePrice * qty;
  const marginPerUnit = product.retailPrice - activePrice;
  const marginPercent = Math.round((marginPerUnit / product.retailPrice) * 100);
  const totalSavings = (product.retailPrice - activePrice) * qty;

  const multiplier = getPackMultiplier(product.packSize);
  const container = getPackContainerName(product.packSize);

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
      onAddToCart({ ...product, selectedVariant: selectedVariant?.name || null }, finalQty);
    }
  };

  const handleNotifyMe = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    const email = u?.email || notifyEmail;
    if (!email) { setNotifyMsg('Please enter an email'); return; }
    const { error } = await supabase.from('back_in_stock_requests').insert({ product_id: product.id, email });
    if (error) { setNotifyMsg(error.message); return; }
    setNotifyMsg("We'll notify you when back in stock!");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      if (onOpenLoginModal) onOpenLoginModal();
      setReviewSubmitting(false);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', u.id).maybeSingle();
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: u.id,
      user_name: profile?.name || u.email?.split('@')[0] || 'Customer',
      rating: reviewRating,
      comment: reviewComment || null
    });
    setReviewSubmitting(false);
    if (error) return;
    setReviewSuccess('Review submitted!');
    setReviewRating(0);
    setReviewComment('');
    const { data: updated } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
    if (updated) setReviews(updated);
    setTimeout(() => setReviewSuccess(''), 3000);
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="product-details-page-wrapper navbar-width-limiter" style={{ padding: '32px 0 64px', textAlign: 'left' }}>
      
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: '40px'
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '48px', height: '48px', borderRadius: '50%',
              fontSize: '28px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            ×
          </button>
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain',
              borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}

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
            onClick={() => setLightboxOpen(true)}
            style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', padding: '16px', cursor: 'pointer' }} 
          />
        </div>

        {/* Right Column: Information Desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {product.brand} Wholesale
              </span>
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={wishlist.includes(product.id) ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              )}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 4px', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
              <span>Pack Size: <strong>{product.packSize}</strong></span>
              <span>•</span>
              <span>Category: <strong>{product.category}</strong></span>
            </div>
            {product.variants && product.variants.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Variant:</span>
                {product.variants.map((v, i) => (
                  <label key={i} style={{
                    padding: '4px 12px', borderRadius: '4px', border: `1px solid ${selectedVariant?.name === v.name ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: selectedVariant?.name === v.name ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    cursor: 'pointer', fontSize: '13px', fontWeight: selectedVariant?.name === v.name ? '700' : '400'
                  }}>
                    <input type="radio" name="variant" value={v.name} checked={selectedVariant?.name === v.name} onChange={() => setSelectedVariant(v)} style={{ display: 'none' }} />
                    {v.name}{v.priceAdjust ? ` (+₹${v.priceAdjust})` : ''}
                  </label>
                ))}
              </div>
            )}
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
                Save ₹{marginPerUnit.toLocaleString('en-IN')}/unit (₹{(marginPerUnit * multiplier).toLocaleString('en-IN')}/{container})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                (Standard Store MRP: ₹{product.retailPrice}/unit (₹{product.retailPrice * multiplier}/{container}) | Base wholesale rate: ₹{product.wholesalePrice}/unit (₹{product.wholesalePrice * multiplier}/{container}))
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
                <span>₹{priceTier1}/unit <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(₹{priceTier1 * multiplier}/{container})</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: qty >= t2Moq && qty < t3Moq ? '700' : '400', color: qty >= t2Moq && qty < t3Moq ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                <span>Medium Tier ({t2Moq} - {t3Moq - 1} packs):</span>
                <span>₹{priceTier2}/unit <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(₹{priceTier2 * multiplier}/{container})</span> <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>(~5% Off)</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: qty >= t3Moq ? '700' : '400', color: qty >= t3Moq ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                <span>Bulk Tier ({t3Moq}+ packs):</span>
                <span>₹{priceTier3}/unit <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>(₹{priceTier3 * multiplier}/{container})</span> <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold' }}>(~10% Off)</span></span>
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

              {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1' }}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    style={{ height: '44px', flex: '1', borderRadius: '6px', border: '1px solid var(--color-border)', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleNotifyMe}
                    className="pincode-btn"
                    style={{ height: '44px', fontSize: '13px', fontWeight: '700', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 16px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    Notify Me
                  </button>
                </div>
              ) : (
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
                    backgroundColor: 'var(--color-primary)', 
                    color: 'white', 
                    cursor: 'pointer', 
                    border: 'none',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  ADD
                </button>
              )}
            </div>
            
            {notifyMsg && (
              <div style={{ fontSize: '12px', color: notifyMsg.includes('notify') ? 'var(--color-success)' : '#dc2626', fontWeight: '600', marginTop: '8px' }}>
                {notifyMsg}
              </div>
            )}
            
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'left' }}>
              *Minimum Order Quantity for this product is <strong>{moqVal} packs</strong>.
            </div>
          </div>

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

      {/* Customer Reviews Section */}
      <section style={{ marginTop: '48px' }}>
        <div className="section-header-flex">
          <div>
            <h2 className="section-title text-left" style={{ fontSize: '22px', fontWeight: '800' }}>Customer Reviews</h2>
            <p className="section-subtitle text-left">
              {reviews.length > 0 ? `${avgRating} avg rating from ${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
            </p>
          </div>
        </div>

        {/* Existing reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px' }}>{r.user_name}</strong>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} size={14} fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : '#d1d5db'} />
                  ))}
                </div>
              </div>
              {r.comment && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{r.comment}</p>}
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Be the first to review this product.</p>
          )}
        </div>

        {/* Submit a review */}
        <form onSubmit={handleSubmitReview} style={{ marginTop: '20px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px' }}>Write a Review</h3>
          {reviewSuccess && <p style={{ color: 'var(--color-success)', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{reviewSuccess}</p>}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setReviewRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <StarIcon size={24} fill={s <= reviewRating ? '#f59e0b' : 'none'} color={s <= reviewRating ? '#f59e0b' : '#d1d5db'} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience with this product (optional)"
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button type="submit" disabled={reviewRating === 0 || reviewSubmitting} className="primary-b2b-btn" style={{ marginTop: '12px' }}>
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </section>

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
                  <div className="margin-overlay-badge">{margin}% OFF</div>
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
                        <span className="mrp-txt">MRP ₹{p.retailPrice} (₹{p.retailPrice * getPackMultiplier(p.packSize)} / {getPackContainerName(p.packSize)})</span>
                        <span className="wholesale-deal-price" style={{ margin: 0 }}>
                          ₹{getTieredWholesalePrice(p, cardQty)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(p, cardQty) * getPackMultiplier(p.packSize)).toLocaleString('en-IN')} / {getPackContainerName(p.packSize)})</span>
                        </span>
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
              <p className="section-subtitle text-left">Top-selling wholesale products in Tradevia</p>
            </div>
          </div>

          <div className="products-horizontal-scroller">
            {bestSellers.map((p) => {
              const margin = Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100);
              const cardQty = quantities[p.id] !== undefined ? quantities[p.id] : (p.moq || 10);
              return (
                <div key={p.id} className="product-card-unit home-scroll-card">
                  <div className="margin-overlay-badge">{margin}% OFF</div>
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
                        <span className="mrp-txt">MRP ₹{p.retailPrice} (₹{p.retailPrice * getPackMultiplier(p.packSize)} / {getPackContainerName(p.packSize)})</span>
                        <span className="wholesale-deal-price" style={{ margin: 0 }}>
                          ₹{getTieredWholesalePrice(p, cardQty)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(p, cardQty) * getPackMultiplier(p.packSize)).toLocaleString('en-IN')} / {getPackContainerName(p.packSize)})</span>
                        </span>
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

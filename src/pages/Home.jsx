import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, ChevronRightIcon, ChevronLeftIcon } from '../components/Icons';
import { 
  getTieredWholesalePrice,
  getPackMultiplier,
  getPackContainerName
} from '../util/productsData';
import amul from '../assets/amul.jpg';

export default function Home({ 
  products,
  categories,
  setSelectedCategories, 
  setSelectedBrands,
  onAddToCart,
  wishlist = [],
  onToggleWishlist
}) {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const categoryProductsRows = (categories || [])
    .filter(cat => cat.showProductsOnHome);

  const bannerSlides = [
    {
      title: "Direct Distributor Rates",
      subtitle: "Kirana & Commercial Supply Hub",
      desc: "Get up to 25% extra profit margins by buying directly in bulk cartons. Free doorstep delivery on orders above ₹10,000.",
      badge: "DISTRIBUTOR DIRECT",
      theme: "slide-blue",
      image: "distribution.jpg"
    },
    {
      title: "Save 18% GST Input Credit",
      subtitle: "100% Tax-Compliant Business Invoices",
      desc: "Get tax-compliant business invoices instantly with every purchase to claim Input Tax Credit.",
      badge: "GST BENEFIT",
      theme: "slide-amber",
      image: "gst.jpg"
    },
    {
      title: "Order on Call",
      subtitle: "Quick & Easy Offline Wholesale Orders",
      desc: "Don't want to place orders online? Dial +917496865205 to place your bulk inventory order instantly on call or WhatsApp.",
      badge: "ORDER ON CALL",
      theme: "slide-red",
      image: "order_on_call.jpg"
    }
  ];

  // Auto scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlide, bannerSlides.length]);

  // Touch Swipe Gesture Handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    } else if (isRightSwipe) {
      setActiveSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    }
  };

  // Set category filter and route to browse
  const handleCategorySelect = (categoryName) => {
    if (categoryName === 'More' || categoryName === 'Show More') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([categoryName]);
    }
    navigate(categoryName && categoryName !== 'More' && categoryName !== 'Show More' ? `/browse?category=${encodeURIComponent(categoryName)}` : '/browse');
  };

  // Get most bought products from dynamic prop, sorting out-of-stock to the bottom
  const mostBoughtProducts = products
    .filter(p => p.isMostBought)
    .sort((a, b) => {
      const isOutOfStockA = (a.inventory !== undefined ? a.inventory : 100) <= 0 ? 1 : 0;
      const isOutOfStockB = (b.inventory !== undefined ? b.inventory : 100) <= 0 ? 1 : 0;
      return isOutOfStockA - isOutOfStockB;
    })
    .slice(0, 8);
  // Get super saver deals from dynamic prop, sorting out-of-stock to the bottom
  const superSaverDeals = products
    .map(p => ({ ...p, discountPercent: Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100) }))
    .sort((a, b) => {
      const isOutOfStockA = (a.inventory !== undefined ? a.inventory : 100) <= 0 ? 1 : 0;
      const isOutOfStockB = (b.inventory !== undefined ? b.inventory : 100) <= 0 ? 1 : 0;
      if (isOutOfStockA !== isOutOfStockB) {
        return isOutOfStockA - isOutOfStockB;
      }
      return b.discountPercent - a.discountPercent;
    })
    .slice(0, 4);

  const resolveImgSrc = (src) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) {
      return src;
    }
    const cleanPath = src.startsWith('/') ? src.slice(1) : src;
    return cleanPath;
  };

  // Dynamic circular categories utilizing dynamic categories prop
  const homeCategories = (categories || []).filter(cat => cat.showOnHome);

  const categoriesList = homeCategories.map(cat => ({
    name: cat.name,
    icon: <img src={resolveImgSrc(cat.imageUrl)} alt={cat.name} className="category-icon-img" />
  }));

  categoriesList.push({
    name: "More",
    icon: <div className="category-more-text">MORE →</div>
  });

  const brandLogos = [
    { name: "Amul", logo: "amul.jpg" },
    { name: "Cadbury", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cadbury_logo_new.jpg/500px-Cadbury_logo_new.jpg" },
    { name: "Haldiram's", logo: "haldirams.png" },
    { name: "Dettol", logo: "dettol.jpeg" },
    { name: "Unilever", logo: "unilever.png" },
    { name: "Coca-Cola", logo: "coke.jpeg" },
    { name: "Colgate", logo: "colgate.jpeg" },
    { name: "More", logo: "" }
  ];

  return (
    <div className="home-container">
      {/* Hero Banner Slider */}
      <section className="hero-slider-section">
        <div 
          className="slider-viewport"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background Image / Gradient */}
          {bannerSlides[activeSlide].image ? (
            <div className="slide-bg-wrap">
              <img 
                src={resolveImgSrc(bannerSlides[activeSlide].image)} 
                alt="" 
                className="slide-bg-image" 
              />
              <div className="slide-left-gradient-overlay"></div>
            </div>
          ) : (
            <div className={`slide-bg-wrap ${bannerSlides[activeSlide].theme}`}></div>
          )}

          {/* Bottom Fade Gradient (Amazon-style) */}
          <div className="slide-bottom-fade-overlay"></div>

          {/* Left Arrow Button */}
          <button 
            type="button" 
            className="slider-arrow-btn prev-arrow" 
            onClick={() => setActiveSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
            aria-label="Previous slide"
          >
            <ChevronLeftIcon size={24} />
          </button>

          <div className="slide-content-wrap navbar-width-limiter">
            <span className="slide-badge">{bannerSlides[activeSlide].badge}</span>
            <h1 className="slide-title">{bannerSlides[activeSlide].title}</h1>
            <h3 className="slide-subtitle">{bannerSlides[activeSlide].subtitle}</h3>
            <p className="slide-desc">{bannerSlides[activeSlide].desc}</p>
            {bannerSlides[activeSlide].badge === 'ORDER ON CALL' ? (
              <a href="tel:+917496865205" className="slide-cta-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Call Now (+917496865205) <ChevronRightIcon size={16} className="inline-chevron" />
              </a>
            ) : (
              <button className="slide-cta-btn" onClick={() => handleCategorySelect('More')}>
                Explore Commercial Rates <ChevronRightIcon size={16} className="inline-chevron" />
              </button>
            )}
          </div>
          
          {/* Right Arrow Button */}
          <button 
            type="button" 
            className="slider-arrow-btn next-arrow" 
            onClick={() => setActiveSlide((prev) => (prev + 1) % bannerSlides.length)}
            aria-label="Next slide"
          >
            <ChevronRightIcon size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="slider-dots">
            {bannerSlides.map((_, index) => (
              <button 
                key={index} 
                className={`slider-dot ${activeSlide === index ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 8 Product Categories Circles Grid */}
      <section className="categories-grid-section navbar-width-limiter">
        <h2 className="section-title text-left">Shop by Wholesale Category</h2>
        <p className="section-subtitle text-left">Select a segment to browse volume-based trade pricing</p>
        
        <div className="categories-blinkit-grid">
          {categoriesList.map((cat, idx) => (
            <div 
              key={idx} 
              className={`category-blinkit-card ${cat.name === 'More' ? 'show-more-card' : ''}`}
              onClick={() => handleCategorySelect(cat.name)}
            >
              <div className="category-blinkit-icon-wrap">
                {cat.icon}
              </div>
              <span className="category-blinkit-label">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Super Saver Deals Section */}
      <section className="super-saver-section navbar-width-limiter">
        <div className="section-header-flex">
          <div>
            <h2 className="section-title text-left">Super Saver Wholesale Deals</h2>
            <p className="section-subtitle text-left">Maximize your profits with our highest margin products</p>
          </div>
          <button className="view-all-link-btn" onClick={() => handleCategorySelect('More')}>
            View All Offers →
          </button>
        </div>

        <div className="products-horizontal-scroller">
          {superSaverDeals.map((product) => {
            const margin = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);
            const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
            return (
              <div key={product.id} className="product-card-unit home-scroll-card">
                <div className="margin-overlay-badge">{margin}% OFF</div>
                <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + product.id)}>
                  <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                </div>
                <div className="product-details-container">
                  <h3 className="product-name-heading" onClick={() => navigate('/product/' + product.id)}>
                    {product.name}
                  </h3>
                  
                  <div className="divider-card" style={{ margin: '8px 0' }}></div>

                  <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                    {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                    ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {product.inventory}</span>
                    ) : (
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                    )}
                  </div>

                  <div className="price-actions-flex-row-blinkit">
                    <div className="price-stack">
                      <span className="mrp-txt">MRP ₹{product.retailPrice} (₹{product.retailPrice * getPackMultiplier(product.packSize)} / {getPackContainerName(product.packSize)})</span>
                      <span className="wholesale-deal-price" style={{ margin: 0 }}>
                        ₹{getTieredWholesalePrice(product, qty)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(product, qty) * getPackMultiplier(product.packSize)).toLocaleString('en-IN')} / {getPackContainerName(product.packSize)})</span>
                      </span>
                    </div>

                    <div className="b2b-action-row-inline">
                      <div className="qty-selector-container">
                        <button 
                          className="qty-btn"
                          type="button"
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
                          type="button"
                          onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button 
                        className="add-to-cart-b2b-btn" 
                        onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                        disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
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

      {/* Featured B2B Brands */}
      <section className="brands-showcase-section navbar-width-limiter">
        <h2 className="section-title text-left">Direct Store Brands</h2>
        <p className="section-subtitle text-left font-sm">Authorized wholesale distributors for leading retail brands</p>
        <div className="brands-flex-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {brandLogos.map((brand, idx) => (
            <div 
              key={idx} 
              className={`brand-logo-card ${brand.name === 'More' ? 'show-more-card' : ''}`}
              onClick={() => {
                if (brand.name === 'More') {
                  setSelectedBrands([]);
                  setSelectedCategories([]);
                } else {
                  setSelectedBrands([brand.name]);
                  setSelectedCategories([]);
                }
                navigate(brand.name === 'More' ? '/browse' : `/browse?brand=${encodeURIComponent(brand.name)}`);
              }}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'white', width: '120px', transition: 'var(--transition-fast)' }}
            >
              {brand.name === 'More' ? (
                <div className="brand-more-text" style={{ width: '60px', height: '60px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'var(--color-primary)', backgroundColor: '#f1f5f9', marginBottom: '8px' }}>MORE →</div>
              ) : (
                <img 
                  src={resolveImgSrc(brand.logo)} 
                  alt={`${brand.name}`} 
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px' }} 
                />
              )}
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', textAlign: 'center' }}>{brand.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Most Bought Grid */}
      <section className="most-bought-section navbar-width-limiter">
        <div className="section-header-flex">
          <div>
            <h2 className="section-title text-left">Bestsellers in Tradevia</h2>
            <p className="section-subtitle text-left">Products with the highest commercial order frequency</p>
          </div>
          <button className="view-all-link-btn" onClick={() => handleCategorySelect('More')}>
            View All Bestsellers →
          </button>
        </div>

        <div className="products-horizontal-scroller">
          {mostBoughtProducts.map((product) => {
            const margin = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);
            const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
            return (
              <div key={product.id} className="product-card-unit home-scroll-card">
                <div className="margin-overlay-badge">{margin}% OFF</div>
                <div className="bestseller-ribbon">Bestseller</div>
                <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + product.id)}>
                  <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                </div>
                <div className="product-details-container">
                  <h3 className="product-name-heading" onClick={() => navigate('/product/' + product.id)}>
                    {product.name}
                  </h3>
                  
                  <div className="divider-card" style={{ margin: '8px 0' }}></div>

                  <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                    {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                    ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {product.inventory}</span>
                    ) : (
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                    )}
                  </div>

                  <div className="price-actions-flex-row-blinkit">
                    <div className="price-stack">
                      <span className="mrp-txt">MRP ₹{product.retailPrice} (₹{product.retailPrice * getPackMultiplier(product.packSize)} / {getPackContainerName(product.packSize)})</span>
                      <span className="wholesale-deal-price" style={{ margin: 0 }}>
                        ₹{getTieredWholesalePrice(product, qty)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(product, qty) * getPackMultiplier(product.packSize)).toLocaleString('en-IN')} / {getPackContainerName(product.packSize)})</span>
                      </span>
                    </div>

                    <div className="b2b-action-row-inline">
                      <div className="qty-selector-container">
                        <button 
                          className="qty-btn"
                          type="button"
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
                          type="button"
                          onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button 
                        className="add-to-cart-b2b-btn" 
                        onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                        disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
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

      {/* Category Specific Dynamic Product Rows */}
      {categoryProductsRows.map((cat) => {
        const catProducts = products
          .filter(p => p.category === cat.name)
          .sort((a, b) => {
            const isOutOfStockA = (a.inventory !== undefined ? a.inventory : 100) <= 0 ? 1 : 0;
            const isOutOfStockB = (b.inventory !== undefined ? b.inventory : 100) <= 0 ? 1 : 0;
            return isOutOfStockA - isOutOfStockB;
          })
          .slice(0, 8);

        if (catProducts.length === 0) return null;

        return (
          <section key={cat.name} className="super-saver-section navbar-width-limiter" style={{ marginTop: '32px' }}>
            <div className="section-header-flex">
              <div>
                <h2 className="section-title text-left">{cat.name}</h2>
                <p className="section-subtitle text-left font-sm">Explore top wholesale deals in {cat.name.toLowerCase()}</p>
              </div>
              <button 
                className="view-all-link-btn" 
                onClick={() => {
                  setSelectedCategories([cat.name]);
                  navigate('/browse');
                }}
              >
                View All →
              </button>
            </div>

            <div className="products-horizontal-scroller">
              {catProducts.map((product) => {
                const margin = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);
                const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
                const discountPercent = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);

                return (
                  <div key={product.id} className="product-card-unit home-scroll-card">
                    <div className="margin-overlay-badge">{margin}% OFF</div>
                    {discountPercent > 18 && (
                      <div className="bestseller-ribbon" style={{ top: '34px' }}>Saver Deal</div>
                    )}
                    <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + product.id)}>
                      <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                    </div>
                    <div className="product-details-container">
                      <h3 className="product-name-heading" onClick={() => navigate('/product/' + product.id)}>
                        {product.name}
                      </h3>
                      
                      <div className="divider-card" style={{ margin: '8px 0' }}></div>

                      <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                        {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                        ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {product.inventory}</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                        )}
                      </div>

                      <div className="price-actions-flex-row-blinkit">
                        <div className="price-stack">
                          <span className="mrp-txt">MRP ₹{product.retailPrice} (₹{product.retailPrice * getPackMultiplier(product.packSize)} / {getPackContainerName(product.packSize)})</span>
                          <span className="wholesale-deal-price" style={{ margin: 0 }}>
                            ₹{getTieredWholesalePrice(product, qty)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(product, qty) * getPackMultiplier(product.packSize)).toLocaleString('en-IN')} / {getPackContainerName(product.packSize)})</span>
                          </span>
                        </div>

                        <div className="b2b-action-row-inline">
                          <div className="qty-selector-container">
                            <button 
                              className="qty-btn"
                              type="button"
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
                              type="button"
                              onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button 
                            className="add-to-cart-b2b-btn" 
                            onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                            disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
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
        );
      })}

      {(() => {
        let recentItems = [];
        try { recentItems = JSON.parse(localStorage.getItem('ss_recently_viewed') || '[]'); } catch(e) {}
        const recentProducts = recentItems.filter(r => products.some(p => p.id === r.id)).slice(0, 6);
        if (recentProducts.length === 0) return null;
        return (
          <section className="super-saver-section navbar-width-limiter" style={{ marginTop: '32px' }}>
            <div className="section-header-flex">
              <div>
                <h2 className="section-title text-left">Recently Viewed</h2>
                <p className="section-subtitle text-left font-sm">Products you checked out recently</p>
              </div>
            </div>
            <div className="products-horizontal-scroller">
              {recentProducts.map((r) => {
                const product = products.find(p => p.id === r.id);
                if (!product) return null;
                const margin = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);
                return (
                  <div key={product.id} className="product-card-unit home-scroll-card">
                    <div className="margin-overlay-badge">{margin}% OFF</div>
                    <div className="product-image-container home-padded-img-wrap" onClick={() => navigate('/product/' + product.id)}>
                      <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                    </div>
                    <div className="product-details-container">
                      <h3 className="product-name-heading" onClick={() => navigate('/product/' + product.id)}>{product.name}</h3>
                      <div className="divider-card" style={{ margin: '8px 0' }}></div>
                      <div style={{ fontSize: '11px', textAlign: 'left', marginBottom: '8px' }}>
                        {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                        ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left: {product.inventory}</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock</span>
                        )}
                      </div>
                      <div className="price-actions-flex-row-blinkit">
                        <div className="price-stack">
                          <span className="mrp-txt">MRP ₹{product.retailPrice} (₹{product.retailPrice * getPackMultiplier(product.packSize)} / {getPackContainerName(product.packSize)})</span>
                          <span className="wholesale-deal-price" style={{ margin: 0 }}>
                            ₹{getTieredWholesalePrice(product, product.moq || 10)} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(₹{(getTieredWholesalePrice(product, product.moq || 10) * getPackMultiplier(product.packSize)).toLocaleString('en-IN')} / {getPackContainerName(product.packSize)})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Info Banners */}
      <section className="b2b-info-banners navbar-width-limiter">
        <div className="info-banner-card blue-gradient">
          <h3>Kirana Stores Delivery</h3>
          <p>Next day dispatch. Insured logistics. Direct to shop-floor loading. Cash on delivery accepted for verified business accounts.</p>
        </div>
        <div className="info-banner-card gold-gradient">
          <h3>Institutional Supplies</h3>
          <p>Exclusive quotes for hotels, restaurants, schools and offices. Purchase order invoicing support. Bulk volumes above 50 cartons.</p>
        </div>
      </section>
    </div>
  );
}

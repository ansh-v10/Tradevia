import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, ChevronRightIcon } from '../components/Icons';
import { getTieredWholesalePrice } from '../util/productsData';
import amul from '../assets/amul.jpg';

export default function Home({ 
  products,            // dynamic state passed from App.jsx
  categoryImages,      // dynamic state passed from App.jsx
  setSelectedCategories, 
  setSelectedBrands,
  onAddToCart 
}) {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId, val) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const bannerSlides = [
    {
      title: "Direct Distributor Rates",
      subtitle: "Kirana & Commercial Supply Hub",
      desc: "Get up to 25% extra profit margins by buying directly in bulk cartons. Free doorstep delivery on orders above ₹10,000.",
      badge: "DISTRIBUTOR DIRECT",
      theme: "slide-blue"
    },
    {
      title: "Save 18% GST Input Credit",
      subtitle: "100% Tax-Compliant Business Invoices",
      desc: "Get tax-compliant business invoices instantly with every purchase to claim Input Tax Credit.",
      badge: "GST BENEFIT",
      theme: "slide-amber"
    },
    {
      title: "Premium Sweets & Namkeen",
      subtitle: "Direct Haldiram's & Bikaji Distributor",
      desc: "Stock your stores for festival seasons with fresh bulk packages of sweets, bhujia, and snacks at special prices.",
      badge: "FESTIVE BULK",
      theme: "slide-red"
    }
  ];

  // Auto scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Set category filter and route to browse
  const handleCategorySelect = (categoryName) => {
    if (categoryName === 'More' || categoryName === 'Show More') {
      setSelectedCategories([]); // show all
    } else {
      setSelectedCategories([categoryName]); // show specific
    }
    navigate('/browse');
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
    const cleanPath = src.startsWith('/') ? src : '/' + src;
    return `/SanjaySales${cleanPath}`;
  };

  // Dynamic circular categories utilizing categoryImages state prop
  const categoriesList = [
    { 
      name: "Chocolates & Candies", 
      icon: <img src={resolveImgSrc(categoryImages["Chocolates & Candies"] || "cadbury_category.jpg")} alt="Cadbury Chocolates" className="category-icon-img" /> 
    },
    { 
      name: "Daily Use", 
      icon: <img src={resolveImgSrc(categoryImages["Daily Use"] || "mop_category.jpg")} alt="Daily needs cleaning mops" className="category-icon-img" /> 
    },
    { 
      name: "Home Essentials", 
      icon: <img src={resolveImgSrc(categoryImages["Home Essentials"] || "https://cdn.brandfetch.io/domain/springwel.in/fallback/lettermark/theme/dark/h/400/w/400/icon?c=1bfwsmEH20zzEfSNTed")} alt="Home Curtains" className="category-icon-img" /> 
    },
    { 
      name: "Preservatives", 
      icon: <img src={resolveImgSrc(categoryImages["Preservatives"] || "chips_category.jpg")} alt="Chips snacks" className="category-icon-img" /> 
    },
    { 
      name: "Sweets & Namkeen", 
      icon: <img src={resolveImgSrc(categoryImages["Sweets & Namkeen"] || "rasgulla_category.jpg")} alt="Sweets Rasgulla" className="category-icon-img" /> 
    },
    { 
      name: "Beverages", 
      icon: <img src={resolveImgSrc(categoryImages["Beverages"] || "https://www.logodesignlove.com/wp-content/uploads/2021/07/coca-cola-logo-arden-square-01.jpg")} alt="Coke Beverage" className="category-icon-img" /> 
    },
    { 
      name: "Grains & Masalas", 
      icon: <img src={resolveImgSrc(categoryImages["Grains & Masalas"] || "https://prithvienterprises.co.in/cdn/shop/collections/Aashirvaad_Logo.png?v=1746877542&width=750")} alt="Grains Atta" className="category-icon-img" /> 
    },
    { 
      name: "Fresh & Dairy", 
      icon: <img src={resolveImgSrc(categoryImages["Fresh & Dairy"] || "https://animationvisarts.com/wp-content/uploads/2023/12/Frame-32-6.png")} alt="Fresh & Dairy" className="category-icon-img" /> 
    },
    { 
      name: "Snacks & Biscuits", 
      icon: <img src={resolveImgSrc(categoryImages["Snacks & Biscuits"] || "https://images.yourstory.com/cs/images/companies/4146603810349766400073541079337822789304320o-1611498760663.png?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=85")} alt="Snacks & Biscuits" className="category-icon-img" /> 
    },
    { 
      name: "Cosmetics & Hygiene", 
      icon: <img src={resolveImgSrc(categoryImages["Cosmetics & Hygiene"] || "https://i.pinimg.com/736x/da/78/1d/da781de9ad2bffefcedb6d872856900c.jpg")} alt="Cosmetics & Hygiene" className="category-icon-img" /> 
    },
    { 
      name: "More", 
      icon: <div className="category-more-text">MORE →</div> 
    }
  ];

  const brandLogos = [
    { name: "Amul", logo: "amul.jpg" },
    { name: "Cadbury", logo: "cadbury.jpeg" },
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
        <div className={`slider-viewport ${bannerSlides[activeSlide].theme}`}>
          <div className="slide-content-wrap navbar-width-limiter">
            <span className="slide-badge">{bannerSlides[activeSlide].badge}</span>
            <h1 className="slide-title">{bannerSlides[activeSlide].title}</h1>
            <h3 className="slide-subtitle">{bannerSlides[activeSlide].subtitle}</h3>
            <p className="slide-desc">{bannerSlides[activeSlide].desc}</p>
            <button className="slide-cta-btn" onClick={() => handleCategorySelect('More')}>
              Explore Commercial Rates <ChevronRightIcon size={16} className="inline-chevron" />
            </button>
          </div>
          
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
        
        <div className="categories-row-flex">
          {categoriesList.map((cat, idx) => (
            <div 
              key={idx} 
              className={`category-circle-card ${cat.name === 'More' ? 'show-more-card' : ''}`}
              onClick={() => handleCategorySelect(cat.name)}
            >
              <div className="category-icon-wrapper">
                {cat.icon}
              </div>
              <span className="category-circle-label">{cat.name}</span>
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

        <div className="deals-grid">
          {superSaverDeals.map((product) => {
            const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
            return (
              <div key={product.id} className="deal-card">
                <div className="deal-discount-badge">{product.discountPercent}% OFF</div>
                <div className="deal-image-wrap">
                  <img src={product.imageUrl} alt={product.name} className="deal-image" />
                </div>
                <div className="deal-info-wrap">
                  <span className="deal-brand">{product.brand}</span>
                  <h4 className="deal-name" onClick={() => {
                    setSelectedCategories([product.category]);
                    navigate('/browse');
                  }}>{product.name}</h4>
                  <span className="deal-pack">{product.packSize}</span>
                  <div className="price-pricing-flex">
                    <div className="price-stack">
                      <span className="retail-strike">MRP ₹{product.retailPrice}</span>
                      <span className="wholesale-price" style={{ margin: 0 }}>₹{getTieredWholesalePrice(product, qty)} <span className="ex-gst">ex. GST</span></span>
                    </div>

                    <div className="qty-selector-container">
                      <button 
                        className="qty-btn"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) - 1)}
                        disabled={(parseInt(qty) || 0) <= (product.moq || 10)}
                        style={{ padding: '4px 8px' }}
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
                        style={{ width: '30px', textAlign: 'center', border: 'none', fontWeight: 'bold' }}
                      />
                      <button 
                        className="qty-btn"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                        style={{ padding: '4px 8px' }}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      className="deal-add-btn" 
                      onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                      disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
                      style={(product.inventory !== undefined ? product.inventory : 100) <= 0 ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b', padding: '8px', width: '100%' } : { padding: '8px', width: '100%' }}
                    >
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? 'Out of Stock' : `Add to Cart (${qty})`}
                    </button>

                    <div style={{ fontSize: '11px', textAlign: 'left', marginTop: '2px' }}>
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                      ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left in stock : {product.inventory}</span>
                      ) : (
                        <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock ({product.inventory !== undefined ? product.inventory : 100} packs)</span>
                      )}
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
                  setSelectedCategories([]); // clear category
                }
                navigate('/browse');
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
            <h2 className="section-title text-left">Bestsellers in Sanjay Sales</h2>
            <p className="section-subtitle text-left">Products with the highest commercial order frequency</p>
          </div>
          <button className="view-all-link-btn" onClick={() => handleCategorySelect('More')}>
            View All Bestsellers →
          </button>
        </div>

        <div className="products-grid-layout">
          {mostBoughtProducts.map((product) => {
            const margin = Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100);
            const qty = quantities[product.id] !== undefined ? quantities[product.id] : (product.moq || 10);
            return (
              <div key={product.id} className="product-card-unit">
                <div className="bestseller-ribbon">Bestseller</div>
                <div className="product-image-container">
                  <img src={product.imageUrl} alt={product.name} className="product-card-img" />
                </div>
                <div className="product-details-container">
                  <span className="product-brand-tag">{product.brand}</span>
                  <h3 className="product-name-heading" onClick={() => {
                    setSelectedCategories([product.category]);
                    navigate('/browse');
                  }}>{product.name}</h3>
                  <span className="product-pack-size">{product.packSize}</span>
                  
                  {/* Stars */}
                  <div className="product-rating-row">
                    <div className="stars-wrap">
                      <StarIcon className="star-icon" />
                      <span className="rating-val">{product.rating}</span>
                    </div>
                    <span className="reviews-cnt">({product.reviewsCount} reviews)</span>
                  </div>

                  <div className="divider-card"></div>

                  <div className="margin-indicator-label">
                    Margin: <span className="margin-green">{margin}% Profit</span>
                  </div>

                  <div style={{ fontSize: '11px', textAlign: 'left', marginTop: '6px', marginBottom: '6px' }}>
                    {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>❌ Out of Stock</span>
                    ) : (product.inventory !== undefined ? product.inventory : 100) < 10 ? (
                      <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>left in stock : {product.inventory}</span>
                    ) : (
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>✓ In Stock ({product.inventory !== undefined ? product.inventory : 100} packs)</span>
                    )}
                  </div>

                  <div className="price-actions-flex-row">
                    <div className="price-stack">
                      <span className="mrp-txt">MRP ₹{product.retailPrice}</span>
                      <span className="wholesale-deal-price" style={{ margin: 0 }}>₹{getTieredWholesalePrice(product, qty)} <span className="ex-gst">ex. GST</span></span>
                    </div>

                    <div className="qty-selector-container">
                      <button 
                        className="qty-btn"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) - 1)}
                        disabled={(parseInt(qty) || 0) <= (product.moq || 10)}
                        style={{ padding: '4px 8px' }}
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
                        style={{ width: '30px', textAlign: 'center', border: 'none', fontWeight: 'bold' }}
                      />
                      <button 
                        className="qty-btn"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, (parseInt(qty) || 10) + 1)}
                        style={{ padding: '4px 8px' }}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      className="add-to-cart-b2b-btn" 
                      onClick={() => onAddToCart(product, parseInt(qty) || product.moq || 10)}
                      disabled={(product.inventory !== undefined ? product.inventory : 100) <= 0}
                      style={(product.inventory !== undefined ? product.inventory : 100) <= 0 ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b', padding: '8px', width: '100%' } : { padding: '8px', width: '100%' }}
                    >
                      {(product.inventory !== undefined ? product.inventory : 100) <= 0 ? 'Out of Stock' : `Add Bulk (${qty})`}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

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

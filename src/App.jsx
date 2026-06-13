import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRouter from './router/AppRouter';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';
import { productsData } from './util/productsData';
import { supabase } from './util/supabaseClient';
import './App.css';

// Default Categories Setup
const defaultCategories = [
  { name: "Chocolates & Candies", showOnHome: true, showProductsOnHome: true, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cadbury_logo_new.jpg/500px-Cadbury_logo_new.jpg" },
  { name: "Daily Use", showOnHome: true, showProductsOnHome: false, imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR7kV9hA2yF0-BdwARpbVqum34JV7P2cR5fA&s" },
  { name: "Home Essentials", showOnHome: true, showProductsOnHome: false, imageUrl: "https://cdn.brandfetch.io/domain/springwel.in/fallback/lettermark/theme/dark/h/400/w/400/icon?c=1bfwsmEH20zzEfSNTed" },
  { name: "Preservatives", showOnHome: true, showProductsOnHome: false, imageUrl: "chips_category.jpg" },
  { name: "Sweets & Namkeen", showOnHome: true, showProductsOnHome: true, imageUrl: "rasgulla_category.jpg" },
  { name: "Beverages", showOnHome: true, showProductsOnHome: true, imageUrl: "https://www.logodesignlove.com/wp-content/uploads/2021/07/coca-cola-logo-arden-square-01.jpg" },
  { name: "Grains & Masalas", showOnHome: true, showProductsOnHome: false, imageUrl: "https://prithvienterprises.co.in/cdn/shop/collections/Aashirvaad_Logo.png?v=1746877542&width=750" },
  { name: "Fresh & Dairy", showOnHome: true, showProductsOnHome: true, imageUrl: "amul.jpg" },
  { name: "Snacks & Biscuits", showOnHome: true, showProductsOnHome: false, imageUrl: "https://images.yourstory.com/cs/images/companies/4146603810349766400073541079337822789304320o-1611498760663.png?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=85" },
  { name: "Cosmetics & Hygiene", showOnHome: true, showProductsOnHome: false, imageUrl: "https://i.pinimg.com/736x/da/78/1d/da781de9ad2bffefcedb6d872856900c.jpg" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ss_cart');
    if (saved) try { return JSON.parse(saved); } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Restore Supabase session on page load
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user;
        supabase.from('profiles').select('*').eq('id', u.id).maybeSingle().then(({ data: profile }) => {
          const base = { id: u.id, email: profile?.email || u.email, name: profile?.name || '', businessName: profile?.business_name || '', mobile: profile?.mobile || '', gstin: profile?.gstin || '' };
          setUser({ ...base, emailConfirmed: !!u.email_confirmed_at });
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for password recovery event (user clicked reset link from email)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setLoginModalMode('resetPassword');
        setIsLoginModalOpen(true);
      }
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => productsData.map(p => ({ ...p, inventory: 100 })));
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('tradevia_sales_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(cat => {
            if (cat.name === "Fresh & Dairy" && (cat.imageUrl === "https://animationvisarts.com/wp-content/uploads/2023/12/Frame-32-6.png" || !cat.imageUrl)) {
              return { ...cat, imageUrl: "amul.jpg" };
            }
            return cat;
          });
        }
      } catch (e) {
        console.error("Failed to parse categories", e);
      }
    }
    return defaultCategories;
  });

  // Sync categories to localStorage
  useEffect(() => {
    localStorage.setItem('tradevia_sales_categories', JSON.stringify(categories));
  }, [categories]);

  // --- Orders & Saved Addresses B2B States ---
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('ss_wishlist');
    if (saved) try { return JSON.parse(saved); } catch (_) {}
    return [];
  });
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('ss_addresses');
    if (saved) try { return JSON.parse(saved); } catch (_) {}
    const defaultAddr = {
      id: 'addr-default',
      name: 'Store Manager',
      businessName: 'Retailer Depot Store',
      addressLine: 'Sabzi mandi',
      city: 'Jhajjar',
      state: 'Haryana',
      pincode: '124103',
      phone: '9988776655'
    };
    return [defaultAddr];
  });

  // --- Router & Filter Navigation States ---
  const location = useLocation();
  const navigate = useNavigate();

  // Determine currentPage string based on URL path to keep existing code working seamlessly:
  const currentPage = location.pathname === '/' ? 'home' : (location.pathname === '/browse' ? 'browse' : (location.pathname === '/cart' ? 'cart' : (location.pathname === '/orders' ? 'orders' : 'home')));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  // --- Modal Visibility Hooks ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('login');
  const [loginTriggeredByCheckout, setLoginTriggeredByCheckout] = useState(false);

  // --- Admin Desk Database Callbacks ---
  const productToSupabase = (p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.wholesalePrice || 0,
    moq: p.moq || 10,
    unit: p.packSize || '',
    description: JSON.stringify({
      brand: p.brand || '',
      retailPrice: p.retailPrice || 0,
      wholesalePrice: p.wholesalePrice || 0,
      packSize: p.packSize || '',
      isMostBought: p.isMostBought || false,
      rating: p.rating || 4.5,
      reviewsCount: p.reviewsCount || 0,
      tier2Price: p.tier2Price || null,
      tier3Price: p.tier3Price || null,
      tier2Moq: p.tier2Moq || null,
      tier3Moq: p.tier3Moq || null,
      gst: p.gst !== undefined ? p.gst : 18
    }),
    image_url: p.imageUrl || p.image_url || '',
    inventory: p.inventory !== undefined ? p.inventory : 100
  });

  const handleAddProduct = async (newProduct) => {
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const productWithId = { ...newProduct, id: nextId };
    setProducts(prevProducts => [...prevProducts, productWithId]);
    const { error } = await supabase.from('products').insert(productToSupabase(productWithId));
    if (error) console.error('Failed to save product to Supabase:', error.message);
  };

  const handleUpdateProduct = async (updatedProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    const { error } = await supabase.from('products').update(productToSupabase(updatedProduct)).eq('id', updatedProduct.id);
    if (error) console.error('Failed to update product in Supabase:', error.message);
  };

  const handleDeleteProduct = async (productId) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) console.error('Failed to delete product from Supabase:', error.message);
  };

  // Sync cart, orders, wishlist, and addresses to localStorage
  useEffect(() => {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ss_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ss_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('ss_addresses', JSON.stringify(addresses));
  }, [addresses]);

  const handleBulkAdjustPrices = async (percentage) => {
    const factor = 1 + (percentage / 100);
    const updatedProducts = products.map(p => {
      let newWholesale = Math.round(p.wholesalePrice * factor * 10) / 10;
      newWholesale = Math.max(1, Math.min(newWholesale, p.retailPrice - 1));
      return { ...p, wholesalePrice: Math.round(newWholesale) };
    });
    setProducts(updatedProducts);
    for (const p of updatedProducts) {
      const { error } = await supabase.from('products').update(productToSupabase(p)).eq('id', p.id);
      if (error) console.error('Bulk update failed for product', p.id, error.message);
    }
  };

  const handleResetCatalog = async () => {
    setProducts(productsData.map(p => ({ ...p, inventory: 100 })));
    setCategories(defaultCategories);
    const { data: existing } = await supabase.from('products').select('id');
    if (existing && existing.length > 0) {
      const { error } = await supabase.from('products').delete().in('id', existing.map(p => p.id));
      if (error) console.error('Failed to clear products:', error.message);
    }
    for (const p of productsData) {
      const { error } = await supabase.from('products').insert(productToSupabase({ ...p, id: p.id }));
      if (error) console.error('Failed to restore product:', error.message);
    }
  };

  const handleUpdateCategories = async (updatedCategories) => {
    setCategories(updatedCategories);
    localStorage.setItem('tradevia_sales_categories', JSON.stringify(updatedCategories));
  };

  // Listen for storage events (syncs across tabs when Admin panel updates localStorage)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ss_cart') {
        setCart(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'ss_orders') {
        setOrders(e.newValue ? JSON.parse(e.newValue) : []);
      }
      if (e.key === 'ss_addresses') {
        setAddresses(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, moq, unit, description, image_url, inventory')
        .order('id', { ascending: true });

      if (error || !data?.length || !isMounted) {
        return;
      }

      const mappedProducts = data.map((product) => ({
        ...product,
        id: product.id,
        name: product.name,
        inventory: product.inventory ?? 100,
        brand: (() => {
          if (!product.description) return '';
          try {
            const parsed = JSON.parse(product.description);
            return parsed.brand || '';
          } catch (e) {
            return product.description?.split(' | ')[0] || '';
          }
        })(),
        category: product.category,
        retailPrice: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.retailPrice ?? product.price;
          } catch (e) {
            return product.price;
          }
        })(),
        wholesalePrice: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.wholesalePrice ?? product.price;
          } catch (e) {
            return product.price;
          }
        })(),
        gst: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.gst ?? 18;
          } catch (e) {
            return 18;
          }
        })(),
        packSize: product.unit || '',
        rating: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.rating ?? 0;
          } catch (e) {
            return 0;
          }
        })(),
        reviewsCount: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.reviewsCount ?? 0;
          } catch (e) {
            return 0;
          }
        })(),
        isMostBought: (() => {
          try {
            const parsed = JSON.parse(product.description || '{}');
            return parsed.isMostBought ?? false;
          } catch (e) {
            return false;
          }
        })(),
        moq: product.moq,
        tier2Price: (() => {
          try { const p = JSON.parse(product.description || '{}'); return p.tier2Price ?? null; } catch (e) { return null; }
        })(),
        tier3Price: (() => {
          try { const p = JSON.parse(product.description || '{}'); return p.tier3Price ?? null; } catch (e) { return null; }
        })(),
        tier2Moq: (() => {
          try { const p = JSON.parse(product.description || '{}'); return p.tier2Moq ?? null; } catch (e) { return null; }
        })(),
        tier3Moq: (() => {
          try { const p = JSON.parse(product.description || '{}'); return p.tier3Moq ?? null; } catch (e) { return null; }
        })(),
        imageUrl: product.image_url || ''
      }));

      setProducts(mappedProducts);
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Login / Profile Action callbacks ---
  const handleLoginSuccess = async (userData) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser({ ...userData, emailConfirmed: !!u?.email_confirmed_at });
    setIsLoginModalOpen(false);
  };

  const handleUpdateUser = async (updatedUser) => {
    const oldEmail = user?.email;
    setUser(updatedUser);
    if (updatedUser?.id) {
      await supabase.from('profiles').upsert({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        business_name: updatedUser.businessName,
        mobile: updatedUser.mobile,
        gstin: updatedUser.gstin || ''
      });
      if (oldEmail && oldEmail !== updatedUser.email) {
        const { error } = await supabase.auth.updateUser({ email: updatedUser.email });
        if (error) console.error('Auth email update failed:', error.message);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    setOrders([]);
    setAddresses([]);
    setWishlist([]);
    navigate('/');
  };

  const openLoginModalWithContext = (triggeredByCheckout = false) => {
    setLoginModalMode('login');
    setLoginTriggeredByCheckout(triggeredByCheckout);
    setIsLoginModalOpen(true);
  };

  const [cartMsg, setCartMsg] = useState('');

  // --- Cart Manipulation ---
  const handleAddToCart = (product, quantity) => {
    const stock = product.inventory !== undefined ? product.inventory : 100;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty + quantity > stock) {
        setCartMsg(`Only ${stock - currentQty} left in stock`);
        return prevCart;
      }
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
    setCartMsg(`Added ${quantity} x ${product.name} to cart`);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.id === productId);
      if (!item) return prevCart;
      const stock = item.product.inventory !== undefined ? item.product.inventory : 100;
      if (newQuantity > stock) {
        setCartMsg(`Only ${stock} in stock`);
        return prevCart;
      }
      return prevCart.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQuantity } : i
      );
    });
  };

  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleAddOrder = (newOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    
    // Decrement stock sizes for ordered items
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const orderedItem = newOrder.items?.find((item) => item.id === p.id);
        if (orderedItem) {
          const currentStock = p.inventory !== undefined ? p.inventory : 100;
          return { ...p, inventory: Math.max(0, currentStock - orderedItem.quantity) };
        }
        return p;
      })
    );
  };

  // Load orders from Supabase when user changes
  useEffect(() => {
    if (!user?.email) {
      const saved = localStorage.getItem('ss_orders');
      if (saved) setOrders(JSON.parse(saved));
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data?.length || !isMounted) {
        return;
      }

      const mapped = data.map((o) => ({
        id: o.id,
        date: o.created_at,
        items: o.items || [],
        rawSubtotal: Number(o.raw_subtotal || 0),
        gstAmount: Number(o.gst || 0),
        bulkTierDiscount: Number(o.discount || 0),
        grandTotal: Number(o.amount || 0),
        address: o.address || {},
        status: o.status || 'pending',
        trackingNumber: o.tracking_number || null,
        shippedAt: o.shipped_at || null,
        cancelledAt: o.cancelled_at || null,
        deliveredAt: o.delivered_at || null,
        courier: o.courier || null,
        couponDiscount: Number(o.coupon_discount || 0),
        couponCode: o.coupon_code || null,
        gstin: o.gstin || null,
        customerEmail: o.customer_email || null
      }));

      if (isMounted) setOrders(mapped);
    };

    const loadAddresses = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);

      if (error || !data?.length) return;
      const mapped = data.map((a) => ({
        id: a.id,
        name: a.name,
        businessName: a.business_name || '',
        addressLine: a.address_line,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        phone: a.phone,
        latitude: a.latitude,
        longitude: a.longitude
      }));
      if (isMounted) {
        setAddresses(mapped);
        localStorage.setItem('ss_addresses', JSON.stringify(mapped));
      }
    };

    const loadWishlist = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
      if (!error && data) {
        setWishlist(data.map((w) => w.product_id));
      }
    };

    loadOrders();
    loadAddresses();
    loadWishlist();

    return () => { isMounted = false; };
  }, [user?.email]);

  const handleToggleWishlist = async (productId) => {
    const exists = wishlist.includes(productId);
    if (user?.id && exists) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
    } else if (user?.id && !exists) {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    }
    setWishlist((prev) =>
      exists ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleAddAddress = async (newAddr) => {
    if (user?.id) {
      const { data, error } = await supabase.from('addresses').insert({
        user_id: user.id,
        name: newAddr.name,
        business_name: newAddr.businessName || '',
        address_line: newAddr.addressLine,
        city: newAddr.city,
        state: newAddr.state,
        pincode: newAddr.pincode,
        phone: newAddr.phone,
        latitude: newAddr.latitude || null,
        longitude: newAddr.longitude || null
      }).select().single();

      if (!error && data) {
        const addr = {
          id: data.id,
          name: data.name,
          businessName: data.business_name || '',
          addressLine: data.address_line,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
          latitude: data.latitude,
          longitude: data.longitude
        };
        setAddresses((prev) => {
          const isDuplicate = prev.some(
            (a) => a.addressLine === addr.addressLine && a.pincode === addr.pincode && a.city === addr.city
          );
          if (isDuplicate) return prev;
          return [...prev, addr];
        });
        return;
      }
    }

    setAddresses((prev) => {
      const isDuplicate = prev.some(
        (a) =>
          a.addressLine === newAddr.addressLine &&
          a.pincode === newAddr.pincode &&
          a.city === newAddr.city
      );
      if (isDuplicate) return prev;
      const id = 'addr-' + Date.now();
      return [...prev, { ...newAddr, id }];
    });
  };

  const handleDeleteAddress = async (addrId) => {
    if (user?.id) {
      await supabase.from('addresses').delete().eq('id', addrId).eq('user_id', user.id);
    }
    setAddresses((prev) => prev.filter((a) => a.id !== addrId));
  };

  return (
    <>
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#f8fafc', gap: '20px'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Loading Tradevia...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div className="app-main-flex-wrapper" style={loading ? { display: 'none' } : {}}>
      
      {/* Dynamic Header */}
      <Navbar 
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenLoginModal={() => openLoginModalWithContext(false)}
        cart={cart}
        currentPage={currentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedCategories={setSelectedCategories}
      />

      {/* Pages Container with React Router */}
      <div className="main-content-fluid-grow">
        <AppRouter 
          products={products}
          categories={categories}
          setSelectedCategories={setSelectedCategories}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          selectedBrands={selectedBrands}
          cart={cart}
          user={user}
          onUpdateUser={handleUpdateUser}
          addresses={addresses}
          onAddAddress={handleAddAddress}
          onDeleteAddress={handleDeleteAddress}
          onAddOrder={handleAddOrder}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onOpenLoginModal={() => openLoginModalWithContext(true)}
          onClearCart={handleClearCart}
          orders={orders}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateCategories={handleUpdateCategories}
          onBulkAdjustPrices={handleBulkAdjustPrices}
          onResetCatalog={handleResetCatalog}
        />
      </div>

      {/* Toast Notification */}
      <Toast message={cartMsg} onClose={() => setCartMsg('')} />

      {/* Login & SignUp Slide Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginTriggeredByCheckout(false);
          setLoginModalMode('login');
        }}
        onSuccess={handleLoginSuccess}
        initialMode={loginModalMode}
        checkoutPrompt={loginTriggeredByCheckout}
      />

      {/* Corporate B2B Footer */}
      <Footer />

      </div>
    </>
  );
}

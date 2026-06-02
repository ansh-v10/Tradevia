import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRouter from './router/AppRouter';
import LoginModal from './components/LoginModal';
import { productsData } from './util/productsData';
import './App.css';

// Default Category Images Setup
const defaultCategoryImages = {
  "Chocolates & Candies": "cadbury_category.jpg",
  "Daily Use": "mop_category.jpg",
  "Home Essentials": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80",
  "Preservatives": "chips_category.jpg",
  "Sweets & Namkeen": "rasgulla_category.jpg",
  "Beverages": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80",
  "Grains & Masalas": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=150&q=80",
  "More": ""
};

export default function App() {
  // --- Persistent User & Cart Session States ---
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ss_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ss_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ss_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(p => ({ ...p, inventory: p.inventory !== undefined ? p.inventory : 100 }));
    }
    return productsData.map(p => ({ ...p, inventory: 100 }));
  });

  const [categoryImages, setCategoryImages] = useState(() => {
    const saved = localStorage.getItem('ss_category_images');
    return saved ? JSON.parse(saved) : defaultCategoryImages;
  });

  // --- Orders & Saved Addresses B2B States ---
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ss_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('ss_addresses');
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
    return saved ? JSON.parse(saved) : [defaultAddr];
  });

  // --- Router & Filter Navigation States ---
  const location = useLocation();
  const navigate = useNavigate();

  // Determine currentPage string based on URL path to keep existing code working seamlessly:
  const currentPage = location.pathname === '/' ? 'home' : (location.pathname === '/browse' ? 'browse' : (location.pathname === '/cart' ? 'cart' : (location.pathname === '/orders' ? 'orders' : 'home')));

  // Redirect/Navigate helper that components can still call:
  const setCurrentPage = (page) => {
    if (page === 'home') navigate('/');
    else navigate('/' + page);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  // --- Modal Visibility Hooks ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTriggeredByCheckout, setLoginTriggeredByCheckout] = useState(false);

  // Sync session states to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('ss_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ss_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync catalog database to LocalStorage (so updates from separate admin app apply)
  useEffect(() => {
    try {
      localStorage.setItem('ss_products', JSON.stringify(products));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded on storefront sync!");
      }
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('ss_category_images', JSON.stringify(categoryImages));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded on category images storefront sync!");
      }
    }
  }, [categoryImages]);

  useEffect(() => {
    try {
      localStorage.setItem('ss_orders', JSON.stringify(orders));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded on orders storefront sync!");
      }
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('ss_addresses', JSON.stringify(addresses));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded on addresses storefront sync!");
      }
    }
  }, [addresses]);

  // Listen for storage events (allows instant storefront update when Admin panel updates localStorage in another tab!)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ss_products') {
        const parsed = e.newValue ? JSON.parse(e.newValue) : productsData;
        setProducts(parsed.map(p => ({ ...p, inventory: p.inventory !== undefined ? p.inventory : 100 })));
      }
      if (e.key === 'ss_category_images') {
        setCategoryImages(e.newValue ? JSON.parse(e.newValue) : defaultCategoryImages);
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

  // --- Login / Profile Action callbacks ---
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setCurrentPage('home');
  };

  const openLoginModalWithContext = (triggeredByCheckout = false) => {
    setLoginTriggeredByCheckout(triggeredByCheckout);
    setIsLoginModalOpen(true);
  };

  // --- Cart Manipulation ---
  const handleAddToCart = (product, quantity) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
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

  const handleAddAddress = (newAddr) => {
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

  return (
    <div className="app-main-flex-wrapper">
      
      {/* Dynamic Header */}
      <Navbar 
        user={user}
        onUpdateUser={setUser}
        onLogout={handleLogout}
        onOpenLoginModal={() => openLoginModalWithContext(false)}
        cart={cart}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedCategories={setSelectedCategories}
      />

      {/* Pages Container with React Router */}
      <div className="main-content-fluid-grow">
        <AppRouter 
          products={products}
          categoryImages={categoryImages}
          setCurrentPage={setCurrentPage}
          setSelectedCategories={setSelectedCategories}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          cart={cart}
          user={user}
          addresses={addresses}
          onAddAddress={handleAddAddress}
          onAddOrder={handleAddOrder}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onOpenLoginModal={() => openLoginModalWithContext(true)}
          onClearCart={handleClearCart}
          orders={orders}
        />
      </div>

      {/* Login & SignUp Slide Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginTriggeredByCheckout(false);
        }}
        onSuccess={handleLoginSuccess}
        initialMode="login"
        checkoutPrompt={loginTriggeredByCheckout}
      />

      {/* Corporate B2B Footer */}
      <Footer />

    </div>
  );
}

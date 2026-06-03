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
  "Chocolates & Candies": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cadbury_logo_new.jpg/500px-Cadbury_logo_new.jpg",
  "Daily Use": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR7kV9hA2yF0-BdwARpbVqum34JV7P2cR5fA&s",
  "Home Essentials": "https://cdn.brandfetch.io/domain/springwel.in/fallback/lettermark/theme/dark/h/400/w/400/icon?c=1bfwsmEH20zzEfSNTed",
  "Preservatives": "chips_category.jpg",
  "Sweets & Namkeen": "rasgulla_category.jpg",
  "Beverages": "https://www.logodesignlove.com/wp-content/uploads/2021/07/coca-cola-logo-arden-square-01.jpg",
  "Grains & Masalas": "https://prithvienterprises.co.in/cdn/shop/collections/Aashirvaad_Logo.png?v=1746877542&width=750",
  "Fresh & Dairy": "https://animationvisarts.com/wp-content/uploads/2023/12/Frame-32-6.png",
  "Snacks & Biscuits": "https://images.yourstory.com/cs/images/companies/4146603810349766400073541079337822789304320o-1611498760663.png?fm=auto&ar=1%3A1&mode=fill&fill=solid&fill-color=fff&format=auto&w=1920&q=85",
  "Cosmetics & Hygiene": "https://i.pinimg.com/736x/da/78/1d/da781de9ad2bffefcedb6d872856900c.jpg",
  "More": ""
};

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => productsData.map(p => ({ ...p, inventory: 100 })));
  const [categoryImages, setCategoryImages] = useState(defaultCategoryImages);

  // --- Orders & Saved Addresses B2B States ---
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState(() => {
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
  const [loginTriggeredByCheckout, setLoginTriggeredByCheckout] = useState(false);

  // --- Admin Desk Database Callbacks ---
  const handleAddProduct = (newProduct) => {
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const productWithId = { ...newProduct, id: nextId };
    setProducts(prevProducts => [...prevProducts, productWithId]);
  };

  const handleUpdateProduct = (updatedProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const handleDeleteProduct = (productId) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
  };

  const handleUpdateCategoryImages = (updatedImagesMap) => {
    setCategoryImages(updatedImagesMap);
  };

  const handleBulkAdjustPrices = (percentage) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const factor = 1 + (percentage / 100);
        let newWholesale = Math.round(p.wholesalePrice * factor * 10) / 10;
        newWholesale = Math.max(1, Math.min(newWholesale, p.retailPrice - 1));
        return {
          ...p,
          wholesalePrice: Math.round(newWholesale)
        };
      })
    );
  };

  const handleResetCatalog = () => {
    setProducts(productsData.map(p => ({ ...p, inventory: 100 })));
    setCategoryImages(defaultCategoryImages);
  };

  // --- Login / Profile Action callbacks ---
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    navigate('/');
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

  const handleDeleteAddress = (addrId) => {
    setAddresses((prev) => prev.filter((a) => a.id !== addrId));
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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedCategories={setSelectedCategories}
      />

      {/* Pages Container with React Router */}
      <div className="main-content-fluid-grow">
        <AppRouter 
          products={products}
          categoryImages={categoryImages}
          setSelectedCategories={setSelectedCategories}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          selectedBrands={selectedBrands}
          cart={cart}
          user={user}
          onUpdateUser={setUser}
          addresses={addresses}
          onAddAddress={handleAddAddress}
          onDeleteAddress={handleDeleteAddress}
          onAddOrder={handleAddOrder}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onOpenLoginModal={() => openLoginModalWithContext(true)}
          onClearCart={handleClearCart}
          orders={orders}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateCategoryImages={handleUpdateCategoryImages}
          onBulkAdjustPrices={handleBulkAdjustPrices}
          onResetCatalog={handleResetCatalog}
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

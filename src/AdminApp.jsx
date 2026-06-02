import React, { useState, useEffect } from 'react';
import AdminPortal from './pages/AdminPortal';
import { productsData } from './util/productsData';

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

export default function AdminApp() {
  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('ss_products');
    return saved ? JSON.parse(saved) : productsData;
  });

  const [categoryImages, setCategoryImages] = useState(() => {
    const saved = localStorage.getItem('ss_category_images');
    return saved ? JSON.parse(saved) : defaultCategoryImages;
  });

  // Sync catalog database to LocalStorage with try/catch to protect against browser storage limits
  useEffect(() => {
    try {
      localStorage.setItem('ss_products', JSON.stringify(products));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        alert("Warning: Browser local storage (localStorage) limit exceeded! The 5MB image is too large to save as a base64 string. Please try using a web URL link or compress the image.");
      } else {
        console.error("Local storage error:", e);
      }
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('ss_category_images', JSON.stringify(categoryImages));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        alert("Warning: Browser local storage limit exceeded for category images!");
      } else {
        console.error("Local storage error:", e);
      }
    }
  }, [categoryImages]);

  // Sync across tabs/pages (if storefront alters anything, although storefront is read-only)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ss_products') {
        setProducts(e.newValue ? JSON.parse(e.newValue) : productsData);
      }
      if (e.key === 'ss_category_images') {
        setCategoryImages(e.newValue ? JSON.parse(e.newValue) : defaultCategoryImages);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    setProducts(productsData);
    setCategoryImages(defaultCategoryImages);
    localStorage.removeItem('ss_products');
    localStorage.removeItem('ss_category_images');
  };

  // MPA Redirect back to the customer storefront
  const handleRedirectToShop = () => {
    window.location.href = "/";
  };

  return (
    <div className="app-main-flex-wrapper" style={{ padding: '24px 0' }}>
      <AdminPortal 
        products={products}
        categoryImages={categoryImages}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateCategoryImages={handleUpdateCategoryImages}
        onBulkAdjustPrices={handleBulkAdjustPrices}
        onResetCatalog={handleResetCatalog}
        setCurrentPage={handleRedirectToShop} // Redirects window back to "/"
      />
    </div>
  );
}

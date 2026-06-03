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
  "Grains & Masalas": "itc.png",
  "Fresh & Dairy": "https://images.unsplash.com/photo-1528750955906-c8b4a3952f2d?auto=format&fit=crop&w=150&q=80",
  "Snacks & Biscuits": "https://images.unsplash.com/photo-1558961312-50a49c93acfe?auto=format&fit=crop&w=150&q=80",
  "Cosmetics & Hygiene": "unilever.png",
  "More": ""
};

export default function AdminApp() {
  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => productsData.map(p => ({ ...p, inventory: 100 })));
  const [categoryImages, setCategoryImages] = useState(defaultCategoryImages);
  const [orders, setOrders] = useState([]);

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

  // MPA Redirect back to the customer storefront
  const handleRedirectToShop = () => {
    window.location.href = "/";
  };

  return (
    <div className="app-main-flex-wrapper" style={{ padding: '24px 0' }}>
      <AdminPortal 
        products={products}
        categoryImages={categoryImages}
        orders={orders}
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

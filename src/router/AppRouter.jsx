import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Browse from '../pages/Browse';
import CartPage from '../pages/CartPage';
import YourOrders from '../pages/YourOrders';

export default function AppRouter({
  products,
  categoryImages,
  setCurrentPage,
  setSelectedCategories,
  setSelectedBrands,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  selectedCategories,
  selectedBrands,
  cart,
  user,
  addresses,
  onAddAddress,
  onAddOrder,
  onUpdateQuantity,
  onRemoveItem,
  onOpenLoginModal,
  onClearCart,
  orders
}) {
  return (
    <Routes>
      <Route path="/" element={
        <Home 
          products={products}
          categoryImages={categoryImages}
          setCurrentPage={setCurrentPage}
          setSelectedCategories={setSelectedCategories}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={onAddToCart}
        />
      } />
      <Route path="/browse" element={
        <Browse 
          products={products}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={onAddToCart}
        />
      } />
      <Route path="/cart" element={
        <CartPage 
          cart={cart}
          user={user}
          addresses={addresses}
          onAddAddress={onAddAddress}
          onAddOrder={onAddOrder}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onOpenLoginModal={onOpenLoginModal}
          onClearCart={onClearCart}
          setCurrentPage={setCurrentPage}
        />
      } />
      <Route path="/orders" element={
        <YourOrders 
          orders={orders}
          setCurrentPage={setCurrentPage}
        />
      } />
      {/* Wildcard redirect back to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

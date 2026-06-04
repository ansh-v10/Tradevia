import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Browse from '../pages/Browse';
import CartPage from '../pages/CartPage';
import YourOrders from '../pages/YourOrders';
import AdminPortal from '../pages/AdminPortal';
import YourAccount from '../pages/YourAccount';
import ProductDetails from '../pages/ProductDetails';

export default function AppRouter({
  products,
  categoryImages,
  setSelectedCategories,
  setSelectedBrands,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  selectedCategories,
  selectedBrands,
  cart,
  user,
  onUpdateUser,
  addresses,
  onAddAddress,
  onDeleteAddress,
  onAddOrder,
  onUpdateQuantity,
  onRemoveItem,
  onOpenLoginModal,
  onClearCart,
  orders,
  // Admin database state props
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateCategoryImages,
  onBulkAdjustPrices,
  onResetCatalog
}) {
  return (
    <Routes>
      <Route path="/" element={
        <Home 
          products={products}
          categoryImages={categoryImages}
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
      <Route path="/Browse" element={
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
        />
      } />
      <Route path="/orders" element={
        <YourOrders 
          orders={orders}
        />
      } />
      <Route path="/account" element={
        <YourAccount 
          user={user}
          onUpdateUser={onUpdateUser}
          addresses={addresses}
          onAddAddress={onAddAddress}
          onDeleteAddress={onDeleteAddress}
          orders={orders}
          cart={cart}
          onOpenLoginModal={onOpenLoginModal}
        />
      } />
      <Route path="/product/:id" element={
        <ProductDetails 
          products={products}
          cart={cart}
          onAddToCart={onAddToCart}
          onOpenLoginModal={onOpenLoginModal}
        />
      } />
      <Route path="/admin" element={
        <AdminPortal 
          products={products}
          categoryImages={categoryImages}
          orders={orders}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onUpdateCategoryImages={onUpdateCategoryImages}
          onBulkAdjustPrices={onBulkAdjustPrices}
          onResetCatalog={onResetCatalog}
        />
      } />
      {/* Wildcard redirect back to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
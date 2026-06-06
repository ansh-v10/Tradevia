import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Browse from '../pages/Browse';
import CartPage from '../pages/CartPage';
import YourOrders from '../pages/YourOrders';
import AdminPortal from '../pages/AdminPortal';
import YourAccount from '../pages/YourAccount';
import ProductDetails from '../pages/ProductDetails';
import WishlistPage from '../pages/WishlistPage';
import ProfilePage from '../pages/ProfilePage';

export default function AppRouter({
  products,
  categories,
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
  wishlist,
  onToggleWishlist,
  // Admin database state props
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateCategories,
  onBulkAdjustPrices,
  onResetCatalog
}) {
  return (
    <Routes>
      <Route path="/" element={
        <Home 
          products={products}
          categories={categories}
          setSelectedCategories={setSelectedCategories}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={onAddToCart}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
        />
      } />
      <Route path="/browse" element={
        <Browse 
          products={products}
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={onAddToCart}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
        />
      } />
      <Route path="/Browse" element={
        <Browse 
          products={products}
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          onAddToCart={onAddToCart}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
        />
      } />
      <Route path="/cart" element={
        <CartPage 
          cart={cart}
          user={user}
          addresses={addresses}
          onAddAddress={onAddAddress}
          onDeleteAddress={onDeleteAddress}
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
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
        />
      } />
      <Route path="/wishlist" element={
        <WishlistPage 
          products={products}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
        />
      } />
      <Route path="/profile" element={
        <ProfilePage 
          user={user}
          onUpdateUser={onUpdateUser}
        />
      } />
      <Route path="/admin" element={
        <AdminPortal 
          products={products}
          categories={categories}
          orders={orders}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          onUpdateCategories={onUpdateCategories}
          onBulkAdjustPrices={onBulkAdjustPrices}
          onResetCatalog={onResetCatalog}
        />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

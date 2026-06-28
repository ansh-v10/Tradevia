import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../util/supabaseClient';
import * as XLSX from 'xlsx';
import { COURIER_OPTIONS } from '../util/tracking';

export default function AdminPortal({ 
  products, 
  categories, 
  orders = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onUpdateCategories, 
  onBulkAdjustPrices,
  onResetCatalog
}) {
  const navigate = useNavigate();
  const [trackingInputs, setTrackingInputs] = useState({});
  const [courierInputs, setCourierInputs] = useState({});
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'bulk', 'orders', 'returns', 'customers', 'analytics', 'price-history'
  const [returns, setReturns] = useState([]);
  const [returnsLoaded, setReturnsLoaded] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersLoaded, setCustomerOrdersLoaded] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceHistoryLoaded, setPriceHistoryLoaded] = useState(false);
  const [adminToast, setAdminToast] = useState({ show: false, message: '', type: 'success' });

  const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(h => {
        const val = row[h]?.toString() || '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeTab === 'returns' && !returnsLoaded) {
      supabase.from('returns').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setReturns(data);
        setReturnsLoaded(true);
      });
    }
    if (activeTab === 'customers' && !customersLoaded) {
      (async () => {
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allOrders } = await supabase.from('orders').select('user_id');
        const orderCounts = {};
        if (allOrders) {
          allOrders.forEach(o => {
            orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1;
          });
        }
        setCustomers((profiles || []).map(p => ({ ...p, ordersCount: orderCounts[p.id] || 0 })));
        setCustomersLoaded(true);
      })();
    }
    if (activeTab === 'price-history' && !priceHistoryLoaded) {
      supabase.from('price_history').select('*').order('changed_at', { ascending: false }).then(({ data }) => {
        if (data) setPriceHistory(data);
        setPriceHistoryLoaded(true);
      });
    }
    if (activeTab === 'analytics' && !analyticsLoaded) {
      (async () => {
        const { data: paidOrders } = await supabase.from('orders').select('*').eq('status', 'paid');
        if (!paidOrders || paidOrders.length === 0) {
          setAnalyticsData({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, topProducts: [] });
          setAnalyticsLoaded(true);
          return;
        }
        const totalOrders = paidOrders.length;
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const avgOrderValue = totalRevenue / totalOrders;
        const productQty = {};
        paidOrders.forEach(o => {
          (o.items || []).forEach(item => {
            const key = item.name || item.productId || 'Unknown';
            productQty[key] = (productQty[key] || 0) + (item.quantity || 0);
          });
        });
        const topProducts = Object.entries(productQty)
          .map(([name, qty]) => ({ name, qty }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);
        setAnalyticsData({ totalRevenue, totalOrders, avgOrderValue, topProducts });
        setAnalyticsLoaded(true);
      })();
    }
  }, [activeTab, returnsLoaded, customersLoaded, analyticsLoaded, priceHistoryLoaded]);

  useEffect(() => {
    setReturnsLoaded(false);
    setCustomersLoaded(false);
    setCustomerOrdersLoaded(false);
    setAnalyticsLoaded(false);
    setPriceHistoryLoaded(false);
  }, [activeTab]);

  const loadCustomerOrders = async (userId) => {
    setSelectedCustomerId(userId);
    setCustomerOrdersLoaded(false);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setCustomerOrders(data);
    setCustomerOrdersLoaded(true);
  };

  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    const { error } = await supabase.from('returns').update({ status: newStatus }).eq('id', returnId);
    if (!error) setReturns((prev) => prev.map((r) => r.id === returnId ? { ...r, status: newStatus } : r));
  };
  
  const handleMarkDelivered = async (orderId) => {
    await supabase.rpc('mark_order_delivered', { order_id: orderId });
    if (window.onAdminOrderUpdate) window.onAdminOrderUpdate();
    setAdminToast({ show: true, message: 'Order marked as delivered!', type: 'success' });
    setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === 'confirmed') update.confirmed_at = new Date().toISOString();
    if (newStatus === 'processing') update.processing_at = new Date().toISOString();
    if (newStatus === 'out_for_delivery') update.out_for_delivery_at = new Date().toISOString();
    await supabase.from('orders').update(update).eq('id', orderId);
    if (window.onAdminOrderUpdate) window.onAdminOrderUpdate();
    setAdminToast({ show: true, message: `Order marked as ${newStatus.replace(/_/g, ' ')}!`, type: 'success' });
    setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
  };

  // Admin Login/Signup Authentication States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [registeredAdmins, setRegisteredAdmins] = useState(() => {
    const saved = localStorage.getItem('tradevia_sales_admins');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse admins database", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tradevia_sales_admins', JSON.stringify(registeredAdmins));
  }, [registeredAdmins]);

  // Manage Admins tab states
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminAccId, setAdminAccId] = useState('');
  const [adminAccPassword, setAdminAccPassword] = useState('');

  const handleAdminAccountSubmit = (e) => {
    e.preventDefault();
    const cleanId = adminAccId.trim();
    const cleanPassword = adminAccPassword.trim();
    if (!cleanId || !cleanPassword) return;

    if (editingAdminId) {
      setRegisteredAdmins(prev => 
        prev.map(a => a.id.toLowerCase() === editingAdminId.toLowerCase() ? { id: a.id, password: cleanPassword } : a)
      );
      setActionSuccess(`Password for admin "${editingAdminId}" updated successfully!`);
      setAdminToast({ show: true, message: `Password for admin "${editingAdminId}" updated successfully!`, type: 'success' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      setEditingAdminId(null);
    } else {
      const exists = registeredAdmins.some(
        a => a.id.toLowerCase() === cleanId.toLowerCase()
      );
      if (exists) {
        setAdminToast({ show: true, message: "This Admin ID is already registered.", type: 'error' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
        return;
      }
      setRegisteredAdmins(prev => [...prev, { id: cleanId, password: cleanPassword }]);
      setActionSuccess(`Admin "${cleanId}" registered successfully!`);
      setAdminToast({ show: true, message: `Admin "${cleanId}" registered successfully!`, type: 'success' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
    }
    setAdminAccId('');
    setAdminAccPassword('');
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleEditAdminClick = (adminAcc) => {
    setEditingAdminId(adminAcc.id);
    setAdminAccId(adminAcc.id);
    setAdminAccPassword(adminAcc.password);
  };

  const handleCancelEditAdmin = () => {
    setEditingAdminId(null);
    setAdminAccId('');
    setAdminAccPassword('');
  };

  const handleDeleteAdminClick = (adminId) => {
    if (registeredAdmins.length <= 1) {
      setAdminToast({ show: true, message: "Cannot delete the last admin account! At least one administrator account must exist.", type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      return;
    }
    if (window.confirm(`Are you sure you want to delete admin account "${adminId}"?`)) {
      setRegisteredAdmins(prev => prev.filter(a => a.id.toLowerCase() !== adminId.toLowerCase()));
      setActionSuccess(`Admin account "${adminId}" deleted successfully!`);
      setAdminToast({ show: true, message: `Admin account "${adminId}" deleted successfully!`, type: 'success' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      setTimeout(() => setActionSuccess(''), 2000);
    }
  };

  const [authId, setAuthId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [authSecretKey, setAuthSecretKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkAdminAccess = async (session) => {
      if (!session?.user?.email) {
        if (isMounted) {
          setIsAdminAuthenticated(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc('is_admin');

      if (!isMounted) return;

      if (error || !data) {
        await supabase.auth.signOut();
        setIsAdminAuthenticated(false);
        setAuthError('This account is not whitelisted for admin access.');
        return;
      }

      setIsAdminAuthenticated(true);
      setAuthError('');
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      checkAdminAccess(data.session);
      setIsAuthChecking(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminAccess(session);
      setIsAuthChecking(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      // Primary: Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
        email: authId.trim(),
        password: authPassword
      });

      if (error) {
        // Fallback: local development admin (INSECURE — for dev only)
        const localAdmin = registeredAdmins.find(
          a => a.id.toLowerCase() === authId.trim().toLowerCase() && a.password === authPassword
        );
        if (localAdmin) {
          console.warn('Using local admin authentication (insecure — for development only)');
          setIsAdminAuthenticated(true);
          setActionSuccess('Login successful (dev mode).');
          setAdminToast({ show: true, message: 'Login successful (dev mode).', type: 'success' });
          setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
          setAuthId('');
          setAuthPassword('');
          return;
        }
        setAuthError(error.message);
        return;
      }

      const { data, error: adminError } = await supabase.rpc('is_admin');
      if (adminError || !data) {
        await supabase.auth.signOut();
        setAuthError('This account is signed in, but it is not allowed to edit the catalog.');
        return;
      }

      setIsAdminAuthenticated(true);
      setActionSuccess('Login successful. Welcome to the admin panel.');
      setAdminToast({ show: true, message: 'Login successful. Welcome to the admin panel.', type: 'success' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      setAuthId('');
      setAuthPassword('');
    } else {
      if (!authId.trim() || !authPassword) {
        setAuthError('Please enter a valid email and password.');
        return;
      }
      const normalizedKey = authSecretKey.trim().toUpperCase();
      if (normalizedKey !== 'TRADEVIA_ADMIN' && normalizedKey !== 'ADMIN' && normalizedKey !== 'TRADEVIA_ADMIN_SECRET') {
        setAuthError('Unauthorized registration! Invalid Admin Secret Security Code.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: authId.trim(),
        password: authPassword
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      const hasSession = Boolean(data.session);
      if (!hasSession) {
        setAuthSuccess('Admin account created. If email confirmation is enabled, confirm the email and then log in.');
        setAuthMode('login');
        setAuthId('');
        setAuthPassword('');
        setAuthSecretKey('');
        return;
      }

      const { data: isAdminAllowed } = await supabase.rpc('is_admin');
      if (!isAdminAllowed) {
        await supabase.auth.signOut();
        setAuthError('Account created, but this email is not whitelisted in the admins table.');
        return;
      }

      setIsAdminAuthenticated(true);
      setAuthSuccess('Admin Account Registered Successfully!');
      setAuthMode('login');
      setAuthSecretKey('');
      setAuthPassword('');
    }
  };

  // Product Form states
  const [editingId, setEditingId] = useState(null); // null if adding
  const [name, setName] = useState('');
  const [gst, setGst] = useState('18');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(() => {
    return categories && categories.length > 0 ? categories[0].name : '';
  });
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [packSize, setPackSize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isMostBought, setIsMostBought] = useState(false);
  const [moq, setMoq] = useState('10');
  const [inventory, setInventory] = useState('100');
  const [tier2Price, setTier2Price] = useState('');
  const [tier3Price, setTier3Price] = useState('');
  const [tier2Moq, setTier2Moq] = useState('');
  const [tier3Moq, setTier3Moq] = useState('');
  const [errors, setErrors] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');

  // Bulk Upload states
  const [bulkUploadData, setBulkUploadData] = useState([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [bulkUploadFileName, setBulkUploadFileName] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  // Image Source Tab: 'link' or 'upload'
  const [imageSourceType, setImageSourceType] = useState('link');

  // Category Manager states
  const [localCategories, setLocalCategories] = useState(() => categories || []);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [newCatShowOnHome, setNewCatShowOnHome] = useState(true);
  const [newCatShowProductsOnHome, setNewCatShowProductsOnHome] = useState(false);

  // Sync with categories prop
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Keep form selection valid if categories change
  useEffect(() => {
    if (categories && categories.length > 0 && (!category || !categories.some(c => c.name === category))) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  // Bulk rate adjustment states
  const [priceAdjPercent, setPriceAdjPercent] = useState('5');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // Search filter inside admin catalog
  const [adminSearchInput, setAdminSearchInput] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  const handleSearchSubmit = () => {
    setAdminSearch(adminSearchInput);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Upload image to Supabase Storage via API server
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAdminToast({ show: true, message: "This file is too large. Please select an image file under 5 MB.", type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      e.target.value = "";
      return;
    }

    // Read as base64 for preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setImageUrl(base64Data); // temporary preview

      // Upload to Supabase Storage via API
      try {
        const resp = await fetch(`${apiBase}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, base64Data })
        });
        const text = await resp.text();
        let js;
        try { js = JSON.parse(text); } catch { throw new Error(text || 'Upload failed'); }
        if (js?.url) {
          setImageUrl(js.url); // replace preview with permanent URL
        } else {
          throw new Error(js?.error || 'Upload failed');
        }
      } catch (err) {
        console.error(err);
        setAdminToast({ show: true, message: 'Image upload failed: ' + (err.message || ''), type: 'error' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Edit action
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setRetailPrice(product.retailPrice.toString());
    setWholesalePrice(product.wholesalePrice.toString());
    setPackSize(product.packSize);
    setImageUrl(product.imageUrl);
    setIsMostBought(product.isMostBought || false);
    setMoq(product.moq ? product.moq.toString() : '10');
    setInventory(product.inventory !== undefined ? product.inventory.toString() : '100');
    setGst((product.gst || 18).toString());
    setTier2Price(product.tier2Price !== undefined && product.tier2Price !== null ? product.tier2Price.toString() : '');
    setTier3Price(product.tier3Price !== undefined && product.tier3Price !== null ? product.tier3Price.toString() : '');
    setTier2Moq(product.tier2Moq !== undefined && product.tier2Moq !== null ? product.tier2Moq.toString() : '');
    setTier3Moq(product.tier3Moq !== undefined && product.tier3Moq !== null ? product.tier3Moq.toString() : '');
    
    // Auto-detect image source type
    if (product.imageUrl && product.imageUrl.startsWith('data:')) {
      setImageSourceType('upload');
    } else {
      setImageSourceType('link');
    }

    setErrors({});
    
    // scroll to form
    const formElem = document.getElementById('admin-product-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setBrand('');
    setCategory(categories && categories.length > 0 ? categories[0].name : '');
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');
    setInventory('100');
    setGst('18');
    setTier2Price('');
    setTier3Price('');
    setTier2Moq('');
    setTier3Moq('');
    setErrors({});
  };

  // Submit product additions/edits
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!name) tempErrors.name = "Product name is required";
    if (!brand) tempErrors.brand = "Brand name is required";
    if (!packSize) tempErrors.packSize = "Pack size is required (e.g. Box of 12)";
    
    const retail = parseFloat(retailPrice);
    const wholesale = parseFloat(wholesalePrice);
    const minOrderQty = parseInt(moq);
    const stockQty = parseInt(inventory);
    const t2 = tier2Price !== '' ? parseFloat(tier2Price) : null;
    const t3 = tier3Price !== '' ? parseFloat(tier3Price) : null;
    const t2Moq = tier2Moq !== '' ? parseInt(tier2Moq) : null;
    const t3Moq = tier3Moq !== '' ? parseInt(tier3Moq) : null;

    if (isNaN(retail) || retail <= 0) tempErrors.retailPrice = "Enter valid retail price";
    if (isNaN(wholesale) || wholesale <= 0) tempErrors.wholesalePrice = "Enter valid wholesale price";
    if (wholesale >= retail) tempErrors.wholesalePrice = "Wholesale price must be lower than MRP";
    if (isNaN(minOrderQty) || minOrderQty <= 0) tempErrors.moq = "Enter valid MOQ (at least 1)";
    if (isNaN(stockQty) || stockQty < 0) tempErrors.inventory = "Enter valid inventory quantity (0 or more)";
    
    if (t2 !== null && (isNaN(t2) || t2 <= 0 || t2 >= wholesale)) {
      tempErrors.tier2Price = "Tier 2 rate must be lower than base wholesale price";
    }
    if (t3 !== null && (isNaN(t3) || t3 <= 0 || (t2 !== null ? t3 >= t2 : t3 >= wholesale))) {
      tempErrors.tier3Price = "Tier 3 rate must be lower than Tier 2 rate / base wholesale price";
    }

    if (t2Moq !== null && (isNaN(t2Moq) || t2Moq <= minOrderQty)) {
      tempErrors.tier2Moq = "Tier 2 MOQ must be greater than base MOQ";
    }
    if (t3Moq !== null && (isNaN(t3Moq) || t3Moq <= (t2Moq !== null ? t2Moq : minOrderQty))) {
      tempErrors.tier3Moq = "Tier 3 MOQ must be greater than Tier 2 MOQ / base MOQ";
    }

    if (!imageUrl) tempErrors.imageUrl = "Product image file or web URL is required";

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) return;

    const productPayload = {
      name,
      brand,
      category,
      retailPrice: retail,
      wholesalePrice: wholesale,
      packSize,
      imageUrl,
      isMostBought,
      moq: minOrderQty || 10,
      inventory: stockQty >= 0 ? stockQty : 100,
      tier2Price: t2,
      tier3Price: t3,
      tier2Moq: t2Moq,
      tier3Moq: t3Moq,
      gst: parseInt(gst) || 18,
      rating: editingId ? (products.find(p => p.id === editingId)?.rating || 4.5) : 4.5,
      reviewsCount: editingId ? (products.find(p => p.id === editingId)?.reviewsCount || 100) : 100
    };

    try {
      if (editingId) {
        await onUpdateProduct({ ...productPayload, id: editingId });
        setActionSuccess("Product updated in wholesale catalog successfully!");
        setAdminToast({ show: true, message: "Product updated in wholesale catalog successfully!", type: 'success' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
        setEditingId(null);
      } else {
        await onAddProduct(productPayload);
        setActionSuccess("New product added to catalog successfully!");
        setAdminToast({ show: true, message: "New product added to catalog successfully!", type: 'success' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      }
    } catch (error) {
      console.error(error);
      setAdminToast({ show: true, message: error?.message || 'Failed to save product to Supabase.', type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      return;
    }

    // Clear form
    setName('');
    setBrand('');
    setCategory(categories && categories.length > 0 ? categories[0].name : '');
    setRetailPrice('');
    setWholesalePrice('');
    setPackSize('');
    setImageUrl('');
    setIsMostBought(false);
    setImageSourceType('link');
    setMoq('10');
    setInventory('100');
    setGst('18');
    setTier2Price('');
    setTier3Price('');
    setTier2Moq('');
    setTier3Moq('');

    setTimeout(() => setActionSuccess(''), 2500);
  };

  // === Bulk Upload from Excel/CSV ===
  const handleDownloadTemplate = () => {
    const headers = ['name', 'brand', 'category', 'retailPrice', 'wholesalePrice', 'packSize', 'imageUrl', 'moq', 'inventory', 'gst', 'tier2Price', 'tier2Moq', 'tier3Price', 'tier3Moq', 'isMostBought'];
    const sample = ['Sample Product', 'Brand Name', 'Category Name', '199', '149', 'Box of 12', 'https://example.com/image.jpg', '10', '100', '18', '139', '50', '129', '100', 'true'];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tradevia_product_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkUploadFileName(file.name);
    setBulkUploadErrors([]);
    setBulkUploadData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const errors = [];
        const valid = [];

        jsonData.forEach((row, idx) => {
          if (!row.name || !row.brand || !row.retailPrice || !row.wholesalePrice) {
            errors.push(`Row ${idx + 2}: Missing required fields (name, brand, retailPrice, wholesalePrice)`);
            return;
          }
          valid.push({
            name: String(row.name).trim(),
            brand: String(row.brand).trim(),
            category: String(row.category || 'Uncategorized').trim(),
            retailPrice: parseFloat(row.retailPrice),
            wholesalePrice: parseFloat(row.wholesalePrice),
            packSize: String(row.packSize || 'Standard Pack').trim(),
            imageUrl: String(row.imageUrl || '').trim(),
            moq: parseInt(row.moq) || 10,
            inventory: parseInt(row.inventory) !== undefined && !isNaN(parseInt(row.inventory)) ? parseInt(row.inventory) : 100,
            gst: parseInt(row.gst) || 18,
            tier2Price: row.tier2Price ? parseFloat(row.tier2Price) : null,
            tier2Moq: row.tier2Moq ? parseInt(row.tier2Moq) : null,
            tier3Price: row.tier3Price ? parseFloat(row.tier3Price) : null,
            tier3Moq: row.tier3Moq ? parseInt(row.tier3Moq) : null,
            isMostBought: row.isMostBought === 'true' || row.isMostBought === true || row.isMostBought === 'TRUE',
            rating: 4.5,
            reviewsCount: 0
          });
        });

        setBulkUploadErrors(errors);
        setBulkUploadData(valid);
      } catch (err) {
        setBulkUploadErrors(['Failed to parse file: ' + err.message]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkUploadData.length === 0) return;
    setBulkUploading(true);
    let successCount = 0;
    let failCount = 0;
    for (const product of bulkUploadData) {
      try {
        await onAddProduct(product);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setBulkUploading(false);
    setAdminToast({
      show: true,
      message: `Bulk upload complete: ${successCount} added, ${failCount} failed.`,
      type: failCount > 0 ? 'warning' : 'success'
    });
    setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 4000);
    setBulkUploadData([]);
    setBulkUploadFileName('');
    // Reset file input
    const fileInput = document.getElementById('bulk-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteClick = async (productId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the wholesale catalog?`)) {
      try {
        await onDeleteProduct(productId);
        setActionSuccess("Product deleted successfully!");
        setAdminToast({ show: true, message: "Product deleted successfully!", type: 'success' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
        setTimeout(() => setActionSuccess(''), 2000);
      } catch (error) {
        console.error(error);
        setAdminToast({ show: true, message: error?.message || 'Failed to delete product from Supabase.', type: 'error' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      }
    }
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    const nameTrimmed = newCatName.trim();
    const urlTrimmed = newCatImageUrl.trim();
    if (!nameTrimmed || !urlTrimmed) return;

    // Check if name already exists in localCategories
    const exists = localCategories.some(
      c => c.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      setAdminToast({ show: true, message: `Category "${nameTrimmed}" already exists.`, type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      return;
    }

    const newCat = {
      name: nameTrimmed,
      imageUrl: urlTrimmed,
      showOnHome: newCatShowOnHome,
      showProductsOnHome: newCatShowProductsOnHome
    };

    setLocalCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatImageUrl('');
    setNewCatShowOnHome(true);
    setNewCatShowProductsOnHome(false);
    
    setActionSuccess(`Category "${nameTrimmed}" added to local draft! Remember to save changes.`);
    setAdminToast({ show: true, message: `Category "${nameTrimmed}" added!`, type: 'success' });
    setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const handleLocalCatImageChange = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, imageUrl: value } : cat));
  };

  const handleLocalCatShowOnHomeToggle = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, showOnHome: value } : cat));
  };

  const handleLocalCatShowProductsOnHomeToggle = (index, value) => {
    setLocalCategories(prev => prev.map((cat, i) => i === index ? { ...cat, showProductsOnHome: value } : cat));
  };

  const handleLocalCatDelete = (name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This will affect product listings.`)) {
      setLocalCategories(prev => prev.filter(cat => cat.name !== name));
    }
  };

  const handleSaveCategoriesConfig = () => {
    onUpdateCategories(localCategories);
    setBulkSuccess("Wholesale categories updated successfully!");
    setAdminToast({ show: true, message: "Wholesale categories updated successfully!", type: 'success' });
    setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
    setTimeout(() => setBulkSuccess(''), 2000);
  };

  const handleRevertCategories = () => {
    if (window.confirm("Revert category changes back to saved settings?")) {
      setLocalCategories(categories || []);
    }
  };

  const handleBulkRateSubmit = async (e) => {
    e.preventDefault();
    const percent = parseFloat(priceAdjPercent);
    if (isNaN(percent) || percent === 0) {
      setAdminToast({ show: true, message: "Please enter a valid non-zero percentage adjustment.", type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      return;
    }
    try {
      await onBulkAdjustPrices(percent);
      setBulkSuccess(`Wholesale rates adjusted globally by ${percent > 0 ? '+' : ''}${percent}%!`);
      setAdminToast({ show: true, message: `Wholesale rates adjusted globally by ${percent > 0 ? '+' : ''}${percent}%!`, type: 'success' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      setTimeout(() => setBulkSuccess(''), 3000);
    } catch (error) {
      console.error(error);
      setAdminToast({ show: true, message: error?.message || 'Failed to update wholesale rates in Supabase.', type: 'error' });
      setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
    }
  };

  const handleResetCatalogSubmit = async () => {
    if (window.confirm("This will revert all product listings and category images to default distributor database. Continue?")) {
      try {
        await onResetCatalog();
        setBulkSuccess("Wholesale database restored to factory settings!");
        setAdminToast({ show: true, message: "Wholesale database restored to factory settings!", type: 'success' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
        setTimeout(() => setBulkSuccess(''), 3000);
      } catch (error) {
        console.error(error);
        setAdminToast({ show: true, message: error?.message || 'Failed to reset the catalog in Supabase.', type: 'error' });
        setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
      }
    }
  };

  // Filter products by search query inside table
  const filteredProducts = products.filter(p => {
    if (!p) return false;
    const q = adminSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  if (isAuthChecking) {
    return (
      <div className="admin-login-wrapper" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--color-bg-main)'
      }}>
        <Spinner />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--color-bg-main)'
      }}>
        <div className="admin-login-card" style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--color-border)',
          padding: '40px 32px',
          textAlign: 'center'
        }}>
          <div className="login-logo-container" style={{ marginBottom: '24px' }}>
            <span style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-accent)', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              fontWeight: '800', 
              fontSize: '20px',
              letterSpacing: '1px',
              display: 'inline-block',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              TRADEVIA
            </span>
            <h3 style={{ marginTop: '16px', fontSize: '22px', fontWeight: '800', color: 'var(--color-text-main)' }}>
              Admin Control Panel
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              {authMode === 'login' ? 'Please log in to manage your wholesale catalog' : 'Register new authorized admin credentials'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {authError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: 'var(--color-danger)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ {authError}
              </div>
            )}
            {authSuccess && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #d1fae5',
                color: 'var(--color-success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✓ {authSuccess}
              </div>
            )}

            <div>
              <label htmlFor="admin-auth-id" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                Admin Email
              </label>
              <input 
                id="admin-auth-id"
                type="text" 
                placeholder="e.g. admin@example.com"
                value={authId}
                onChange={(e) => setAuthId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '14px',
                  color: 'var(--color-text-main)',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
              />
            </div>

            <div>
              <label htmlFor="admin-auth-password" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="admin-auth-password"
                  type={showAdminPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '40px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                />
                <button 
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label={showAdminPassword ? "Hide password" : "Show password"}
                >
                  {showAdminPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label htmlFor="admin-auth-secret" style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                  Admin Security Secret Key
                </label>
                <input 
                  id="admin-auth-secret"
                  type="password" 
                  placeholder="Enter admin verification key"
                  value={authSecretKey}
                  onChange={(e) => setAuthSecretKey(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    color: 'var(--color-text-main)',
                    backgroundColor: '#f8fafc',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                />
              </div>
            )}

            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '8px',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              {authMode === 'login' ? 'Access Control Desk' : 'Register Admin Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {authMode === 'login' ? (
                <>
                  Need to add a new admin?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Log In
                  </button>
                </>
              )}
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '12px'
              }}
            >
              ← Back to Shop front
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper navbar-width-limiter text-left">
      <div className="admin-header-row" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-main-title">Tradevia Admin Control Desk</h2>
          <p className="page-main-subtitle">Commercial panel to manage inventory products, adjust wholesale prices, and configure frontpage layouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="secondary-b2b-btn" 
            onClick={async () => {
              await supabase.auth.signOut();
              setIsAdminAuthenticated(false);
              setActionSuccess('Logged out successfully.');
              setAdminToast({ show: true, message: 'Logged out successfully.', type: 'success' });
              setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
            }}
            style={{ backgroundColor: '#fee2e2', color: 'var(--color-danger)', borderColor: '#fca5a5' }}
          >
            🔒 Log Out Admin
          </button>
          <button className="secondary-b2b-btn" onClick={() => navigate('/')}>
            ← Back to Shop front
          </button>
        </div>
      </div>

      {/* Admin Panel Tab toggles */}
      <div className="admin-tabs-row">
        <button 
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Manage Catalog Products
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Category Circle Images
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Rates Adjuster
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'bulk-upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk-upload')}
        >
          Bulk Upload Products
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders Placed Log ({orders.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          Returns / Refunds
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'price-history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('price-history'); }}
        >
          Price History
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          Admin Accounts ({registeredAdmins.length})
        </button>
      </div>

      {/* SUCCESS POPUP MESSAGE */}
      {actionSuccess && <div className="modal-success-banner mt-4">{actionSuccess}</div>}
      {bulkSuccess && <div className="modal-success-banner mt-4">{bulkSuccess}</div>}

      {/* TAB 1: PRODUCT CATALOG MANAGEMENT */}
      {activeTab === 'products' && (
        <>
          {(() => {
            const outOfStock = products.filter(p => p && (p.inventory !== undefined ? p.inventory : 100) <= 0).length;
            const lowStock = products.filter(p => {
              if (!p) return false;
              const inv = p.inventory !== undefined ? p.inventory : 100;
              return inv > 0 && inv < 10;
            }).length;
            if (outOfStock === 0 && lowStock === 0) return null;
            const parts = [];
            if (outOfStock > 0) parts.push(`${outOfStock} product${outOfStock > 1 ? 's' : ''} out of stock`);
            if (lowStock > 0) parts.push(`${lowStock} product${lowStock > 1 ? 's' : ''} low in stock`);
            return (
              <div style={{
                width: '100%', marginTop: '16px', marginBottom: '16px', padding: '12px 16px',
                backgroundColor: '#fefce8', border: '1px solid #fde68a',
                borderRadius: '8px', color: '#92400e', fontSize: '13px',
                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                ⚠️ {parts.join(' · ')}
              </div>
            );
          })()}
          <div className="admin-grid-layout mt-6">
          
          {/* Left Form: Add/Edit products */}
          <div className="admin-form-column">
            <div className="summary-card" id="admin-product-form">
              <h3>{editingId ? 'Edit Product Details' : 'Add New Wholesale Product'}</h3>
              <p className="gst-disclaimer">Create or modify inventory listings served to trade buyers.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleProductSubmit} className="login-form">
                
                <div className="form-group">
                  <label htmlFor="prod-name">Product Label/Name *</label>
                  <input 
                    type="text" 
                    id="prod-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cadbury Gems Mega Jar"
                    className={errors.name ? 'error-input' : ''}
                  />
                  {errors.name && <span className="input-error-msg">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="prod-brand">Manufacturer / Brand *</label>
                  <input 
                    type="text" 
                    id="prod-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Cadbury"
                    className={errors.brand ? 'error-input' : ''}
                  />
                  {errors.brand && <span className="input-error-msg">{errors.brand}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="prod-cat">Wholesale Category *</label>
                  <select 
                    id="prod-cat" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="pincode-input font-bold"
                    style={{ height: '42px', padding: '8px' }}
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-gst">GST Rate (%) *</label>
                  <select 
                    id="prod-gst" 
                    value={gst} 
                    onChange={(e) => setGst(e.target.value)}
                    className="pincode-input font-bold"
                    style={{ height: '42px', padding: '8px' }}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-pack">Trade Pack Size *</label>
                  <input 
                    type="text" 
                    id="prod-pack"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. Carton of 24 packets"
                    className={errors.packSize ? 'error-input' : ''}
                  />
                  {errors.packSize && <span className="input-error-msg">{errors.packSize}</span>}
                </div>

                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-moq">Minimum Order Quantity (MOQ) *</label>
                    <input 
                      type="number" 
                      id="prod-moq"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      placeholder="e.g. 10"
                      className={errors.moq ? 'error-input' : ''}
                    />
                    {errors.moq && <span className="input-error-msg">{errors.moq}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-inv">Quantity / Stock Inventory *</label>
                    <input 
                      type="number" 
                      id="prod-inv"
                      value={inventory}
                      onChange={(e) => setInventory(e.target.value)}
                      placeholder="e.g. 100"
                      className={errors.inventory ? 'error-input' : ''}
                    />
                    {errors.inventory && <span className="input-error-msg">{errors.inventory}</span>}
                  </div>
                </div>

                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-mrp">Standard MRP (₹) *</label>
                    <input 
                      type="number" 
                      id="prod-mrp"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      placeholder="MRP per pack"
                      className={errors.retailPrice ? 'error-input' : ''}
                    />
                    {errors.retailPrice && <span className="input-error-msg">{errors.retailPrice}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-whol">Distributor Rate (₹) *</label>
                    <input 
                      type="number" 
                      id="prod-whol"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Bulk rate ex. GST"
                      className={errors.wholesalePrice ? 'error-input' : ''}
                    />
                    {errors.wholesalePrice && <span className="input-error-msg">{errors.wholesalePrice}</span>}
                  </div>
                </div>

                {/* Tier 2 Configuration */}
                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-t2">Tier 2 Rate (₹)</label>
                    <input 
                      type="number" 
                      id="prod-t2"
                      value={tier2Price}
                      onChange={(e) => setTier2Price(e.target.value)}
                      placeholder="Leave blank for auto-5% off"
                      className={errors.tier2Price ? 'error-input' : ''}
                    />
                    {errors.tier2Price && <span className="input-error-msg">{errors.tier2Price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-t2-moq">Tier 2 MOQ (Qty Threshold)</label>
                    <input 
                      type="number" 
                      id="prod-t2-moq"
                      value={tier2Moq}
                      onChange={(e) => setTier2Moq(e.target.value)}
                      placeholder="Leave blank for base MOQ + 15"
                      className={errors.tier2Moq ? 'error-input' : ''}
                    />
                    {errors.tier2Moq && <span className="input-error-msg">{errors.tier2Moq}</span>}
                  </div>
                </div>

                {/* Tier 3 Configuration */}
                <div className="form-group-row-flex">
                  <div className="form-group">
                    <label htmlFor="prod-t3">Tier 3 Rate (₹)</label>
                    <input 
                      type="number" 
                      id="prod-t3"
                      value={tier3Price}
                      onChange={(e) => setTier3Price(e.target.value)}
                      placeholder="Leave blank for auto-10% off"
                      className={errors.tier3Price ? 'error-input' : ''}
                    />
                    {errors.tier3Price && <span className="input-error-msg">{errors.tier3Price}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-t3-moq">Tier 3 MOQ (Qty Threshold)</label>
                    <input 
                      type="number" 
                      id="prod-t3-moq"
                      value={tier3Moq}
                      onChange={(e) => setTier3Moq(e.target.value)}
                      placeholder="Leave blank for base MOQ + 40"
                      className={errors.tier3Moq ? 'error-input' : ''}
                    />
                    {errors.tier3Moq && <span className="input-error-msg">{errors.tier3Moq}</span>}
                  </div>
                </div>

                {/* Product Image Source Selector (URL vs Upload) */}
                <div className="form-group">
                  <label>Product Image Source *</label>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setImageSourceType('link')}
                      className={`sort-tab-btn ${imageSourceType === 'link' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '11px', flex: 1 }}
                    >
                      Web URL Link
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setImageSourceType('upload')}
                      className={`sort-tab-btn ${imageSourceType === 'upload' ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '11px', flex: 1 }}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageSourceType === 'link' ? (
                    <input 
                      type="text" 
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className={errors.imageUrl ? 'error-input' : ''}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className={errors.imageUrl ? 'error-input' : ''}
                        style={{ fontSize: '12px', padding: '6px' }}
                      />
                      {imageUrl && imageUrl.startsWith('data:') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={imageUrl} alt="Uploaded preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: '600' }}>✓ Image loaded successfully</span>
                        </div>
                      )}
                    </div>
                  )}
                  {errors.imageUrl && <span className="input-error-msg">{errors.imageUrl}</span>}
                </div>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={isMostBought}
                    onChange={(e) => setIsMostBought(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Feature as Kirana Bestseller</span>
                </label>

                <div className="admin-form-actions-row">
                  <button type="submit" className="checkout-proceed-btn" style={{ flex: 2 }}>
                    {editingId ? 'Save Changes' : 'Publish Product'}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      className="drawer-clear-btn" 
                      onClick={handleCancelEdit}
                      style={{ flex: 1, padding: '0 12px' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* Right Column: Listing Table */}
          <div className="admin-table-column">
            <div className="summary-card" style={{ padding: '20px' }}>
              <div className="admin-search-header-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Active Store Inventory ({products.length})</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={adminSearchInput}
                    onChange={(e) => setAdminSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    placeholder="Search active listings..."
                    className="pincode-input"
                    style={{ maxWidth: '200px', padding: '6px 12px', margin: 0 }}
                  />
                  <button 
                    type="button"
                    onClick={handleSearchSubmit}
                    className="pincode-btn font-bold"
                    style={{ padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Search
                  </button>
                  {adminSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSearchInput('');
                        setAdminSearch('');
                      }}
                      className="pincode-btn"
                      style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="admin-desktop-table-view">
                <div className="admin-table-scroll-container" style={{ overflowX: 'auto', maxHeight: '600px' }}>
                  <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Label & Brand</th>
                        <th>Segment</th>
                        <th className="text-right">MRP</th>
                        <th className="text-right">Dist. Rate</th>
                        <th className="text-center">MOQ</th>
                        <th className="text-center">Quantity (Stock)</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(prod => (
                        <tr key={prod.id}>
                          <td>
                            <div className="admin-item-details-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img src={prod.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                              <div>
                                <strong>{prod.name}</strong>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)' }}>Brand: {prod.brand} | {prod.packSize} | GST: {prod.gst || 18}%</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="gst-info-bubble">{prod.category}</span></td>
                          <td className="text-right">₹{prod.retailPrice}</td>
                          <td className="text-right font-bold">₹{prod.wholesalePrice}</td>
                          <td className="text-center">{prod.moq || 10}</td>
                          <td className="text-center font-bold" style={{ color: (prod.inventory !== undefined ? prod.inventory : 100) <= 0 ? 'var(--color-danger)' : (prod.inventory !== undefined ? prod.inventory : 100) < 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {prod.inventory !== undefined ? prod.inventory : 100}
                          </td>
                          <td className="text-center">
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                className="pincode-btn" 
                                onClick={() => handleEditClick(prod)}
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)' }}
                              >
                                Edit
                              </button>
                              <button 
                                className="pincode-btn" 
                                onClick={() => handleDeleteClick(prod.id, prod.name)}
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center" style={{ padding: '24px 0', color: 'var(--color-text-muted)' }}>
                            No active listings match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="admin-mobile-cards-view">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredProducts.map(prod => (
                    <div key={prod.id} className="admin-mobile-product-card" style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img src={prod.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                        <div style={{ flexGrow: 1 }}>
                          <strong style={{ fontSize: '13px', display: 'block', textAlign: 'left' }}>{prod.name}</strong>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'left' }}>Brand: {prod.brand} | {prod.packSize} | GST: {prod.gst || 18}%</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          Segment: <span className="gst-info-bubble">{prod.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>MRP: <strong>₹{prod.retailPrice}</strong></span>
                          <span>Rate: <strong style={{ color: 'var(--color-primary)' }}>₹{prod.wholesalePrice}</strong></span>
                          <span>MOQ: <strong>{prod.moq || 10}</strong></span>
                          <span>Quantity: <strong style={{ color: (prod.inventory !== undefined ? prod.inventory : 100) <= 0 ? 'var(--color-danger)' : (prod.inventory !== undefined ? prod.inventory : 100) < 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>{prod.inventory !== undefined ? prod.inventory : 100}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button 
                          className="pincode-btn" 
                          onClick={() => handleEditClick(prod)}
                          style={{ flex: 1, padding: '8px', fontSize: '11px', backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit Product
                        </button>
                        <button 
                          className="pincode-btn" 
                          onClick={() => handleDeleteClick(prod.id, prod.name)}
                          style={{ flex: 1, padding: '8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', padding: '20px' }}>
                      No active listings match your filters.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </>)}

      {/* TAB 2: WHOLESALE CATEGORIES MANAGER */}
      {activeTab === 'categories' && (
        <div className="admin-grid-layout mt-6">
          {/* Left Form: Add New Category */}
          <div className="admin-form-column">
            <div className="summary-card">
              <h3>Create Wholesale Category</h3>
              <p className="gst-disclaimer">Add a new market segment to the distributor catalog.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleAddCategorySubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="new-cat-name">Category Title / Name *</label>
                  <input 
                    type="text" 
                    id="new-cat-name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Instant Food"
                    required
                    className="pincode-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-cat-img">Category Image URL *</label>
                  <input 
                    type="text" 
                    id="new-cat-img"
                    value={newCatImageUrl}
                    onChange={(e) => setNewCatImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/..."
                    required
                    className="pincode-input"
                  />
                </div>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={newCatShowOnHome}
                    onChange={(e) => setNewCatShowOnHome(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Show on Homepage Category Bar</span>
                </label>

                <label className="checkbox-label-row mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox"
                    checked={newCatShowProductsOnHome}
                    onChange={(e) => setNewCatShowProductsOnHome(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="checkbox-text-label font-bold text-sm">Show Product Slider on Homepage</span>
                </label>

                <div className="admin-form-actions-row">
                  <button type="submit" className="checkout-proceed-btn" style={{ flex: 1 }}>
                    Add Category
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Listing & Edits */}
          <div className="admin-table-column">
            <div className="summary-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ margin: 0 }}>Wholesale Segments ({localCategories.length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className="pincode-btn font-bold" 
                    onClick={handleSaveCategoriesConfig}
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="pincode-btn font-bold" 
                    onClick={handleRevertCategories}
                    style={{ backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Revert
                  </button>
                </div>
              </div>
              <div className="divider-card"></div>

              <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
                <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Category Name</th>
                      <th>Image URL Path</th>
                      <th className="text-center" style={{ width: '110px' }}>Show on Home</th>
                      <th className="text-center" style={{ width: '110px' }}>Product Slider</th>
                      <th className="text-center" style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCategories.map((cat, idx) => (
                      <tr key={cat.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={cat.imageUrl} 
                              alt="" 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)' }} 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Category';
                              }}
                            />
                            <strong>{cat.name}</strong>
                          </div>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={cat.imageUrl} 
                            onChange={(e) => handleLocalCatImageChange(idx, e.target.value)}
                            placeholder="Image URL"
                            className="pincode-input"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12px', margin: 0 }}
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={cat.showOnHome} 
                            onChange={(e) => handleLocalCatShowOnHomeToggle(idx, e.target.checked)}
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={cat.showProductsOnHome || false} 
                            onChange={(e) => handleLocalCatShowProductsOnHomeToggle(idx, e.target.checked)}
                            className="custom-checkbox"
                          />
                        </td>
                        <td className="text-center">
                          <button 
                            type="button" 
                            className="pincode-btn" 
                            onClick={() => handleLocalCatDelete(cat.name)}
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {localCategories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center" style={{ padding: '24px 0', color: 'var(--color-text-muted)' }}>
                          No categories defined. Add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK RATE MODIFIER & FACTORY RESET */}
      {activeTab === 'bulk' && (
        <div className="admin-grid-layout mt-6">
          
          {/* Rate adjuster */}
          <div className="summary-card">
            <h3>Mass Rate Revision Desk</h3>
            <p className="gst-disclaimer">Simulate instant percentage wholesale rate updates across the entire Tradevia database.</p>
            <div className="divider-card"></div>

            <form onSubmit={handleBulkRateSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="bulk-percent">Pricing Revision Percentage (%) *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    id="bulk-percent" 
                    value={priceAdjPercent}
                    onChange={(e) => setPriceAdjPercent(e.target.value)}
                    placeholder="e.g. 5 for +5%, -10 for -10%"
                    className="pincode-input font-bold"
                  />
                  <span className="font-bold">%</span>
                </div>
                <span className="input-hint-text">
                  Entering positive numbers (e.g. <strong>5</strong>) hikes all distributor prices by 5% to handle raw material costs. Negative numbers discount all items globally.
                </span>
              </div>

              <button type="submit" className="checkout-proceed-btn mt-4" style={{ backgroundColor: 'var(--color-primary)' }}>
                Apply global rate shift
              </button>
            </form>
          </div>

          {/* Database Reset panel */}
          <div className="summary-card" style={{ borderColor: 'var(--color-danger)' }}>
            <h3 style={{ color: 'var(--color-danger)' }}>Factory Database Reset</h3>
            <p className="gst-disclaimer">Revert all user-made modifications to the catalog list and category images back to factory original settings.</p>
            <div className="divider-card"></div>
            
            <p className="text-sm text-muted" style={{ marginBottom: '20px' }}>
              Warning: Resetting the database will delete any custom products, erase custom category images, and revert all pricing sheets back to original rates. This action is irreversible.
            </p>

            <button 
              type="button" 
              className="checkout-proceed-btn" 
              style={{ backgroundColor: 'var(--color-danger)', border: 'none', color: 'white' }}
              onClick={handleResetCatalogSubmit}
            >
              Restore Original Distributor Database
            </button>
          </div>

        </div>
      )}

      {/* TAB: BULK UPLOAD PRODUCTS */}
      {activeTab === 'bulk-upload' && (
        <div className="summary-card mt-6">
          <h3>Bulk Upload Products from Spreadsheet</h3>
          <p className="gst-disclaimer">
            Upload a CSV or Excel (.xlsx) file containing your product list. All products will be added to the catalog at once.
          </p>
          <div className="divider-card"></div>

          {/* Step 1: Download Template */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Step 1: Download the template format</p>
            <button type="button" className="checkout-proceed-btn" style={{ backgroundColor: 'var(--color-primary)', border: 'none' }} onClick={handleDownloadTemplate}>
              Download CSV Template
            </button>
            <p className="text-sm text-muted" style={{ marginTop: '6px' }}>
              The template shows the required columns: name, brand, category, retailPrice, wholesalePrice, packSize, imageUrl, moq, inventory, gst, tier2Price, tier2Moq, tier3Price, tier3Moq, isMostBought.
            </p>
          </div>

          <div className="divider-card"></div>

          {/* Step 2: Upload File */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>Step 2: Upload your CSV or Excel file</p>
            <input id="bulk-file-input" type="file" accept=".csv,.xlsx" onChange={handleBulkFileUpload} style={{ marginBottom: '8px' }} />
            {bulkUploadFileName && <p className="text-sm text-muted">Selected file: {bulkUploadFileName}</p>}
          </div>

          {/* Errors */}
          {bulkUploadErrors.length > 0 && (
            <div style={{ color: 'var(--color-danger)', marginBottom: '16px', padding: '12px', background: '#fff0f0', borderRadius: '6px' }}>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Skipped rows:</p>
              {bulkUploadErrors.map((err, i) => <p key={i} style={{ fontSize: '13px', margin: '2px 0' }}>{err}</p>)}
            </div>
          )}

          {/* Preview Table */}
          {bulkUploadData.length > 0 && (
            <>
              <div className="divider-card"></div>
              <h4>Preview — {bulkUploadData.length} product{bulkUploadData.length > 1 ? 's' : ''} ready to upload</h4>
              <div style={{ maxHeight: '360px', overflowY: 'auto', margin: '12px 0', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>#</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Brand</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>MRP</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Wholesale</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>MOQ</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkUploadData.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                        <td style={{ padding: '6px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '6px 8px' }}>{p.brand}</td>
                        <td style={{ padding: '6px 8px' }}>{p.category}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{p.retailPrice}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{p.wholesalePrice}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.moq}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.inventory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="checkout-proceed-btn"
                style={{ backgroundColor: 'var(--color-primary)', border: 'none' }}
                onClick={handleBulkUploadSubmit}
                disabled={bulkUploading}
              >
                {bulkUploading ? 'Uploading...' : `Upload All ${bulkUploadData.length} Products`}
              </button>
            </>
          )}

          {/* Empty state */}
          {bulkUploadFileName && bulkUploadData.length === 0 && bulkUploadErrors.length === 0 && (
            <p className="text-sm text-muted">No valid products found in file. Check the format and try again.</p>
          )}
        </div>
      )}

      {/* TAB 4: INCOMING ORDERS LOG */}
      {activeTab === 'orders' && (
        <div className="summary-card mt-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Incoming Wholesale Order Shipments</h3>
              <p className="gst-disclaimer">Review compliance tax invoices and dispatch details for all placed orders.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Total Placed Orders: {orders.length}
              </div>
              <button onClick={() => exportCSV(orders.map(o => ({ ID: o.id, Date: new Date(o.date).toLocaleDateString('en-IN'), Customer: o.customerEmail || '', Amount: o.grandTotal, Status: o.status || 'pending', Items: o.items?.length || 0 })), 'orders-export')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Export CSV</button>
            </div>
          </div>
          <div className="divider-card"></div>

          {orders.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>No orders have been placed yet.</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Orders checked out on the shopfront will populate here automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                return (
                  <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>ORDER ID: {order.id}</span>
                        <strong style={{ display: 'block', fontSize: '14px', marginTop: '2px' }}>
                          Placed on: {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </strong>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Client Business: <strong>{order.address?.businessName || order.address?.name}</strong> | Phone: <strong>{order.address?.phone}</strong>
                        </span>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Customer: <strong>{order.customerEmail || 'N/A'}</strong>
                          {order.gstin && <> | GSTIN: <strong>{order.gstin}</strong></>}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>BILLING AMOUNT</span>
                        <span style={{ display: 'block', fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</span>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered' ? 'var(--color-success)' : '#b45309',
                          padding: '1px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '10px', marginTop: '4px'
                        }}>{(order.status || 'pending').toUpperCase()}</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', textAlign: 'left' }}>
                        <strong>Delivery Destination:</strong> {order.address?.addressLine}, {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                      </div>

                      {/* Tracking info */}
                      {order.trackingNumber && (
                        <div style={{ fontSize: '12px', textAlign: 'left', color: 'var(--color-success)' }}>
                          <strong>Tracking:</strong> {order.trackingNumber}
                          {order.courier && <> via {order.courier}</>}
                          {order.shippedAt && <> (shipped {new Date(order.shippedAt).toLocaleDateString('en-IN')})</>}
                        </div>
                      )}

                      {/* Granular status timestamps */}
                      {order.confirmed_at && (
                        <div style={{ fontSize: '12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                          <strong>Confirmed:</strong> {new Date(order.confirmed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {order.processing_at && (
                        <div style={{ fontSize: '12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                          <strong>Processing:</strong> {new Date(order.processing_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {order.out_for_delivery_at && (
                        <div style={{ fontSize: '12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                          <strong>Out for Delivery:</strong> {new Date(order.out_for_delivery_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {order.status === 'delivered' && order.delivered_at && (
                        <div style={{ fontSize: '12px', textAlign: 'left', color: 'var(--color-success)' }}>
                          <strong>Delivered:</strong> {new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* Action buttons based on status */}
                      {order.status === 'paid' && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Mark as Confirmed
                          </button>
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                            style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Mark as Processing
                          </button>
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                            style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Mark as Out for Delivery
                          </button>
                        </div>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={trackingInputs[order.id] || ''}
                            onChange={(e) => setTrackingInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="Tracking number"
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px', maxWidth: '200px' }}
                          />
                          <select
                            value={courierInputs[order.id] || ''}
                            onChange={(e) => setCourierInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px', maxWidth: '160px' }}
                          >
                            <option value="">Select Courier</option>
                            {COURIER_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={async () => {
                              const tracking = (trackingInputs[order.id] || '').trim();
                              const courier = courierInputs[order.id] || '';
                              if (!tracking || !courier) {
                                setAdminToast({ show: true, message: 'Enter tracking number and select courier.', type: 'error' });
                                setTimeout(() => setAdminToast(p => ({ ...p, show: false })), 3000);
                                return;
                              }
                              await supabase.rpc('mark_order_shipped', { order_id: order.id, tracking, courier_name: courier });
                              setTrackingInputs((p) => ({ ...p, [order.id]: '' }));
                              setCourierInputs((p) => ({ ...p, [order.id]: '' }));
                              const apiBase = import.meta.env.VITE_API_BASE_URL || '';
                              if (apiBase) {
                                fetch(apiBase + '/api/send-shipping-notification', {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ orderId: order.id, trackingNumber: tracking })
                                }).catch(() => {});
                              }
                              if (window.onAdminOrderUpdate) window.onAdminOrderUpdate();
                            }}
                            style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Mark Shipped
                          </button>
                        </div>
                      )}
                      {order.status === 'shipped' && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order.id)}
                            style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Mark Delivered
                          </button>
                        </div>
                      )}

                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ display: 'block', fontSize: '12px', textAlign: 'left', marginBottom: '4px' }}>Items Summary ({itemsCount} units):</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', backgroundColor: 'white', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                              <span style={{ textAlign: 'left' }}>
                                <strong>{item.name}</strong> ({item.packSize}) x {item.quantity} packs
                              </span>
                              <strong>₹{(item.wholesalePrice * item.quantity).toLocaleString('en-IN')}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RETURNS / REFUNDS */}
      {activeTab === 'returns' && (
        <div className="summary-card mt-6">
          <h3>Return / Refund Requests</h3>
          <p className="gst-disclaimer">Review and manage customer return and refund requests.</p>
          <div className="divider-card"></div>
          {returns.length === 0 ? (
            <p style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>No return requests yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {returns.map((r) => (
                <div key={r.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px' }}>
                      <strong>Order: {r.order_id}</strong>
                      <span style={{ display: 'block', color: 'var(--color-text-muted)' }}>Reason: {r.reason}</span>
                      {r.details && <span style={{ display: 'block', color: 'var(--color-text-muted)' }}>Details: {r.details}</span>}
                      <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px',
                        backgroundColor: r.status === 'pending' ? 'rgba(234, 179, 8, 0.1)' : r.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: r.status === 'pending' ? '#b45309' : r.status === 'approved' ? 'var(--color-success)' : '#dc2626'
                      }}>{r.status.toUpperCase()}</span>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" onClick={() => handleUpdateReturnStatus(r.id, 'approved')} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Approve</button>
                          <button type="button" onClick={() => handleUpdateReturnStatus(r.id, 'rejected')} style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="summary-card mt-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Registered Customers</h3>
              <p className="gst-disclaimer">All user profiles who have created an account on the platform.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                Total Customers: {customers.length}
              </div>
              <button onClick={() => exportCSV(customers.map(c => ({ Name: c.name || '', Business: c.business_name || '', Email: c.email || '', Mobile: c.mobile || '', GSTIN: c.gstin || '', Orders: c.ordersCount, Created: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '' })), 'customers-export')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Export CSV</button>
            </div>
          </div>
          <div className="divider-card"></div>
          {customers.length === 0 ? (
            <p style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>No customers found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Business Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>GSTIN</th>
                    <th className="text-center">Orders</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                      <tr key={c.id} style={{ cursor: 'pointer', backgroundColor: selectedCustomerId === c.id ? '#f0f7ff' : undefined }} onClick={() => loadCustomerOrders(c.id)}>
                        <td><strong>{c.name || '-'}</strong></td>
                        <td>{c.business_name || '-'}</td>
                        <td>{c.email || '-'}</td>
                        <td>{c.mobile || '-'}</td>
                        <td>{c.gstin || '-'}</td>
                        <td className="text-center"><span className="b2b-badge">{c.ordersCount}</span></td>
                        <td>{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedCustomerId && (
              <div style={{ marginTop: '24px', borderTop: '2px solid var(--color-border)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>
                  Order History — {customers.find(c => c.id === selectedCustomerId)?.name || selectedCustomerId}
                  <span style={{ fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '13px' }}>
                    ({customerOrdersLoaded ? customerOrders.length : 'loading...'} orders)
                  </span>
                </h4>
                {!customerOrdersLoaded ? (
                  <Spinner />
                ) : customerOrders.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="invoice-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Items</th>
                          <th>Coupon</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((o) => (
                          <tr key={o.id}>
                            <td style={{ fontSize: '11px' }}>{o.id}</td>
                            <td>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td>₹{(o.amount || 0).toLocaleString('en-IN')}</td>
                            <td><span className="b2b-badge" style={{ backgroundColor: o.status === 'paid' ? '#dcfce7' : o.status === 'shipped' ? '#dbeafe' : '#fef3c7', color: o.status === 'paid' ? '#16a34a' : o.status === 'shipped' ? '#2563eb' : '#92400e' }}>{(o.status || 'pending').toUpperCase()}</span></td>
                            <td>{(o.items || []).length}</td>
                            <td>{o.coupon_code || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {customerOrders.length > 1 && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <strong>Order Frequency:</strong> {customerOrders.length} order{customerOrders.length > 1 ? 's' : ''} · 
                        First: {new Date(customerOrders[customerOrders.length - 1].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · 
                        Last: {new Date(customerOrders[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · 
                        Total Spent: ₹{customerOrders.reduce((s, o) => s + (o.amount || 0), 0).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* TAB 8: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="summary-card mt-6">
          <h3>Sales Analytics</h3>
          <p className="gst-disclaimer">Revenue breakdown and top-selling products from paid orders.</p>
          <div className="divider-card"></div>
          {!analyticsData ? (
            <Spinner />
          ) : analyticsData.totalOrders === 0 ? (
            <p style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: '13px' }}>No paid orders yet.</p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div className="admin-stat-card" style={{ flex: '1', minWidth: '160px', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</span>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: 'var(--color-success)', marginTop: '8px' }}>₹{analyticsData.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="admin-stat-card" style={{ flex: '1', minWidth: '160px', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: '#eff6ff', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</span>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)', marginTop: '8px' }}>{analyticsData.totalOrders}</span>
                </div>
                <div className="admin-stat-card" style={{ flex: '1', minWidth: '160px', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: '#fefce8', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Order Value</span>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: '#b45309', marginTop: '8px' }}>₹{analyticsData.avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button onClick={() => exportCSV([{ Metric: 'Total Revenue', Value: analyticsData.totalRevenue }, { Metric: 'Total Orders', Value: analyticsData.totalOrders }, { Metric: 'Avg Order Value', Value: analyticsData.avgOrderValue.toFixed(2) }], 'analytics-summary')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', marginBottom: '12px' }}>Export Summary CSV</button>
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>Top 5 Products (by quantity sold)</h4>
                <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th className="text-center">Quantity Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topProducts.map((p, i) => (
                      <tr key={p.name}>
                        <td>{i + 1}</td>
                        <td><strong>{p.name}</strong></td>
                        <td className="text-center"><span className="b2b-badge">{p.qty}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => exportCSV(analyticsData.topProducts.map((p, i) => ({ Rank: i+1, Product: p.name, Quantity: p.qty })), 'top-products')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', marginTop: '12px' }}>Export Top Products CSV</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 9: PRICE HISTORY */}
      {activeTab === 'price-history' && (
        <div className="summary-card mt-6">
          <h3>Price Change History</h3>
          <p className="gst-disclaimer">Track all wholesale price modifications.</p>
          <div className="divider-card"></div>
          {!priceHistoryLoaded ? <Spinner /> : priceHistory.length === 0 ? (
            <p style={{ padding: '20px 0', color: 'var(--color-text-muted)' }}>No price changes recorded yet.</p>
          ) : (
            <>
              <button onClick={() => exportCSV(priceHistory.map(p => ({ ID: p.id, ProductID: p.product_id, OldPrice: p.old_price, NewPrice: p.new_price, ChangedAt: new Date(p.changed_at).toLocaleString('en-IN') })), 'price-history')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', marginBottom: '12px' }}>Export CSV</button>
              <div style={{ overflowX: 'auto' }}>
                <table className="invoice-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead><tr><th>ID</th><th>Product ID</th><th>Old Price</th><th>New Price</th><th>Changed At</th></tr></thead>
                  <tbody>
                    {priceHistory.map((p) => (
                      <tr key={p.id}><td>{p.id}</td><td>{p.product_id}</td><td>₹{p.old_price}</td><td>₹{p.new_price}</td><td>{new Date(p.changed_at).toLocaleString('en-IN')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 6: ADMIN ACCOUNTS PERSISTENCE & MANAGEMENT */}
      {activeTab === 'admins' && (
        <div className="admin-grid-layout mt-6">
          {/* Left Form: Add/Edit Admin Account */}
          <div className="admin-form-column">
            <div className="summary-card">
              <h3>{editingAdminId ? 'Edit Admin Credentials' : 'Register New Admin Account'}</h3>
              <p className="gst-disclaimer">Create, edit, or remove administrative users allowed to access this Control Desk.</p>
              <div className="divider-card"></div>

              <form onSubmit={handleAdminAccountSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="admin-acc-id">Admin Username / ID *</label>
                  <input 
                    type="text" 
                    id="admin-acc-id"
                    value={adminAccId}
                    onChange={(e) => setAdminAccId(e.target.value.replace(/\s/g, ''))}
                    placeholder="e.g. vansh2005"
                    required
                    disabled={editingAdminId !== null}
                    className="pincode-input"
                    style={{ width: '100%', height: '42px', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-acc-pass">Admin Password *</label>
                  <input 
                    type="text"
                    id="admin-acc-pass"
                    value={adminAccPassword}
                    onChange={(e) => setAdminAccPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="pincode-input"
                    style={{ width: '100%', height: '42px', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    type="submit" 
                    className="pincode-btn" 
                    style={{ flex: 1, backgroundColor: 'var(--color-primary)', color: 'white', height: '40px', fontWeight: 'bold' }}
                  >
                    {editingAdminId ? 'Save Changes' : 'Create Admin'}
                  </button>
                  {editingAdminId && (
                    <button 
                      type="button" 
                      onClick={handleCancelEditAdmin} 
                      className="pincode-btn" 
                      style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#1e293b', height: '40px', fontWeight: 'bold' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Table: List of Admin Accounts */}
          <div className="admin-table-column">
            <div className="summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Registered Admins Database</h3>
                <span className="b2b-badge">{registeredAdmins.length} Active Accounts</span>
              </div>
              <div className="divider-card"></div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '12px' }}>Admin ID</th>
                      <th style={{ padding: '12px' }}>Password</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredAdmins.map((adminAcc) => (
                      <tr key={adminAcc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{adminAcc.id}</td>
                        <td style={{ padding: '12px', fontFamily: 'monospace' }}>{adminAcc.password}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            type="button"
                            onClick={() => handleEditAdminClick(adminAcc)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-primary)', 
                              fontWeight: 'bold', 
                              marginRight: '12px', 
                              cursor: 'pointer' 
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteAdminClick(adminAcc.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-danger)', 
                              fontWeight: 'bold', 
                              cursor: 'pointer' 
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminToast.show && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '10px', fontSize: '14px',
          fontWeight: '600', backdropFilter: 'blur(12px)',
          backgroundColor: adminToast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)',
          color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          maxWidth: '380px'
        }}>
          {adminToast.message}
        </div>
      )}

    </div>
  );
}

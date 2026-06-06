import React, { useState, useEffect } from 'react';
import AdminPortal from './pages/AdminPortal';
import { productsData, allCategories } from './util/productsData';
import { supabase } from './util/supabaseClient';

const defaultCategories = allCategories.map((name) => ({
  name,
  imageUrl: '',
  showOnHome: true,
  showProductsOnHome: false
}));

const toProductPayload = (product) => ({
  name: product.name,
  category: product.category,
  price: Number(product.wholesalePrice ?? product.retailPrice ?? 0),
  moq: Number(product.moq ?? 10),
  unit: product.packSize || '',
  inventory: Number(product.inventory ?? 100),
  description: JSON.stringify({
    brand: product.brand || '',
    retailPrice: Number(product.retailPrice ?? product.wholesalePrice ?? 0),
    wholesalePrice: Number(product.wholesalePrice ?? product.retailPrice ?? 0),
    packSize: product.packSize || '',
    rating: Number(product.rating ?? 0),
    reviewsCount: Number(product.reviewsCount ?? 0),
    isMostBought: Boolean(product.isMostBought),
    tier2Price: product.tier2Price != null ? Number(product.tier2Price) : null,
    tier2Moq: product.tier2Moq != null ? Number(product.tier2Moq) : null,
    tier3Price: product.tier3Price != null ? Number(product.tier3Price) : null,
    tier3Moq: product.tier3Moq != null ? Number(product.tier3Moq) : null
  }),
  image_url: product.imageUrl || ''
});

const fromProductRow = (product) => {
  let parsed = {};
  try {
    parsed = product.description ? JSON.parse(product.description) : {};
  } catch (e) {
    parsed = {};
  }

  const fallbackBrand = product.description?.split(' | ')[0] || '';

  return {
    id: product.id,
    name: product.name,
    brand: parsed.brand || fallbackBrand,
    category: product.category,
    retailPrice: parsed.retailPrice ?? product.price,
    wholesalePrice: parsed.wholesalePrice ?? product.price,
    packSize: parsed.packSize || product.unit || '',
    rating: parsed.rating ?? 0,
    reviewsCount: parsed.reviewsCount ?? 0,
    isMostBought: parsed.isMostBought ?? false,
    moq: product.moq,
    inventory: product.inventory ?? 100,
    imageUrl: product.image_url || '',
    tier2Price: parsed.tier2Price ?? null,
    tier2Moq: parsed.tier2Moq ?? null,
    tier3Price: parsed.tier3Price ?? null,
    tier3Moq: parsed.tier3Moq ?? null
  };
};

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

export default function AdminApp() {
  // --- Dynamic B2B Catalog and Settings States ---
  const [products, setProducts] = useState(() => productsData.map(p => ({ ...p, inventory: 100 })));
  const [categories, setCategories] = useState(() => defaultCategories);
  const [categoryImages, setCategoryImages] = useState(() => {
    const saved = localStorage.getItem('ss_category_images');
    return saved ? JSON.parse(saved) : defaultCategoryImages;
  });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    localStorage.setItem('ss_category_images', JSON.stringify(categoryImages));
  }, [categoryImages]);

  // Sync across tabs/pages
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'ss_category_images') {
        setCategoryImages(e.newValue ? JSON.parse(e.newValue) : defaultCategoryImages);
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
        if (isMounted) {
          setProducts(productsData.map((p) => ({ ...p, inventory: 100 })));
        }
        return;
      }

      setProducts(data.map(fromProductRow));
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load all orders from Supabase (admin sees all via RLS)
  useEffect(() => {
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
        status: o.status || 'pending'
      }));

      if (isMounted) setOrders(mapped);
    };

    loadOrders();

    return () => { isMounted = false; };
  }, []);

  // --- Admin Desk Database Callbacks ---
  const refreshProducts = async () => {
    const { data, error } = await supabase
      .from('products')
        .select('id, name, category, price, moq, unit, description, image_url, inventory')
        .order('id', { ascending: true });

    if (!error && data?.length) {
      setProducts(data.map(fromProductRow));
    }
  };

  const handleAddProduct = async (newProduct) => {
    const { error } = await supabase.from('products').insert(toProductPayload(newProduct));
    if (error) {
      throw error;
    }
    await refreshProducts();
  };

  const handleUpdateProduct = async (updatedProduct) => {
    const { error } = await supabase
      .from('products')
      .update(toProductPayload(updatedProduct))
      .eq('id', updatedProduct.id);

    if (error) {
      throw error;
    }

    await refreshProducts();
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      throw error;
    }
    await refreshProducts();
  };

  const handleUpdateCategoryImages = (updatedImagesMap) => {
    setCategoryImages(updatedImagesMap);
  };

  const handleBulkAdjustPrices = async (percentage) => {
    const factor = 1 + (percentage / 100);
    const updatedProducts = products.map((p) => {
      let newWholesale = Math.round(p.wholesalePrice * factor * 10) / 10;
      newWholesale = Math.max(1, Math.min(newWholesale, p.retailPrice - 1));
      return {
        ...p,
        wholesalePrice: Math.round(newWholesale)
      };
    });

    for (const product of updatedProducts) {
      const { error } = await supabase
        .from('products')
        .update(toProductPayload(product))
        .eq('id', product.id);

      if (error) {
        throw error;
      }
    }

    await refreshProducts();
  };

  const handleResetCatalog = async () => {
    const { error: deleteError } = await supabase.from('products').delete().not('id', 'is', null);
    if (deleteError) {
      throw deleteError;
    }

    const rows = productsData.map(toProductPayload);
    const { error: insertError } = await supabase.from('products').insert(rows);
    if (insertError) {
      throw insertError;
    }

        setCategories(defaultCategories);
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
        categories={categories}
        orders={orders}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateCategories={setCategories}
        onUpdateCategoryImages={handleUpdateCategoryImages}
        onBulkAdjustPrices={handleBulkAdjustPrices}
        onResetCatalog={handleResetCatalog}
        setCurrentPage={handleRedirectToShop} // Redirects window back to "/"
      />
    </div>
  );
}

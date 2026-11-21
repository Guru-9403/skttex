import { deleteCustomProduct, fetchLiveProducts } from '../data/products.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../config/api.js';

export default function AdminStock() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Active view tab: 'items' | 'dashboard'
  const [activeTab, setActiveTab] = useState('items');

  // Dashboard metrics
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Items list & filters
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'Women',
    type: 'Clothing',
    image: '',
    sizes: 'Free Size',
    fabric: 'Cotton Blend',
    unit: 'Pieces',
    currentStock: 50,
    lowStockThreshold: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
  });

  // UI feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adjustingId, setAdjustingId] = useState(null);

  // Check admin authorization
  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
    } else if (!isAdmin) {
      setErrorMsg('Access denied. Administrator privileges required.');
    }
  }, [token, user, isAdmin, navigate]);

  // Load Dashboard Data
  const fetchDashboard = async () => {
    if (!token || !isAdmin) return;
    setLoadingDashboard(true);
    try {
      const res = await fetch(`${API_URL}/stock/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDashboard(data);
      } else {
        throw new Error(data.message || 'Failed to load dashboard metrics');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Load Stock Items
  const fetchItems = async () => {
    if (!token || !isAdmin) return;
    setLoadingItems(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`${API_URL}/stock/items?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      } else {
        throw new Error(data.message || 'Failed to load stock items');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      fetchDashboard();
      fetchItems();
    }
  }, [token, isAdmin]);

  // Auto-clear notification messages after 5s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Open Modal Helpers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      itemCode: `SKT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Women',
      type: 'Saree',
      image: '',
      sizes: 'Free Size',
      fabric: 'Cotton Blend',
      unit: 'Pieces',
      currentStock: 30,
      lowStockThreshold: 10,
      purchasePrice: 0,
      sellingPrice: 0,
      description: '',
      addToStore: true,
    });
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      type: item.type || 'Clothing',
      image: item.image || '',
      sizes: item.sizes || 'Free Size',
      fabric: item.fabric || '',
      unit: item.unit || 'Pieces',
      currentStock: item.currentStock ?? item.openingStock ?? 0,
      lowStockThreshold: item.lowStockThreshold || 10,
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      description: item.description || '',
      addToStore: true,
    });
    setShowItemModal(true);
  };

  // Upload image to Cloudinary via backend API
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image upload to Cloudinary failed');
      }

      setItemForm((prev) => ({ ...prev, image: data.url }));
      setSuccessMsg('Image uploaded to Cloudinary successfully!');
    } catch (err) {
      console.warn('Cloudinary upload warning:', err);
      // Fallback to local data URI preview if upload is blocked
      const reader = new FileReader();
      reader.onload = (ev) => {
        setItemForm((prev) => ({ ...prev, image: ev.target.result }));
      };
      reader.readAsDataURL(file);
      setErrorMsg(`Cloudinary Upload Notice: ${err.message}. Using preview.`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Quick 1-click Stock Quantity Adjuster (+1 / -1)
  const handleQuickStockAdjust = async (item, delta) => {
    const newStock = Math.max(0, (item.currentStock || 0) + delta);
    if (newStock === item.currentStock) return;

    setAdjustingId(item._id);
    try {
      const res = await fetch(`${API_URL}/stock/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentStock: newStock }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update stock');

      // Update in local state immediately for snappy UI
      setItems((prev) =>
        prev.map((it) => (it._id === item._id ? { ...it, currentStock: newStock, status: newStock === 0 ? 'Out of Stock' : newStock <= it.lowStockThreshold ? 'Low Stock' : 'In Stock' } : it))
      );

      await fetchLiveProducts();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAdjustingId(null);
    }
  };

  // Submit Add / Edit Stock Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const url = editingItem
        ? `${API_URL}/stock/items/${editingItem._id}`
        : `${API_URL}/stock/items`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      // Refresh customer storefront products directly from live database
      await fetchLiveProducts();

      setSuccessMsg(editingItem ? 'Product details & stock updated successfully!' : 'New product created & added to store!');
      setShowItemModal(false);
      fetchItems();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Stock Item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" (${item.itemCode})? This will immediately remove it from both stock management and the customer website.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/stock/items/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete item');

      // Remove immediately from customer storefront cards and cache
      deleteCustomProduct(item.itemCode, item.name);
      await fetchLiveProducts();

      setSuccessMsg(`Deleted "${item.name}" from stock and removed from website!`);
      fetchItems();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Download Excel Report (.xlsx)
  const handleExportExcel = async () => {
    setExporting(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`${API_URL}/stock/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate Excel report');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `Sree_Kavinya_Tex_Stock_Report_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccessMsg('Excel stock report downloaded successfully!');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Admin Access Required</h2>
        <p style={{ margin: '20px 0', color: '#666' }}>
          You must be logged in with an administrator account to access Stock Management.
        </p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  // Calculated stock metrics
  const totalItemsCount = dashboard?.totalItems ?? items.length;
  const availableStockCount = dashboard?.availableStock ?? items.reduce((acc, it) => acc + (it.currentStock || 0), 0);
  const lowStockCount = dashboard?.lowStockCount ?? items.filter((it) => it.currentStock > 0 && it.currentStock <= (it.lowStockThreshold || 10)).length;
  const outOfStockCount = dashboard?.outOfStockCount ?? items.filter((it) => it.currentStock === 0).length;
  const totalStockPurchaseValue = dashboard?.totalStockValue ?? items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.purchasePrice || 0), 0);
  const totalStockSellingValue = dashboard?.totalSellingValue ?? items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.sellingPrice || 0), 0);
  const totalProfitEstimate = Math.max(0, totalStockSellingValue - totalStockPurchaseValue);
  const lowStockAlertsList = items.filter((it) => it.currentStock <= (it.lowStockThreshold || 10));

  return (
    <div className="admin-stock-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '28px 0' }}>
      <div className="stock-container">
        
        {/* Header bar */}
        <div className="stock-header" style={{ marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Inventory &amp; Stock Management
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 34px', color: '#64748b', fontSize: '13px' }}>
              Sree Kavinya Tex &bull; Product Catalog, Live Stock Levels &amp; Pricing Control
            </p>
          </div>

          <div className="stock-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                localStorage.removeItem('skt_cached_live_products');
                localStorage.removeItem('skt_custom_products');
                localStorage.removeItem('skt_deleted_items');
                await fetchLiveProducts();
                fetchItems();
                fetchDashboard();
                setSuccessMsg('Storefront cache cleared and re-synced with live database!');
              }}
              title="Resync customer storefront cards with database"
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                padding: '9px 15px',
                borderRadius: '8px',
                fontWeight: '600',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span>🔄</span> Resync Store
            </button>

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 15px',
                borderRadius: '8px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span>📊</span>
              {exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
            </button>

            <button
              onClick={handleOpenAddItem}
              style={{
                backgroundColor: 'var(--primary, #b8405e)',
                color: '#fff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(184, 64, 94, 0.25)',
              }}
            >
              <span>+</span> Add New Product
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 18px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 18px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="stock-tabs-nav" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '22px' }}>
          <button
            onClick={() => { setActiveTab('items'); fetchItems(); }}
            style={{
              padding: '11px 18px',
              border: 'none',
              background: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === 'items' ? '3px solid var(--primary, #b8405e)' : '3px solid transparent',
              color: activeTab === 'items' ? 'var(--primary, #b8405e)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📦</span> Products &amp; Stock Inventory ({items.length})
          </button>
          <button
            onClick={() => { setActiveTab('dashboard'); fetchDashboard(); }}
            style={{
              padding: '11px 18px',
              border: 'none',
              background: 'none',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary, #b8405e)' : '3px solid transparent',
              color: activeTab === 'dashboard' ? 'var(--primary, #b8405e)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📊</span> Inventory Valuation &amp; Analytics
          </button>
        </div>

        {/* TAB 1: ALL STOCK ITEMS (MAIN VIEW) */}
        {activeTab === 'items' && (
          <div className="stock-table-card" style={{ background: '#fff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by SKU code, product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
              >
                <option value="">All Categories</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Kids">Kids</option>
                <option value="Sarees">Sarees</option>
                <option value="Kurtas">Kurtas</option>
                <option value="Suits">Suits</option>
                <option value="General">General</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
              >
                <option value="">All Stock Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                onClick={fetchItems}
                className="btn btn-secondary"
                style={{ padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
              >
                Filter
              </button>

              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedStatus(''); fetchItems(); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
              >
                Reset
              </button>

              <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                Showing <strong>{items.length}</strong> {items.length === 1 ? 'product' : 'products'}
              </div>
            </div>

            {/* Table */}
            {loadingItems ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading stock items...</p>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>📦</span>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>No products found in stock</p>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Click "+ Add New Product" to add your first stock item. It will automatically appear on the customer storefront.
                </p>
                <button onClick={handleOpenAddItem} className="btn btn-primary" style={{ padding: '8px 18px' }}>
                  + Add New Product
                </button>
              </div>
            ) : (
              <div className="stock-table-responsive" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 14px' }}>Product</th>
                      <th style={{ padding: '12px 14px' }}>SKU Code</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Stock Level</th>
                      <th style={{ padding: '12px 14px' }}>Purchase (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Selling (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Margin</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const marginAmount = Math.max(0, (item.sellingPrice || 0) - (item.purchasePrice || 0));
                      const marginPercent = item.sellingPrice > 0 ? Math.round((marginAmount / item.sellingPrice) * 100) : 0;
                      const isAdjusting = adjustingId === item._id;

                      return (
                        <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          
                          {/* Product Info with Thumbnail */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                />
                              ) : (
                                <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '18px' }}>
                                  👗
                                </div>
                              )}
                              <div>
                                <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block' }}>{item.name}</strong>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  {item.type || 'Apparel'}{item.fabric ? ` • ${item.fabric}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '600', fontSize: '12px' }}>
                              {item.itemCode}
                            </span>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '500' }}>
                            {item.category}
                          </td>

                          {/* Stock Quantity with Quick Stepper */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '3px 6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <button
                                type="button"
                                disabled={isAdjusting || item.currentStock <= 0}
                                onClick={() => handleQuickStockAdjust(item, -1)}
                                title="Decrease stock by 1"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#fff',
                                  cursor: isAdjusting || item.currentStock <= 0 ? 'not-allowed' : 'pointer',
                                  fontWeight: '700',
                                  color: '#475569',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                }}
                              >
                                −
                              </button>
                              
                              <span style={{ minWidth: '40px', fontWeight: '700', fontSize: '14px', color: item.currentStock === 0 ? '#ef4444' : item.currentStock <= (item.lowStockThreshold || 10) ? '#d97706' : '#0f172a' }}>
                                {item.currentStock}
                              </span>

                              <button
                                type="button"
                                disabled={isAdjusting}
                                onClick={() => handleQuickStockAdjust(item, 1)}
                                title="Increase stock by 1"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#fff',
                                  cursor: isAdjusting ? 'not-allowed' : 'pointer',
                                  fontWeight: '700',
                                  color: '#475569',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                }}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{item.unit || 'Pieces'}</div>
                          </td>

                          {/* Purchase Price */}
                          <td style={{ padding: '12px 14px', color: '#64748b' }}>
                            ₹{Number(item.purchasePrice || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Selling Price */}
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>
                            ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Margin */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: '#059669', fontWeight: '600', fontSize: '12px' }}>
                              +₹{marginAmount} <span style={{ color: '#64748b', fontWeight: 'normal' }}>({marginPercent}%)</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: item.status === 'In Stock' ? '#ecfdf5' : item.status === 'Low Stock' ? '#fffbeb' : '#fef2f2',
                              color: item.status === 'In Stock' ? '#047857' : item.status === 'Low Stock' ? '#b45309' : '#b91c1c',
                              border: item.status === 'In Stock' ? '1px solid #a7f3d0' : item.status === 'Low Stock' ? '1px solid #fde68a' : '1px solid #fecaca',
                            }}>
                              {item.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                title="Edit product details & stock"
                                style={{
                                  background: '#f8fafc',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>✏️</span> Edit
                              </button>
                              
                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete item completely"
                                style={{
                                  background: '#fff',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY VALUATION & ANALYTICS */}
        {activeTab === 'dashboard' && (
          <div>
            {loadingDashboard && !dashboard && items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Loading analytics...</p>
            ) : (
              <>
                {/* 6 Clean Metric Cards */}
                <div className="stock-metrics-grid" style={{ marginBottom: '24px' }}>
                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Active Products</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{totalItemsCount}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Total SKUs in store</div>
                  </div>

                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Available Stock Units</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>{availableStockCount}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Pieces on hand</div>
                  </div>

                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Inventory Cost Value</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#312e81', marginTop: '6px' }}>
                      ₹{Number(totalStockPurchaseValue || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Total investment cost</div>
                  </div>

                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #059669' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Retail Revenue Value</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#065f46', marginTop: '6px' }}>
                      ₹{Number(totalStockSellingValue || 0).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px' }}>
                      Est. Profit: ₹{Number(totalProfitEstimate).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Low Stock Alert</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#b45309', marginTop: '6px' }}>{lowStockCount}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Need restock soon</div>
                  </div>

                  <div className="stock-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Out of Stock</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#b91c1c', marginTop: '6px' }}>{outOfStockCount}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Zero inventory</div>
                  </div>
                </div>

                {/* Critical Stock Alerts Table */}
                <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span> Inventory Health &amp; Low Stock Alerts
                    </h3>
                  </div>

                  {lowStockAlertsList && lowStockAlertsList.length > 0 ? (
                    <div className="stock-table-responsive">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 14px' }}>SKU Code</th>
                            <th style={{ padding: '10px 14px' }}>Product Name</th>
                            <th style={{ padding: '10px 14px' }}>Category</th>
                            <th style={{ padding: '10px 14px' }}>Current Stock</th>
                            <th style={{ padding: '10px 14px' }}>Alert Level</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>Quick Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStockAlertsList.map((item) => (
                            <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.itemCode}</td>
                              <td style={{ padding: '10px 14px', fontWeight: '500' }}>{item.name}</td>
                              <td style={{ padding: '10px 14px' }}>{item.category}</td>
                              <td style={{ padding: '10px 14px', fontWeight: '700', color: item.currentStock === 0 ? '#ef4444' : '#d97706' }}>
                                {item.currentStock} {item.unit || 'Pieces'}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.lowStockThreshold || 10}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: item.status === 'Out of Stock' ? '#fee2e2' : '#fef9c3',
                                  color: item.status === 'Out of Stock' ? '#b91c1c' : '#854d0e'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleOpenEditItem(item)}
                                  style={{
                                    backgroundColor: '#0284c7',
                                    color: '#fff',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  Update Stock
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#059669', background: '#ecfdf5', borderRadius: '8px' }}>
                      <span style={{ fontSize: '20px' }}>✓</span> All product inventory levels are healthy!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showItemModal && (
        <div className="stock-modal-backdrop">
          <div className="stock-modal-box" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                {editingItem ? `Edit Product: ${editingItem.itemCode}` : 'Add New Product to Store'}
              </h2>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              {/* Product Image Section */}
              <div style={{ marginBottom: '18px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#0f172a' }}>
                  Product Photo
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', background: uploadingImage ? '#9ca3af' : 'var(--primary, #b8405e)', color: '#fff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                    {uploadingImage ? '⏳ Uploading...' : '📁 Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>or paste Image URL:</span>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={itemForm.image?.startsWith('data:') ? '' : (itemForm.image || '')}
                    onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                    style={{ flex: 1, minWidth: '180px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                {itemForm.image && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={itemForm.image}
                      alt="Preview"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--primary, #b8405e)' }}
                    />
                    <div>
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600', display: 'block' }}>✓ Photo attached</span>
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, image: '' })}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SKU & Category & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>SKU Code</label>
                  <input
                    type="text"
                    required
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value.toUpperCase() })}
                    disabled={!!editingItem}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                  >
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                    <option value="Kids">Kids</option>
                    <option value="Sarees">Sarees</option>
                    <option value="Kurtas">Kurtas</option>
                    <option value="Suits">Suits</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Product Type</label>
                  <select
                    value={itemForm.type || 'Saree'}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff' }}
                  >
                    <option value="Saree">Saree</option>
                    <option value="Kurta">Kurta</option>
                    <option value="Shirt">Shirt</option>
                    <option value="Salwar Suit">Salwar Suit</option>
                    <option value="Lehenga">Lehenga</option>
                    <option value="Frock">Frock</option>
                    <option value="Jacket">Jacket</option>
                    <option value="Chinos">Chinos</option>
                    <option value="Dupatta">Dupatta</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Dress">Dress</option>
                    <option value="Clothing">Clothing</option>
                  </select>
                </div>
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block Print Cotton Dupatta"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Stock Quantity & Unit & Low Alert Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px', background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#166534' }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.currentStock}
                    onChange={(e) => setItemForm({ ...itemForm, currentStock: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '14px', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#166534' }}>Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit || 'Pieces'}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#166534' }}>Low Stock Alert At</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.lowStockThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Purchase Price & Selling Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm({ ...itemForm, purchasePrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Retail Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm({ ...itemForm, sellingPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* Sizes and Fabric */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Available Sizes (e.g. Free Size or S, M, L)</label>
                  <input
                    type="text"
                    value={itemForm.sizes || 'Free Size'}
                    onChange={(e) => setItemForm({ ...itemForm, sizes: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Fabric Material</label>
                  <input
                    type="text"
                    value={itemForm.fabric || 'Cotton Blend'}
                    onChange={(e) => setItemForm({ ...itemForm, fabric: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#334155' }}>Description / Highlights</label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Hand block printed cotton dupatta, 2.25 m long. Goes well with plain kurtis and suits."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: 'var(--primary, #b8405e)',
                    color: '#fff',
                    padding: '9px 22px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

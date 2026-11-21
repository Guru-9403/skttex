import { saveCustomProduct } from '../data/products.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../config/api.js';

export default function AdminStock() {
  const { user, token, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Active view tab: 'dashboard' | 'items' | 'transactions'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard metrics
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Items list & filters
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Transactions list
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState('');

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'General',
    unit: 'Pieces',
    openingStock: 0,
    lowStockThreshold: 10,
    purchasePrice: 0,
    sellingPrice: 0,
    description: '',
  });

  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [txForm, setTxForm] = useState({
    stockItemId: '',
    quantity: 1,
    unitPrice: 0,
    referenceNumber: '',
    partyName: '',
    notes: '',
  });

  // UI feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Load Transactions
  const fetchTransactions = async () => {
    if (!token || !isAdmin) return;
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      if (txTypeFilter) params.append('type', txTypeFilter);

      const res = await fetch(`${API_URL}/stock/transactions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      } else {
        throw new Error(data.message || 'Failed to load stock transactions');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (token && isAdmin) {
      fetchDashboard();
      fetchItems();
      fetchTransactions();
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
      category: 'Sarees',
      type: 'Saree',
      image: '',
      sizes: 'S, M, L, XL',
      fabric: 'Cotton Silk Blend',
      unit: 'Pieces',
      openingStock: 15,
      lowStockThreshold: 5,
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
      type: item.type || 'Saree',
      image: item.image || '',
      sizes: item.sizes || 'S, M, L, XL',
      fabric: item.fabric || '',
      unit: item.unit || 'Pieces',
      openingStock: item.openingStock,
      lowStockThreshold: item.lowStockThreshold || 10,
      purchasePrice: item.purchasePrice || 0,
      sellingPrice: item.sellingPrice || 0,
      description: item.description || '',
      addToStore: true,
    });
    setShowItemModal(true);
  };

  const handleOpenInward = (item = null) => {
    setTxForm({
      stockItemId: item ? item._id : (items[0]?._id || ''),
      quantity: 10,
      unitPrice: item ? item.purchasePrice : 0,
      referenceNumber: `INW-${Date.now().toString().slice(-6)}`,
      partyName: '',
      notes: 'Fresh stock received',
    });
    setShowInwardModal(true);
  };

  const handleOpenOutward = (item = null) => {
    setTxForm({
      stockItemId: item ? item._id : (items[0]?._id || ''),
      quantity: 1,
      unitPrice: item ? item.sellingPrice : 0,
      referenceNumber: `OUT-${Date.now().toString().slice(-6)}`,
      partyName: '',
      notes: 'Stock dispatch / counter sale',
    });
    setShowOutwardModal(true);
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
      // Fallback to local data URI preview if upload is blocked by Cloudinary key permission
      const reader = new FileReader();
      reader.onload = (ev) => {
        setItemForm((prev) => ({ ...prev, image: ev.target.result }));
      };
      reader.readAsDataURL(file);
      setErrorMsg(`Cloudinary Upload Notice: ${err.message}. Using local image preview.`);
    } finally {
      setUploadingImage(false);
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

      // Also sync to customer storefront cards
      try {
        const catMap = {
          'Sarees': 'Women',
          'Kurtas': 'Men',
          'Suits': 'Women',
          'Men': 'Men',
          'Women': 'Women',
          'Kids': 'Kids',
          'General': 'Women'
        };
        saveCustomProduct({
          id: itemForm.itemCode,
          name: itemForm.name,
          category: catMap[itemForm.category] || itemForm.category,
          type: itemForm.type || 'Clothing',
          price: Number(itemForm.sellingPrice) || 0,
          oldPrice: Math.round((Number(itemForm.sellingPrice) || 0) * 1.25),
          sizes: itemForm.sizes ? itemForm.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['Free Size'],
          colors: [{ name: 'Standard', hex: '#b8405e' }],
          tint: '#fdf5f7',
          fabric: itemForm.fabric || 'Premium Fabric',
          image: itemForm.image || '',
          isNew: true,
          featured: true,
          description: itemForm.description || itemForm.name,
        });
      } catch (err) {
        console.warn('Could not sync to storefront:', err);
      }

      setSuccessMsg(editingItem ? 'Stock item updated & synced to cards!' : 'New item created & added to storefront cards!');
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
    if (!window.confirm(`Are you sure you want to delete "${item.name}" (${item.itemCode})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/stock/items/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete item');

      setSuccessMsg(`Deleted item: ${item.name}`);
      fetchItems();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Record Inward Stock
  const handleRecordInward = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/stock/inward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(txForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record inward stock');

      setSuccessMsg(`Inward stock of ${txForm.quantity} units successfully recorded!`);
      setShowInwardModal(false);
      fetchItems();
      fetchTransactions();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Record Outward Stock
  const handleRecordOutward = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/stock/outward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(txForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record outward stock');

      setSuccessMsg(`Outward stock of ${txForm.quantity} units successfully recorded!`);
      setShowOutwardModal(false);
      fetchItems();
      fetchTransactions();
      fetchDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
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

  // Live calculated stock metrics with automatic fallback
  const totalItemsCount = dashboard?.totalItems ?? dashboard?.metrics?.totalItems ?? items.length;
  const availableStockCount = dashboard?.availableStock ?? dashboard?.metrics?.totalCurrentStock ?? items.reduce((acc, it) => acc + (it.currentStock || 0), 0);
  const totalInwardCount = dashboard?.totalInward ?? dashboard?.metrics?.totalInwardStock ?? items.reduce((acc, it) => acc + (it.totalInward || 0), 0);
  const totalOutwardCount = dashboard?.totalOutward ?? dashboard?.metrics?.totalOutwardStock ?? items.reduce((acc, it) => acc + (it.totalOutward || 0), 0);
  const lowStockCount = dashboard?.lowStockCount ?? dashboard?.metrics?.lowStockItems ?? items.filter((it) => it.currentStock > 0 && it.currentStock <= (it.lowStockThreshold || 10)).length;
  const outOfStockCount = dashboard?.outOfStockCount ?? dashboard?.metrics?.outOfStockItems ?? items.filter((it) => it.currentStock === 0).length;
  const totalStockPurchaseValue = dashboard?.totalStockValue ?? dashboard?.metrics?.totalStockPurchaseValue ?? items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.purchasePrice || 0), 0);
  const totalStockSellingValue = dashboard?.totalSellingValue ?? dashboard?.metrics?.totalStockSellingValue ?? items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.sellingPrice || 0), 0);
  const lowStockAlertsList = (dashboard?.lowStockItems && dashboard.lowStockItems.length > 0)
    ? dashboard.lowStockItems
    : (dashboard?.lowStockAlerts && dashboard.lowStockAlerts.length > 0)
    ? dashboard.lowStockAlerts
    : items.filter((it) => it.currentStock <= (it.lowStockThreshold || 10));

  return (
    <div className="admin-stock-page" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '24px 0' }}>
      <div className="stock-container">
        
        {/* Header bar */}
        <div className="stock-header">
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', color: '#1a1a1a', fontWeight: '700' }}>
              Stock Management Module
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>
              Sree Kavinya Tex &bull; Real-time Inventory, Movements &amp; Reports
            </p>
          </div>

          <div className="stock-header-actions">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="btn"
              style={{
                backgroundColor: '#107c41',
                color: '#fff',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: exporting ? 'not-allowed' : 'pointer'
              }}
            >
              <span>📊</span>
              {exporting ? 'Generating Excel...' : 'Export to Excel (.xlsx)'}
            </button>

            <button
              onClick={handleOpenAddItem}
              className="btn btn-primary"
              style={{ padding: '10px 18px', borderRadius: '6px', fontWeight: '600' }}
            >
              + Add New Item
            </button>
            <button
              onClick={() => handleOpenInward()}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              + Inward Stock
            </button>
            <button
              onClick={() => handleOpenOutward()}
              style={{
                backgroundColor: '#ea580c',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              - Outward Stock
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e', color: '#15803d', padding: '12px 18px', borderRadius: '6px', marginBottom: '20px' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="stock-tabs-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary, #b8405e)' : '3px solid transparent',
              color: activeTab === 'dashboard' ? 'var(--primary, #b8405e)' : '#6b7280',
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('items'); fetchItems(); }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'items' ? '3px solid var(--primary, #b8405e)' : '3px solid transparent',
              color: activeTab === 'items' ? 'var(--primary, #b8405e)' : '#6b7280',
            }}
          >
            📦 All Stock Items ({items.length})
          </button>
          <button
            onClick={() => { setActiveTab('transactions'); fetchTransactions(); }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'transactions' ? '3px solid var(--primary, #b8405e)' : '3px solid transparent',
              color: activeTab === 'transactions' ? 'var(--primary, #b8405e)' : '#6b7280',
            }}
          >
            📜 Transaction History
          </button>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {loadingDashboard && !dashboard && items.length === 0 ? (
              <p>Loading dashboard metrics...</p>
            ) : (
              <>
                {/* 6 Metric Cards */}
                      <div className="stock-metrics-grid">
                        <div className="stock-metric-card" style={{ borderTop: '4px solid #3b82f6' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Items</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>{totalItemsCount}</div>
                        </div>

                        <div className="stock-metric-card" style={{ borderTop: '4px solid #10b981' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Available Stock</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#065f46', marginTop: '4px' }}>{availableStockCount}</div>
                        </div>

                        <div className="stock-metric-card" style={{ borderTop: '4px solid #0284c7' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Inward</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#0369a1', marginTop: '4px' }}>{totalInwardCount}</div>
                        </div>

                        <div className="stock-metric-card" style={{ borderTop: '4px solid #f97316' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Outward</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#c2410c', marginTop: '4px' }}>{totalOutwardCount}</div>
                        </div>

                        <div className="stock-metric-card" style={{ borderTop: '4px solid #eab308' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Low Stock</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#a16207', marginTop: '4px' }}>{lowStockCount}</div>
                        </div>

                        <div className="stock-metric-card" style={{ borderTop: '4px solid #ef4444' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Out of Stock</div>
                          <div style={{ fontSize: '26px', fontWeight: '700', color: '#b91c1c', marginTop: '4px' }}>{outOfStockCount}</div>
                        </div>
                      </div>

                      {/* Stock Value & Formulas Info */}
                      <div style={{ background: '#fff', padding: '22px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', color: '#1f2937' }}>
                          Inventory Valuation &amp; Stock Formula
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                          <div>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Inventory Cost Value:</span>
                            <p style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '4px 0 0 0' }}>
                              ₹{Number(totalStockPurchaseValue || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>Estimated Retail Value:</span>
                            <p style={{ fontSize: '20px', fontWeight: '700', color: '#059669', margin: '4px 0 0 0' }}>
                              ₹{Number(totalStockSellingValue || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid var(--primary, #b8405e)' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary, #b8405e)', textTransform: 'uppercase' }}>Calculation Rule</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        Current Stock = Opening Stock + Inward Stock - Outward Stock
                      </p>
                    </div>
                  </div>
                </div>

                {/* Critical Stock Alerts Table */}
                <div style={{ background: '#fff', padding: '22px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '17px', color: '#b91c1c' }}>
                    ⚠️ Low &amp; Out of Stock Alerts
                  </h3>
                  {(lowStockAlertsList && lowStockAlertsList.length > 0) ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '10px 14px' }}>Item Code</th>
                            <th style={{ padding: '10px 14px' }}>Name</th>
                            <th style={{ padding: '10px 14px' }}>Category</th>
                            <th style={{ padding: '10px 14px' }}>Current Stock</th>
                            <th style={{ padding: '10px 14px' }}>Threshold</th>
                            <th style={{ padding: '10px 14px' }}>Status</th>
                            <th style={{ padding: '10px 14px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStockAlertsList.map((item) => (
                            <tr key={item._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.itemCode}</td>
                              <td style={{ padding: '10px 14px' }}>{item.name}</td>
                              <td style={{ padding: '10px 14px' }}>{item.category}</td>
                              <td style={{ padding: '10px 14px', fontWeight: '700', color: item.currentStock === 0 ? '#ef4444' : '#eab308' }}>
                                {item.currentStock} {item.unit}
                              </td>
                              <td style={{ padding: '10px 14px' }}>{item.lowStockThreshold}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  background: item.status === 'Out of Stock' ? '#fee2e2' : '#fef9c3',
                                  color: item.status === 'Out of Stock' ? '#b91c1c' : '#854d0e'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <button
                                  onClick={() => handleOpenInward(item)}
                                  style={{
                                    backgroundColor: '#0284c7',
                                    color: '#fff',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}
                                >
                                  + Inward Stock
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#059669', margin: '10px 0' }}>✅ All stock levels are currently healthy!</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ALL STOCK ITEMS */}
        {activeTab === 'items' && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', minWidth: '240px' }}
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">All Categories</option>
                <option value="Sarees">Sarees</option>
                <option value="Kurtas">Kurtas</option>
                <option value="Suits">Suits</option>
                <option value="Men">Men</option>
                <option value="Kids">Kids</option>
                <option value="General">General</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                onClick={fetchItems}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '6px' }}
              >
                Apply Filters
              </button>

              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedStatus(''); fetchItems(); }}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset
              </button>
            </div>

            {/* Table */}
            {loadingItems ? (
              <p>Loading stock items...</p>
            ) : items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                No stock items found. Click "+ Add New Item" to create one.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Item Code</th>
                      <th style={{ padding: '12px 14px' }}>Item Name</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Opening</th>
                      <th style={{ padding: '12px 14px', color: '#0284c7' }}>+ Inward</th>
                      <th style={{ padding: '12px 14px', color: '#ea580c' }}>- Outward</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700' }}>Current Stock</th>
                      <th style={{ padding: '12px 14px' }}>Purchase (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Selling (₹)</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600' }}>{item.itemCode}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong>{item.name}</strong>
                          {item.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{item.description}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>{item.category}</td>
                        <td style={{ padding: '12px 14px' }}>{item.openingStock}</td>
                        <td style={{ padding: '12px 14px', color: '#0284c7', fontWeight: '600' }}>+{item.totalInward || 0}</td>
                        <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: '600' }}>-{item.totalOutward || 0}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '15px' }}>
                          {item.currentStock} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>{item.unit}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>₹{item.purchasePrice}</td>
                        <td style={{ padding: '12px 14px' }}>₹{item.sellingPrice}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: item.status === 'In Stock' ? '#dcfce7' : item.status === 'Low Stock' ? '#fef9c3' : '#fee2e2',
                            color: item.status === 'In Stock' ? '#15803d' : item.status === 'Low Stock' ? '#854d0e' : '#b91c1c',
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenInward(item)}
                              title="Add Inward Stock"
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              +In
                            </button>
                            <button
                              onClick={() => handleOpenOutward(item)}
                              title="Issue Outward Stock"
                              style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              -Out
                            </button>
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              title="Edit item"
                              style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Delete item"
                              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">All Movement Types</option>
                <option value="INWARD">Inward Stock Only</option>
                <option value="OUTWARD">Outward Stock Only</option>
              </select>

              <button onClick={fetchTransactions} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px' }}>
                Filter
              </button>
            </div>

            {loadingTransactions ? (
              <p>Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                No stock transactions found. Record an Inward or Outward transaction first.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Date</th>
                      <th style={{ padding: '12px 14px' }}>Type</th>
                      <th style={{ padding: '12px 14px' }}>Item Code</th>
                      <th style={{ padding: '12px 14px' }}>Item Name</th>
                      <th style={{ padding: '12px 14px' }}>Quantity</th>
                      <th style={{ padding: '12px 14px' }}>Stock Before &rarr; After</th>
                      <th style={{ padding: '12px 14px' }}>Ref #</th>
                      <th style={{ padding: '12px 14px' }}>Party / Vendor</th>
                      <th style={{ padding: '12px 14px' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {new Date(tx.date || tx.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: tx.type === 'INWARD' ? '#e0f2fe' : '#ffedd5',
                            color: tx.type === 'INWARD' ? '#0369a1' : '#c2410c',
                          }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '600' }}>{tx.itemCode}</td>
                        <td style={{ padding: '12px 14px' }}>{tx.itemName}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: tx.type === 'INWARD' ? '#0284c7' : '#ea580c' }}>
                          {tx.type === 'INWARD' ? '+' : '-'}{tx.quantity} {tx.unit}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {tx.stockBefore} &rarr; <strong>{tx.stockAfter}</strong>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{tx.referenceNumber || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{tx.partyName || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13px' }}>{tx.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL: ADD / EDIT ITEM */}
      {showItemModal && (
        <div className="stock-modal-backdrop">
          <div className="stock-modal-box">
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#111827' }}>
              {editingItem ? `Edit Item: ${editingItem.itemCode}` : 'Add New Stock Item'}
            </h2>
            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Item Code (SKU)</label>
                  <input
                    type="text"
                    required
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value.toUpperCase() })}
                    disabled={!!editingItem}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Sarees">Sarees</option>
                    <option value="Kurtas">Kurtas</option>
                    <option value="Suits">Suits</option>
                    <option value="Men">Men</option>
                    <option value="Kids">Kids</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Item Type</label>
                  <select
                    value={itemForm.type || 'Saree'}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
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

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Pure Silk Kanchipuram Saree"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              {/* Product Image Function (Cloudinary upload or URL) */}
              <div style={{ marginTop: '15px', background: '#fdf5f7', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f2d4dc' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
                  📷 Product Image (Cloudinary Upload)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer', background: uploadingImage ? '#9ca3af' : 'var(--primary, #b8405e)', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                    {uploadingImage ? '⏳ Uploading...' : '📁 Choose Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>OR paste URL:</span>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/... or https://example.com/photo.jpg"
                    value={itemForm.image?.startsWith('data:') ? '' : (itemForm.image || '')}
                    onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                    style={{ flex: 1, minWidth: '180px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' }}
                  />
                </div>
                {uploadingImage && (
                  <p style={{ fontSize: '12px', color: '#b8405e', marginTop: '6px', fontWeight: '500' }}>
                    Uploading to Cloudinary... please wait.
                  </p>
                )}
                {itemForm.image && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={itemForm.image}
                      alt="Preview"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--primary, #b8405e)' }}
                    />
                    <div>
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                        {itemForm.image.includes('cloudinary') ? '☁️ Cloudinary image attached' : '✓ Image ready to attach to card'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, image: '' })}
                        style={{ display: 'block', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0, marginTop: '2px' }}
                      >
                        ✕ Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sizes and Fabric */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sizes (e.g. S, M, L, XL)</label>
                  <input
                    type="text"
                    value={itemForm.sizes || 'S, M, L, XL'}
                    onChange={(e) => setItemForm({ ...itemForm, sizes: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Fabric</label>
                  <input
                    type="text"
                    value={itemForm.fabric || 'Cotton Silk'}
                    onChange={(e) => setItemForm({ ...itemForm, fabric: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Low Stock Alert At</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.lowStockThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm({ ...itemForm, purchasePrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm({ ...itemForm, sellingPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              {!editingItem && (
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Initial Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.openingStock}
                    onChange={(e) => setItemForm({ ...itemForm, openingStock: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              )}

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description / Notes</label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '25px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '6px' }}
                >
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INWARD STOCK */}
      {showInwardModal && (
        <div className="stock-modal-backdrop">
          <div className="stock-modal-box">
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#0369a1' }}>
              📥 Record Inward Stock (Stock Received)
            </h2>
            <form onSubmit={handleRecordInward}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Select Stock Item</label>
                <select
                  required
                  value={txForm.stockItemId}
                  onChange={(e) => {
                    const sel = items.find(it => it._id === e.target.value);
                    setTxForm({ ...txForm, stockItemId: e.target.value, unitPrice: sel?.purchasePrice || 0 });
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {items.map(it => (
                    <option key={it._id} value={it._id}>
                      {it.itemCode} - {it.name} (Current: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Received Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Purchase Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={txForm.unitPrice}
                    onChange={(e) => setTxForm({ ...txForm, unitPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Supplier / Party Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Weaver Mills Erode"
                    value={txForm.partyName}
                    onChange={(e) => setTxForm({ ...txForm, partyName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Invoice / PO #</label>
                  <input
                    type="text"
                    value={txForm.referenceNumber}
                    onChange={(e) => setTxForm({ ...txForm, referenceNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Notes</label>
                <input
                  type="text"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Recording...' : 'Confirm Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OUTWARD STOCK */}
      {showOutwardModal && (
        <div className="stock-modal-backdrop">
          <div className="stock-modal-box">
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#c2410c' }}>
              📤 Record Outward Stock (Issue / Sale)
            </h2>
            <form onSubmit={handleRecordOutward}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Select Stock Item</label>
                <select
                  required
                  value={txForm.stockItemId}
                  onChange={(e) => {
                    const sel = items.find(it => it._id === e.target.value);
                    setTxForm({ ...txForm, stockItemId: e.target.value, unitPrice: sel?.sellingPrice || 0 });
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {items.map(it => (
                    <option key={it._id} value={it._id}>
                      {it.itemCode} - {it.name} (Available: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Issue Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Selling Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={txForm.unitPrice}
                    onChange={(e) => setTxForm({ ...txForm, unitPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Customer / Dispatch To</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail Counter / Order #104"
                    value={txForm.partyName}
                    onChange={(e) => setTxForm({ ...txForm, partyName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Dispatch / Invoice #</label>
                  <input
                    type="text"
                    value={txForm.referenceNumber}
                    onChange={(e) => setTxForm({ ...txForm, referenceNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Notes</label>
                <input
                  type="text"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowOutwardModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Recording...' : 'Confirm Outward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

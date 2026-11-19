import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../config/api.js';
import { formatPrice } from '../utils/format.js';

export default function AdminStock() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'inward', 'outward', 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard & Inventory Data
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Selected item for quick action
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  // Form States
  const [itemForm, setItemForm] = useState({
    itemCode: '',
    name: '',
    category: 'Men',
    unit: 'Pieces',
    openingStock: 0,
    lowStockThreshold: 10,
    purchasePrice: '',
    sellingPrice: '',
    description: '',
  });

  const [inwardForm, setInwardForm] = useState({
    stockItemId: '',
    quantity: '',
    unitPrice: '',
    referenceNumber: '',
    partyName: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [outwardForm, setOutwardForm] = useState({
    stockItemId: '',
    quantity: '',
    unitPrice: '',
    referenceNumber: '',
    partyName: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [exportFilter, setExportFilter] = useState({
    category: 'All',
    startDate: '',
    endDate: '',
  });
  const [exporting, setExporting] = useState(false);

  // Check admin role
  const isAdmin = user && user.role === 'admin';

  // Load initial data
  const fetchData = async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch dashboard stats
      const dashRes = await fetch(`${API_URL}/stock/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!dashRes.ok) throw new Error('Failed to load stock dashboard');
      const dashData = await dashRes.json();
      setDashboard(dashData);

      // 2. Fetch all stock items
      const itemsRes = await fetch(`${API_URL}/stock/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!itemsRes.ok) throw new Error('Failed to load stock items');
      const itemsData = await itemsRes.json();
      setItems(itemsData.items || []);

      // 3. Fetch transactions history
      const transRes = await fetch(`${API_URL}/stock/transactions?limit=250`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!transRes.ok) throw new Error('Failed to load transactions');
      const transData = await transRes.json();
      setTransactions(transData.transactions || []);
    } catch (err) {
      setError(err.message || 'Error fetching stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [token, isAdmin]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(['Men', 'Women', 'Kids', 'Fabric', 'Accessories']);
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'All' || item.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Inward & Outward filtered transactions
  const inwardHistory = useMemo(() => {
    return transactions.filter((t) => t.type === 'INWARD');
  }, [transactions]);

  const outwardHistory = useMemo(() => {
    return transactions.filter((t) => t.type === 'OUTWARD');
  }, [transactions]);

  // Auto-dismiss alert
  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Open Add Item modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemForm({
      itemCode: `SKT-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'Men',
      unit: 'Pieces',
      openingStock: 0,
      lowStockThreshold: 10,
      purchasePrice: '',
      sellingPrice: '',
      description: '',
    });
    setShowItemModal(true);
  };

  // Open Edit Item modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      itemCode: item.itemCode,
      name: item.name,
      category: item.category,
      unit: item.unit || 'Pieces',
      openingStock: item.openingStock,
      lowStockThreshold: item.lowStockThreshold || 10,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      description: item.description || '',
    });
    setShowItemModal(true);
  };

  // Save Add/Edit Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setError('');

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
      if (!res.ok) throw new Error(data.message || 'Failed to save item');

      showToast(
        editingItem
          ? `Stock item "${itemForm.name}" updated successfully.`
          : `New stock item "${itemForm.name}" added with opening stock.`
      );
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Open Inward modal
  const handleOpenInwardModal = (item = null) => {
    setSelectedItemForAction(item);
    setInwardForm({
      stockItemId: item ? item._id : items[0]?._id || '',
      quantity: '',
      unitPrice: item ? item.purchasePrice : '',
      referenceNumber: `INV-${Date.now().toString().slice(-5)}`,
      partyName: '',
      notes: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowInwardModal(true);
  };

  // Save Inward Stock
  const handleSaveInward = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/stock/inward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inwardForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record inward stock');

      showToast(data.message || 'Inward stock added successfully.');
      setShowInwardModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Open Outward modal
  const handleOpenOutwardModal = (item = null) => {
    setSelectedItemForAction(item);
    setOutwardForm({
      stockItemId: item ? item._id : items[0]?._id || '',
      quantity: '',
      unitPrice: item ? item.sellingPrice : '',
      referenceNumber: `BILL-${Date.now().toString().slice(-5)}`,
      partyName: '',
      notes: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowOutwardModal(true);
  };

  // Save Outward Stock
  const handleSaveOutward = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/stock/outward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(outwardForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record outward stock');

      showToast(data.message || 'Outward stock issued successfully.');
      setShowOutwardModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
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

      showToast(`Item "${item.name}" removed from stock catalog.`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Download Excel Report (.xlsx)
  const handleDownloadExcel = async () => {
    setExporting(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (exportFilter.category && exportFilter.category !== 'All') {
        params.append('category', exportFilter.category);
      }
      if (exportFilter.startDate) {
        params.append('startDate', exportFilter.startDate);
      }
      if (exportFilter.endDate) {
        params.append('endDate', exportFilter.endDate);
      }

      const res = await fetch(`${API_URL}/stock/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Excel export failed');
      }

      // Convert to blob and trigger download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `SreeKavinyaTex_Stock_${exportFilter.category !== 'All' ? exportFilter.category + '_' : ''}${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('Excel report downloaded successfully! Contains 4 separate sheets.');
      setShowExportModal(false);
    } catch (err) {
      setError(err.message || 'Could not download Excel report');
    } finally {
      setExporting(false);
    }
  };

  // Selected item stock helper for Outward modal
  const currentOutwardSelectedItem = useMemo(() => {
    return items.find((i) => i._id === outwardForm.stockItemId) || selectedItemForAction;
  }, [items, outwardForm.stockItemId, selectedItemForAction]);

  // Auth Guard
  if (!user) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Admin Authentication Required</h2>
        <p style={{ margin: '16px 0', color: 'var(--muted)' }}>
          Please sign in with your Admin credentials to access the Stock Management module.
        </p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}>Access Restricted</h2>
        <p style={{ margin: '16px 0', color: 'var(--muted)' }}>
          You are currently signed in as <strong>{user.email}</strong> (Role: {user.role}). Only administrators can manage warehouse stock and export inventory data.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ minHeight: '85vh', background: '#f8fafc', paddingBottom: 60 }}>
      <div className="container">
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            paddingTop: 10,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.9rem', color: '#0f172a', margin: 0 }}>Stock Management</h1>
              <span
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Admin Panel
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Sree Kavinya Tex &bull; Inventory Tracking &bull; Inward / Outward &bull; Excel Reports
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowExportModal(true)}
              title="Download Excel spreadsheet with all records and 4 sheets"
            >
              📊 Export to Excel (.xlsx)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 6, borderColor: '#059669', color: '#059669' }}
              onClick={() => handleOpenInwardModal()}
            >
              📥 + Inward Stock
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 6, borderColor: '#d97706', color: '#d97706' }}
              onClick={() => handleOpenOutwardModal()}
            >
              📤 - Outward Stock
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddModal}
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Global Alert Messages */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>✓ {successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* KPI Dashboard Cards */}
        {dashboard && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={cardStyle}>
              <span style={cardLabelStyle}>Total Items</span>
              <strong style={{ ...cardNumberStyle, color: '#0f172a' }}>{dashboard.totalItems}</strong>
              <span style={cardSubStyle}>Unique Varieties</span>
            </div>

            <div style={cardStyle}>
              <span style={cardLabelStyle}>Available Stock</span>
              <strong style={{ ...cardNumberStyle, color: '#2563eb' }}>{dashboard.availableStock}</strong>
              <span style={cardSubStyle}>Units on Hand</span>
            </div>

            <div style={cardStyle}>
              <span style={cardLabelStyle}>Total Inward</span>
              <strong style={{ ...cardNumberStyle, color: '#059669' }}>{dashboard.totalInward}</strong>
              <span style={cardSubStyle}>Received Units</span>
            </div>

            <div style={cardStyle}>
              <span style={cardLabelStyle}>Total Outward</span>
              <strong style={{ ...cardNumberStyle, color: '#7c3aed' }}>{dashboard.totalOutward}</strong>
              <span style={cardSubStyle}>Issued / Sold Units</span>
            </div>

            <div style={cardStyle}>
              <span style={cardLabelStyle}>Stock Valuation</span>
              <strong style={{ ...cardNumberStyle, color: '#0f172a', fontSize: '1.45rem' }}>
                {formatPrice(dashboard.totalStockValue)}
              </strong>
              <span style={cardSubStyle}>At Purchase Cost</span>
            </div>

            <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
              <span style={cardLabelStyle}>Low Stock Alert</span>
              <strong style={{ ...cardNumberStyle, color: '#d97706' }}>{dashboard.lowStockCount}</strong>
              <span style={cardSubStyle}>Needs Reorder</span>
            </div>

            <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
              <span style={cardLabelStyle}>Out of Stock</span>
              <strong style={{ ...cardNumberStyle, color: '#dc2626' }}>{dashboard.outOfStockCount}</strong>
              <span style={cardSubStyle}>0 Units Remaining</span>
            </div>
          </div>
        )}

        {/* Low Stock Warning Banner if any */}
        {dashboard && (dashboard.lowStockCount > 0 || dashboard.outOfStockCount > 0) && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 'var(--radius)',
              padding: '14px 18px',
              marginBottom: 24,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
                ⚠️ Attention Required: {dashboard.outOfStockCount} item(s) out of stock and {dashboard.lowStockCount} item(s) running low.
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {dashboard.outOfStockItems.slice(0, 4).map((i) => (
                  <span
                    key={i._id}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.8rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {i.name} (0 left)
                  </span>
                ))}
                {dashboard.lowStockItems.slice(0, 4).map((i) => (
                  <span
                    key={i._id}
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.8rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {i.name} ({i.currentStock} left)
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ background: '#fff' }}
              onClick={() => {
                setActiveTab('inventory');
                setSelectedStatus('Low Stock');
              }}
            >
              Filter Low Stock
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            borderBottom: '2px solid #e2e8f0',
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            style={tabButtonStyle(activeTab === 'inventory')}
          >
            📦 All Inventory Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inward')}
            style={tabButtonStyle(activeTab === 'inward')}
          >
            📥 Inward Stock History ({inwardHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outward')}
            style={tabButtonStyle(activeTab === 'outward')}
          >
            📤 Outward Stock History ({outwardHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={tabButtonStyle(activeTab === 'history')}
          >
            📜 Full Transaction Audit ({transactions.length})
          </button>
        </div>

        {/* TAB 1: INVENTORY ITEMS */}
        {activeTab === 'inventory' && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', padding: 20 }}>
            {/* Filter Toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Search by Item Name or Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    minWidth: 240,
                    fontSize: '0.9rem',
                  }}
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Showing {filteredItems.length} of {items.length} items
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={fetchData}
                  title="Reload live database data"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading live stock records...</p>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50, color: 'var(--muted)' }}>
                <p>No stock items match your filter.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedStatus('All');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={thRowStyle}>
                      <th style={thStyle}>Item Code</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Category</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Opening</th>
                      <th style={{ ...thStyle, textAlign: 'right', color: '#059669' }}>Inward</th>
                      <th style={{ ...thStyle, textAlign: 'right', color: '#7c3aed' }}>Outward</th>
                      <th style={{ ...thStyle, textAlign: 'right', background: '#f8fafc' }}>Current Stock</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Purchase (₹)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Selling (₹)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Stock Value (₹)</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item._id} style={trStyle}>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>
                          <code>{item.itemCode}</code>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {item.name}
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Unit: {item.unit || 'Pieces'}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={categoryBadgeStyle}>{item.category}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{item.openingStock}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          +{item.totalInward}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>
                          -{item.totalOutward}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: '1rem',
                            background: item.currentStock === 0 ? '#fef2f2' : item.currentStock <= item.lowStockThreshold ? '#fffbeb' : '#f0fdf4',
                            color: item.currentStock === 0 ? '#dc2626' : item.currentStock <= item.lowStockThreshold ? '#d97706' : '#15803d',
                          }}
                        >
                          {item.currentStock}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(item.purchasePrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(item.sellingPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                          {formatPrice(item.currentStock * item.purchasePrice)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#059669', color: '#059669' }}
                              onClick={() => handleOpenInwardModal(item)}
                              title="Record Inward Stock"
                            >
                              + In
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#d97706', color: '#d97706' }}
                              onClick={() => handleOpenOutwardModal(item)}
                              title="Record Outward Stock"
                              disabled={item.currentStock <= 0}
                            >
                              - Out
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit item details"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                              onClick={() => handleDeleteItem(item)}
                              title="Delete Item"
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

        {/* TAB 2: INWARD STOCK HISTORY */}
        {activeTab === 'inward' && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Inward Stock Received History</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  Complete audit log of all raw materials, finished garments, and purchases received into inventory.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenInwardModal()}
              >
                + Record Inward Entry
              </button>
            </div>

            {inwardHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No inward transactions recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={thRowStyle}>
                      <th style={thStyle}>Date & Time</th>
                      <th style={thStyle}>Item Code</th>
                      <th style={thStyle}>Item Name</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Received Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Unit Cost (₹)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total (₹)</th>
                      <th style={thStyle}>Supplier / Source</th>
                      <th style={thStyle}>Invoice / Ref #</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Stock (Before &rarr; After)</th>
                      <th style={thStyle}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inwardHistory.map((t) => (
                      <tr key={t._id} style={trStyle}>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(t.date || t.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <code>{t.itemCode}</code>
                        </td>
                        <td style={tdStyle}>{t.itemName}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          +{t.quantity} {t.unit || 'Pieces'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(t.unitPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatPrice(t.totalAmount)}</td>
                        <td style={tdStyle}>{t.partyName || '-'}</td>
                        <td style={tdStyle}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>
                            {t.referenceNumber || '-'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: '0.88rem' }}>
                          {t.stockBefore} &rarr; <strong style={{ color: '#059669' }}>{t.stockAfter}</strong>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>{t.createdByName || 'Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OUTWARD STOCK HISTORY */}
        {activeTab === 'outward' && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Outward Stock Issued / Sold History</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
                  Complete audit log of all goods issued, wholesale orders fulfilled, or dispatched items.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenOutwardModal()}
              >
                - Record Outward Entry
              </button>
            </div>

            {outwardHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No outward transactions recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={thRowStyle}>
                      <th style={thStyle}>Date & Time</th>
                      <th style={thStyle}>Item Code</th>
                      <th style={thStyle}>Item Name</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Issued Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Unit Rate (₹)</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total (₹)</th>
                      <th style={thStyle}>Customer / Recipient</th>
                      <th style={thStyle}>Bill / Ref #</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Stock (Before &rarr; After)</th>
                      <th style={thStyle}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outwardHistory.map((t) => (
                      <tr key={t._id} style={trStyle}>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(t.date || t.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <code>{t.itemCode}</code>
                        </td>
                        <td style={tdStyle}>{t.itemName}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>
                          -{t.quantity} {t.unit || 'Pieces'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(t.unitPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatPrice(t.totalAmount)}</td>
                        <td style={tdStyle}>{t.partyName || '-'}</td>
                        <td style={tdStyle}>
                          <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>
                            {t.referenceNumber || '-'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontSize: '0.88rem' }}>
                          {t.stockBefore} &rarr; <strong style={{ color: '#7c3aed' }}>{t.stockAfter}</strong>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>{t.createdByName || 'Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FULL AUDIT HISTORY */}
        {activeTab === 'history' && (
          <div style={{ background: '#fff', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Complete Stock Movement Log</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
                Chronological timeline of all stock balance changes (Inward and Outward).
              </p>
            </div>

            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No stock movements recorded yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={thRowStyle}>
                      <th style={thStyle}>Date & Time</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Type</th>
                      <th style={thStyle}>Item Code</th>
                      <th style={thStyle}>Item Name</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Movement Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Total (₹)</th>
                      <th style={thStyle}>Ref / Party</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Stock Impact</th>
                      <th style={thStyle}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t._id} style={trStyle}>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(t.date || t.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span
                            style={{
                              background: t.type === 'INWARD' ? '#dcfce7' : '#f3e8ff',
                              color: t.type === 'INWARD' ? '#15803d' : '#6b21a8',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <code>{t.itemCode}</code>
                        </td>
                        <td style={tdStyle}>{t.itemName}</td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'right',
                            fontWeight: 700,
                            color: t.type === 'INWARD' ? '#059669' : '#7c3aed',
                          }}
                        >
                          {t.type === 'INWARD' ? `+${t.quantity}` : `-${t.quantity}`} {t.unit || 'Pieces'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(t.totalAmount)}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 500 }}>{t.partyName || '-'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{t.referenceNumber || '-'}</div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {t.stockBefore} &rarr; <strong>{t.stockAfter}</strong>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: '#64748b' }}>{t.createdByName || 'Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: ADD / EDIT STOCK ITEM
          ======================================================== */}
      {showItemModal && (
        <div style={modalBackdropStyle} onClick={() => setShowItemModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                {editingItem ? `Edit Stock Item: ${editingItem.itemCode}` : 'Add New Stock Item'}
              </h2>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Item Code / SKU *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SKT-KUR-001"
                    style={{ ...inputStyle, textTransform: 'uppercase', background: editingItem ? '#f1f5f9' : '#fff' }}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Unique identifier for barcodes/tags</small>
                </div>

                <div>
                  <label style={labelStyle}>Item Name *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Silk Blend Nehru Jacket"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Men">Men's Wear</option>
                    <option value="Women">Women's Wear</option>
                    <option value="Kids">Kids' Wear</option>
                    <option value="Sarees">Sarees</option>
                    <option value="Fabric">Raw Fabric</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Measurement Unit</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Pieces">Pieces</option>
                    <option value="Meters">Meters</option>
                    <option value="Sets">Sets</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Purchase Cost Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm({ ...itemForm, purchasePrice: e.target.value })}
                    placeholder="e.g. 750"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Retail Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                    placeholder="e.g. 1299"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Opening Stock ({editingItem ? 'Adjust Base' : 'Initial'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={itemForm.openingStock}
                    onChange={(e) => setItemForm({ ...itemForm, openingStock: e.target.value })}
                    placeholder="0"
                    style={inputStyle}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    Formula: Current = Opening + Inward - Outward
                  </small>
                </div>

                <div>
                  <label style={labelStyle}>Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.lowStockThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })}
                    placeholder="10"
                    style={inputStyle}
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Triggers alert when stock drops to or below this</small>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Description / Fabric Notes</label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Optional details about fabric, weave, supplier, or shelf location..."
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowItemModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Create Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RECORD INWARD STOCK
          ======================================================== */}
      {showInwardModal && (
        <div style={modalBackdropStyle} onClick={() => setShowInwardModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#059669' }}>📥 Record Inward Stock</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Add newly received stock from manufacturer/supplier into inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInwardModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInward}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Select Stock Item *</label>
                <select
                  required
                  value={inwardForm.stockItemId}
                  onChange={(e) => {
                    const selected = items.find((i) => i._id === e.target.value);
                    setInwardForm({
                      ...inwardForm,
                      stockItemId: e.target.value,
                      unitPrice: selected ? selected.purchasePrice : inwardForm.unitPrice,
                    });
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.itemCode} - {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Inward Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={inwardForm.quantity}
                    onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Unit Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Defaults to item purchase cost"
                    value={inwardForm.unitPrice}
                    onChange={(e) => setInwardForm({ ...inwardForm, unitPrice: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Supplier / Manufacturer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Surat Weavers Mill / Lakshmi Tex"
                    value={inwardForm.partyName}
                    onChange={(e) => setInwardForm({ ...inwardForm, partyName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Invoice / Purchase Challan #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-948"
                    value={inwardForm.referenceNumber}
                    onChange={(e) => setInwardForm({ ...inwardForm, referenceNumber: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Transaction Date</label>
                  <input
                    type="date"
                    value={inwardForm.date}
                    onChange={(e) => setInwardForm({ ...inwardForm, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Notes / Remark</label>
                  <input
                    type="text"
                    placeholder="Lot number, quality check pass, etc."
                    value={inwardForm.notes}
                    onChange={(e) => setInwardForm({ ...inwardForm, notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {inwardForm.quantity && inwardForm.unitPrice && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius)',
                    padding: 12,
                    marginTop: 16,
                    fontSize: '0.9rem',
                    color: '#166534',
                  }}
                >
                  <strong>Total Transaction Value:</strong> {formatPrice(Number(inwardForm.quantity) * Number(inwardForm.unitPrice))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowInwardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                >
                  Confirm & Receive Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: RECORD OUTWARD STOCK (NEVER NEGATIVE!)
          ======================================================== */}
      {showOutwardModal && (
        <div style={modalBackdropStyle} onClick={() => setShowOutwardModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#d97706' }}>📤 Record Outward Stock</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Issue stock for sales, wholesale fulfillment, or department transfers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOutwardModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOutward}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Select Stock Item *</label>
                <select
                  required
                  value={outwardForm.stockItemId}
                  onChange={(e) => {
                    const selected = items.find((i) => i._id === e.target.value);
                    setOutwardForm({
                      ...outwardForm,
                      stockItemId: e.target.value,
                      unitPrice: selected ? selected.sellingPrice : outwardForm.unitPrice,
                    });
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i._id} value={i._id} disabled={i.currentStock <= 0}>
                      {i.itemCode} - {i.name} (Available: {i.currentStock} {i.unit}) {i.currentStock <= 0 ? '[OUT OF STOCK]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock Banner */}
              {currentOutwardSelectedItem && (
                <div
                  style={{
                    background: currentOutwardSelectedItem.currentStock > 0 ? '#eff6ff' : '#fef2f2',
                    border: `1px solid ${currentOutwardSelectedItem.currentStock > 0 ? '#bfdbfe' : '#fecaca'}`,
                    borderRadius: 'var(--radius)',
                    padding: '10px 14px',
                    marginBottom: 16,
                    fontSize: '0.9rem',
                    color: currentOutwardSelectedItem.currentStock > 0 ? '#1e40af' : '#991b1b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    Item: <strong>{currentOutwardSelectedItem.name}</strong>
                  </span>
                  <span>
                    Current Available Stock:{' '}
                    <strong style={{ fontSize: '1.05rem' }}>
                      {currentOutwardSelectedItem.currentStock} {currentOutwardSelectedItem.unit}
                    </strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>
                    Outward Quantity *{' '}
                    {currentOutwardSelectedItem && (
                      <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
                        (Max: {currentOutwardSelectedItem.currentStock})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={currentOutwardSelectedItem ? currentOutwardSelectedItem.currentStock : undefined}
                    placeholder="e.g. 10"
                    value={outwardForm.quantity}
                    onChange={(e) => setOutwardForm({ ...outwardForm, quantity: e.target.value })}
                    style={inputStyle}
                  />
                  {currentOutwardSelectedItem && Number(outwardForm.quantity) > currentOutwardSelectedItem.currentStock && (
                    <small style={{ color: '#dc2626', fontWeight: 600, display: 'block', marginTop: 4 }}>
                      ⚠️ Error: Cannot exceed available stock ({currentOutwardSelectedItem.currentStock}).
                    </small>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Selling / Issue Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Defaults to selling price"
                    value={outwardForm.unitPrice}
                    onChange={(e) => setOutwardForm({ ...outwardForm, unitPrice: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Customer / Destination Buyer</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail Customer / Wholesale Boutique"
                    value={outwardForm.partyName}
                    onChange={(e) => setOutwardForm({ ...outwardForm, partyName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Bill / Order / Dispatch Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-9821 / ORD-543"
                    value={outwardForm.referenceNumber}
                    onChange={(e) => setOutwardForm({ ...outwardForm, referenceNumber: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Transaction Date</label>
                  <input
                    type="date"
                    value={outwardForm.date}
                    onChange={(e) => setOutwardForm({ ...outwardForm, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Notes / Remark</label>
                  <input
                    type="text"
                    placeholder="Reason, dispatch courier tracking, etc."
                    value={outwardForm.notes}
                    onChange={(e) => setOutwardForm({ ...outwardForm, notes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {currentOutwardSelectedItem && Number(outwardForm.quantity) > 0 && (
                <div
                  style={{
                    background: '#fdf4ff',
                    border: '1px solid #f0abfc',
                    borderRadius: 'var(--radius)',
                    padding: 12,
                    marginTop: 16,
                    fontSize: '0.9rem',
                    color: '#86198f',
                  }}
                >
                  <strong>Stock After Transaction:</strong>{' '}
                  {currentOutwardSelectedItem.currentStock - Number(outwardForm.quantity)}{' '}
                  {currentOutwardSelectedItem.unit} (
                  {currentOutwardSelectedItem.currentStock - Number(outwardForm.quantity) === 0
                    ? 'Will be Out of Stock'
                    : currentOutwardSelectedItem.currentStock - Number(outwardForm.quantity) <= currentOutwardSelectedItem.lowStockThreshold
                    ? 'Will enter Low Stock'
                    : 'Healthy stock'}
                  )
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowOutwardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#d97706', borderColor: '#d97706' }}
                  disabled={
                    !currentOutwardSelectedItem ||
                    currentOutwardSelectedItem.currentStock <= 0 ||
                    Number(outwardForm.quantity) > currentOutwardSelectedItem.currentStock ||
                    Number(outwardForm.quantity) <= 0
                  }
                >
                  Confirm & Issue Outward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: EXPORT TO EXCEL (.XLSX)
          ======================================================== */}
      {showExportModal && (
        <div style={modalBackdropStyle} onClick={() => setShowExportModal(false)}>
          <div style={{ ...modalCardStyle, maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>
                  📊 Export Stock Report to Excel (.xlsx)
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Generates an authentic Microsoft Excel spreadsheet containing all database records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: 20,
              }}
            >
              <strong style={{ fontSize: '0.88rem', color: '#334155', display: 'block', marginBottom: 6 }}>
                Included Excel Sheets:
              </strong>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                <li><strong>Sheet 1:</strong> Complete Stock Details (All items, prices, valuations, & statuses)</li>
                <li><strong>Sheet 2:</strong> Inward Stock History (Chronological received entries & suppliers)</li>
                <li><strong>Sheet 3:</strong> Outward Stock History (Chronological sales, bills & customers)</li>
                <li><strong>Sheet 4:</strong> Total Stock Summary (Executive KPIs & category breakdown)</li>
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Category Filter</label>
                <select
                  value={exportFilter.category}
                  onChange={(e) => setExportFilter({ ...exportFilter, category: e.target.value })}
                  style={inputStyle}
                >
                  <option value="All">All Categories (Complete Inventory)</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start Date (Optional)</label>
                  <input
                    type="date"
                    value={exportFilter.startDate}
                    onChange={(e) => setExportFilter({ ...exportFilter, startDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={exportFilter.endDate}
                    onChange={(e) => setExportFilter({ ...exportFilter, endDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadExcel}
                disabled={exporting}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {exporting ? 'Generating Excel File...' : '📥 Download Excel Report (.xlsx)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for Clean Dashboard Presentation
const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 'var(--radius)',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const cardLabelStyle = {
  fontSize: '0.8rem',
  color: '#64748b',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const cardNumberStyle = {
  fontSize: '1.75rem',
  fontWeight: 700,
  lineHeight: 1.2,
};

const cardSubStyle = {
  fontSize: '0.78rem',
  color: '#94a3b8',
};

const tabButtonStyle = (isActive) => ({
  background: 'none',
  border: 'none',
  borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
  color: isActive ? 'var(--primary)' : '#64748b',
  fontWeight: isActive ? 600 : 500,
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: '0.92rem',
  transition: 'all 0.2s',
});

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.88rem',
  whiteSpace: 'nowrap',
};

const thRowStyle = {
  background: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
};

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#475569',
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const trStyle = {
  borderBottom: '1px solid #f1f5f9',
};

const tdStyle = {
  padding: '12px 14px',
  color: '#334155',
};

const statusBadgeStyle = (status) => {
  if (status === 'Out of Stock') {
    return {
      background: '#fee2e2',
      color: '#b91c1c',
      padding: '3px 8px',
      borderRadius: 4,
      fontWeight: 600,
      fontSize: '0.75rem',
    };
  }
  if (status === 'Low Stock') {
    return {
      background: '#fef3c7',
      color: '#b45309',
      padding: '3px 8px',
      borderRadius: 4,
      fontWeight: 600,
      fontSize: '0.75rem',
    };
  }
  return {
    background: '#dcfce7',
    color: '#15803d',
    padding: '3px 8px',
    borderRadius: 4,
    fontWeight: 600,
    fontSize: '0.75rem',
  };
};

const categoryBadgeStyle = {
  background: '#f1f5f9',
  color: '#475569',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: '0.8rem',
};

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  padding: 16,
};

const modalCardStyle = {
  background: '#fff',
  borderRadius: 8,
  maxWidth: 620,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: 24,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

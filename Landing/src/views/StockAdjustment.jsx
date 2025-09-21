import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllStockAdjustments, addStockAdjustment, exportStockAdjustments, importStockAdjustments, downloadTemplate } from '../services/stockAdjustmentService';
import { getProducts } from '../services/productService';
import { getStores } from '../services/storeService';

const StockAdjustment = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_no: '',
    store_no: '',
    qty: '',
    adj_type: 'add',
    adj_desc: ''
  });
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [prods, strs, adjs] = await Promise.all([
          getProducts(),
          getStores(),
          getAllStockAdjustments()
        ]);
        setProducts(prods);
        setStores(Array.isArray(strs) ? strs : (strs.data || []));
        setAdjustments(adjs);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/stocks');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingAdjustment(null);
    setFormData({ product_no: '', store_no: '', qty: '', adj_type: 'add', adj_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingAdjustment(null);
    setFormData({ product_no: '', store_no: '', qty: '', adj_type: 'add', adj_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (adj) => {
    setEditingAdjustment(adj);
    setFormData({
      product_no: adj.product_no,
      store_no: adj.store_no,
      qty: adj.qty,
      adj_type: adj.adj_type,
      adj_desc: adj.adj_desc
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  // No backend delete yet, just UI
  const handleDelete = (adj_no) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      setAdjustments(prev => prev.filter(adj => adj.adj_no !== adj_no));
      setSuccess('Adjustment deleted successfully (UI only)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product_no || !formData.store_no || !formData.qty) {
      setError('All fields are required');
      return;
    }
    if (Number(formData.qty) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await addStockAdjustment({
        product_no: Number(formData.product_no),
        store_no: Number(formData.store_no),
        qty: Number(formData.qty),
        adj_type: formData.adj_type,
        adj_desc: formData.adj_desc
      });
      setSuccess('Adjustment added successfully');
      // Refresh adjustments
      const adjs = await getAllStockAdjustments();
      setAdjustments(adjs);
      setFormData({ product_no: '', store_no: '', qty: '', adj_type: 'add', adj_desc: '' });
      setEditingAdjustment(null);
      setTimeout(() => setViewMode('table'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error adding adjustment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Export stock adjustments to Excel
  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await exportStockAdjustments();
      setSuccess('Stock adjustments exported successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download import template
  const handleDownloadTemplate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await downloadTemplate();
      setSuccess('Template downloaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for import
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');
    setImportResult(null);

    try {
      const result = await importStockAdjustments(file);
      setImportResult(result);
      
      if (result.success) {
        setSuccess(`Import completed: ${result.imported} imported, ${result.skipped} skipped`);
        // Refresh adjustments list
        const adjs = await getAllStockAdjustments();
        setAdjustments(adjs);
      } else {
        setError(result.error || 'Import failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Map product/store numbers to names for display
  const getProductName = (product_no) => {
    const prod = products.find(p => p.product_no === product_no);
    return prod ? prod.product_name : product_no;
  };
  const getStoreName = (store_no) => {
    const store = stores.find(s => s.store_no === store_no);
    return store ? store.store_name : store_no;
  };


  // Defensive: Only filter if all data is loaded and arrays
  const isDataReady = Array.isArray(adjustments) && Array.isArray(products) && Array.isArray(stores);
  const filteredAdjustments = isDataReady
    ? adjustments.filter(adj =>
        (String(getProductName(adj.product_no)) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String(getStoreName(adj.store_no)) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adj.adj_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adj.adj_desc || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (error) {
    return <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>;
  }
  if (!isDataReady || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Stocks
        </button>
        <h1>Stock Adjustment</h1>
        <p>Manage stock adjustments for products</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Adjustment
          </button>
          {viewMode === 'table' && (
            <>
              <button
                className={styles['action-btn']}
                onClick={handleExport}
                disabled={loading}
              >
                <Download size={20} />
                Export
              </button>
              <button
                className={styles['action-btn']}
                onClick={handleImportClick}
                disabled={loading}
              >
                <Upload size={20} />
                Import
              </button>
              <button
                className={styles['action-btn']}
                onClick={handleDownloadTemplate}
                disabled={loading}
              >
                <FileSpreadsheet size={20} />
                Template
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {importResult && importResult.errors && importResult.errors.length > 0 && (
          <div className={styles['import-errors']}>
            <h4>Import Errors:</h4>
            <ul>
              {importResult.errors.map((err, index) => (
                <li key={index}>Row {err.row}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}
        {loading && <div className={styles.loading}>Loading...</div>}
        {viewMode === 'table' && !loading && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search adjustments..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredAdjustments.length} adjustments found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Adjustment No</th>
                    <th>Product</th>
                    <th>Store</th>
                    <th>Quantity</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdjustments.map(adj => (
                    <tr key={adj.adj_no}>
                      <td>{adj.adj_no}</td>
                      <td>{getProductName(adj.product_no)}</td>
                      <td>{getStoreName(adj.store_no)}</td>
                      <td>{adj.qty}</td>
                      <td>{adj.adj_type}</td>
                      <td>{adj.adj_desc}</td>
                      <td>{new Date(adj.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(adj)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(adj.adj_no)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAdjustments.length === 0 && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No adjustments found matching your search' : 'No adjustments found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && !loading && (
          <div className={styles['form-container']}>
            <h2>{editingAdjustment ? 'Edit Adjustment' : 'Add New Adjustment'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="product_no">Product *</label>
                <select
                  id="product_no"
                  name="product_no"
                  value={formData.product_no}
                  onChange={handleInputChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.product_no} value={p.product_no}>{p.product_name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="store_no">Store *</label>
                <select
                  id="store_no"
                  name="store_no"
                  value={formData.store_no}
                  onChange={handleInputChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(s => (
                    <option key={s.store_no} value={s.store_no}>{s.store_name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="qty">Quantity *</label>
                <input
                  type="number"
                  id="qty"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  required
                  className={styles['form-input']}
                  min="1"
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="adj_type">Type *</label>
                <select
                  id="adj_type"
                  name="adj_type"
                  value={formData.adj_type}
                  onChange={handleInputChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="adj_desc">Description</label>
                <input
                  type="text"
                  id="adj_desc"
                  name="adj_desc"
                  value={formData.adj_desc}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingAdjustment ? 'Update Adjustment' : 'Add Adjustment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustment;
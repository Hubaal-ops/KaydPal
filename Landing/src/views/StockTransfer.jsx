import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getStores } from '../services/storeService';
import { createStockTransfer, getStockTransfers } from '../services/stockTransferService';

const StockTransfer = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [transfers, setTransfers] = useState([]); // For now, only add new
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product_no: '',
    from_store: '',
    to_store: '',
    qty: '',
    transfer_desc: ''
  });
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [prods, strs, transfersData] = await Promise.all([
          getProducts(),
          getStores(),
          getStockTransfers()
        ]);
        setProducts(prods);
        setStores(Array.isArray(strs) ? strs : (strs.data || []));
        setTransfers(transfersData);
      } catch (err) {
        setError('Error loading products, stores, or transfers');
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
    setEditingTransfer(null);
    setFormData({ product_no: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingTransfer(null);
    setFormData({ product_no: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      product_no: transfer.product_no,
      from_store: transfer.from_store,
      to_store: transfer.to_store,
      qty: transfer.qty,
      transfer_desc: transfer.transfer_desc
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (transfer_id) => {
    if (window.confirm('Are you sure you want to delete this transfer?')) {
      setTransfers(prev => prev.filter(tr => tr.transfer_id !== transfer_id));
      setSuccess('Transfer deleted successfully');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product_no || !formData.from_store || !formData.to_store || !formData.qty) {
      setError('All fields are required');
      return;
    }
    if (formData.from_store === formData.to_store) {
      setError('Source and destination stores must be different');
      return;
    }
    if (Number(formData.qty) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await createStockTransfer({
        product_no: Number(formData.product_no),
        from_store: Number(formData.from_store),
        to_store: Number(formData.to_store),
        qty: Number(formData.qty),
        transfer_desc: formData.transfer_desc
      });
      setSuccess('Stock transfer completed successfully');
      setFormData({ product_no: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
      setEditingTransfer(null);
      setTimeout(() => setViewMode('table'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error creating stock transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // For now, transfers are not fetched from backend, so search is on local state
  const filteredTransfers = transfers.filter(tr =>
    (tr.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tr.from_store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tr.to_store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tr.transfer_desc || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Stocks
        </button>
        <h1>Stock Transfer</h1>
        <p>Manage stock transfers between stores</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Transfer
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {loading && <div className={styles.loading}>Loading...</div>}
        {viewMode === 'table' && !loading && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredTransfers.length} transfers found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Product</th>
                    <th>From Store</th>
                    <th>To Store</th>
                    <th>Quantity</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map(tr => (
                    <tr key={tr.transfer_id}>
                      <td>{tr.transfer_id}</td>
                      <td>{tr.product_name}</td>
                      <td>{tr.from_store_name}</td>
                      <td>{tr.to_store_name}</td>
                      <td>{tr.qty}</td>
                      <td>{tr.transfer_desc}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(tr)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(tr.transfer_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransfers.length === 0 && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No transfers found matching your search' : 'No transfers found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && !loading && (
          <div className={styles['form-container']}>
            <h2>{editingTransfer ? 'Edit Transfer' : 'Add New Transfer'}</h2>
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
                <label htmlFor="from_store">From Store *</label>
                <select
                  id="from_store"
                  name="from_store"
                  value={formData.from_store}
                  onChange={handleInputChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Select source store</option>
                  {stores.map(s => (
                    <option key={s.store_no} value={s.store_no}>{s.store_name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="to_store">To Store *</label>
                <select
                  id="to_store"
                  name="to_store"
                  value={formData.to_store}
                  onChange={handleInputChange}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Select destination store</option>
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
                <label htmlFor="transfer_desc">Description</label>
                <input
                  type="text"
                  id="transfer_desc"
                  name="transfer_desc"
                  value={formData.transfer_desc}
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
                  {editingTransfer ? 'Update Transfer' : 'Add Transfer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTransfer; 
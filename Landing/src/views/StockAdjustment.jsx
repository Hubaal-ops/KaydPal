import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockAdjustment = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [adjustments, setAdjustments] = useState([
    {
      adj_no: 1,
      product: 'Product A',
      store: 'Main Street Store',
      qty: 10,
      adj_type: 'add',
      adj_desc: 'Initial stock',
      created_at: '2024-06-01T10:00:00Z'
    },
    {
      adj_no: 2,
      product: 'Product B',
      store: 'Downtown Branch',
      qty: 5,
      adj_type: 'subtract',
      adj_desc: 'Damaged items',
      created_at: '2024-06-02T12:30:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product: '',
    store: '',
    qty: '',
    adj_type: 'add',
    adj_desc: ''
  });
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setFormData({ product: '', store: '', qty: '', adj_type: 'add', adj_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingAdjustment(null);
    setFormData({ product: '', store: '', qty: '', adj_type: 'add', adj_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (adj) => {
    setEditingAdjustment(adj);
    setFormData({
      product: adj.product,
      store: adj.store,
      qty: adj.qty,
      adj_type: adj.adj_type,
      adj_desc: adj.adj_desc
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (adj_no) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      setAdjustments(prev => prev.filter(adj => adj.adj_no !== adj_no));
      setSuccess('Adjustment deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product.trim() || !formData.store.trim() || !formData.qty) {
      setError('All fields are required');
      return;
    }
    if (editingAdjustment) {
      setAdjustments(prev => prev.map(adj =>
        adj.adj_no === editingAdjustment.adj_no ? { ...adj, ...formData } : adj
      ));
      setSuccess('Adjustment updated successfully');
    } else {
      const newAdj = {
        adj_no: Math.max(...adjustments.map(a => a.adj_no), 0) + 1,
        ...formData,
        created_at: new Date().toISOString()
      };
      setAdjustments(prev => [...prev, newAdj]);
      setSuccess('Adjustment added successfully');
    }
    setFormData({ product: '', store: '', qty: '', adj_type: 'add', adj_desc: '' });
    setEditingAdjustment(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredAdjustments = adjustments.filter(adj =>
    adj.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.adj_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.adj_desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {viewMode === 'table' && (
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
                      <td>{adj.product}</td>
                      <td>{adj.store}</td>
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
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingAdjustment ? 'Edit Adjustment' : 'Add New Adjustment'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="product">Product *</label>
                <input
                  type="text"
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="store">Store *</label>
                <input
                  type="text"
                  id="store"
                  name="store"
                  value={formData.store}
                  onChange={handleInputChange}
                  placeholder="Enter store name"
                  required
                  className={styles['form-input']}
                />
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
                  className={styles['form-input']}
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
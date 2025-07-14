import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockTransfer = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [transfers, setTransfers] = useState([
    {
      transfer_id: 1,
      product: 'Product A',
      from_store: 'Main Street Store',
      to_store: 'Downtown Branch',
      qty: 8,
      transfer_desc: 'Restocking',
      created_at: '2024-06-03T09:00:00Z'
    },
    {
      transfer_id: 2,
      product: 'Product B',
      from_store: 'Downtown Branch',
      to_store: 'Mall Location',
      qty: 3,
      transfer_desc: 'Low stock transfer',
      created_at: '2024-06-04T11:15:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    product: '',
    from_store: '',
    to_store: '',
    qty: '',
    transfer_desc: ''
  });
  const [editingTransfer, setEditingTransfer] = useState(null);
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
    setEditingTransfer(null);
    setFormData({ product: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingTransfer(null);
    setFormData({ product: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      product: transfer.product,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.product.trim() || !formData.from_store.trim() || !formData.to_store.trim() || !formData.qty) {
      setError('All fields are required');
      return;
    }
    if (editingTransfer) {
      setTransfers(prev => prev.map(tr =>
        tr.transfer_id === editingTransfer.transfer_id ? { ...tr, ...formData } : tr
      ));
      setSuccess('Transfer updated successfully');
    } else {
      const newTransfer = {
        transfer_id: Math.max(...transfers.map(t => t.transfer_id), 0) + 1,
        ...formData,
        created_at: new Date().toISOString()
      };
      setTransfers(prev => [...prev, newTransfer]);
      setSuccess('Transfer added successfully');
    }
    setFormData({ product: '', from_store: '', to_store: '', qty: '', transfer_desc: '' });
    setEditingTransfer(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredTransfers = transfers.filter(tr =>
    tr.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.from_store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.to_store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.transfer_desc.toLowerCase().includes(searchTerm.toLowerCase())
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
        {viewMode === 'table' && (
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
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map(tr => (
                    <tr key={tr.transfer_id}>
                      <td>{tr.transfer_id}</td>
                      <td>{tr.product}</td>
                      <td>{tr.from_store}</td>
                      <td>{tr.to_store}</td>
                      <td>{tr.qty}</td>
                      <td>{tr.transfer_desc}</td>
                      <td>{new Date(tr.created_at).toLocaleDateString()}</td>
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
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingTransfer ? 'Edit Transfer' : 'Add New Transfer'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="from_store">From Store *</label>
                  <select
                    id="from_store"
                    name="from_store"
                    value={formData.from_store}
                    onChange={handleInputChange}
                    required
                    className={styles['form-input']}
                  >
                    <option value="">Select Store</option>
                    <option value="Main Street Store">Main Street Store</option>
                    <option value="Downtown Branch">Downtown Branch</option>
                    <option value="Mall Location">Mall Location</option>
                  </select>
                </div>
                <div style={{ fontSize: '2rem', color: '#bdbdbd', marginTop: '2rem' }}>&rarr;</div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="to_store">To Store *</label>
                  <select
                    id="to_store"
                    name="to_store"
                    value={formData.to_store}
                    onChange={handleInputChange}
                    required
                    className={styles['form-input']}
                  >
                    <option value="">Select Store</option>
                    <option value="Main Street Store">Main Street Store</option>
                    <option value="Downtown Branch">Downtown Branch</option>
                    <option value="Mall Location">Mall Location</option>
                  </select>
                </div>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="product">Product *</label>
                <select
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  required
                  className={styles['form-input']}
                >
                  <option value="">Select Product</option>
                  <option value="Product A">Product A</option>
                  <option value="Product B">Product B</option>
                  <option value="Product C">Product C</option>
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
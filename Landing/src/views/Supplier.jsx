import React, { useState, useEffect } from 'react';
import styles from './Supplier.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';

const Supplier = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    balance: 0
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(err.message || 'Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingSupplier(null);
    setFormData({ name: '', email: '', phone: '', balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingSupplier(null);
    setFormData({ name: '', email: '', phone: '', balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      balance: supplier.balance !== null && supplier.balance !== undefined ? Number(supplier.balance) : 0
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (supplier_no) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deleteSupplier(supplier_no);
        await fetchSuppliers();
        setSuccess('Supplier deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting supplier');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    // Debug: Log the form data being sent
    console.log('Form data being sent:', formData);
    console.log('Balance value:', formData.balance, 'Type:', typeof formData.balance);
    
    setLoading(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.supplier_no, formData);
        setSuccess('Supplier updated successfully');
      } else {
        await addSupplier(formData);
        setSuccess('Supplier added successfully');
      }
      await fetchSuppliers();
      setFormData({ name: '', email: '', phone: '', balance: 0 });
      setEditingSupplier(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error saving supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.supplier}>
      <div className={styles['supplier-header']}>
        <button className={styles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Supplier Management</h1>
        <p>Register and manage suppliers</p>
      </div>
      <div className={styles['supplier-content']}>
        <div className={styles['action-buttons']}>
          <button
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
          >
            <Eye size={20} />
            View Table
          </button>
          <button
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            Add New Supplier
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
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredSuppliers.length} suppliers found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading suppliers...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Balance</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.supplier_no}>
                        <td>{supplier.supplier_no}</td>
                        <td>{supplier.name}</td>
                        <td>{supplier.email}</td>
                        <td>{supplier.phone}</td>
                        <td>{supplier.balance !== null && supplier.balance !== undefined ? supplier.balance : 0}</td>
                        <td>{supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(supplier)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.supplier_no)}
                              className={`${styles['icon-btn']} ${styles.delete}`}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSuppliers.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="phone">Phone</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="balance">Balance *</label>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  min="0"
                  required
                  placeholder="Enter balance"
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Supplier; 
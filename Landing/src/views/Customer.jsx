import React, { useState, useEffect } from 'react';
import styles from './Customer.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/customerService';

const Customer = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bal: 0
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', bal: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', bal: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      bal: customer.bal || 0
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (customer_no) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        await deleteCustomer(customer_no);
        await fetchCustomers();
        setSuccess('Customer deleted successfully');
      } catch (err) {
        setError(err.message || 'Error deleting customer');
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
    setLoading(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.customer_no, formData);
        setSuccess('Customer updated successfully');
      } else {
        await addCustomer(formData);
        setSuccess('Customer added successfully');
      }
      await fetchCustomers();
      setFormData({ name: '', email: '', phone: '', address: '', bal: 0 });
      setEditingCustomer(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.customer}>
      <div className={styles['customer-header']}>
        <button className={styles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Customer Management</h1>
        <p>Register and manage customers</p>
      </div>
      <div className={styles['customer-content']}>
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
            Add New Customer
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredCustomers.length} customers found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading customers...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Balance</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.customer_no}>
                        <td>{customer.customer_no}</td>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.address}</td>
                        <td>{customer.bal}</td>
                        <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(customer)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.customer_no)}
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
                {filteredCustomers.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No customers found matching your search' : 'No customers found'}
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
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label>Balance</label>
                <input
                  type="number"
                  name="bal"
                  value={formData.bal !== undefined ? formData.bal : ''}
                  onChange={e => setFormData(prev => ({ ...prev, bal: Number(e.target.value) }))}
                  min="0"
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customer; 
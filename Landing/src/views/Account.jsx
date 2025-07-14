import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Account = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account_id: '',
    name: ''
  });
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for demonstration
  const mockAccounts = [
    {
      account_id: 'ACC001',
      name: 'Cash',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      account_id: 'ACC002',
      name: 'Bank',
      createdAt: '2024-01-16T14:20:00Z'
    },
    {
      account_id: 'ACC003',
      name: 'Receivables',
      createdAt: '2024-01-17T09:15:00Z'
    }
  ];

  // Simulate API call
  const fetchAccounts = async () => {
    console.log('fetchAccounts called');
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccounts(mockAccounts);
      console.log('accounts', mockAccounts);
    } catch (error) {
      setError('Error fetching accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/financial');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingAccount(null);
    setFormData({ account_id: '', name: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingAccount(null);
    setFormData({ account_id: '', name: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      account_id: account.account_id,
      name: account.name
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setAccounts(prev => prev.filter(acc => acc.account_id !== accountId));
        setSuccess('Account deleted successfully');
      } catch (error) {
        setError('Error deleting account');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.account_id.trim() || !formData.name.trim()) {
      setError('Account ID and Name are required');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (editingAccount) {
        setAccounts(prev => prev.map(acc =>
          acc.account_id === editingAccount.account_id
            ? { ...acc, ...formData }
            : acc
        ));
        setSuccess('Account updated successfully');
      } else {
        if (accounts.some(acc => acc.account_id === formData.account_id)) {
          setError('Account ID must be unique');
          return;
        }
        const newAccount = {
          account_id: formData.account_id,
          name: formData.name,
          createdAt: new Date().toISOString()
        };
        setAccounts(prev => [...prev, newAccount]);
        setSuccess('Account added successfully');
      }
      setFormData({ account_id: '', name: '' });
      setEditingAccount(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving account');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredAccounts = accounts.filter(account =>
    account.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.categories}>
      <div className={styles['categories-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Accounts Management</h1>
        <p>Manage business accounts</p>
      </div>
      <div className={styles['categories-content']}>
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
            Add New Account
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
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredAccounts.length} accounts found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading accounts...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Account ID</th>
                      <th>Name</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account.account_id}>
                        <td>{account.account_id}</td>
                        <td>{account.name}</td>
                        <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button className={styles['icon-btn']} onClick={() => handleEdit(account)}>
                              <Edit size={18} />
                            </button>
                            <button className={`${styles['icon-btn']} ${styles.delete}`} onClick={() => handleDelete(account.account_id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAccounts.length === 0 && !loading && (
                  <div className={styles['no-data']}>No accounts found.</div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingAccount ? 'Edit Account' : 'Add New Account'}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label htmlFor="account_id">Account ID</label>
                <input
                  type="text"
                  id="account_id"
                  name="account_id"
                  className={styles['form-input']}
                  value={formData.account_id}
                  onChange={handleInputChange}
                  disabled={!!editingAccount}
                  required
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={styles['form-input']}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingAccount ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account; 
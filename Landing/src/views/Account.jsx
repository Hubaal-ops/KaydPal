import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} from '../services/accountService';

const Account = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account_id: '',
    name: '',
    bank: '',
    balance: 0
  });
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch accounts from backend
  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
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
    setFormData({ account_id: '', name: '', bank: '', balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingAccount(null);
    setFormData({ account_id: '', name: '', bank: '', balance: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      account_id: account.account_id || '',
      name: account.name,
      bank: account.bank,
      balance: account.balance
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setLoading(true);
      setError('');
      try {
        await deleteAccount(id);
        setSuccess('Account deleted successfully');
        fetchAccounts();
      } catch (err) {
        setError('Error deleting account');
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
    if (!formData.bank.trim()) {
      setError('Bank is required');
      return;
    }
    setLoading(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount._id, formData);
        setSuccess('Account updated successfully');
      } else {
        await createAccount(formData);
        setSuccess('Account added successfully');
      }
      setFormData({ account_id: '', name: '', bank: '', balance: 0 });
      setEditingAccount(null);
      fetchAccounts();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' ? Number(value) : value
    }));
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.bank && account.bank.toLowerCase().includes(searchTerm.toLowerCase()))
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
                      <th>Bank</th>
                      <th>Balance</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account._id}>
                        <td>{account.account_id}</td>
                        <td>{account.name}</td>
                        <td>{account.bank}</td>
                        <td>{account.balance}</td>
                        <td>{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button className={styles['icon-btn']} onClick={() => handleEdit(account)}>
                              <Edit size={18} />
                            </button>
                            <button className={`${styles['icon-btn']} ${styles.delete}`} onClick={() => handleDelete(account._id)}>
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
                  type="number"
                  id="account_id"
                  name="account_id"
                  className={styles['form-input']}
                  value={formData.account_id}
                  onChange={handleInputChange}
                  disabled={!editingAccount}
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
              <div className={styles['form-group']}>
                <label htmlFor="bank">Bank</label>
                <input
                  type="text"
                  id="bank"
                  name="bank"
                  className={styles['form-input']}
                  value={formData.bank}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="balance">Balance</label>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  className={styles['form-input']}
                  value={formData.balance}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
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
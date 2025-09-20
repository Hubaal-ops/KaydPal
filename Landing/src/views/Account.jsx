import React, { useState, useEffect, useRef } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  exportAccountsToExcel,
  importAccountsFromExcel,
  downloadAccountTemplate
} from '../services/accountService';

const Account = ({ onBack }) => {
  const fileInputRef = useRef(null);
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

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    const fileExt = file.name.split('.').pop().toLowerCase();
    const isValidType = validTypes.includes(file.type) || 
                       ['.xls', '.xlsx', '.csv'].includes(`.${fileExt}`);
    
    if (!isValidType) {
      setError('Invalid file type. Please upload an Excel (.xls, .xlsx) or CSV file.');
      e.target.value = ''; // Reset file input
      return;
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 5MB.');
      e.target.value = ''; // Reset file input
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const result = await importAccountsFromExcel(file);
      if (result.success) {
        setSuccess('Accounts imported successfully');
        if (result.data?.errors?.length > 0) {
          setError(`Some accounts could not be imported: ${result.data.errors.join(', ')}`);
        }
        fetchAccounts();
      } else {
        setError(result.message || 'Import failed');
      }
    } catch (err) {
      setError(err.message || 'Error importing accounts. Please check the file format and try again.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleExport = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await exportAccountsToExcel();
      setSuccess('Accounts exported successfully');
    } catch (err) {
      setError(err.message || 'Error exporting accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await downloadAccountTemplate();
      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError(err.message || 'Error downloading template');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.bank && account.bank.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={styles.categories}>
  <div className={styles['categories-header']} style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '2.5rem', color: 'var(--text-primary)', position: 'relative', width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>Accounts Management</h1>
        <p style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.9 }}>Manage business accounts</p>
      </div>
      <div className={styles['categories-content']}>
        <div className={styles['action-buttons']} style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
          <button
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
          >
            <Eye size={20} />
            View Table
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleExport}
            disabled={loading || accounts.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to Excel
          </button>
          <button
            className={styles['action-btn']}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 14 12 9 7 14"/><line x1="12" y1="9" x2="12" y2="21"/></svg>
            Import from Excel
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            Download Template
          </button>
          <button
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            Add New Account
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {viewMode === 'table' && (
          <div className={styles['table-container']} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
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
                      <tr key={account.account_id}>
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
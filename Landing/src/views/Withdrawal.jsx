import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal
} from '../services/withdrawalService';
import { getAccounts } from '../services/accountService';

const Withdrawal = ({ onBack }) => {
  const fileInputRef = React.createRef();
  // Download template handler
  const handleDownloadTemplate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch('/api/withdrawals/import/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to download template');
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'withdrawal_import_template.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1].replace(/['"]/g, '');
      }
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Received empty template file');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError(err.message || 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  // Import handler
  const [importResults, setImportResults] = useState(null);
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setImportResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/withdrawals/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: formData
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid response from server');
      }
      if (!response.ok) throw new Error(result.message || `Server responded with status ${response.status}`);
      if (result.success === true && result.data) {
        await fetchWithdrawals();
        setSuccess(result.data.message || 'Successfully imported withdrawals');
        setImportResults({
          imported: result.data.importedCount || 0,
          skipped: result.data.skippedCount || 0,
          errors: result.data.errors || [],
          message: result.data.message || ''
        });
      } else {
        throw new Error(result.message || 'Invalid response format from server');
      }
    } catch (err) {
      setError('Error importing file: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export handler
  const handleExport = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch('/api/withdrawals/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      if (!response.ok) throw new Error('Failed to export withdrawals');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `withdrawals_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setSuccess('Withdrawals exported successfully');
    } catch (err) {
      setError('Failed to export withdrawals: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [withdrawals, setWithdrawals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account: '',
    amount: ''
  });
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch withdrawals and accounts from backend
  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWithdrawals();
      setWithdrawals(data);
    } catch (err) {
      setError('Error fetching withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError('Error fetching accounts');
    }
  };

  useEffect(() => {
    fetchWithdrawals();
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
    setEditingWithdrawal(null);
    setFormData({ account: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingWithdrawal(null);
    setFormData({ account: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (withdrawal) => {
    setEditingWithdrawal(withdrawal);
    setFormData({
      account: withdrawal.account?._id || '',
      amount: withdrawal.amount
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this withdrawal?')) {
      setLoading(true);
      setError('');
      try {
        await deleteWithdrawal(id);
        setSuccess('Withdrawal deleted successfully');
        fetchWithdrawals();
      } catch (err) {
        setError('Error deleting withdrawal');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.account || !formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('Valid Account and Amount are required');
      return;
    }
    setLoading(true);
    try {
      if (editingWithdrawal) {
        await updateWithdrawal(editingWithdrawal._id, {
          account: formData.account,
          amount: Number(formData.amount)
        });
        setSuccess('Withdrawal updated successfully');
      } else {
        await createWithdrawal({
          account: formData.account,
          amount: Number(formData.amount)
        });
        setSuccess('Withdrawal added successfully');
      }
      setFormData({ account: '', amount: '' });
      setEditingWithdrawal(null);
      fetchWithdrawals();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const accountName = withdrawal.account?.name || '';
    const bank = withdrawal.account?.bank || '';
    return (
      accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.amount.toString().includes(searchTerm)
    );
  });

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Withdrawals</h1>
        <p>Manage withdrawal records and details</p>
      </div>
      <div className={styles['stores-content']}>
        <div className={styles['action-buttons']} style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
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
            Add New Withdrawal
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Template
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
            onClick={handleExport}
            disabled={loading || withdrawals.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".xlsx,.xls"
            disabled={loading}
            style={{ display: 'none' }}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {importResults && (
          <div className={styles.importResults} style={{ marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>Import Results</h4>
            <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
              <span style={{ color: '#4caf50' }}>Imported: {importResults.imported}</span>
              <span style={{ color: '#ff9800' }}>Skipped: {importResults.skipped}</span>
              <span style={{ color: '#f44336' }}>Errors: {importResults.errors.length}</span>
            </div>
            {importResults.message && <div style={{ marginBottom: 8 }}>{importResults.message}</div>}
            {importResults.errors.length > 0 && (
              <div style={{ color: '#f44336', fontSize: 13 }}>
                <strong>Errors:</strong>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {importResults.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search withdrawals..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredWithdrawals.length} withdrawals found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Bank</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map(withdrawal => (
                    <tr key={withdrawal._id}>
                      <td>{withdrawal.account?.name || ''}</td>
                      <td>{withdrawal.account?.bank || ''}</td>
                      <td>{withdrawal.amount}</td>
                      <td>{withdrawal.withdrawal_date ? new Date(withdrawal.withdrawal_date).toLocaleDateString() : ''}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(withdrawal)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(withdrawal._id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWithdrawals.length === 0 && !loading && (
                <div className={styles['no-data']}>
                  {searchTerm ? 'No withdrawals found matching your search' : 'No withdrawals found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingWithdrawal ? 'Edit Withdrawal' : 'Add New Withdrawal'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="account">Account</label>
                <select
                  id="account"
                  name="account"
                  className={styles['form-input']}
                  value={formData.account}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({acc.bank})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className={styles['form-input']}
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingWithdrawal ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdrawal; 
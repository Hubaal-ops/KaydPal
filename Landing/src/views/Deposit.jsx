import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getDeposits,
  getDepositById,
  createDeposit,
  updateDeposit,
  deleteDeposit
} from '../services/depositService';
import { getAccounts } from '../services/accountService';

const Deposit = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [deposits, setDeposits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account: '',
    amount: ''
  });
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.createRef(null);

  // Fetch deposits and accounts from backend
  const fetchDeposits = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeposits();
      setDeposits(data);
    } catch (err) {
      setError('Error fetching deposits');
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
    fetchDeposits();
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
    setEditingDeposit(null);
    setFormData({ account: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingDeposit(null);
    setFormData({ account: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (deposit) => {
    setEditingDeposit(deposit);
    setFormData({
      account: deposit.account?._id || '',
      amount: deposit.amount
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deposit?')) {
      setLoading(true);
      setError('');
      try {
        await deleteDeposit(id);
        setSuccess('Deposit deleted successfully');
        fetchDeposits();
      } catch (err) {
        setError('Error deleting deposit');
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
      if (editingDeposit) {
        await updateDeposit(editingDeposit._id, {
          account: formData.account,
          amount: Number(formData.amount)
        });
        setSuccess('Deposit updated successfully');
      } else {
        await createDeposit({
          account: formData.account,
          amount: Number(formData.amount)
        });
        setSuccess('Deposit added successfully');
      }
      setFormData({ account: '', amount: '' });
      setEditingDeposit(null);
      fetchDeposits();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving deposit');
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

  const filteredDeposits = deposits.filter(deposit => {
    const accountName = deposit.account?.name || '';
    const bank = deposit.account?.bank || '';
    return (
      accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.amount.toString().includes(searchTerm)
    );
  });

  // Handle template download
  const handleDownloadTemplate = async () => {
    setError('');
    setSuccess('');
    setIsProcessing(true);
    
    try {
      // Call the API to download the template
      const response = await fetch('/api/deposits/import/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        credentials: 'include' // Ensure cookies are sent with the request
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download template');
      }
      
      // Get the filename from the content-disposition header or use a default name
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'deposit_import_template.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Check if the blob is not empty
      if (blob.size === 0) {
        throw new Error('Received empty template file');
      }
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Template downloaded successfully');
    } catch (err) {
      const errorMessage = err.message || 'Failed to download template';
      setError(errorMessage);
      console.error('Download error:', errorMessage, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Starting import of file:', file.name, file);
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending import request...');
      const response = await fetch('/api/deposits/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: formData
      });
      
      console.log('Received response, status:', response.status);
      let result;
      try {
        result = await response.json();
        console.log('Response data:', result);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Import failed:', result);
        throw new Error(result.message || `Server responded with status ${response.status}`);
      }
      
      // First, check if we have a successful response with data
      if (result.success === true && result.data) {
        const importedCount = result.data.importedCount || 0;
        const errorCount = result.data.errors?.length || 0;
        
        console.log(`Import result - Success: ${result.success}, Imported: ${importedCount}, Errors: ${errorCount}`);
        
        // Always refresh the deposits list to ensure UI is in sync with the server
        await fetchDeposits();
        
        if (importedCount > 0) {
          // Force a state update to ensure UI reflects the changes
          setDeposits(prev => [...prev]);
          setSuccess(`Successfully imported ${importedCount} deposit(s)`);
          return; // Exit early on success
        } else if (errorCount > 0) {
          setError(`Import completed with ${errorCount} error(s). No valid deposits were imported.`);
          if (result.data.errors) {
            console.error('Detailed import errors:', result.data.errors);
          }
        } else {
          // If we get here, the import was successful but no records were imported
          console.warn('Import successful but no records were imported. Response:', result);
          setError('No valid deposits found in the file. Please check the file format and try again.');
        }
      } else {
        console.error('Unexpected response format:', result);
        throw new Error(result.message || 'Invalid response format from server');
      }
    } catch (err) {
      setError('Error importing file: ' + (err.message || 'Unknown error'));
      console.error('Import error:', err);
    } finally {
      setIsProcessing(false);
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setError('');
    setSuccess('');
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/deposits/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export deposits');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `deposits_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setSuccess(`Exported ${deposits.length} deposits successfully`);
    } catch (err) {
      setError('Failed to export deposits: ' + (err.message || 'Unknown error'));
      console.error('Export error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.categories}>
      <div className={styles['categories-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Deposits Management</h1>
        <p>Manage account deposits</p>
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
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            Add New Deposit
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleDownloadTemplate}
            disabled={isProcessing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Template
          </button>
          <button
            className={styles['action-btn']}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isProcessing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 14 12 9 7 14"/><line x1="12" y1="9" x2="12" y2="21"/></svg>
            Import from Excel
          </button>
          <button
            className={styles['action-btn']}
            onClick={handleExport}
            disabled={isProcessing || deposits.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".xlsx,.xls"
            disabled={isProcessing}
            style={{ display: 'none' }}
          />
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
                  placeholder="Search deposits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredDeposits.length} deposits found
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading deposits...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Account Name</th>
                      <th>Bank</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposits.map((deposit) => (
                      <tr key={deposit._id}>
                        <td>{deposit.deposit_id}</td>
                        <td>{deposit.account?.name || ''}</td>
                        <td>{deposit.account?.bank || ''}</td>
                        <td>{deposit.amount}</td>
                        <td>{deposit.deposit_date ? new Date(deposit.deposit_date).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button className={styles['icon-btn']} onClick={() => handleEdit(deposit)}>
                              <Edit size={18} />
                            </button>
                            <button className={`${styles['icon-btn']} ${styles.delete}`} onClick={() => handleDelete(deposit._id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDeposits.length === 0 && !loading && (
                  <div className={styles['no-data']}>No deposits found.</div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingDeposit ? 'Edit Deposit' : 'Add New Deposit'}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
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
                  {editingDeposit ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit; 
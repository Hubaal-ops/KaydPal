import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Download, Upload, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  importTransfers,
  exportTransfers,
  downloadTransferTemplate
} from '../services/transferService';
import { getAccounts } from '../services/accountService';

const Transfer = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [transfers, setTransfers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    from_account: '',
    to_account: '',
    amount: '',
    description: ''
  });
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.createRef(null);

  // Fetch transfers and accounts from backend
  const fetchTransfers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTransfers();
      setTransfers(data);
    } catch (err) {
      setError('Error fetching transfers');
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
    fetchTransfers();
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
    setEditingTransfer(null);
    setFormData({ from_account: '', to_account: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingTransfer(null);
    setFormData({ from_account: '', to_account: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      from_account: transfer.from_account?._id || '',
      to_account: transfer.to_account?._id || '',
      amount: transfer.amount,
      description: transfer.description || ''
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transfer?')) {
      setLoading(true);
      setError('');
      try {
        await deleteTransfer(id);
        setSuccess('Transfer deleted successfully');
        fetchTransfers();
      } catch (err) {
        setError('Error deleting transfer');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.from_account || !formData.to_account || !formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('All fields except description are required and must be valid');
      return;
    }
    if (formData.from_account === formData.to_account) {
      setError('Cannot transfer to the same account');
      return;
    }
    setLoading(true);
    try {
      if (editingTransfer) {
        await updateTransfer(editingTransfer._id, {
          from_account: formData.from_account,
          to_account: formData.to_account,
          amount: Number(formData.amount),
          description: formData.description
        });
        setSuccess('Transfer updated successfully');
      } else {
        await createTransfer({
          from_account: formData.from_account,
          to_account: formData.to_account,
          amount: Number(formData.amount),
          description: formData.description
        });
        setSuccess('Transfer added successfully');
      }
      setFormData({ from_account: '', to_account: '', amount: '', description: '' });
      setEditingTransfer(null);
      fetchTransfers();
      setTimeout(() => {
        setViewMode('table');
      }, 1200);
    } catch (err) {
      setError('Error saving transfer');
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

  const filteredTransfers = transfers.filter(transfer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fromName = transfer.from_account?.name?.toLowerCase() || '';
    const toName = transfer.to_account?.name?.toLowerCase() || '';
    const fromBank = transfer.from_account?.bank?.toLowerCase() || '';
    const toBank = transfer.to_account?.bank?.toLowerCase() || '';
    const description = (transfer.description || '').toLowerCase();
    const amount = transfer.amount?.toString() || '';
    const transferId = transfer.transfer_id?.toString().toLowerCase() || '';
    
    return (
      fromName.includes(searchLower) ||
      toName.includes(searchLower) ||
      fromBank.includes(searchLower) ||
      toBank.includes(searchLower) ||
      description.includes(searchLower) ||
      amount.includes(searchLower) ||
      transferId.includes(searchLower) ||
      (transfer.transfer_date && new Date(transfer.transfer_date).toLocaleDateString().includes(searchLower))
    );
  });

  // Handle template download
  const handleDownloadTemplate = async () => {
    setError('');
    setSuccess('');
    setIsProcessing(true);
    
    try {
      await downloadTransferTemplate();
      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError('Error downloading template: ' + (err.message || 'Unknown error'));
      console.error('Download error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file import
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      await importTransfers(file);
      setSuccess('Transfers imported successfully');
      fetchTransfers(); // Refresh the transfers list
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

  // Handle export
  const handleExport = async (format = 'xlsx') => {
    setError('');
    setSuccess('');
    setIsProcessing(true);
    
    try {
      await exportTransfers(format);
      setSuccess(`Transfers exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      setError('Error exporting transfers: ' + (err.message || 'Unknown error'));
      console.error('Export error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Financial
        </button>
        <h1>Transfers</h1>
        <p>Manage fund transfers between accounts</p>
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
              <div className={styles.buttonGroup}>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`${styles.iconButton} ${styles.importButton}`}
                  disabled={isProcessing}
                  title="Import transfers"
                >
                  <Upload size={16} />
                  <span>Import</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileImport}
                  />
                </button>
                <button 
                  onClick={handleDownloadTemplate} 
                  className={`${styles.iconButton} ${styles.templateButton}`}
                  disabled={isProcessing}
                  title="Download import template"
                >
                  <FileText size={16} />
                  <span>Template</span>
                </button>
                <div className={styles.dropdown}>
                  <button 
                    className={`${styles.iconButton} ${styles.exportButton}`}
                    disabled={isProcessing}
                    title="Export transfers"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                  <div className={styles.dropdownContent}>
                    <button onClick={() => handleExport('xlsx')}>Export as XLSX</button>
                    <button onClick={() => handleExport('csv')}>Export as CSV</button>
                  </div>
                </div>
              </div>
            </div>
            {loading ? (
              <div className={styles.loading}>Loading transfers...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>From Account</th>
                      <th>To Account</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((transfer) => (
                      <tr key={transfer._id}>
                        <td>{transfer.transfer_id}</td>
                        <td>
                          <div className={styles['account-cell']}>
                            <div className={styles['account-name']}>{transfer.from_account?.name || 'N/A'}</div>
                            {transfer.from_account?.bank && (
                              <div className={styles['account-bank']}>{transfer.from_account.bank}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles['account-cell']}>
                            <div className={styles['account-name']}>{transfer.to_account?.name || 'N/A'}</div>
                            {transfer.to_account?.bank && (
                              <div className={styles['account-bank']}>{transfer.to_account.bank}</div>
                            )}
                          </div>
                        </td>
                        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transfer.amount)}</td>
                        <td className={styles['description-cell']}>{transfer.description || '-'}</td>
                        <td>{transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button 
                              className={styles['icon-btn']} 
                              onClick={() => handleEdit(transfer)}
                              title="Edit transfer"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className={`${styles['icon-btn']} ${styles.delete}`} 
                              onClick={() => handleDelete(transfer._id)}
                              title="Delete transfer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransfers.length === 0 && !loading && (
                  <div className={styles['no-data']}>
                    No transfers found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingTransfer ? 'Edit Transfer' : 'Add New Transfer'}</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label htmlFor="from_account">From Account</label>
                <select
                  id="from_account"
                  name="from_account"
                  className={styles['form-input']}
                  value={formData.from_account}
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
                <label htmlFor="to_account">To Account</label>
                <select
                  id="to_account"
                  name="to_account"
                  className={styles['form-input']}
                  value={formData.to_account}
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
              <div className={styles['form-group']}>
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className={styles['form-input']}
                  value={formData.description}
                  onChange={handleInputChange}
                  maxLength={200}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" className={styles['cancel-btn']} onClick={handleViewTable}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingTransfer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transfer; 
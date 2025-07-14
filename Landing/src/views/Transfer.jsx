import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Transfer = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [transfers, setTransfers] = useState([
    {
      transfer_id: 1,
      from_account: 'Main Account',
      to_account: 'Savings Account',
      amount: 500,
      description: 'Monthly savings',
      date: '2024-06-01T10:00:00Z'
    },
    {
      transfer_id: 2,
      from_account: 'Main Account',
      to_account: 'Petty Cash',
      amount: 100,
      description: 'Office petty cash',
      date: '2024-06-02T12:30:00Z'
    }
  ]);
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

  const handleEdit = (tr) => {
    setEditingTransfer(tr);
    setFormData({
      from_account: tr.from_account,
      to_account: tr.to_account,
      amount: tr.amount,
      description: tr.description
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
    if (!formData.from_account.trim() || !formData.to_account.trim() || !formData.amount) {
      setError('All fields are required');
      return;
    }
    if (editingTransfer) {
      setTransfers(prev => prev.map(tr =>
        tr.transfer_id === editingTransfer.transfer_id ? { ...tr, ...formData } : tr
      ));
      setSuccess('Transfer updated successfully');
    } else {
      const newTr = {
        transfer_id: Math.max(...transfers.map(t => t.transfer_id), 0) + 1,
        ...formData,
        date: new Date().toISOString()
      };
      setTransfers(prev => [...prev, newTr]);
      setSuccess('Transfer added successfully');
    }
    setFormData({ from_account: '', to_account: '', amount: '', description: '' });
    setEditingTransfer(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredTransfers = transfers.filter(tr =>
    tr.from_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.to_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>From Account</th>
                    <th>To Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map(tr => (
                    <tr key={tr.transfer_id}>
                      <td>{tr.transfer_id}</td>
                      <td>{tr.from_account}</td>
                      <td>{tr.to_account}</td>
                      <td>{tr.amount}</td>
                      <td>{tr.description}</td>
                      <td>{new Date(tr.date).toLocaleDateString()}</td>
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
              <div className={styles['form-group']}>
                <label htmlFor="from_account">From Account *</label>
                <input
                  type="text"
                  id="from_account"
                  name="from_account"
                  value={formData.from_account}
                  onChange={handleInputChange}
                  placeholder="Enter source account"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="to_account">To Account *</label>
                <input
                  type="text"
                  id="to_account"
                  name="to_account"
                  value={formData.to_account}
                  onChange={handleInputChange}
                  placeholder="Enter destination account"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  required
                  className={styles['form-input']}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
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

export default Transfer; 
import React, { useState } from 'react';
import styles from './Stores.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Withdrawal = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [withdrawals, setWithdrawals] = useState([
    {
      withdrawal_id: 1,
      account: 'Main Account',
      amount: 200,
      description: 'Office supplies',
      date: '2024-06-01T10:00:00Z'
    },
    {
      withdrawal_id: 2,
      account: 'Petty Cash',
      amount: 50,
      description: 'Snacks',
      date: '2024-06-02T12:30:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account: '',
    amount: '',
    description: ''
  });
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
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
    setEditingWithdrawal(null);
    setFormData({ account: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingWithdrawal(null);
    setFormData({ account: '', amount: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (wd) => {
    setEditingWithdrawal(wd);
    setFormData({
      account: wd.account,
      amount: wd.amount,
      description: wd.description
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (withdrawal_id) => {
    if (window.confirm('Are you sure you want to delete this withdrawal?')) {
      setWithdrawals(prev => prev.filter(wd => wd.withdrawal_id !== withdrawal_id));
      setSuccess('Withdrawal deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.account.trim() || !formData.amount) {
      setError('All fields are required');
      return;
    }
    if (editingWithdrawal) {
      setWithdrawals(prev => prev.map(wd =>
        wd.withdrawal_id === editingWithdrawal.withdrawal_id ? { ...wd, ...formData } : wd
      ));
      setSuccess('Withdrawal updated successfully');
    } else {
      const newWd = {
        withdrawal_id: Math.max(...withdrawals.map(w => w.withdrawal_id), 0) + 1,
        ...formData,
        date: new Date().toISOString()
      };
      setWithdrawals(prev => [...prev, newWd]);
      setSuccess('Withdrawal added successfully');
    }
    setFormData({ account: '', amount: '', description: '' });
    setEditingWithdrawal(null);
    setTimeout(() => setViewMode('table'), 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredWithdrawals = withdrawals.filter(wd =>
    wd.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wd.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className={styles['action-buttons']}>
          <button className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`} onClick={handleViewTable}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`} onClick={handleAddNew}>
            <Plus size={20} />
            Add New Withdrawal
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
                    <th>Withdrawal ID</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map(wd => (
                    <tr key={wd.withdrawal_id}>
                      <td>{wd.withdrawal_id}</td>
                      <td>{wd.account}</td>
                      <td>{wd.amount}</td>
                      <td>{wd.description}</td>
                      <td>{new Date(wd.date).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(wd)} className={styles['icon-btn']} title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(wd.withdrawal_id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWithdrawals.length === 0 && (
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
                <label htmlFor="account">Account *</label>
                <input
                  type="text"
                  id="account"
                  name="account"
                  value={formData.account}
                  onChange={handleInputChange}
                  placeholder="Enter account name"
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
                  {editingWithdrawal ? 'Update Withdrawal' : 'Add Withdrawal'}
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
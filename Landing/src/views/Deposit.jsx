import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Deposit = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table');
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    account_id: '',
    amount: ''
  });
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for demonstration
  const mockDeposits = [
    {
      deposit_id: 1,
      account_id: 'ACC001',
      amount: 500,
      deposit_date: '2024-01-15T10:30:00Z'
    },
    {
      deposit_id: 2,
      account_id: 'ACC002',
      amount: 1200,
      deposit_date: '2024-01-16T14:20:00Z'
    },
    {
      deposit_id: 3,
      account_id: 'ACC003',
      amount: 300,
      deposit_date: '2024-01-17T09:15:00Z'
    }
  ];

  // Simulate API call
  const fetchDeposits = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDeposits(mockDeposits);
    } catch (error) {
      setError('Error fetching deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
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
    setFormData({ account_id: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingDeposit(null);
    setFormData({ account_id: '', amount: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (deposit) => {
    setEditingDeposit(deposit);
    setFormData({
      account_id: deposit.account_id,
      amount: deposit.amount
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (depositId) => {
    if (window.confirm('Are you sure you want to delete this deposit?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setDeposits(prev => prev.filter(dep => dep.deposit_id !== depositId));
        setSuccess('Deposit deleted successfully');
      } catch (error) {
        setError('Error deleting deposit');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.account_id.trim() || !formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      setError('Valid Account ID and Amount are required');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (editingDeposit) {
        setDeposits(prev => prev.map(dep =>
          dep.deposit_id === editingDeposit.deposit_id
            ? { ...dep, ...formData, amount: Number(formData.amount) }
            : dep
        ));
        setSuccess('Deposit updated successfully');
      } else {
        const newDeposit = {
          deposit_id: deposits.length ? Math.max(...deposits.map(d => d.deposit_id)) + 1 : 1,
          account_id: formData.account_id,
          amount: Number(formData.amount),
          deposit_date: new Date().toISOString()
        };
        setDeposits(prev => [...prev, newDeposit]);
        setSuccess('Deposit added successfully');
      }
      setFormData({ account_id: '', amount: '' });
      setEditingDeposit(null);
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving deposit');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredDeposits = deposits.filter(deposit =>
    deposit.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.amount.toString().includes(searchTerm)
  );

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
            Add New Deposit
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
                      <th>Deposit ID</th>
                      <th>Account ID</th>
                      <th>Amount</th>
                      <th>Deposit Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposits.map((deposit) => (
                      <tr key={deposit.deposit_id}>
                        <td>{deposit.deposit_id}</td>
                        <td>{deposit.account_id}</td>
                        <td>{deposit.amount}</td>
                        <td>{new Date(deposit.deposit_date).toLocaleDateString()}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button className={styles['icon-btn']} onClick={() => handleEdit(deposit)}>
                              <Edit size={18} />
                            </button>
                            <button className={`${styles['icon-btn']} ${styles.delete}`} onClick={() => handleDelete(deposit.deposit_id)}>
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
                <label htmlFor="account_id">Account ID</label>
                <input
                  type="text"
                  id="account_id"
                  name="account_id"
                  className={styles['form-input']}
                  value={formData.account_id}
                  onChange={handleInputChange}
                  required
                />
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
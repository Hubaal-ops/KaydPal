import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
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
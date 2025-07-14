import React, { useState, useEffect } from 'react';
import styles from './payment_in.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';

const PaymentIn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ customer_id: '', account_id: '', amount: 0 });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data
  const mockCustomers = [
    { customer_no: 1, customer_name: 'Alice Smith' },
    { customer_no: 2, customer_name: 'Bob Johnson' }
  ];
  const mockAccounts = [
    { account_id: 1, account_name: 'Cash' },
    { account_id: 2, account_name: 'Bank' }
  ];
  const mockPayments = [
    { id: 1, customer_id: 1, account_id: 1, amount: 500, created_at: '2024-07-13T10:30:00Z', customer_name: 'Alice Smith', account_name: 'Cash' },
    { id: 2, customer_id: 2, account_id: 2, amount: 300, created_at: '2024-07-13T11:00:00Z', customer_name: 'Bob Johnson', account_name: 'Bank' }
  ];

  useEffect(() => {
    setCustomers(mockCustomers);
    setAccounts(mockAccounts);
    setPayments(mockPayments);
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditing(null);
    setForm({ customer_id: '', account_id: '', amount: 0 });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditing(null);
    setForm({ customer_id: '', account_id: '', amount: 0 });
    setError('');
    setSuccess('');
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ customer_id: p.customer_id, account_id: p.account_id, amount: p.amount });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = (id) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    setSuccess('Payment deleted');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.customer_id || !form.account_id || form.amount <= 0) {
      setError('All fields required and amount > 0');
      return;
    }
    const customer = customers.find(c => c.customer_no === parseInt(form.customer_id));
    const account = accounts.find(a => a.account_id === parseInt(form.account_id));
    if (editing) {
      setPayments(prev => prev.map(p => p.id === editing.id ? { ...p, ...form, customer_name: customer.customer_name, account_name: account.account_name } : p));
      setSuccess('Payment updated');
    } else {
      const newId = Math.max(0, ...payments.map(p => p.id)) + 1;
      setPayments(prev => [...prev, { id: newId, ...form, customer_name: customer.customer_name, account_name: account.account_name, created_at: new Date().toISOString() }]);
      setSuccess('Payment added');
    }
    setForm({ customer_id: '', account_id: '', amount: 0 });
    setEditing(null);
    setTimeout(() => setViewMode('table'), 1200);
  };

  const filtered = payments.filter(p =>
    (p.customer_name && p.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.paymentin}>
      <div className={styles['top-header']}>
        <button className={styles['back-to-main']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Payments
        </button>
        <div className={styles['title-section']}>
          <h1 className={styles['main-title']}>Payment In Management</h1>
          <p className={styles['subtitle']}>Manage incoming customer payments</p>
        </div>
      </div>
      <div className={styles['center-actions']}>
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
          Add New Payment In
        </button>
      </div>
      <div className={styles['content']}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filtered.length} payments found
              </div>
            </div>
            <div className={styles['table-wrapper']}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.customer_name}</td>
                      <td>{p.account_name}</td>
                      <td>{p.amount}</td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className={styles['action-icons']}>
                          <button onClick={() => handleEdit(p)} className={styles['icon-btn']} title="Edit"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className={styles['no-data']}>No payments found</div>}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editing ? 'Edit Payment In' : 'Add Payment In'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label>Customer *</label>
                <select name="customer_id" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} required className={styles['form-select']}>
                  <option value="">Select a customer</option>
                  {customers.map(c => <option key={c.customer_no} value={c.customer_no}>{c.customer_name}</option>)}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Account *</label>
                <select name="account_id" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} required className={styles['form-select']}>
                  <option value="">Select an account</option>
                  {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Amount *</label>
                <input type="number" name="amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="1" required className={styles['form-input']} />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentIn; 
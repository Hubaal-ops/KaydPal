import React, { useState, useEffect } from 'react';
import styles from './payment_out.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';

const PaymentOut = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ supplier_no: '', account_id: '', amount: 0, description: '' });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data
  const mockSuppliers = [
    { supplier_no: 1, supplier_name: 'Tech Supplies Inc.' },
    { supplier_no: 2, supplier_name: 'Global Footwear' }
  ];
  const mockAccounts = [
    { account_id: 1, account_name: 'Cash' },
    { account_id: 2, account_name: 'Bank' }
  ];
  const mockPayments = [
    { id: 1, supplier_no: 1, account_id: 1, amount: 400, description: 'Partial payment', created_at: '2024-07-13T12:00:00Z', supplier_name: 'Tech Supplies Inc.', account_name: 'Cash' },
    { id: 2, supplier_no: 2, account_id: 2, amount: 200, description: 'Advance', created_at: '2024-07-13T13:00:00Z', supplier_name: 'Global Footwear', account_name: 'Bank' }
  ];

  useEffect(() => {
    setSuppliers(mockSuppliers);
    setAccounts(mockAccounts);
    setPayments(mockPayments);
  }, []);

  const handleViewTable = () => {
    setViewMode('table');
    setEditing(null);
    setForm({ supplier_no: '', account_id: '', amount: 0, description: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditing(null);
    setForm({ supplier_no: '', account_id: '', amount: 0, description: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({ supplier_no: p.supplier_no, account_id: p.account_id, amount: p.amount, description: p.description });
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
    if (!form.supplier_no || !form.account_id || form.amount <= 0) {
      setError('All fields required and amount > 0');
      return;
    }
    const supplier = suppliers.find(s => s.supplier_no === parseInt(form.supplier_no));
    const account = accounts.find(a => a.account_id === parseInt(form.account_id));
    if (editing) {
      setPayments(prev => prev.map(p => p.id === editing.id ? { ...p, ...form, supplier_name: supplier.supplier_name, account_name: account.account_name } : p));
      setSuccess('Payment updated');
    } else {
      const newId = Math.max(0, ...payments.map(p => p.id)) + 1;
      setPayments(prev => [...prev, { id: newId, ...form, supplier_name: supplier.supplier_name, account_name: account.account_name, created_at: new Date().toISOString() }]);
      setSuccess('Payment added');
    }
    setForm({ supplier_no: '', account_id: '', amount: 0, description: '' });
    setEditing(null);
    setTimeout(() => setViewMode('table'), 1200);
  };

  const filtered = payments.filter(p =>
    (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.paymentout}>
      <div className={styles['top-header']}>
        <button className={styles['back-to-main']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Payments
        </button>
        <div className={styles['title-section']}>
          <h1 className={styles['main-title']}>Payment Out Management</h1>
          <p className={styles['subtitle']}>Manage outgoing supplier payments</p>
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
          Add New Payment Out
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
                    <th>Supplier</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.supplier_name}</td>
                      <td>{p.account_name}</td>
                      <td>{p.amount}</td>
                      <td>{p.description}</td>
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
            <h2>{editing ? 'Edit Payment Out' : 'Add Payment Out'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label>Supplier *</label>
                <select name="supplier_no" value={form.supplier_no} onChange={e => setForm(f => ({ ...f, supplier_no: e.target.value }))} required className={styles['form-select']}>
                  <option value="">Select a supplier</option>
                  {suppliers.map(s => <option key={s.supplier_no} value={s.supplier_no}>{s.supplier_name}</option>)}
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
              <div className={styles['form-group']}>
                <label>Description</label>
                <input type="text" name="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={styles['form-input']} />
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

export default PaymentOut; 
import React, { useState, useEffect } from 'react';
import styles from './payment_out.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { getPaymentsOut, createPaymentOut, updatePaymentOut, deletePaymentOut } from '../services/paymentOutService';
import { getSuppliers } from '../services/supplierService';
import { getAccounts } from '../services/accountService';

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
  const [loading, setLoading] = useState(false);

  // Fetch suppliers, accounts, and payments on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [supp, acc, pays] = await Promise.all([
          getSuppliers(),
          getAccounts(),
          getPaymentsOut()
        ]);
        setSuppliers(supp);
        setAccounts(acc);
        setPayments(pays);
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleDelete = async (id) => {
    setLoading(true);
    setError('');
    try {
      await deletePaymentOut(id);
      setSuccess('Payment deleted');
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Error deleting payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.supplier_no || !form.account_id || form.amount <= 0) {
      setError('All fields required and amount > 0');
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updatePaymentOut(editing.id, form);
        setSuccess('Payment updated');
      } else {
        await createPaymentOut(form);
        setSuccess('Payment added');
      }
      // Refresh payments
      const pays = await getPaymentsOut();
      setPayments(pays);
      setForm({ supplier_no: '', account_id: '', amount: 0, description: '' });
      setEditing(null);
      setTimeout(() => setViewMode('table'), 1200);
    } catch (err) {
      setError('Error saving payment');
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(p => {
    const supplier = suppliers.find(s => s.supplier_no === p.supplier_no);
    return supplier && supplier.name && supplier.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={styles.paymentout}>
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
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        {viewMode === 'table' && !loading && (
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
                  {filtered.map(p => {
                    const supplier = suppliers.find(s => s.supplier_no === p.supplier_no);
                    const account = accounts.find(a => a.account_id === p.account_id);
                    return (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{supplier ? supplier.name || supplier.supplier_name : p.supplier_no}</td>
                        <td>{account ? (account.account_name || account.bank || account.name) : p.account_id}</td>
                        <td>{p.amount}</td>
                        <td>{p.description}</td>
                        <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button onClick={() => handleEdit(p)} className={styles['icon-btn']} title="Edit"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(p.id)} className={`${styles['icon-btn']} ${styles.delete}`} title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className={styles['no-data']}>No payments found</div>}
            </div>
          </div>
        )}
        {viewMode === 'form' && !loading && (
          <div className={styles['form-container']}>
            <h2 className={styles['main-title']}>{editing ? 'Edit Payment Out' : 'Add Payment Out'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label>Supplier *</label>
                <select name="supplier_no" value={form.supplier_no || ''} onChange={e => setForm(f => ({ ...f, supplier_no: Number(e.target.value) }))} required className={styles['form-select']}>
                  <option value="">Select a supplier</option>
                  {suppliers.map(s => <option key={s.supplier_no || s._id} value={s.supplier_no}>{s.name || s.supplier_name}</option>)}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Account *</label>
                <select name="account_id" value={form.account_id || ''} onChange={e => setForm(f => ({ ...f, account_id: Number(e.target.value) }))} required className={styles['form-select']}>
                  <option value="">Select an account</option>
                  {accounts.map(a => <option key={a.account_id || a._id} value={a.account_id}>{a.account_name || a.bank || a.name}</option>)}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Amount *</label>
                <input type="number" name="amount" value={form.amount !== undefined ? form.amount : ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} min="1" required className={styles['form-input']} />
              </div>
              <div className={styles['form-group']}>
                <label>Description</label>
                <input type="text" name="description" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={styles['form-input']} />
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
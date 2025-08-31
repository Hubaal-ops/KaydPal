import React, { useState, useEffect } from 'react';
import styles from './payment_in.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search, Receipt as ReceiptIcon } from 'lucide-react';
import { getPayments, getPaymentById, createPayment, updatePayment, deletePayment, generateReceiptData, generateReceiptFromBackend } from '../services/paymentService';
import { getCustomers } from '../services/customerService';
import { getAccounts } from '../services/accountService';
import Receipt from '../components/Receipt';

const PaymentIn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ customer_id: '', account_id: '', amount: 0 });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Fetch customers and accounts on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [cust, acc, pays] = await Promise.all([
          getCustomers(),
          getAccounts(),
          getPayments()
        ]);
        setCustomers(cust);
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

  const handleDelete = async (id) => {
    setLoading(true);
    setError('');
    try {
      await deletePayment(id);
      setSuccess('Payment deleted');
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Error deleting payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReceipt = async (payment) => {
    try {
      // Try backend receipt generation first
      try {
        const backendReceipt = await generateReceiptFromBackend(payment.id);
        setReceiptData({
          payment: backendReceipt.payment,
          customer: backendReceipt.customer,
          account: backendReceipt.account,
          receiptNumber: backendReceipt.receiptNumber,
          generatedAt: backendReceipt.generatedAt
        });
        setShowReceipt(true);
        return;
      } catch (backendError) {
        console.log('Backend receipt generation failed, trying frontend:', backendError.message);
      }
      
      // Fallback to frontend generation
      const receiptInfo = await generateReceiptData(payment, customers, accounts);
      setReceiptData(receiptInfo);
      setShowReceipt(true);
    } catch (err) {
      setError('Error generating receipt: ' + err.message);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.customer_id || !form.account_id || form.amount <= 0) {
      setError('All fields required and amount > 0');
      return;
    }
    setLoading(true);
    try {
      let paymentResult;
      if (editing) {
        paymentResult = await updatePayment(editing.id, form);
        setSuccess('Payment updated');
      } else {
        paymentResult = await createPayment(form);
        setSuccess('Payment added successfully!');
      }
      
      // Refresh payments
      const pays = await getPayments();
      console.log('Fetched payments:', pays); // Debug log
      setPayments(pays);
      
      // Generate receipt for new payment
      if (!editing && paymentResult) {
        try {
          let receiptInfo;
          // Check if the backend already provided receipt data
          if (paymentResult.receipt) {
            receiptInfo = {
              payment: paymentResult.data || paymentResult.receipt.payment,
              customer: paymentResult.receipt.customer,
              account: paymentResult.receipt.account,
              receiptNumber: paymentResult.receipt.receiptNumber,
              generatedAt: new Date().toISOString()
            };
          } else {
            // Fallback to frontend generation
            receiptInfo = await generateReceiptData(paymentResult.data || paymentResult, customers, accounts);
          }
          setReceiptData(receiptInfo);
          setShowReceipt(true);
        } catch (receiptErr) {
          console.log('Receipt generation error:', receiptErr);
          // Don't show error for receipt generation failure
        }
      }
      
      setForm({ customer_id: '', account_id: '', amount: 0 });
      setEditing(null);
      
      if (!showReceipt) {
        setTimeout(() => setViewMode('table'), 1200);
      }
    } catch (err) {
      setError('Error saving payment');
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(p => {
    const customer = customers.find(c => c.customer_no === p.customer_id);
    return customer && customer.name && customer.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={styles.paymentin}>
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
        {loading && <div className={styles.loading}>Loading...</div>}
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
                    <th>Customer</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const customer = customers.find(c => c.customer_no === p.customer_id);
                    const account = accounts.find(a => a.account_id === p.account_id);
                    return (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{customer ? customer.name : p.customer_id}</td>
                        <td>{account ? (account.account_name || account.bank || account.name) : p.account_id}</td>
                        <td>{p.amount}</td>
                        <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button 
                              onClick={() => handleGenerateReceipt(p)} 
                              className={styles['icon-btn']} 
                              title="Generate Receipt"
                            >
                              <ReceiptIcon size={16} />
                            </button>
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
            <h2>{editing ? 'Edit Payment In' : 'Add Payment In'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label>Customer *</label>
                <select
                  name="customer_id"
                  value={form.customer_id || ''}
                  onChange={e => setForm(f => ({ ...f, customer_id: Number(e.target.value) }))}
                  required
                  className={styles['form-select']}
                >
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.customer_no} value={c.customer_no}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Account *</label>
                <select
                  name="account_id"
                  value={form.account_id || ''}
                  onChange={e => setForm(f => ({ ...f, account_id: Number(e.target.value) }))}
                  required
                  className={styles['form-select']}
                >
                  <option value="">Select an account</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>{a.account_name || a.bank || a.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles['form-group']}>
                <label>Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount !== undefined ? form.amount : ''}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  min="1"
                  required
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editing ? 'Update' : 'Add'} Payment
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Receipt Component */}
      {showReceipt && receiptData && (
        <Receipt
          payment={receiptData.payment}
          customer={receiptData.customer}
          account={receiptData.account}
          onClose={handleCloseReceipt}
          onPrint={() => {
            setSuccess('Receipt printed successfully!');
            setTimeout(() => {
              setShowReceipt(false);
              setReceiptData(null);
              setViewMode('table');
            }, 1500);
          }}
        />
      )}
    </div>
  );
};

export default PaymentIn; 
import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/invoiceService';
import { Eye, Search } from 'lucide-react';
import styles from './Sales.module.css';

const InvoiceList = ({ onView }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    getInvoices()
      .then(setInvoices)
      .catch(err => setError(err.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const filteredInvoices = invoices.filter(inv =>
    (inv.customer?.name && inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (String(inv.invoice_no).includes(searchTerm))
  );

  return (
    <div className={styles['table-container']}>
      <div className={styles['table-header']}>
        <div className={styles['search-container']}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles['search-input']}
          />
        </div>
        <div className={styles['table-info']}>
          {filteredInvoices.length} invoices found
        </div>
      </div>
      {loading ? (
        <div className={styles.loading}>Loading invoices...</div>
      ) : error ? (
        <div style={{color:'red'}}>{error}</div>
      ) : (
        <div className={styles['table-wrapper']}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv._id}>
                  <td>{inv.invoice_no}</td>
                  <td>{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</td>
                  <td>{inv.customer?.name || ''}</td>
                  <td>{inv.total?.toFixed(2)}</td>
                  <td>{inv.status}</td>
                  <td>
                    <button onClick={() => onView(inv)} className={styles['icon-btn']} title="View"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className={styles['no-data']}>
              {searchTerm ? 'No invoices found matching your search' : 'No invoices found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceList; 
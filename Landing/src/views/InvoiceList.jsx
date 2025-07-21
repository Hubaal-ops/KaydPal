import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/invoiceService';
import { Eye } from 'lucide-react';

const InvoiceList = ({ onView }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getInvoices()
      .then(setInvoices)
      .catch(err => setError(err.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <div>
      <h2>Invoices</h2>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
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
          {invoices.map(inv => (
            <tr key={inv._id}>
              <td>{inv.invoice_no}</td>
              <td>{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</td>
              <td>{inv.customer?.name || ''}</td>
              <td>{inv.total?.toFixed(2)}</td>
              <td>{inv.status}</td>
              <td>
                <button onClick={() => onView(inv)} title="View"><Eye size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList; 
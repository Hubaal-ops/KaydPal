import React, { useState } from 'react';
import salesStyles from './Sales.module.css';
import returnStyles from './SalesReturn.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';

const dummyReturns = [
  {
    return_no: 1,
    product: 'Product A',
    customer: 'Customer X',
    store: 'Main Store',
    qty: 2,
    price: 100,
    amount: 200,
    paid: 200,
    reason: 'Damaged',
    date: '2024-07-01',
  },
  {
    return_no: 2,
    product: 'Product B',
    customer: 'Customer Y',
    store: 'Branch',
    qty: 1,
    price: 150,
    amount: 150,
    paid: 150,
    reason: 'Wrong item',
    date: '2024-07-02',
  },
];

const SalesReturn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [returns] = useState(dummyReturns);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = returns.filter(r =>
    r.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={salesStyles.sales}>
      <div className={salesStyles['sales-header']}>
        <button className={salesStyles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Sales Return Management</h1>
        <p>Manage and record product sales returns</p>
      </div>
      <div className={salesStyles['sales-content']}>
        <div className={salesStyles['action-buttons']}>
          <button className={`${salesStyles['action-btn']} ${viewMode === 'table' ? salesStyles.active : ''}`} onClick={() => setViewMode('table')}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${salesStyles['action-btn']} ${viewMode === 'form' ? salesStyles.active : ''}`} onClick={() => setViewMode('form')}>
            <Plus size={20} />
            Add New Return
          </button>
        </div>
        {viewMode === 'table' && (
          <div className={salesStyles['table-container']}>
            <div className={salesStyles['table-header']}>
              <div className={salesStyles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={salesStyles['search-input']}
                />
              </div>
              <div className={salesStyles['table-info']}>
                {filteredReturns.length} returns found
              </div>
            </div>
            <div className={salesStyles['table-wrapper']}>
              <table className={salesStyles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Store</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map(r => (
                    <tr key={r.return_no}>
                      <td>{r.return_no}</td>
                      <td>{r.product}</td>
                      <td>{r.customer}</td>
                      <td>{r.store}</td>
                      <td>{r.qty}</td>
                      <td>{r.price}</td>
                      <td>{r.amount}</td>
                      <td>{r.paid}</td>
                      <td>{r.reason}</td>
                      <td>{r.date}</td>
                      <td>
                        <div className={returnStyles.actionIcons}>
                          <button className={returnStyles.iconBtn} title="Edit"><Edit size={16} /></button>
                          <button className={`${returnStyles.iconBtn} ${returnStyles.delete}`} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReturns.length === 0 && (
                <div className={salesStyles['no-data']}>
                  {searchTerm ? 'No returns found matching your search' : 'No returns found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={salesStyles['form-container']}>
            <h2>Add/Edit Sales Return (Dummy Form)</h2>
            <p>Form coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReturn; 
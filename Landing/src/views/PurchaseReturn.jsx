import React, { useState } from 'react';
import purchasesStyles from './Purchases.module.css';
import returnStyles from './PurchaseReturn.module.css';
import { Plus, Eye, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';

const dummyReturns = [
  {
    return_no: 1,
    product: 'Product X',
    supplier: 'Supplier A',
    store: 'Main Store',
    qty: 5,
    price: 80,
    amount: 400,
    paid: 400,
    reason: 'Overstock',
    date: '2024-07-03',
  },
  {
    return_no: 2,
    product: 'Product Y',
    supplier: 'Supplier B',
    store: 'Branch',
    qty: 2,
    price: 120,
    amount: 240,
    paid: 240,
    reason: 'Defective',
    date: '2024-07-04',
  },
];

const PurchaseReturn = ({ onBack }) => {
  const [viewMode, setViewMode] = useState('table');
  const [returns] = useState(dummyReturns);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = returns.filter(r =>
    r.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={purchasesStyles.purchases}>
      <div className={purchasesStyles['purchases-header']}>
        <button className={purchasesStyles['back-button']} onClick={onBack}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Purchase Return Management</h1>
        <p>Manage and record product purchase returns</p>
      </div>
      <div className={purchasesStyles['purchases-content']}>
        <div className={purchasesStyles['action-buttons']}>
          <button className={`${purchasesStyles['action-btn']} ${viewMode === 'table' ? purchasesStyles.active : ''}`} onClick={() => setViewMode('table')}>
            <Eye size={20} />
            View Table
          </button>
          <button className={`${purchasesStyles['action-btn']} ${viewMode === 'form' ? purchasesStyles.active : ''}`} onClick={() => setViewMode('form')}>
            <Plus size={20} />
            Add New Return
          </button>
        </div>
        {viewMode === 'table' && (
          <div className={purchasesStyles['table-container']}>
            <div className={purchasesStyles['table-header']}>
              <div className={purchasesStyles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={purchasesStyles['search-input']}
                />
              </div>
              <div className={purchasesStyles['table-info']}>
                {filteredReturns.length} returns found
              </div>
            </div>
            <div className={purchasesStyles['table-wrapper']}>
              <table className={purchasesStyles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Supplier</th>
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
                      <td>{r.supplier}</td>
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
                <div className={purchasesStyles['no-data']}>
                  {searchTerm ? 'No returns found matching your search' : 'No returns found'}
                </div>
              )}
            </div>
          </div>
        )}
        {viewMode === 'form' && (
          <div className={purchasesStyles['form-container']}>
            <h2>Add/Edit Purchase Return (Dummy Form)</h2>
            <p>Form coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturn; 
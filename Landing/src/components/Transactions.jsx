import React, { useState } from 'react';
import { ShoppingCart, FileText, CreditCard, ArrowLeft, RotateCcw, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Purchases from '../views/Purchases';
import Sales from '../views/Sales';
import SalesReturn from '../views/SalesReturn';
import PurchaseReturn from '../views/PurchaseReturn';
import styles from './Transactions.module.css';

const Transactions = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(null); // 'sales', 'purchases', 'payments', 'salesReturn', 'purchaseReturn', or null

  const transactionModules = [
    {
      id: 'sales',
      title: 'Sales',
      description: 'View and manage sales transactions',
      icon: ShoppingCart,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'purchases',
      title: 'Purchases',
      description: 'Track and manage purchase transactions',
      icon: FileText,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Handle payment records and details',
      icon: CreditCard,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'salesReturn',
      title: 'Sales Return',
      description: 'Manage sales return transactions',
      icon: RotateCcw,
      color: '#f59e42',
      gradient: 'linear-gradient(135deg, #f59e42 0%, #b45309 100%)'
    },
    {
      id: 'purchaseReturn',
      title: 'Purchase Return',
      description: 'Manage purchase return transactions',
      icon: RotateCw,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    if (moduleId === 'sales') {
      setActiveModule('sales');
    } else if (moduleId === 'purchases') {
      setActiveModule('purchases');
    } else if (moduleId === 'payments') {
      navigate('/payments');
    } else if (moduleId === 'salesReturn') {
      setActiveModule('salesReturn');
    } else if (moduleId === 'purchaseReturn') {
      setActiveModule('purchaseReturn');
    }
  };

  const handleBackClick = () => {
    setActiveModule(null);
  };

  return (
    <div className={styles.transactions}>
      <div className={styles['transactions-header']}>
        {!activeModule && (
          <>
            <button className={styles['back-button']} onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1>Transactions</h1>
            <p>Manage your sales, purchases, and payments</p>
          </>
        )}
      </div>
      <div className={styles['transactions-content']}>
        {activeModule === 'sales' ? (
          <div className={styles.sales} style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <Sales onBack={handleBackClick} />
          </div>
        ) : activeModule === 'purchases' ? (
          <div className={styles.sales} style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <Purchases onBack={handleBackClick} />
          </div>
        ) : activeModule === 'salesReturn' ? (
          <div className={styles.sales} style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <SalesReturn onBack={handleBackClick} />
          </div>
        ) : activeModule === 'purchaseReturn' ? (
          <div className={styles.sales} style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <PurchaseReturn onBack={handleBackClick} />
          </div>
        ) : (
          <div className={styles['modules-grid']}>
            {transactionModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  className={styles['module-card']}
                  onClick={() => handleCardClick(module.id)}
                  style={{ '--card-gradient': module.gradient }}
                >
                  <div className={styles['card-header']}>
                    <div className={styles['icon-container']} style={{ backgroundColor: module.color }}>
                      <IconComponent size={32} color="white" />
                    </div>
                    <h3>{module.title}</h3>
                  </div>
                  <p className={styles['card-description']}>{module.description}</p>
                  <div className={styles['card-footer']}>
                    <span className={styles['access-text']}>Click to access</span>
                    <div className={styles['arrow-icon']}>→</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions; 
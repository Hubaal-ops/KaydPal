import React from 'react';
import styles from './Financial.module.css';
import { Banknote, ArrowDownCircle, ArrowUpCircle, Repeat, List, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Financial = () => {
  const navigate = useNavigate();

  const financialModules = [
    {
      id: 'accounts',
      title: 'Accounts',
      description: 'Manage business accounts and balances',
      icon: Banknote,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'deposits',
      title: 'Deposits',
      description: 'Track and manage deposit transactions',
      icon: ArrowDownCircle,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'withdrawals',
      title: 'Withdrawals',
      description: 'Handle withdrawal records and details',
      icon: ArrowUpCircle,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    },
    {
      id: 'transfers',
      title: 'Transfers',
      description: 'Manage fund transfers between accounts',
      icon: Repeat,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'expense-category',
      title: 'Expense Category',
      description: 'Organize and manage expense categories',
      icon: List,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Track and manage business expenses',
      icon: FileText,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    console.log(`Navigating to ${moduleId} module`);
    // Navigation logic for each module can be added here
  };

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.financial}>
      <div className={styles['financial-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Financial</h1>
        <p>Manage accounts, deposits, withdrawals, transfers, and expenses</p>
      </div>
      <div className={styles['financial-content']}>
        <div className={styles['modules-grid']}>
          {financialModules.map((module) => {
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
      </div>
    </div>
  );
};

export default Financial; 
import React from 'react';
import styles from './Payments.module.css';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Payments = () => {
  const navigate = useNavigate();

  const paymentModules = [
    {
      id: 'payment-in',
      title: 'Payment-in',
      description: 'Record and manage incoming payments',
      icon: ArrowDownCircle,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'payment-out',
      title: 'Payment-out',
      description: 'Record and manage outgoing payments',
      icon: ArrowUpCircle,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    console.log(`Navigating to ${moduleId} module`);
    // Navigation logic for each module can be added here
  };

  const handleBackClick = () => {
    navigate('/transactions');
  };

  return (
    <div className={styles.payments}>
      <div className={styles['payments-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Transactions
        </button>
        <h1>Payments</h1>
        <p>Manage incoming and outgoing payments</p>
      </div>
      <div className={styles['payments-content']}>
        <div className={styles['modules-grid']}>
          {paymentModules.map((module) => {
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

export default Payments; 
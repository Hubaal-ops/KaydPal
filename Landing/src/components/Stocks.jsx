import React from 'react';
import styles from './Stocks.module.css';
import { SlidersHorizontal, Repeat2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Stocks = () => {
  const navigate = useNavigate();

  const stockModules = [
    {
      id: 'stock-adjustment',
      title: 'Stock Adjustment',
      description: 'Adjust inventory levels for products',
      icon: SlidersHorizontal,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'stock-transfer',
      title: 'Stock Transfer',
      description: 'Transfer stock between stores or warehouses',
      icon: Repeat2,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    navigate(`/stocks/${moduleId}`);
  };

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.stocks}>
      <div className={styles['stocks-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Stocks</h1>
        <p>Manage stock adjustments and transfers</p>
      </div>
      <div className={styles['stocks-content']}>
        <div className={styles['modules-grid']}>
          {stockModules.map((module) => {
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

export default Stocks; 
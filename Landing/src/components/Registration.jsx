import React, { useState } from 'react';
import styles from './Transactions.module.css';
import { User, Building2, ArrowLeft } from 'lucide-react';
import Customer from '../views/Customer';
import Supplier from '../views/Supplier';

const Registration = ({ onBack }) => {
  const [activeModule, setActiveModule] = useState(null); // 'customer' or 'supplier'

  const registrationModules = [
    {
      id: 'customer',
      title: 'Customer',
      description: 'Register and manage customers',
      icon: User,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'supplier',
      title: 'Supplier',
      description: 'Register and manage suppliers',
      icon: Building2,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
      disabled: false
    }
  ];

  const handleCardClick = (moduleId, disabled) => {
    if (!disabled) setActiveModule(moduleId);
  };

  const handleBackClick = () => {
    setActiveModule(null);
  };

  // Back to Inventory or previous page
  const handleMainBack = () => {
    if (onBack) onBack();
    // else: you can add navigation logic here
  };

  return (
    <div className={styles.transactions}>
      {/* Only show Registration header/back when not inside a module */}
      {!activeModule && (
        <div className={styles['transactions-header']}>
          <button className={styles['back-button']} onClick={handleMainBack}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Registration</h1>
          <p>Register and manage customers and suppliers</p>
        </div>
      )}
      <div className={styles['transactions-content']}>
        {activeModule === 'customer' ? (
          <Customer onBack={handleBackClick} />
        ) : activeModule === 'supplier' ? (
          <Supplier onBack={handleBackClick} />
        ) : (
          <div className={styles['modules-grid']}>
            {registrationModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  className={styles['module-card']}
                  onClick={() => handleCardClick(module.id, module.disabled)}
                  style={{
                    '--card-gradient': module.gradient,
                    opacity: module.disabled ? 0.5 : 1,
                    cursor: module.disabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div className={styles['card-header']}>
                    <div className={styles['icon-container']} style={{ backgroundColor: module.color }}>
                      <IconComponent size={32} color="white" />
                    </div>
                    <h3>{module.title}</h3>
                  </div>
                  <p className={styles['card-description']}>{module.description}</p>
                  <div className={styles['card-footer']}>
                    <span className={styles['access-text']}>
                      {module.disabled ? 'Unavailable' : 'Click to access'}
                    </span>
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

export default Registration;

import React from 'react';
import styles from './Employees.module.css';
import { Users, BadgeDollarSign, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Employees = () => {
  const navigate = useNavigate();

  const employeeModules = [
    {
      id: 'employees',
      title: 'Employees',
      description: 'Manage staff, roles, and permissions',
      icon: Users,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      id: 'salaries',
      title: 'Salaries',
      description: 'Manage and track employee salaries',
      icon: BadgeDollarSign,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    if (moduleId === 'employees') {
      navigate('/employees/employees');
    } else if (moduleId === 'salaries') {
      navigate('/employees/salaries');
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.employees}>
      <div className={styles['employees-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Employees</h1>
        <p>Manage employees and their salaries</p>
      </div>
      <div className={styles['employees-content']}>
        <div className={styles['modules-grid']}>
          {employeeModules.map((module) => {
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

export default Employees; 
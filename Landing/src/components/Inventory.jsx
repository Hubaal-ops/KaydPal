import React from 'react';
import styles from './Inventory.module.css';
import { 
  Package, 
  Tags, 
  Store, 
  PackageCheck,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
  const navigate = useNavigate();

  const inventoryModules = [
    {
      id: 'category',
      title: 'Categories',
      description: 'Manage product categories and classifications',
      icon: Tags,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Add, edit, and manage product information',
      icon: Package,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
    },
    {
      id: 'stores',
      title: 'Stores',
      description: 'Manage store locations and information',
      icon: Store,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'store-product',
      title: 'Store Products',
      description: 'Manage product inventory across stores',
      icon: PackageCheck,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  ];

  const handleCardClick = (moduleId) => {
    console.log(`Navigating to ${moduleId} module`);
    // Here you would typically navigate to the specific module page
    // For now, we'll just log the action
  };

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.inventory}>
      <div className={styles['inventory-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Inventory Management</h1>
        <p>Manage your inventory, products, and store operations</p>
      </div>
      
      <div className={styles['inventory-content']}>
        <div className={styles['modules-grid']}>
          {inventoryModules.map((module) => {
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

export default Inventory; 
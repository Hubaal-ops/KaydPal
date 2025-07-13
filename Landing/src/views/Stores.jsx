import React, { useState, useEffect } from 'react';
import styles from './Stores.module.css';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Stores = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    store_name: '',
    location: '',
    manager: ''
  });
  const [editingStore, setEditingStore] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for demonstration
  const mockStores = [
    {
      store_no: 1,
      store_name: 'Main Street Store',
      location: '123 Main St, Springfield',
      manager: 'John Doe',
      total_items: 45,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      store_no: 2,
      store_name: 'Downtown Branch',
      location: '456 Oak Ave, Downtown',
      manager: 'Jane Smith',
      total_items: 32,
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      store_no: 3,
      store_name: 'Mall Location',
      location: '789 Shopping Mall, Westside',
      manager: 'Mike Johnson',
      total_items: 28,
      created_at: '2024-01-17T09:15:00Z'
    }
  ];

  // Simulate API call for stores
  const fetchStores = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStores(mockStores);
    } catch (error) {
      setError('Error fetching stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/inventory');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setEditingStore(null);
    setFormData({ store_name: '', location: '', manager: '' });
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setEditingStore(null);
    setFormData({ store_name: '', location: '', manager: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      store_name: store.store_name,
      location: store.location,
      manager: store.manager
    });
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (storeNo) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Remove from local state
        setStores(prev => prev.filter(store => store.store_no !== storeNo));
        setSuccess('Store deleted successfully');
      } catch (error) {
        setError('Error deleting store');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.store_name.trim()) {
      setError('Store name is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    if (!formData.manager.trim()) {
      setError('Manager is required');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingStore) {
        // Update existing store
        setStores(prev => prev.map(store => 
          store.store_no === editingStore.store_no 
            ? { ...store, ...formData }
            : store
        ));
        setSuccess('Store updated successfully');
      } else {
        // Add new store
        const newStore = {
          store_no: Math.max(...stores.map(s => s.store_no)) + 1,
          store_name: formData.store_name,
          location: formData.location,
          manager: formData.manager,
          total_items: 0,
          created_at: new Date().toISOString()
        };
        setStores(prev => [...prev, newStore]);
        setSuccess('Store added successfully');
      }
      
      setFormData({ store_name: '', location: '', manager: '' });
      setEditingStore(null);
      
      // Auto-switch to table view after successful submission
      setTimeout(() => {
        setViewMode('table');
      }, 1500);
    } catch (error) {
      setError('Error saving store');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.stores}>
      <div className={styles['stores-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Inventory
        </button>
        <h1>Stores Management</h1>
        <p>Manage store locations and information</p>
      </div>

      <div className={styles['stores-content']}>
        {/* Action Buttons */}
        <div className={styles['action-buttons']}>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
          >
            <Eye size={20} />
            View Table
          </button>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            Add New Store
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['table-header']}>
              <div className={styles['search-container']}>
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['search-input']}
                />
              </div>
              <div className={styles['table-info']}>
                {filteredStores.length} stores found
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading stores...</div>
            ) : (
              <div className={styles['table-wrapper']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Store No</th>
                      <th>Store Name</th>
                      <th>Location</th>
                      <th>Manager</th>
                      <th>Total Items</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr key={store.store_no}>
                        <td>{store.store_no}</td>
                        <td>{store.store_name}</td>
                        <td>{store.location}</td>
                        <td>{store.manager}</td>
                        <td>{store.total_items}</td>
                        <td>{new Date(store.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className={styles['action-icons']}>
                            <button
                              onClick={() => handleEdit(store)}
                              className={styles['icon-btn']}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(store.store_no)}
                              className={`${styles['icon-btn']} ${styles.delete}`}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStores.length === 0 && (
                  <div className={styles['no-data']}>
                    {searchTerm ? 'No stores found matching your search' : 'No stores found'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Form View */}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{editingStore ? 'Edit Store' : 'Add New Store'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-group']}>
                <label htmlFor="store_name">Store Name *</label>
                <input
                  type="text"
                  id="store_name"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  placeholder="Enter store name"
                  required
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter store location"
                  required
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="manager">Manager *</label>
                <input
                  type="text"
                  id="manager"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  placeholder="Enter manager name"
                  required
                  className={styles['form-input']}
                />
              </div>

              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']}>
                  {editingStore ? 'Update Store' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores; 
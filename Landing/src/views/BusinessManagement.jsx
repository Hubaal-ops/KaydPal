import React, { useState, useEffect, useRef } from 'react';
import styles from './BusinessManagement.module.css';
import { 
  Building,
  ArrowLeft,
  Eye,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBusinessInfo, createBusinessInfo, updateBusinessInfo } from '../services/businessService';

const BusinessManagement = ({ onBack }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'form'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Business form data
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    logo: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    registrationNumber: ''
  });

  // Load business info on component mount
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await getBusinessInfo();
        if (response.success) {
          setBusinessInfo(response.data);
          setBusinessFormData({
            name: response.data.name || '',
            logo: response.data.logo || '',
            address: response.data.address || '',
            city: response.data.city || '',
            state: response.data.state || '',
            zipCode: response.data.zipCode || '',
            country: response.data.country || '',
            phone: response.data.phone || '',
            email: response.data.email || '',
            website: response.data.website || '',
            taxId: response.data.taxId || '',
            registrationNumber: response.data.registrationNumber || ''
          });
        }
      } catch (err) {
        // Business info not found, which is okay
        console.log('Business info not found, creating new');
      }
    };

    fetchBusinessInfo();
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };

  const handleViewTable = () => {
    setViewMode('table');
    setError('');
    setSuccess('');
  };

  const handleAddNew = () => {
    setViewMode('form');
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload for logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real application, you would upload the file to a server
      // For now, we'll just create a local URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessFormData(prev => ({
          ...prev,
          logo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Handle business form submission
      if (!businessFormData.name.trim()) {
        setError('Business name is required');
        setLoading(false);
        return;
      }

      let response;
      if (businessInfo) {
        // Update existing business info
        response = await updateBusinessInfo(businessFormData);
      } else {
        // Create new business info
        response = await createBusinessInfo(businessFormData);
      }

      if (response.success) {
        setSuccess('Business information saved successfully');
        setBusinessInfo(response.data);
        // Auto-switch to table view after successful submission
        setTimeout(() => {
          setViewMode('table');
        }, 1500);
      } else {
        setError(response.message || 'Failed to save business information');
      }
    } catch (error) {
      setError(`Error saving business information: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.businessManagement}>
      <div className={styles['business-header']}>
        <button className={styles['back-button']} onClick={handleBackClick}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Business Management</h1>
        <p>Manage your business information</p>
      </div>

      <div className={styles['business-content']}>
        {/* Action Buttons */}
        <div className={styles['action-buttons']}>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={handleViewTable}
          >
            <Eye size={20} />
            View Business Info
          </button>
          <button 
            className={`${styles['action-btn']} ${viewMode === 'form' ? styles.active : ''}`}
            onClick={handleAddNew}
          >
            <Plus size={20} />
            {businessInfo ? 'Edit Business Info' : 'Add Business Info'}
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Business Info View */}
        {viewMode === 'table' && (
          <div className={styles['table-container']}>
            <div className={styles['business-info-card']}>
              <h3>Business Information</h3>
              {businessInfo ? (
                <div className={styles['business-info-details']}>
                  {businessInfo.logo && (
                    <div className={styles['business-logo']}>
                      <img src={businessInfo.logo} alt="Business Logo" />
                    </div>
                  )}
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Business Name:</span>
                    <span>{businessInfo.name}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Address:</span>
                    <span>{businessInfo.address}, {businessInfo.city}, {businessInfo.state} {businessInfo.zipCode}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Phone:</span>
                    <span>{businessInfo.phone}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Email:</span>
                    <span>{businessInfo.email}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Website:</span>
                    <span>{businessInfo.website}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Tax ID:</span>
                    <span>{businessInfo.taxId}</span>
                  </div>
                  <div className={styles['business-info-row']}>
                    <span className={styles['business-info-label']}>Registration Number:</span>
                    <span>{businessInfo.registrationNumber}</span>
                  </div>
                </div>
              ) : (
                <p>No business information registered yet.</p>
              )}
              <button 
                className={styles['edit-business-btn']}
                onClick={handleAddNew}
              >
                {businessInfo ? 'Edit Business Info' : 'Add Business Info'}
              </button>
            </div>
          </div>
        )}

        {/* Business Form View */}
        {viewMode === 'form' && (
          <div className={styles['form-container']}>
            <h2>{businessInfo ? 'Edit Business Information' : 'Add Business Information'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="name">Business Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={businessFormData.name}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                    required
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="logo">Logo</label>
                  <div className={styles['logo-upload-container']}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className={styles['logo-upload-btn']}
                      onClick={triggerFileInput}
                    >
                      Choose File
                    </button>
                    {businessFormData.logo && (
                      <div className={styles['logo-preview']}>
                        <img src={businessFormData.logo} alt="Logo Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={businessFormData.address}
                  onChange={handleInputChange}
                  placeholder="Enter street address"
                />
              </div>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={businessFormData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={businessFormData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={businessFormData.zipCode}
                    onChange={handleInputChange}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={businessFormData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                />
              </div>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={businessFormData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={businessFormData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={businessFormData.website}
                  onChange={handleInputChange}
                  placeholder="Enter website URL"
                />
              </div>

              <div className={styles['form-row']}>
                <div className={styles['form-group']}>
                  <label htmlFor="taxId">Tax ID</label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={businessFormData.taxId}
                    onChange={handleInputChange}
                    placeholder="Enter tax identification number"
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="registrationNumber">Registration Number</label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={businessFormData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="Enter business registration number"
                  />
                </div>
              </div>

              <div className={styles['form-actions']}>
                <button type="button" onClick={handleViewTable} className={styles['cancel-btn']} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className={styles['submit-btn']} disabled={loading}>
                  {businessInfo ? 'Update' : 'Save'} Business Information
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessManagement;
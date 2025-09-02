const API_URL = '/api/business';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/*
 * Business Service
 * Provides methods for managing business information
 */

// Get business information for the current user
export const getBusinessInfo = async () => {
  try {
    const response = await fetch(API_URL, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch business information');
    return response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch business information');
  }
};

// Create business information for the current user
export const createBusinessInfo = async (businessData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(businessData)
    });
    if (!response.ok) throw new Error('Failed to create business information');
    return response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to create business information');
  }
};

// Update business information for the current user
export const updateBusinessInfo = async (businessData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(businessData)
    });
    if (!response.ok) throw new Error('Failed to update business information');
    return response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to update business information');
  }
};

export default {
  getBusinessInfo,
  createBusinessInfo,
  updateBusinessInfo
};
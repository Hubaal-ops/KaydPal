const API_URL = '/api/categories';

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Request failed');
    error.status = response.status;
    error.errors = errorData.errors;
    throw error;
  }

  // For DELETE requests that might not return content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Get all categories
export const getCategories = async () => {
  try {
    const data = await apiRequest('/');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get single category
export const getCategory = async (id) => {
  try {
    const data = await apiRequest(`/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Error fetching category with id ${id}:`, error);
    throw error;
  }
};

// Create category
export const createCategory = async (categoryData) => {
  try {
    const data = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return data.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update category
export const updateCategory = async (id, categoryData) => {
  try {
    const data = await apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return data.data;
  } catch (error) {
    console.error(`Error updating category with id ${id}:`, error);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (id) => {
  try {
    await apiRequest(`/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    throw error;
  }
};

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};

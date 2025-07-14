const API_URL = '/api/products';

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

// Get all products
export const getProducts = async () => {
  try {
    const data = await apiRequest('/');
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get single product
export const getProduct = async (id) => {
  try {
    const data = await apiRequest(`/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
};

// Create product
export const createProduct = async (productData) => {
  try {
    const data = await apiRequest('/', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return data.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const data = await apiRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return data.data;
  } catch (error) {
    console.error(`Error updating product with id ${id}:`, error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    await apiRequest(`/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`Error deleting product with id ${id}:`, error);
    throw error;
  }
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};

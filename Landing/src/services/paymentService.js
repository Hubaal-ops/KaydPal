const API_URL = '/api/payments';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export async function getPayments() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const data = await res.json();
  return data.data || [];
}

export async function getPaymentById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch payment');
  return res.json();
}

export async function createPayment(payment) {
  const { customer_id, account_id, amount } = payment;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customer_id, account_id, amount })
  });
  if (!res.ok) throw new Error('Failed to create payment');
  return res.json();
}

export async function updatePayment(id, payment) {
  const { customer_id, account_id, amount } = payment;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ customer_id, account_id, amount })
  });
  if (!res.ok) throw new Error('Failed to update payment');
  return res.json();
}

export async function deletePayment(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete payment');
  return res.json();
}

// Generate receipt data for a payment
export async function generateReceiptData(payment, customers, accounts) {
  try {
    // Try to use the backend endpoint first
    const res = await fetch(`${API_URL}/${payment.id}/receipt-data`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        return {
          payment: result.data.payment,
          customer: result.data.customer,
          account: result.data.account,
          receiptNumber: result.data.receiptNumber,
          businessInfo: result.data.businessInfo,
          generatedAt: new Date().toISOString()
        };
      }
    }
    
    // Fallback to frontend generation if backend fails
    const customer = customers.find(c => c.customer_no === payment.customer_id);
    const account = accounts.find(a => a.account_id === payment.account_id);
    
    if (!customer || !account) {
      throw new Error('Customer or account information not found');
    }
    
    return {
      payment,
      customer,
      account,
      receiptNumber: `RCP-${String(payment.id).padStart(6, '0')}`,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error('Failed to generate receipt data: ' + error.message);
  }
}

// Generate receipt from backend
export async function generateReceiptFromBackend(paymentId) {
  try {
    const res = await fetch(`${API_URL}/${paymentId}/receipt`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to generate receipt');
    const result = await res.json();
    if (result.success) {
      return result.receipt;
    }
    throw new Error('Receipt generation failed');
  } catch (error) {
    throw new Error('Failed to generate receipt: ' + error.message);
  }
} 
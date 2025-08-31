import React from 'react';
import styles from './Receipt.module.css';

const Receipt = ({ payment, customer, account, onClose, onPrint }) => {
  if (!payment || !customer || !account) return null;

  const receiptDate = new Date(payment.created_at).toLocaleDateString();
  const receiptTime = new Date(payment.created_at).toLocaleTimeString();
  const receiptNumber = `RCP-${String(payment.id).padStart(6, '0')}`;

  const handlePrint = () => {
    window.print();
    if (onPrint) onPrint();
  };

  return (
    <div className={styles.receiptOverlay}>
      <div className={`${styles.receiptContainer} receipt-detail`}>
        <div className={styles.receiptHeader}>
          <h1>Payment Receipt</h1>
          <div className={styles.receiptNumber}>
            Receipt #: {receiptNumber}
          </div>
        </div>

        <div className={styles.businessInfo}>
          <h2>KaydPal Business Management</h2>
          <p>123 Business Street</p>
          <p>City, State 12345</p>
          <p>Phone: (555) 123-4567</p>
          <p>Email: info@kaydpal.com</p>
        </div>

        <div className={styles.receiptDetails}>
          <div className={styles.detailsRow}>
            <div className={styles.detailsSection}>
              <h3>Receipt Details</h3>
              <p><strong>Date:</strong> {receiptDate}</p>
              <p><strong>Time:</strong> {receiptTime}</p>
              <p><strong>Receipt #:</strong> {receiptNumber}</p>
            </div>
            
            <div className={styles.detailsSection}>
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> {customer.name}</p>
              <p><strong>Customer ID:</strong> {customer.customer_no}</p>
              {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
              {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
            </div>
          </div>
        </div>

        <div className={styles.paymentSummary}>
          <h3>Payment Summary</h3>
          <div className={styles.summaryTable}>
            <div className={styles.summaryRow}>
              <span>Payment Amount:</span>
              <span className={styles.amount}>${parseFloat(payment.amount).toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Payment Method:</span>
              <span>{account.account_name || account.bank || 'Cash'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Account:</span>
              <span>{account.account_name || account.bank}</span>
            </div>
            {customer.balance !== undefined && (
              <>
                <div className={styles.summaryDivider}></div>
                <div className={styles.summaryRow}>
                  <span>Previous Balance:</span>
                  <span>${(parseFloat(customer.balance) + parseFloat(payment.amount)).toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Payment Applied:</span>
                  <span>-${parseFloat(payment.amount).toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow} style={{ fontWeight: 'bold' }}>
                  <span>Remaining Balance:</span>
                  <span className={customer.balance > 0 ? styles.balanceDue : styles.balancePaid}>
                    ${parseFloat(customer.balance).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.thankYouMessage}>
          <h3>Thank You!</h3>
          <p>We appreciate your business and prompt payment.</p>
          {customer.balance > 0 && (
            <p className={styles.balanceNote}>
              Your remaining balance is ${parseFloat(customer.balance).toFixed(2)}
            </p>
          )}
          {customer.balance <= 0 && (
            <p className={styles.paidNote}>
              Your account is fully paid. Thank you!
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <p>This is a computer-generated receipt.</p>
          <p>For any questions, please contact us at info@kaydpal.com</p>
        </div>

        <div className={`${styles.actions} ${styles.noPrint}`}>
          <button onClick={handlePrint} className={styles.printBtn}>
            Print Receipt
          </button>
          <button onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
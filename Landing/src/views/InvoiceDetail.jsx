import React from 'react';
import jsPDF from 'jspdf';

function downloadPDF(invoice) {
  const doc = new jsPDF();
  let y = 15;
  
  // Add business logo if available
  if (invoice.businessInfo && invoice.businessInfo.logo) {
    try {
      const logoWidth = 40;
      const logoHeight = 25;
      // Position logo at top center
      doc.addImage(invoice.businessInfo.logo, 'JPEG', (doc.internal.pageSize.width - logoWidth) / 2, y, logoWidth, logoHeight);
      y += logoHeight + 5;
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
      // Continue without logo if there's an error
    }
  }
  
  // Add business info at the top
  if (invoice.businessInfo) {
    doc.setFontSize(16);
    doc.text(invoice.businessInfo.name || 'KaydPal Business Management', 105, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(10);
    if (invoice.businessInfo.address || invoice.businessInfo.city || invoice.businessInfo.state || invoice.businessInfo.zipCode) {
      const addressParts = [invoice.businessInfo.address, invoice.businessInfo.city, invoice.businessInfo.state, invoice.businessInfo.zipCode].filter(Boolean);
      if (addressParts.length > 0) {
        doc.text(addressParts.join(', '), 105, y, { align: 'center' });
        y += 5;
      }
    }
    
    if (invoice.businessInfo.phone) {
      doc.text(`Phone: ${invoice.businessInfo.phone}`, 105, y, { align: 'center' });
      y += 5;
    }
    
    if (invoice.businessInfo.email) {
      doc.text(`Email: ${invoice.businessInfo.email}`, 105, y, { align: 'center' });
      y += 5;
    }
    
    if (invoice.businessInfo.website) {
      doc.text(`Website: ${invoice.businessInfo.website}`, 105, y, { align: 'center' });
      y += 5;
    }
    
    y += 5; // Add some space
  }
  
  doc.setFontSize(16);
  doc.text(`Invoice #${invoice.invoice_no}`, 105, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}`, 10, y);
  doc.text(`Status: ${invoice.status}`, 150, y, { align: 'right' });
  y += 10;
  
  // Customer information
  doc.text('Bill To:', 10, y);
  y += 5;
  doc.text(invoice.customer?.name || '', 10, y);
  y += 5;
  if (invoice.customer?.address) {
    doc.text(invoice.customer.address, 10, y);
    y += 5;
  }
  if (invoice.customer?.phone) {
    doc.text(`Phone: ${invoice.customer.phone}`, 10, y);
    y += 5;
  }
  if (invoice.customer?.email) {
    doc.text(`Email: ${invoice.customer.email}`, 10, y);
    y += 5;
  }
  
  y += 10;
  doc.text('Items:', 10, y);
  y += 5;
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y, 190, 7, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Product', 12, y + 5);
  doc.text('Qty', 80, y + 5);
  doc.text('Price', 100, y + 5);
  doc.text('Discount', 125, y + 5);
  doc.text('Tax', 150, y + 5);
  doc.text('Subtotal', 175, y + 5);
  y += 10;
  
  // Table rows
  invoice.items?.forEach(item => {
    const productName = item.product_name || item.name || `Product #${item.product_no}` || 'Unknown Product';
    
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(String(productName).substring(0, 30), 12, y);
    doc.text(String(item.qty), 80, y);
    doc.text(String(item.price?.toFixed(2)), 100, y);
    doc.text(String(item.discount?.toFixed(2)), 125, y);
    doc.text(String(item.tax?.toFixed(2)), 150, y);
    doc.text(String(item.subtotal?.toFixed(2)), 175, y);
    y += 7;
  });
  
  y += 10;
  
  // Summary
  doc.line(120, y, 200, y);
  y += 5;
  doc.text(`Subtotal:`, 150, y);
  doc.text(`$${invoice.subtotal?.toFixed(2)}`, 190, y, { align: 'right' });
  y += 7;
  
  doc.text(`Total Discount:`, 150, y);
  doc.text(`$${invoice.total_discount?.toFixed(2)}`, 190, y, { align: 'right' });
  y += 7;
  
  doc.text(`Total Tax:`, 150, y);
  doc.text(`$${invoice.total_tax?.toFixed(2)}`, 190, y, { align: 'right' });
  y += 7;
  
  doc.setFontSize(12);
  doc.text(`Total:`, 150, y);
  doc.text(`$${invoice.total?.toFixed(2)}`, 190, y, { align: 'right' });
  y += 7;
  
  doc.setFontSize(10);
  doc.text(`Paid:`, 150, y);
  doc.text(`$${invoice.paid?.toFixed(2)}`, 190, y, { align: 'right' });
  y += 7;
  
  doc.text(`Balance Due:`, 150, y);
  doc.text(`$${invoice.balance_due?.toFixed(2)}`, 190, y, { align: 'right' });
  
  // Notes
  if (invoice.notes) {
    y += 15;
    doc.text(`Notes:`, 10, y);
    y += 5;
    doc.text(invoice.notes, 10, y);
  }
  
  // Footer
  y = 280;
  doc.setFontSize(8);
  doc.text('This is a computer-generated invoice.', 105, y, { align: 'center' });
  
  doc.save(`Invoice_${invoice.invoice_no}.pdf`);
}

const InvoiceDetail = ({ invoice, onBack }) => {
  if (!invoice) return null;
  return (
    <div style={{maxWidth:700,margin:'0 auto',background:'#fff',padding:32,borderRadius:12,boxShadow:'0 4px 24px #0002',fontFamily:'Segoe UI,Arial,sans-serif'}} className="invoice-detail">
      {/* Print-specific styles for clarity and print-only invoice */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-detail, .invoice-detail * {
            visibility: visible !important;
          }
          .invoice-detail {
            position: absolute !important;
            left: 0; top: 0; width: 100vw; min-height: 100vh;
            margin: 0 !important; padding: 0 !important; box-shadow: none !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        /* Ensure buttons are visible on screen */
        .no-print button {
          display: inline-block !important;
          opacity: 1 !important;
        }
        .business-logo {
          text-align: center;
          margin-bottom: 16px;
        }
        .business-logo img {
          max-width: 120px;
          max-height: 80px;
          object-fit: contain;
        }
        .business-info {
          text-align: center;
          margin-bottom: 24px;
          color: #444;
          font-size: 0.9em;
        }
      `}</style>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <button onClick={onBack} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}} className="no-print">Back to Invoices</button>
        <div style={{display:'flex',gap:12}} className="no-print">
          <button onClick={()=>window.print()} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}}>Print</button>
          <button onClick={()=>downloadPDF(invoice)} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}}>Download PDF</button>
        </div>
      </div>
      
      {/* Business Information with Logo */}
      {invoice.businessInfo && (
        <>
          {invoice.businessInfo.logo && (
            <div className="business-logo">
              <img src={invoice.businessInfo.logo} alt={`${invoice.businessInfo.name} Logo`} />
            </div>
          )}
          <div className="business-info">
            <h3 style={{margin:'0 0 8px 0',fontSize:'1.2em'}}>{invoice.businessInfo.name}</h3>
            {(invoice.businessInfo.address || invoice.businessInfo.city || invoice.businessInfo.state || invoice.businessInfo.zipCode) && (
              <p style={{margin:'0 0 4px 0'}}>
                {[invoice.businessInfo.address, invoice.businessInfo.city, invoice.businessInfo.state, invoice.businessInfo.zipCode].filter(Boolean).join(', ')}
              </p>
            )}
            {invoice.businessInfo.phone && <p style={{margin:'0 0 4px 0'}}>Phone: {invoice.businessInfo.phone}</p>}
            {invoice.businessInfo.email && <p style={{margin:'0 0 4px 0'}}>Email: {invoice.businessInfo.email}</p>}
            {invoice.businessInfo.website && <p style={{margin:'0 0 4px 0'}}>Website: {invoice.businessInfo.website}</p>}
          </div>
        </>
      )}
      
      <h2 style={{textAlign:'center',marginBottom:8}}>Invoice #{invoice.invoice_no}</h2>
      <div style={{textAlign:'center',color:'#222',marginBottom:24}}>
        <span>Date: {invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}</span> &nbsp;|&nbsp; <span>Status: {invoice.status}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <b>Customer</b><br/>
          {invoice.customer?.name || invoice.customer_name}<br/>
          {invoice.customer?.address && <>{invoice.customer.address}<br/></>}
          {invoice.customer?.phone && <>{invoice.customer.phone}<br/></>}
          {invoice.customer?.email && <>{invoice.customer.email}<br/></>}
        </div>
        <div style={{textAlign:'right'}}>
          <b>Invoice Total</b><br/>
          <span style={{fontSize:'1.5em',fontWeight:700}}>${invoice.total?.toFixed(2)}</span>
        </div>
      </div>
      <table style={{width:'100%',marginBottom:24,borderCollapse:'collapse',background:'#fafbfc'}}>
        <thead>
          <tr style={{background:'#f5f7fa'}}>
            <th style={{padding:'8px',textAlign:'left'}}>Product</th>
            <th style={{padding:'8px',textAlign:'right'}}>Qty</th>
            <th style={{padding:'8px',textAlign:'right'}}>Price</th>
            <th style={{padding:'8px',textAlign:'right'}}>Discount</th>
            <th style={{padding:'8px',textAlign:'right'}}>Tax</th>
            <th style={{padding:'8px',textAlign:'right'}}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item,i) => (
            <tr key={i}>
              <td style={{padding:'8px',borderTop:'1px solid #eee'}}>{item.product_name || item.name || `Product #${item.product_no}` || 'Unknown Product'}</td>
              <td style={{padding:'8px',borderTop:'1px solid #eee',textAlign:'right'}}>{item.qty}</td>
              <td style={{padding:'8px',borderTop:'1px solid #eee',textAlign:'right'}}>{item.price?.toFixed(2)}</td>
              <td style={{padding:'8px',borderTop:'1px solid #eee',textAlign:'right'}}>{item.discount?.toFixed(2)}</td>
              <td style={{padding:'8px',borderTop:'1px solid #eee',textAlign:'right'}}>{item.tax?.toFixed(2)}</td>
              <td style={{padding:'8px',borderTop:'1px solid #eee',textAlign:'right'}}>{item.subtotal?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:'flex',justifyContent:'flex-end',gap:32,marginBottom:8}}>
        <div style={{minWidth:180}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span>Subtotal:</span>
            <span>${invoice.subtotal?.toFixed(2)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span>Total Discount:</span>
            <span>${invoice.total_discount?.toFixed(2)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span>Total Tax:</span>
            <span>${invoice.total_tax?.toFixed(2)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:600,fontSize:'1.1em',marginTop:8}}>
            <span>Total:</span>
            <span>${invoice.total?.toFixed(2)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span>Paid:</span>
            <span>${invoice.paid?.toFixed(2)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
            <span>Balance Due:</span>
            <span>${invoice.balance_due?.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {invoice.notes && <div style={{marginTop:16,background:'#f5f7fa',padding:12,borderRadius:6}}><b>Notes:</b> {invoice.notes}</div>}
      
      <div style={{textAlign:'center',marginTop:32,color:'#666',fontSize:'0.8em'}}>
        <p>This is a computer-generated invoice.</p>
        {invoice.businessInfo?.email && <p>For any questions, please contact us at {invoice.businessInfo.email}</p>}
      </div>
    </div>
  );
};

export default InvoiceDetail;
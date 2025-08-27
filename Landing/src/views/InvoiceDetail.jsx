import React from 'react';
import jsPDF from 'jspdf';

function downloadPDF(invoice) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Invoice #${invoice.invoice_no}`, 10, 15);
  doc.setFontSize(10);
  doc.text(`Date: ${invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}`, 10, 25);
  doc.text(`Status: ${invoice.status}`, 10, 32);
  doc.text(`Customer: ${invoice.customer?.name || ''}`, 10, 40);
  if (invoice.customer?.address) doc.text(`Address: ${invoice.customer.address}`, 10, 46);
  if (invoice.customer?.phone) doc.text(`Phone: ${invoice.customer.phone}`, 10, 52);
  if (invoice.customer?.email) doc.text(`Email: ${invoice.customer.email}`, 10, 58);
  doc.text('Items:', 10, 68);
  let y = 74;
  doc.setFontSize(9);
  doc.text('Product', 10, y);
  doc.text('Qty', 60, y);
  doc.text('Price', 80, y);
  doc.text('Discount', 100, y);
  doc.text('Tax', 125, y);
  doc.text('Subtotal', 150, y);
  y += 6;
  invoice.items?.forEach(item => {
    const productName = item.product_name || item.name || `Product #${item.product_no}` || 'Unknown Product';
    doc.text(String(productName), 10, y);
    doc.text(String(item.qty), 60, y);
    doc.text(String(item.price?.toFixed(2)), 80, y);
    doc.text(String(item.discount?.toFixed(2)), 100, y);
    doc.text(String(item.tax?.toFixed(2)), 125, y);
    doc.text(String(item.subtotal?.toFixed(2)), 150, y);
    y += 6;
  });
  y += 4;
  doc.setFontSize(10);
  doc.text(`Subtotal: ${invoice.subtotal?.toFixed(2)}`, 120, y);
  y += 6;
  doc.text(`Total Discount: ${invoice.total_discount?.toFixed(2)}`, 120, y);
  y += 6;
  doc.text(`Total Tax: ${invoice.total_tax?.toFixed(2)}`, 120, y);
  y += 6;
  doc.text(`Total: ${invoice.total?.toFixed(2)}`, 120, y);
  y += 6;
  doc.text(`Paid: ${invoice.paid?.toFixed(2)}`, 120, y);
  y += 6;
  doc.text(`Balance Due: ${invoice.balance_due?.toFixed(2)}`, 120, y);
  if (invoice.notes) {
    y += 8;
    doc.text(`Notes: ${invoice.notes}`, 10, y);
  }
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
        }
        /* Ensure buttons are visible on screen */
        .no-print button {
          display: inline-block !important;
          opacity: 1 !important;
        }
      `}</style>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <button onClick={onBack} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}} className="no-print">Back to Invoices</button>
        <div style={{display:'flex',gap:12}} className="no-print">
          <button onClick={()=>window.print()} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}}>Print</button>
          <button onClick={()=>downloadPDF(invoice)} style={{padding:'6px 18px',borderRadius:6,border:'1px solid #ddd',background:'#f5f7fa',fontWeight:500}}>Download PDF</button>
        </div>
      </div>
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
    </div>
  );
};

export default InvoiceDetail; 
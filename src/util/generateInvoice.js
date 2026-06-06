import { jsPDF } from 'jspdf';

export function generateInvoicePDF({ orderId, user, address, cart, rawSubtotal, gstAmount, bulkTierDiscount, couponDiscount = 0, couponCode, grandTotal, getPrice }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 190;
  let y = 20;

  const line = () => {
    doc.setDrawColor(200);
    doc.line(10, y, 200, y);
    y += 6;
  };

  const bold = (text, size = 10, x = 10) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(text, x, y);
  };

  const normal = (text, size = 9, x = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.text(text, x, y);
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADEVIA', 10, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('B2B Wholesale Marketplace', 10, y + 4);
  y += 14;

  // Invoice title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Commercial Tax Invoice', 10, y);
  line();

  // Order ID
  normal(`Order ID: ${orderId}`, 9);
  y += 5;
  normal(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 9);
  y += 8;

  // Billed to & Delivery
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed To:', 10, y);
  doc.text('Delivery Address:', pageW / 2 + 10, y);
  y += 5;
  normal((user?.businessName || address?.businessName || 'Registered Business'), 9, 10);
  normal(`${address?.addressLine || ''}`, 9, pageW / 2 + 10);
  y += 4;
  normal(`Contact: ${user?.name || address?.name || ''}`, 9, 10);
  normal(`${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}`, 9, pageW / 2 + 10);
  y += 4;
  normal(`Email: ${user?.email || 'N/A'}`, 9, 10);
  normal(`Phone: ${address?.phone || ''}`, 9, pageW / 2 + 10);
  y += 10;
  line();

  // Items table header
  const col1 = 10;
  const col2 = 130;
  const col3 = 155;
  const col4 = 175;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Product', col1, y);
  doc.text('Qty', col2, y, { align: 'center' });
  doc.text('Rate', col3, y, { align: 'right' });
  doc.text('Total', col4, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(200);
  doc.line(10, y, 200, y);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  cart.forEach((item) => {
    const qty = parseInt(item.quantity) || 0;
    const price = getPrice ? getPrice(item.product, qty) : item.product.wholesalePrice;
    const total = price * qty;
    const name = `${item.product.name} (${item.product.packSize || ''})`;

    doc.text(name, col1, y);
    doc.text(String(qty), col2, y, { align: 'center' });
    doc.text(`₹${price}`, col3, y, { align: 'right' });
    doc.text(`₹${total.toLocaleString('en-IN')}`, col4, y, { align: 'right' });
    y += 5;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  y += 3;
  line();

  // Totals
  const totX = pageW / 2 + 20;
  doc.setFontSize(9);
  normal('Subtotal (ex. GST):', 9, totX);
  doc.text(`₹${rawSubtotal.toLocaleString('en-IN')}`, pageW + 10, y - 5, { align: 'right' });
  y += 5;
  normal(`GST (18%):`, 9, totX);
  doc.text(`₹${gstAmount.toLocaleString('en-IN')}`, pageW + 10, y - 5, { align: 'right' });
  y += 5;
  if (bulkTierDiscount > 0) {
    normal('Bulk Savings:', 9, totX);
    doc.text(`-₹${bulkTierDiscount.toLocaleString('en-IN')}`, pageW + 10, y - 5, { align: 'right' });
    y += 5;
  }
  if (couponDiscount > 0) {
    normal(`Coupon${couponCode ? ` (${couponCode})` : ''}:`, 9, totX);
    doc.text(`-₹${couponDiscount.toLocaleString('en-IN')}`, pageW + 10, y - 5, { align: 'right' });
    y += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total (incl. Tax):', totX, y);
  doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, pageW + 10, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(128);
  doc.text('This is a computer-generated B2B tax invoice. Valid without signature.', 10, y);

  doc.save(`invoice-${orderId}.pdf`);
}

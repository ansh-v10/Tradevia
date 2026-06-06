import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartIcon } from '../components/Icons';
import { supabase } from '../util/supabaseClient';
import { getTrackingUrl } from '../util/tracking';

export default function YourOrders({ orders = [] }) {
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [returnForm, setReturnForm] = useState({ orderId: null, reason: '', details: '' });
  const [returnMsg, setReturnMsg] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMsg, setCancelMsg] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (orders && orders.length >= 0) {
      setOrdersLoading(false);
    }
  }, [orders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    setCancelMsg('');
    const { error } = await supabase.rpc('cancel_order_and_restore', { order_id: orderId });
    setCancellingId(null);
    if (error) { setCancelMsg(error.message); return; }
    setCancelMsg('Order cancelled successfully!');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleReturnSubmit = async (e, orderId) => {
    e.preventDefault();
    setReturnLoading(true);
    setReturnMsg('');
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setReturnMsg('Please sign in'); setReturnLoading(false); return; }
    const { error } = await supabase.from('returns').insert({
      order_id: orderId,
      user_id: u.id,
      reason: returnForm.reason,
      details: returnForm.details || null
    });
    setReturnLoading(false);
    if (error) { setReturnMsg(error.message); return; }
    setReturnMsg('Return request submitted!');
    setReturnForm({ orderId: null, reason: '', details: '' });
    setTimeout(() => setReturnMsg(''), 4000);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  if (ordersLoading) {
    return (
      <div className="orders-page-wrapper navbar-width-limiter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Loading orders...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-cart-page navbar-width-limiter" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="empty-cart-card">
          <CartIcon size={64} className="empty-cart-svg" />
          <h2>No B2B Orders Found</h2>
          <p>You haven't placed any commercial orders yet. Once checked out, your wholesale tax invoices will appear here.</p>
          <button className="primary-b2b-btn" onClick={() => navigate('/browse')}>
            Browse Wholesale Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper navbar-width-limiter" style={{ padding: '32px 0 64px', textAlign: 'left' }}>
      <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="page-main-title">Your B2B Order History</h2>
          <p className="page-main-subtitle">Access your past tax invoices, track wholesale dispatch details, and review shipment addresses.</p>
        </div>
        <button className="secondary-b2b-btn" onClick={() => navigate('/browse')}>
          ← Back to Catalog
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

          return (
            <div key={order.id} className="summary-card" style={{ padding: '20px', transition: 'all 0.2s ease', borderLeft: '4px solid var(--color-primary)' }}>
              
              {/* Accordion Trigger Header */}
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', cursor: 'pointer' }}
                onClick={() => toggleOrderDetails(order.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '700' }}>ORDER ID: {order.id}</span>
                  <span style={{ fontSize: '15px', fontWeight: '700' }}>Placed on {formatDate(order.date)}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Total Items: <strong>{itemsCount} units</strong> | Shipped to: <strong>{order.address?.city}</strong>
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>GRAND TOTAL</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <button 
                    className="pincode-btn" 
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '12px', 
                      backgroundColor: isExpanded ? '#cbd5e1' : 'var(--color-primary)', 
                      color: isExpanded ? 'var(--color-text-main)' : 'white' 
                    }}
                  >
                    {isExpanded ? 'Hide Details' : 'View Tax Invoice'}
                  </button>
                </div>
              </div>

              {/* Accordion Expandable Invoice Body */}
              {isExpanded && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                  
                  {/* Meta Details Row */}
                  <div className="invoice-meta-row" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px' }}>
                      <strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Billed & Shipped To:</strong>
                      <strong>{order.address?.name}</strong>
                      <span style={{ display: 'block', color: 'var(--color-text-muted)', fontWeight: '600' }}>{order.address?.businessName}</span>
                      <span style={{ display: 'block' }}>{order.address?.addressLine}</span>
                      <span style={{ display: 'block' }}>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</span>
                      <span style={{ display: 'block', marginTop: '4px', fontWeight: '600' }}>📞 {order.address?.phone}</span>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '13px' }}>
                      <strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Wholesale Invoice Details:</strong>
                      <p style={{ margin: '2px 0' }}>Status: <span style={{
                        backgroundColor: order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'cancelled' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered' ? 'var(--color-success)' : order.status === 'cancelled' ? '#dc2626' : '#b45309',
                        padding: '2px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '11px'
                      }}>{(order.status || 'pending').toUpperCase()}</span></p>
                      <p style={{ margin: '2px 0' }}>Fulfillment: <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{order.status === 'delivered' ? 'Delivered' : order.status === 'shipped' ? 'Shipped' : order.status === 'paid' ? 'Dispatching (Within 24 Hours)' : 'Awaiting Payment'}</span></p>
                      {order.trackingNumber && (
                        <p style={{ margin: '2px 0', fontSize: '12px' }}>
                          Tracking: <strong>{order.trackingNumber}</strong>
                          {order.courier && <> via {order.courier}</>}
                          {' · '}
                          <a
                            href={getTrackingUrl(order.trackingNumber, order.courier)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            Track Package
                          </a>
                        </p>
                      )}
                      <p style={{ margin: '2px 0' }}>Nearest Hub: <span style={{ fontWeight: '600' }}>Jhajjar B2B Hub</span></p>
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ textAlign: 'left', padding: '10px 8px' }}>Product description</th>
                          <th style={{ textAlign: 'center', padding: '10px 8px' }}>Pack Qty</th>
                          <th style={{ textAlign: 'right', padding: '10px 8px' }}>Distributor Rate</th>
                          <th style={{ textAlign: 'right', padding: '10px 8px' }}>Subtotal (ex. Tax)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <strong>{item.name}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)' }}>Brand: {item.brand} | {item.packSize}</span>
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px 8px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '10px 8px' }}>₹{item.wholesalePrice}</td>
                            <td style={{ textAlign: 'right', padding: '10px 8px' }}>₹{(item.wholesalePrice * item.quantity).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal (ex. GST):</span>
                        <span>₹{order.rawSubtotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>CGST + SGST (18%):</span>
                        <span>₹{order.gstAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {order.bulkTierDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', fontWeight: '600' }}>
                          <span>Commercial Bulk Savings:</span>
                          <span>- ₹{order.bulkTierDiscount.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px', fontWeight: '700', fontSize: '15px' }}>
                        <span>Final Billing Amount (incl. Tax):</span>
                        <span style={{ color: 'var(--color-primary)' }}>₹{order.grandTotal.toLocaleString('en-IN')}</span>
                      </div>

                    </div>
                  </div>

                    {/* Cancel Order */}
                    {(order.status === 'pending' || order.status === 'paid') && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                        {cancelMsg && <p style={{ color: cancelMsg.includes('success') ? 'var(--color-success)' : '#dc2626', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>{cancelMsg}</p>}
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="pincode-btn"
                          style={{ backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626', fontSize: '12px', padding: '6px 14px' }}
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      </div>
                    )}

                    {/* Return / Refund */}
                    {(order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && (
                      <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                        {returnForm.orderId === order.id ? (
                          <form onSubmit={(e) => handleReturnSubmit(e, order.id)} style={{ fontSize: '13px' }}>
                            <strong style={{ display: 'block', marginBottom: '8px' }}>Request Return / Refund</strong>
                            {returnMsg && <p style={{ color: returnMsg.includes('submitted') ? 'var(--color-success)' : '#dc2626', fontWeight: '600', marginBottom: '8px' }}>{returnMsg}</p>}
                            <select
                              value={returnForm.reason}
                              onChange={(e) => setReturnForm((p) => ({ ...p, reason: e.target.value }))}
                              required
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '8px', fontSize: '13px' }}
                            >
                              <option value="">Select a reason</option>
                              <option value="damaged">Damaged / Defective</option>
                              <option value="wrong_item">Wrong item shipped</option>
                              <option value="quality">Quality not as expected</option>
                              <option value="other">Other</option>
                            </select>
                            <textarea
                              value={returnForm.details}
                              onChange={(e) => setReturnForm((p) => ({ ...p, details: e.target.value }))}
                              placeholder="Additional details (optional)"
                              rows={2}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="submit" disabled={!returnForm.reason || returnLoading} className="pincode-btn" style={{ backgroundColor: 'var(--color-danger)', color: 'white', fontSize: '12px', padding: '6px 14px' }}>
                                {returnLoading ? 'Submitting...' : 'Submit Request'}
                              </button>
                              <button type="button" onClick={() => { setReturnForm({ orderId: null, reason: '', details: '' }); setReturnMsg(''); }} className="pincode-btn" style={{ backgroundColor: '#e2e8f0', color: '#1e293b', fontSize: '12px', padding: '6px 14px' }}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReturnForm((p) => ({ ...p, orderId: order.id }))}
                            className="pincode-btn"
                            style={{ backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', fontSize: '12px', padding: '6px 14px' }}
                          >
                            Request Return / Refund
                          </button>
                        )}
                      </div>
                    )}

                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}

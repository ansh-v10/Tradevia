import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, CartIcon, CloseIcon } from '../components/Icons';
import { getTieredWholesalePrice } from '../util/productsData';

export default function CartPage({ 
  cart, 
  user, 
  addresses = [],
  onAddAddress,
  onAddOrder,
  onUpdateQuantity,
  onRemoveItem,
  onOpenLoginModal,
  onClearCart
}) {
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'address', 'success'
  const [orderId, setOrderId] = useState('');
  
  // Selection state for shipping address
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Add Address Form states
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrBiz, setNewAddrBiz] = useState(user?.businessName || '');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrPin, setNewAddrPin] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.mobile || '');
  const [addressErrors, setAddressErrors] = useState({});

  // Auto-select the first address when list becomes available or user logs in
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Keep track of addresses length to auto-select newly added addresses
  const prevAddressesLength = useRef(addresses.length);
  useEffect(() => {
    if (addresses.length > prevAddressesLength.current) {
      const newlyAdded = addresses[addresses.length - 1];
      if (newlyAdded) {
        setSelectedAddressId(newlyAdded.id);
      }
    }
    prevAddressesLength.current = addresses.length;
  }, [addresses]);

  // Sync profile values when user state changes
  useEffect(() => {
    if (user) {
      setNewAddrBiz(user.businessName || '');
      setNewAddrPhone(user.mobile || '');
    }
  }, [user]);

  const totalItems = cart.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
  
  // Calculations
  const rawSubtotal = cart.reduce((acc, item) => {
    const qty = parseInt(item.quantity) || 0;
    return acc + (getTieredWholesalePrice(item.product, qty) * qty);
  }, 0);
  const gstAmount = Math.round(rawSubtotal * 0.18); // 18% GST for FMCG/Beverages/Toiletries
  
  // Extra bulk tier discount (e.g. 5% off if subtotal is above 10,000)
  const bulkTierDiscount = rawSubtotal > 10000 ? Math.round(rawSubtotal * 0.05) : 0;
  const grandTotal = rawSubtotal + gstAmount - bulkTierDiscount;

  const handleCheckoutBtn = () => {
    if (!user) {
      onOpenLoginModal(true); // pass true to indicate it was a checkout trigger
      return;
    }
    setCheckoutStep('address');
  };

  const handlePlaceOrder = () => {
    const chosenAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
    if (!chosenAddress) {
      alert("Please select or add a shipping address to place your order.");
      return;
    }

    const generatedId = "SS-B2B-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(generatedId);

    const orderPayload = {
      id: generatedId,
      date: new Date().toISOString(),
      items: cart.map(item => {
        const qty = parseInt(item.quantity) || 10;
        return {
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          packSize: item.product.packSize,
          quantity: qty,
          wholesalePrice: getTieredWholesalePrice(item.product, qty),
          retailPrice: item.product.retailPrice
        };
      }),
      rawSubtotal,
      gstAmount,
      bulkTierDiscount,
      grandTotal,
      address: chosenAddress
    };

    onAddOrder(orderPayload);
    setCheckoutStep('success');
  };

  const handleSaveNewAddress = (e) => {
    e.preventDefault();
    const errs = {};
    if (!newAddrName.trim()) errs.name = "Contact Name is required";
    if (!newAddrLine.trim()) errs.line = "Address line is required";
    if (!newAddrCity.trim()) errs.city = "City is required";
    if (!newAddrState.trim()) errs.state = "State is required";
    if (!newAddrPin.trim() || newAddrPin.length !== 6) errs.pincode = "Enter a valid 6-digit Pincode";
    if (!newAddrPhone.trim() || newAddrPhone.length !== 10) errs.phone = "Enter a 10-digit Phone number";

    setAddressErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newAddr = {
      name: newAddrName,
      businessName: newAddrBiz || user?.businessName || "Registered Business",
      addressLine: newAddrLine,
      city: newAddrCity,
      state: newAddrState,
      pincode: newAddrPin,
      phone: newAddrPhone
    };

    onAddAddress(newAddr);
    setShowNewAddressForm(false);
    
    // Reset Form
    setNewAddrName('');
    setNewAddrLine('');
    setNewAddrCity('');
    setNewAddrState('');
    setNewAddrPin('');
    setAddressErrors({});
  };

  const handleCloseSuccess = () => {
    onClearCart();
    setCheckoutStep('cart');
    navigate('/');
  };

  const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  if (cart.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="empty-cart-page navbar-width-limiter">
        <div className="empty-cart-card">
          <CartIcon size={64} className="empty-cart-svg" />
          <h2>Your Wholesale Cart is Empty</h2>
          <p>You haven't added any products to your commercial order list yet.</p>
          <button className="primary-b2b-btn" onClick={() => navigate('/browse')}>
            Browse Wholesale Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper navbar-width-limiter">
      {checkoutStep === 'cart' && (
        <>
          <h2 className="page-main-title">Business Shopping Cart</h2>
          <p className="page-main-subtitle">Review items, adjust quantities to meet Minimum Order Requirements, and prepare order.</p>

          <div className="cart-grid-layout">
            
            {/* Cart Items List */}
            <div className="cart-items-column">
              <div className="cart-table-header">
                <span className="col-desc">Product Details</span>
                <span className="col-qty">Trade Qty</span>
                <span className="col-price">Distributor Rate</span>
                <span className="col-total">Subtotal</span>
              </div>

              <div className="cart-items-list-container">
                {cart.map((item) => {
                  const qty = parseInt(item.quantity) || 0;
                  const itemPrice = getTieredWholesalePrice(item.product, qty);
                  const itemTotal = itemPrice * qty;
                  const savings = (item.product.retailPrice - item.product.wholesalePrice) * qty;
                  const moqLimit = item.product.moq || 10;

                  return (
                    <div key={item.product.id} className="cart-item-row">
                      
                      {/* Product details */}
                      <div className="cart-item-details">
                        <img src={item.product.imageUrl} alt={item.product.name} className="cart-item-img" />
                        <div className="cart-item-info">
                          <span className="item-brand">{item.product.brand}</span>
                          <h4>{item.product.name}</h4>
                          <span className="item-pack">{item.product.packSize}</span>
                          <span className="savings-badge">Saving ₹{savings.toLocaleString('en-IN')} off MRP</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            MOQ Enforced: <strong>{moqLimit} units</strong>
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="cart-item-quantity">
                        <div className="qty-selector-container">
                          <button 
                            className="qty-btn"
                            onClick={() => onUpdateQuantity(item.product.id, (parseInt(item.quantity) || 10) - 1)}
                            disabled={(parseInt(item.quantity) || 0) <= moqLimit}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <input 
                            type="text" 
                            className="qty-input"
                            value={item.quantity}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const parsed = parseInt(valStr);
                              onUpdateQuantity(item.product.id, valStr === '' ? '' : (isNaN(parsed) ? valStr : parsed));
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (isNaN(val) || val < moqLimit) {
                                onUpdateQuantity(item.product.id, moqLimit);
                              } else {
                                onUpdateQuantity(item.product.id, val);
                              }
                            }}
                          />
                          <button 
                            className="qty-btn"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button className="item-delete-btn" onClick={() => onRemoveItem(item.product.id)}>
                          <TrashIcon size={16} /> Remove
                        </button>
                      </div>

                      {/* Distributor unit rate */}
                      <div className="cart-item-unit-price">
                        <span className="unit-label">Rate:</span>
                        <span className="price-num">₹{itemPrice}</span>
                        <span className="ex-gst-sub">ex. GST</span>
                      </div>

                      {/* Subtotal */}
                      <div className="cart-item-total-price">
                        <span className="total-label">Total:</span>
                        <span className="price-num font-bold">₹{itemTotal.toLocaleString('en-IN')}</span>
                      </div>

                    </div>
                  );
                })}
              </div>

              <div className="cart-actions-row">
                <button className="secondary-b2b-btn" onClick={() => navigate('/browse')}>
                  ← Continue Shopping
                </button>
                <button className="danger-text-btn" onClick={onClearCart}>
                  Clear Commercial Cart
                </button>
              </div>
            </div>

            {/* Cart Summary Panel */}
            <div className="cart-summary-column">
              <div className="summary-card">
                <h3>Commercial Order Summary</h3>
                <div className="divider-card"></div>

                <div className="summary-row">
                  <span>Gross Items Qty:</span>
                  <span>{totalItems} units</span>
                </div>

                <div className="summary-row">
                  <span>Gross Value (ex. GST):</span>
                  <span>₹{rawSubtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="summary-row">
                  <span className="gst-label-flex">
                    CGST + SGST (18%):
                    <span className="gst-info-bubble">Claimable</span>
                  </span>
                  <span>+ ₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {bulkTierDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>5% Bulk Discount (Order &gt; ₹10k):</span>
                    <span>- ₹{bulkTierDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="divider-card"></div>

                <div className="summary-row grand-total-row">
                  <span>Invoice Total:</span>
                  <span className="grand-price">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <span className="gst-disclaimer">Price is inclusive of SGST and CGST laws.</span>

                {/* Checkout Trigger */}
                <button className="checkout-proceed-btn" onClick={handleCheckoutBtn}>
                  {user ? 'Proceed to B2B Checkout' : 'Login & Checkout'}
                </button>

                <div className="summary-benefits-list">
                  <div className="benefit-item">
                    <span className="benefit-check">✓</span>
                    <span>Direct wholesale tax invoice with dispatch</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-check">✓</span>
                    <span>No-contact doorstep bulk unloading</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </>
      )}

      {checkoutStep === 'address' && (
        <>
          <h2 className="page-main-title">Select Shipping Address</h2>
          <p className="page-main-subtitle">Choose a saved commercial hub address or register a new delivery destination.</p>

          <div className="cart-grid-layout">
            
            {/* Address Selection Column */}
            <div className="cart-items-column">
              <div className="summary-card" style={{ padding: '24px' }}>
                <div className="address-selection-container">
                  
                  <div className="address-cards-grid">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`address-card-item ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <input 
                          type="radio" 
                          name="selected-address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="address-radio-input"
                        />
                        <div className="address-card-details">
                          <h4>{addr.name}</h4>
                          <span className="address-biz-name">{addr.businessName}</span>
                          <span className="address-lines">{addr.addressLine}</span>
                          <span className="address-location">{addr.city}, {addr.state} - {addr.pincode}</span>
                          <span className="address-phone">📞 {addr.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!showNewAddressForm ? (
                    <button 
                      className="add-address-trigger-btn mt-4" 
                      onClick={() => setShowNewAddressForm(true)}
                    >
                      + Add New Delivery Address
                    </button>
                  ) : (
                    <div className="address-form-card mt-4">
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Add Shipping Address</h3>
                      <form onSubmit={handleSaveNewAddress} className="login-form">
                        
                        <div className="address-form-grid">
                          <div className="form-group">
                            <label>Contact Name *</label>
                            <input 
                              type="text" 
                              value={newAddrName}
                              onChange={(e) => setNewAddrName(e.target.value)}
                              placeholder="e.g. Sanjay Patel"
                              className={addressErrors.name ? 'error-input' : ''}
                            />
                            {addressErrors.name && <span className="input-error-msg">{addressErrors.name}</span>}
                          </div>

                          <div className="form-group">
                            <label>Business Name (Optional)</label>
                            <input 
                              type="text" 
                              value={newAddrBiz}
                              onChange={(e) => setNewAddrBiz(e.target.value)}
                              placeholder="e.g. Sanjay Kirana Store"
                            />
                          </div>

                          <div className="form-group address-form-grid-full">
                            <label>Shipping Address Line *</label>
                            <input 
                              type="text" 
                              value={newAddrLine}
                              onChange={(e) => setNewAddrLine(e.target.value)}
                              placeholder="e.g. Shop No. 4, Main Sabzi Mandi"
                              className={addressErrors.line ? 'error-input' : ''}
                            />
                            {addressErrors.line && <span className="input-error-msg">{addressErrors.line}</span>}
                          </div>

                          <div className="form-group">
                            <label>City *</label>
                            <input 
                              type="text" 
                              value={newAddrCity}
                              onChange={(e) => setNewAddrCity(e.target.value)}
                              placeholder="e.g. Jhajjar"
                              className={addressErrors.city ? 'error-input' : ''}
                            />
                            {addressErrors.city && <span className="input-error-msg">{addressErrors.city}</span>}
                          </div>

                          <div className="form-group">
                            <label>State *</label>
                            <input 
                              type="text" 
                              value={newAddrState}
                              onChange={(e) => setNewAddrState(e.target.value)}
                              placeholder="e.g. Haryana"
                              className={addressErrors.state ? 'error-input' : ''}
                            />
                            {addressErrors.state && <span className="input-error-msg">{addressErrors.state}</span>}
                          </div>

                          <div className="form-group">
                            <label>6-Digit Pincode *</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={newAddrPin}
                              onChange={(e) => setNewAddrPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 124103"
                              className={addressErrors.pincode ? 'error-input' : ''}
                            />
                            {addressErrors.pincode && <span className="input-error-msg">{addressErrors.pincode}</span>}
                          </div>

                          <div className="form-group">
                            <label>Commercial Phone *</label>
                            <input 
                              type="text" 
                              maxLength={10}
                              value={newAddrPhone}
                              onChange={(e) => setNewAddrPhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 9876543210"
                              className={addressErrors.phone ? 'error-input' : ''}
                            />
                            {addressErrors.phone && <span className="input-error-msg">{addressErrors.phone}</span>}
                          </div>
                        </div>

                        <div className="address-form-actions">
                          <button type="submit" className="checkout-proceed-btn" style={{ padding: '10px 20px', flex: 'none', width: 'auto' }}>
                            Save & Choose Address
                          </button>
                          <button 
                            type="button" 
                            className="drawer-clear-btn" 
                            onClick={() => {
                              setShowNewAddressForm(false);
                              setAddressErrors({});
                            }}
                            style={{ padding: '10px 20px', border: '1px solid var(--color-border)' }}
                          >
                            Cancel
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                </div>
              </div>

              <div className="cart-actions-row">
                <button 
                  className="secondary-b2b-btn" 
                  onClick={() => setCheckoutStep('cart')}
                >
                  ← Back to Cart Items
                </button>
              </div>
            </div>

            {/* Summary & Confirm Order panel */}
            <div className="cart-summary-column">
              <div className="summary-card">
                <h3>Confirm Shipping Details</h3>
                <div className="divider-card"></div>

                {activeAddress ? (
                  <div style={{ marginBottom: '16px', fontSize: '13px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Deliver To:</strong>
                    <strong>{activeAddress.name}</strong>
                    <span style={{ display: 'block', color: 'var(--color-text-muted)' }}>{activeAddress.businessName}</span>
                    <span style={{ display: 'block' }}>{activeAddress.addressLine}</span>
                    <span style={{ display: 'block' }}>{activeAddress.city}, {activeAddress.state} - {activeAddress.pincode}</span>
                    <span style={{ display: 'block', marginTop: '4px', fontWeight: '600' }}>📞 {activeAddress.phone}</span>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--color-danger)', marginBottom: '16px' }}>⚠️ No address selected</p>
                )}

                <div className="divider-card"></div>

                <div className="summary-row">
                  <span>Gross Value:</span>
                  <span>₹{rawSubtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="summary-row">
                  <span>GST (18%):</span>
                  <span>+ ₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {bulkTierDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount:</span>
                    <span>- ₹{bulkTierDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="divider-card"></div>

                <div className="summary-row grand-total-row" style={{ margin: '12px 0' }}>
                  <span>Final Amount:</span>
                  <span className="grand-price" style={{ fontSize: '18px' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <button 
                  className="checkout-proceed-btn" 
                  onClick={handlePlaceOrder}
                  disabled={!activeAddress}
                  style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                >
                  Confirm & Place Order
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {checkoutStep === 'success' && (
        /* Purchase Success Panel */
        <div className="checkout-success-container">
          <div className="success-icon-badge">✓</div>
          <h2>Wholesale Order Placed Successfully!</h2>
          <p className="success-order-id">Order ID: <strong>{orderId}</strong></p>
          
          <div className="success-details-card">
            <h3>B2B Commercial Tax Invoice</h3>
            <div className="invoice-divider"></div>
            
            <div className="invoice-meta-row">
              <div>
                <strong>Billed To:</strong>
                <p className="invoice-p">{user?.businessName || activeAddress?.businessName || "Registered Business"}</p>
                <p className="invoice-p">Contact: {user?.name || activeAddress?.name}</p>
                <p className="invoice-p">Email: {user?.email || "No Email Provided"}</p>
              </div>
              <div className="text-right">
                <strong>Delivery Address:</strong>
                <p className="invoice-p">{activeAddress?.addressLine}</p>
                <p className="invoice-p">{activeAddress?.city}, {activeAddress?.state} - {activeAddress?.pincode}</p>
                <p className="invoice-p">Phone: {activeAddress?.phone}</p>
                <p className="invoice-p">Invoice Date: {new Date().toLocaleDateString()}</p>
                <p className="invoice-p">Status: <span className="invoice-status-paid">COMMERCIAL CHARGE</span></p>
              </div>
            </div>

            <div className="invoice-divider"></div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Product description</th>
                  <th className="text-center">Pack Qty</th>
                  <th className="text-right">Distributor Rate</th>
                  <th className="text-right">Total (ex. Tax)</th>
                </tr>
              </thead>
              <tbody>
                 {cart.map((item) => {
                   const qty = parseInt(item.quantity) || 0;
                   return (
                     <tr key={item.product.id}>
                       <td>{item.product.name} ({item.product.packSize})</td>
                       <td className="text-center">{qty}</td>
                       <td className="text-right">₹{getTieredWholesalePrice(item.product, qty)}</td>
                       <td className="text-right">₹{(getTieredWholesalePrice(item.product, qty) * qty).toLocaleString('en-IN')}</td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>

            <div className="invoice-divider"></div>

            <div className="invoice-totals-table">
              <div className="invoice-total-row">
                <span>Subtotal (ex. GST):</span>
                <span>₹{rawSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="invoice-total-row">
                <span>Total GST (18%):</span>
                <span>₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              {bulkTierDiscount > 0 && (
                <div className="invoice-total-row text-green">
                  <span>Commercial Bulk Savings:</span>
                  <span>- ₹{bulkTierDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="invoice-total-row grand-row">
                <span>Final Billing Amount (incl. Tax):</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <p className="tax-compliance-text">
              * This is a simulated B2B tax invoice compliance sheet. Goods will be dispatched from our nearest Sanjay Sales Wholesale Hub within 24 business hours.
            </p>
          </div>

          <button className="primary-b2b-btn" onClick={handleCloseSuccess}>
            Back to Wholesale Home
          </button>
        </div>
      )}
    </div>
  );
}

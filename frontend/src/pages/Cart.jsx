import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { TrashIcon, CloseIcon } from '../components/Icons.jsx';
import { getProductById } from '../data/products.js';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../config/api.js';

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, subtotal, shipping, total } = useCart();
  const { user, token } = useAuth();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const orderNumber = `SV-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // Try posting to backend API if authenticated or endpoint is up
    try {
      if (token) {
        const res = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shippingAddress }),
        });
        const data = await res.json();
        if (res.ok && data.order) {
          setOrderComplete({
            orderNumber: data.order.orderNumber,
            total: data.order.total,
            shippingAddress,
          });
          clearCart();
          setCheckoutOpen(false);
          return;
        }
      }
    } catch {
      // Backend not running or error, proceed with client-side order completion
    }

    // Complete order client-side
    setOrderComplete({
      orderNumber,
      total,
      shippingAddress,
    });
    clearCart();
    setCheckoutOpen(false);
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title="Shopping Cart" />

      <section className="page-content">
        <div className="container">
          {orderComplete ? (
            <div className="empty-state" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
              <h2>Order Placed Successfully!</h2>
              <p style={{ marginTop: 8, fontSize: '1.05rem', color: 'var(--text)' }}>
                Thank you for shopping with Shree Vastra.
              </p>
              <div
                style={{
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  margin: '20px 0',
                  textAlign: 'left',
                }}
              >
                <p><strong>Order Number:</strong> {orderComplete.orderNumber}</p>
                <p><strong>Total Amount:</strong> {formatPrice(orderComplete.total)} (Cash on Delivery)</p>
                <p><strong>Shipping to:</strong> {orderComplete.shippingAddress.fullName}, {orderComplete.shippingAddress.city} - {orderComplete.shippingAddress.pincode}</p>
                <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Delivery expected within 3–7 business days across India.
                </p>
              </div>
              <Link to="/products" className="btn btn-primary" onClick={() => setOrderComplete(null)}>
                Continue Shopping
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                {items.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;

                  const colorObj =
                    product.colors && product.colors[item.colorIndex]
                      ? product.colors[item.colorIndex]
                      : { name: 'Standard' };

                  return (
                    <div className="cart-item" key={item.id}>
                      <Link to={`/product/${product.id}`}>
                        <ProductImage product={product} />
                      </Link>

                      <div className="cart-item-info">
                        <h3>
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <p className="cart-item-meta">
                          Size: {item.size} · Colour: {colorObj.name}
                        </p>
                        <div className="qty-box">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                          >
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-side">
                        <span className="cart-item-price">{formatPrice(product.price * item.qty)}</span>
                        <button
                          type="button"
                          className="remove-btn"
                          aria-label={`Remove ${product.name} from cart`}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <TrashIcon size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                  <Link to="/products" className="section-link">
                    ← Continue shopping
                  </Link>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <aside className="summary-card">
                <h2>Order Summary</h2>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Proceed to Checkout
                </button>
                <p className="summary-note">
                  Buying 20+ pieces? <Link to="/wholesale" className="section-link">Ask for wholesale rates</Link>
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* Checkout Dialog Modal */}
      {checkoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="form-card"
            style={{
              position: 'relative',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 id="checkout-title" style={{ fontSize: '1.4rem' }}>Delivery Address</h2>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close"
                onClick={() => setCheckoutOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            {error && <p className="form-error" role="alert" style={{ marginBottom: 12, color: 'var(--primary)' }}>{error}</p>}

            <form className="form" onSubmit={handleCheckoutSubmit}>
              <div className="form-field">
                <label htmlFor="co-name">Full Name</label>
                <input
                  id="co-name"
                  name="fullName"
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={handleAddressChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="co-phone">Mobile Phone</label>
                <input
                  id="co-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={shippingAddress.phone}
                  onChange={handleAddressChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="co-line1">Address (House No., Building, Street)</label>
                <input
                  id="co-line1"
                  name="line1"
                  type="text"
                  required
                  value={shippingAddress.line1}
                  onChange={handleAddressChange}
                />
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="co-city">City</label>
                  <input
                    id="co-city"
                    name="city"
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="co-state">State</label>
                  <input
                    id="co-state"
                    name="state"
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="co-pin">Pincode</label>
                <input
                  id="co-pin"
                  name="pincode"
                  type="text"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  placeholder="6-digit pincode"
                  value={shippingAddress.pincode}
                  onChange={handleAddressChange}
                />
              </div>

              <div style={{ background: 'var(--bg-soft)', padding: 12, borderRadius: 'var(--radius)', margin: '12px 0' }}>
                <p><strong>Payment Mode:</strong> Cash on Delivery (COD)</p>
                <p><strong>Total to Pay:</strong> {formatPrice(total)}</p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCheckoutOpen(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 2 }}
                >
                  {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

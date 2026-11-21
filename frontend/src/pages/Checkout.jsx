import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import PageHeader from '../components/PageHeader.jsx';
import { useCart } from '../context/CartContext.jsx';
import { payment } from '../data/site.js';
import { formatPrice } from '../utils/format.js';
import { gpayLink, phonepeLink, paytmLink, isMobileDevice, upiLink } from '../utils/upi.js';

const newOrderId = () => 'SV' + Date.now().toString(36).toUpperCase();

export default function Checkout() {
  const { lines, subtotal, shipping, total, placeOrder } = useCart();
  const navigate = useNavigate();
  const mobile = useMemo(isMobileDevice, []);
  const [orderId] = useState(newOrderId);
  const [step, setStep] = useState('address');
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '' });
  const [errors, setErrors] = useState({});
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const opts = { amount: total };

  useEffect(() => {
    if (step !== 'pay' || mobile) return;
    QRCode.toDataURL(upiLink(opts), {
      width: 260,
      margin: 1,
      color: { dark: '#1e1317', light: '#ffffff' }
    }).then(setQr).catch(() => setQr(''));
  }, [step, mobile, total]); // eslint-disable-line react-hooks/exhaustive-deps

  if (lines.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <section className="page-content">
          <div className="container empty-state">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </section>
      </>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submitAddress = (e) => {
    e.preventDefault();
    const err = {};
    if (form.name.trim().length < 2) err.name = 'Enter your full name';
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) err.phone = 'Enter a valid 10-digit mobile number';
    if (form.address.trim().length < 5) err.address = 'Enter your full address';
    if (form.city.trim().length < 2) err.city = 'Enter your city';
    if (!/^\d{6}$/.test(form.pincode.trim())) err.pincode = 'Enter a valid 6-digit pincode';
    setErrors(err);
    if (Object.keys(err).length === 0) setStep('pay');
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(payment.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(Number(total || 0).toFixed(2));
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const confirmPaid = () => {
    const cleanUtr = utr.trim();
    if (!cleanUtr || cleanUtr.length < 4) {
      setUtrError('Please enter the UPI transaction reference or UTR number from your payment app');
      return;
    }
    placeOrder({
      id: orderId,
      date: new Date().toISOString(),
      customer: form,
      items: lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        size: l.size,
        color: l.product.colors[l.colorIndex]?.name,
        qty: l.qty,
        price: l.product.price,
      })),
      subtotal,
      shipping,
      total,
      payment: {
        method: 'UPI',
        upiId: payment.upiId,
        payeeName: payment.payeeName,
        utr: cleanUtr,
        status: 'verification pending',
      },
    });
    navigate(`/order-success/${orderId}`);
  };

  const field = (k, label, props = {}) => (
    <label className="co-field">
      <span>{label}</span>
      <input value={form[k]} onChange={set(k)} {...props} />
      {errors[k] && <small className="co-error">{errors[k]}</small>}
    </label>
  );

  return (
    <>
      <PageHeader title="Checkout" />
      <section className="page-content">
        <div className="container cart-layout">
          <div>
            {step === 'address' ? (
              <form className="co-card" onSubmit={submitAddress} noValidate>
                <h2>1. Delivery details</h2>
                {field('name', 'Full name', { autoComplete: 'name' })}
                {field('phone', 'Mobile number', { inputMode: 'numeric', maxLength: 10, autoComplete: 'tel' })}
                {field('address', 'Address', { autoComplete: 'street-address' })}
                <div className="co-row">
                  {field('city', 'City', { autoComplete: 'address-level2' })}
                  {field('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
                </div>
                <button type="submit" className="btn btn-primary">Continue to payment</button>
              </form>
            ) : (
              <div className="co-card">
                <div className="upi-security-badge">
                  <span>🔒 100% Secure UPI Payment (NPCI Encrypted)</span>
                </div>

                <h2>2. Pay {formatPrice(total)} with UPI</h2>

                <div className="upi-box">
                  <div>
                    <span>Total Purchase Value</span>
                    <strong style={{ fontSize: '1.25rem', color: '#166534' }}>{formatPrice(total)}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Amount automatically filled in app • No notes added
                    </p>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copyAmount} style={{ marginLeft: 'auto' }}>
                    {copiedAmount ? 'Copied ✓' : 'Copy Amount'}
                  </button>
                </div>

                <div className="upi-box" style={{ marginTop: '10px' }}>
                  <div>
                    <span>Official Payee UPI ID</span>
                    <strong>{payment.upiId}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Payee: <strong>{payment.payeeName}</strong>
                    </p>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={copyUpi} style={{ marginLeft: 'auto' }}>
                    {copied ? 'Copied ✓' : 'Copy UPI ID'}
                  </button>
                </div>

                {mobile ? (
                  <div style={{ marginTop: 18 }}>
                    <p className="co-hint">Tap below to open your payment app with {formatPrice(total)} automatically entered:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <a className="btn btn-gpay btn-block" href={gpayLink(opts)}>
                        Pay {formatPrice(total)} with Google Pay
                      </a>
                      <a className="btn btn-phonepe btn-block" href={phonepeLink(opts)}>
                        Pay {formatPrice(total)} with PhonePe
                      </a>
                      <a className="btn btn-paytm btn-block" href={paytmLink(opts)}>
                        Pay {formatPrice(total)} with Paytm
                      </a>
                      <a className="btn btn-outline btn-block" href={upiLink(opts)}>
                        ⚡ Pay with Any UPI App (Direct)
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="upi-desktop" style={{ marginTop: 18 }}>
                    <div className="qr-wrap">
                      {qr ? (
                        <img src={qr} alt="UPI QR code" width="260" height="260" />
                      ) : (
                        <p>Generating secure QR code…</p>
                      )}
                      <p className="co-hint">Scan using PhonePe, Google Pay, Paytm or any UPI app</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <h4 style={{ marginBottom: 8, fontSize: '0.98rem' }}>How to Pay:</h4>
                      <ol style={{ paddingLeft: 18, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                        <li>Open any UPI app (PhonePe, GPay, Paytm, BHIM, Cred).</li>
                        <li>Scan the QR code or enter UPI ID <strong>{payment.upiId}</strong>.</li>
                        <li>Verify payee is <strong>{payment.payeeName}</strong>.</li>
                        <li>Complete the payment of <strong>{formatPrice(total)}</strong>.</li>
                        <li>Copy the <strong>12-digit UTR / UPI Reference No.</strong> from the payment screen and paste it below.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="co-paid">
                  <label className="co-field">
                    <span>Enter UPI Transaction Reference / UTR Number *</span>
                    <input
                      value={utr}
                      onChange={(e) => {
                        setUtr(e.target.value.trim());
                        setUtrError('');
                      }}
                      placeholder="e.g. 412345678901 or UPI Ref ID"
                    />
                    {utrError && <small className="co-error">{utrError}</small>}
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                      💡 Found on your payment app screen (UTR / UPI Ref No. / Transaction ID)
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14 }}>
                    <button type="button" className="btn btn-primary" onClick={confirmPaid}>
                      I have paid – Place Order
                    </button>
                    <button type="button" className="link-btn" onClick={() => setStep('address')}>
                      ← Edit address
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="summary-card">
            <h2>Order Summary</h2>
            {lines.map((l) => (
              <div className="summary-row" key={`${l.productId}-${l.size}-${l.colorIndex}`}>
                <span>{l.product.name} × {l.qty}</span>
                <span>{formatPrice(l.product.price * l.qty)}</span>
              </div>
            ))}
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
          </aside>
        </div>
      </section>
    </>
  );
}

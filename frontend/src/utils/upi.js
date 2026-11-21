import { payment } from '../data/site.js';

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIOS() {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Clean and sanitize string for UPI parameters
function sanitizeParam(str) {
  return String(str || '').replace(/[^\w\s.-]/gi, '').trim();
}

function query({ amount, note, orderId }) {
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanOrderId = sanitizeParam(orderId);
  const cleanNote = sanitizeParam(note || `Order ${cleanOrderId}`);

  const p = new URLSearchParams({
    pa: payment.upiId.trim(),
    pn: payment.payeeName.trim(),
    am: cleanAmount,
    cu: 'INR',
    tn: cleanNote,
    tr: cleanOrderId,
  });
  return p.toString();
}

// Standard UPI link – used inside the QR code (compatible with all UPI apps)
export function upiLink(opts) {
  return `upi://pay?${query(opts)}`;
}

// Google Pay specific deep link
export function gpayLink(opts) {
  const q = query(opts);
  if (isIOS()) return `gpay://upi/pay?${q}`;
  return `intent://pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}

// PhonePe specific deep link (handle matches PhonePe @ybl)
export function phonepeLink(opts) {
  const q = query(opts);
  if (isIOS()) return `phonepe://pay?${q}`;
  return `intent://pay?${q}#Intent;scheme=upi;package=com.phonepe.app;end`;
}

// Paytm specific deep link
export function paytmLink(opts) {
  const q = query(opts);
  if (isIOS()) return `paytmmp://pay?${q}`;
  return `intent://pay?${q}#Intent;scheme=upi;package=net.one97.paytm;end`;
}

import { payment } from '../data/site.js';

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIOS() {
  return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Builds the clean, standard NPCI UPI query string.
 * CRITICAL REQUIREMENTS:
 * 1. ONLY the purchase value in rupees is added to 'am' (e.g. 599.00).
 * 2. NO notes ('tn') - notes field is completely empty!
 * 3. NO transaction reference ('tr') - prevents P2P intent rejection by Google Pay.
 * 4. Proper %20 encoding for payee name so UPI intent parsers do not fail on '+'.
 */
function query({ amount }) {
  const cleanAmount = Number(amount || 0).toFixed(2);
  const upiId = (payment.upiId || 'guruprasath.k1212@ybl').trim();
  const payeeName = (payment.payeeName || 'Sree Kavinya Tex').trim();

  // ONLY pa, pn, am, and cu. Absolutely NO notes (tn) and NO reference (tr).
  return `pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${cleanAmount}&cu=INR`;
}

// Universal standard UPI link – opens payment screen with amount in all UPI apps
export function upiLink(opts) {
  return `upi://pay?${query(opts)}`;
}

// Google Pay specific deep link
export function gpayLink(opts) {
  const q = query(opts);
  if (isIOS()) {
    return `gpay://upi/pay?${q}`;
  }
  // Android intent targeting Google Pay with explicit ACTION_VIEW to land on the payment sheet
  return `intent://pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end`;
}

// PhonePe specific deep link
export function phonepeLink(opts) {
  const q = query(opts);
  if (isIOS()) {
    return `phonepe://pay?${q}`;
  }
  // Android intent targeting PhonePe with explicit ACTION_VIEW
  return `intent://pay?${q}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end`;
}

// Paytm specific deep link
export function paytmLink(opts) {
  const q = query(opts);
  if (isIOS()) {
    return `paytmmp://pay?${q}`;
  }
  // Android intent targeting Paytm with explicit ACTION_VIEW
  return `intent://pay?${q}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end`;
}

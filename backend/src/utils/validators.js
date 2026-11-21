import { HttpError } from './httpError.js';

// Throws a 400 if any field is missing, empty, or not a string
export function requireStrings(body, fields) {
  const missing = fields.filter((f) => typeof body[f] !== 'string' || !body[f].trim());
  if (missing.length) {
    throw new HttpError(400, `Missing or invalid field(s): ${missing.join(', ')}`);
  }
}

export function assertEmail(email) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new HttpError(400, 'Enter a valid email address');
  }
}

// Returns a trimmed string, or '' if the value is not a string
export function optionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Query-string values can be arrays/objects; only accept plain strings
export function queryString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseQty(value, fallback) {
  const qty = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
    throw new HttpError(400, 'Quantity must be a whole number between 1 and 999');
  }
  return qty;
}

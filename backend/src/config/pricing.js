// Business rules for shipping and wholesale pricing.
// These match the placeholder numbers shown on the website. Change them here when final.

export const FREE_SHIPPING_ABOVE = 1999; // ₹
export const SHIPPING_FEE = 99; // ₹

// Wholesale customers must order at least this many pieces in total
export const WHOLESALE_MIN_QTY = 20;

// Discount applied to the order subtotal, based on total pieces ordered
export const WHOLESALE_SLABS = [
  { minQty: 20, rate: 0.1 },
  { minQty: 50, rate: 0.15 },
  { minQty: 100, rate: 0.2 },
];

// lines: [{ price, qty }]
export function computeTotals(lines, customerType = 'retail') {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);

  let discountRate = 0;
  if (customerType === 'wholesale') {
    const slab = [...WHOLESALE_SLABS].reverse().find((s) => totalQty >= s.minQty);
    discountRate = slab ? slab.rate : 0;
  }

  const discount = Math.round(subtotal * discountRate);
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

  return {
    subtotal,
    discount,
    shipping,
    total: afterDiscount + shipping,
    totalQty,
    meetsMinimum: customerType === 'wholesale' ? totalQty >= WHOLESALE_MIN_QTY : true,
    minimumQty: customerType === 'wholesale' ? WHOLESALE_MIN_QTY : 1,
  };
}

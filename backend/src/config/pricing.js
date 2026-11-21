// Business rules for retail shipping and order calculation (Meesho-style pure retail).
export const FREE_SHIPPING_ABOVE = 1999; // ₹
export const SHIPPING_FEE = 99; // ₹

// lines: [{ price, qty }]
export function computeTotals(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;

  return {
    subtotal,
    discount: 0,
    shipping,
    total: subtotal + shipping,
    totalQty,
    meetsMinimum: true,
    minimumQty: 1,
  };
}

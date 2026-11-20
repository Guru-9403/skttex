import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getProductById } from '../data/products.js';

const CartContext = createContext(null);
const CART_KEY = 'sv_cart_v1';
const ORDERS_KEY = 'sv_orders_v1';

export const FREE_SHIPPING_ABOVE = 1999;
export const SHIPPING_FEE = 99;

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

const sameLine = (a, b) =>
  a.productId === b.productId && a.size === b.size && a.colorIndex === b.colorIndex;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => load(CART_KEY, []));
  const [orders, setOrders] = useState(() => load(ORDERS_KEY, []));

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);
  useEffect(() => {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch { /* ignore */ }
  }, [orders]);

  const addItem = (line) => {
    setItems((prev) => {
      const found = prev.find((i) => sameLine(i, line));
      if (found) return prev.map((i) => (sameLine(i, line) ? { ...i, qty: i.qty + (line.qty || 1) } : i));
      return [...prev, { colorIndex: 0, qty: 1, ...line }];
    });
  };
  const changeQty = (line, change) =>
    setItems((prev) => prev.map((i) => (sameLine(i, line) ? { ...i, qty: Math.max(1, i.qty + change) } : i)));
  const removeItem = (line) => setItems((prev) => prev.filter((i) => !sameLine(i, line)));
  const clearCart = () => setItems([]);

  // Only keep lines whose product still exists; prices always come from product data
  const lines = useMemo(
    () => items.map((i) => ({ ...i, product: getProductById(i.productId) })).filter((i) => i.product),
    [items]
  );
  const count = lines.reduce((s, i) => s + i.qty, 0);
  const subtotal = lines.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const placeOrder = (order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  return (
    <CartContext.Provider
      value={{ lines, count, subtotal, shipping, total, addItem, changeQty, removeItem, clearCart, orders, placeOrder }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

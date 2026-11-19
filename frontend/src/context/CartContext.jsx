import { createContext, useContext, useState, useEffect } from 'react';
import { getProductById } from '../data/products.js';

const CartContext = createContext(null);

const STORAGE_KEY = 'shree_vastra_cart';
const FREE_SHIPPING_ABOVE = 1999;
const SHIPPING_FEE = 99;

const INITIAL_SAMPLE_CART = [
  { id: '1-L-1', productId: 1, size: 'L', colorIndex: 1, qty: 1 },
  { id: '7-M-0', productId: 7, size: 'M', colorIndex: 0, qty: 2 },
  { id: '16-4-5 Y-1', productId: 16, size: '4-5 Y', colorIndex: 1, qty: 1 },
];

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return INITIAL_SAMPLE_CART;
    } catch {
      return INITIAL_SAMPLE_CART;
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (product, size, colorIndex = 0, qty = 1) => {
    const chosenSize = size || (product.sizes && product.sizes[0]) || 'Standard';
    const chosenColorIndex = typeof colorIndex === 'number' ? colorIndex : 0;
    const cartItemId = `${product.id}-${chosenSize}-${chosenColorIndex}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: Math.min(999, updated[existingIndex].qty + qty),
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          id: cartItemId,
          productId: product.id,
          size: chosenSize,
          colorIndex: chosenColorIndex,
          qty: Math.max(1, qty),
        },
      ];
    });
  };

  const removeFromCart = (cartItemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== cartItemId));
  };

  const updateQty = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, qty: Math.min(999, Math.max(1, newQty)) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = items.reduce((sum, item) => sum + (item.qty || 0), 0);

  // Calculate totals safely
  const subtotal = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return product ? sum + product.price * item.qty : sum;
  }, 0);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        totalItemsCount,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

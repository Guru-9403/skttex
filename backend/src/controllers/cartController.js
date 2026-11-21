import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireStrings, parseQty } from '../utils/validators.js';
import { computeTotals } from '../config/pricing.js';

async function getOrCreateCart(userId) {
  return (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));
}

// Builds the response the frontend cart page needs: lines + totals
async function cartResponse(cart, user) {
  await cart.populate('items.product');

  // Skip items whose product has since been deleted
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      id: item._id,
      product: item.product.toJSON(),
      size: item.size,
      color: item.color,
      qty: item.qty,
      lineTotal: item.product.price * item.qty,
    }));

  const summary = computeTotals(
    items.map((item) => ({ price: item.product.price, qty: item.qty })),
    user.customerType
  );

  return { items, summary };
}

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json(await cartResponse(cart, req.user));
});

// POST /api/cart/items  { productId, size, color, qty }
export const addItem = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['productId', 'size', 'color']);
  const { productId, size, color } = req.body;
  const qty = parseQty(req.body.qty, 1);

  const product = mongoose.isValidObjectId(productId) ? await Product.findById(productId) : null;
  if (!product) throw new HttpError(404, 'Product not found');

  if (!product.sizes.includes(size)) {
    throw new HttpError(400, `Size "${size}" is not available for this product`);
  }
  if (!product.colors.some((c) => c.name === color)) {
    throw new HttpError(400, `Colour "${color}" is not available for this product`);
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (item) => item.product.equals(product._id) && item.size === size && item.color === color
  );

  if (existing) {
    existing.qty = Math.min(999, existing.qty + qty);
  } else {
    cart.items.push({ product: product._id, size, color, qty });
  }

  await cart.save();
  res.status(201).json(await cartResponse(cart, req.user));
});

// PATCH /api/cart/items/:itemId  { qty }
export const updateItem = asyncHandler(async (req, res) => {
  const qty = parseQty(req.body.qty);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new HttpError(404, 'Cart item not found');

  item.qty = qty;
  await cart.save();
  res.json(await cartResponse(cart, req.user));
});

// DELETE /api/cart/items/:itemId
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new HttpError(404, 'Cart item not found');

  cart.items.pull(item._id);
  await cart.save();
  res.json(await cartResponse(cart, req.user));
});

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json(await cartResponse(cart, req.user));
});

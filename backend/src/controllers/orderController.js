import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireStrings, optionalString, queryString } from '../utils/validators.js';
import { computeTotals } from '../config/pricing.js';

const STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function generateOrderNumber() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SV-${time}${random}`;
}

// POST /api/orders  { shippingAddress: {...}, notes }
// Creates an order from the logged-in user's cart, then empties the cart.
export const createOrder = asyncHandler(async (req, res) => {
  const address = req.body.shippingAddress;
  if (!address || typeof address !== 'object') {
    throw new HttpError(400, 'Shipping address is required');
  }
  requireStrings(address, ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']);
  if (!/^\d{6}$/.test(address.pincode.trim())) {
    throw new HttpError(400, 'Enter a valid 6-digit pincode');
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const cartItems = cart ? cart.items.filter((item) => item.product) : [];
  if (cartItems.length === 0) {
    throw new HttpError(400, 'Your cart is empty');
  }

  // Prices always come from the database, never from the request
  const items = cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    size: item.size,
    color: item.color,
    qty: item.qty,
  }));

  const totals = computeTotals(items);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    customerType: 'retail',
    items,
    shippingAddress: {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      line1: address.line1.trim(),
      line2: optionalString(address.line2),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    },
    notes: optionalString(req.body.notes),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
});

// GET /api/orders/mine
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
});

// GET /api/orders/:id  (the owner, or an admin)
export const getOrder = asyncHandler(async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) ? await Order.findById(req.params.id) : null;
  const allowed = order && (req.user.role === 'admin' || order.user.equals(req.user._id));
  if (!allowed) throw new HttpError(404, 'Order not found');

  res.json({ order });
});

// GET /api/orders?status=  (admin)
export const listAllOrders = asyncHandler(async (req, res) => {
  const filter = {};
  const status = queryString(req.query.status);
  if (status) filter.status = status;

  const orders = await Order.find(filter).populate('user', 'name email phone customerType businessName').sort({
    createdAt: -1,
  });
  res.json({ orders });
});

// PATCH /api/orders/:id/status  { status, paymentStatus } (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) ? await Order.findById(req.params.id) : null;
  if (!order) throw new HttpError(404, 'Order not found');

  const { status, paymentStatus } = req.body;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    }
    order.status = status;
  }
  if (paymentStatus !== undefined) {
    if (!['pending', 'paid'].includes(paymentStatus)) {
      throw new HttpError(400, 'paymentStatus must be "pending" or "paid"');
    }
    order.paymentStatus = paymentStatus;
  }

  await order.save();
  res.json({ order });
});

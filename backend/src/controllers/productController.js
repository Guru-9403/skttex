import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockItem from '../models/StockItem.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { queryString, escapeRegex } from '../utils/validators.js';

const EDITABLE_FIELDS = [
  'itemCode',
  'stockItemId',
  'name',
  'category',
  'type',
  'price',
  'oldPrice',
  'sizes',
  'colors',
  'image',
  'tint',
  'fabric',
  'description',
  'featured',
  'inStock',
  'currentStock',
];

// Only allow known fields. The API uses "isNew", the database field is "newArrival".
function pickProductData(body) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  if (body.isNew !== undefined) data.newArrival = body.isNew;
  return data;
}

async function findProductOr404(id) {
  const product = mongoose.isValidObjectId(id) ? await Product.findById(id) : null;
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
}

// GET /api/products?category=&type=&q=&featured=&isNew=&sort=&page=&limit=
export const listProducts = asyncHandler(async (req, res) => {
  // Enforce single source of truth: only items present in Admin StockItem are valid
  const activeStockItems = await StockItem.find({}, { name: 1, itemCode: 1, _id: 1 });
  const activeStockIds = activeStockItems.map((s) => s._id);
  const activeStockCodes = activeStockItems.map((s) => s.itemCode).filter(Boolean);
  const activeStockNames = activeStockItems.map((s) => s.name).filter(Boolean);

  // Automatically delete any orphan products from the database that don't exist in stock
  if (activeStockItems.length > 0) {
    await Product.deleteMany({
      stockItemId: { $nin: activeStockIds },
      itemCode: { $nin: activeStockCodes },
      name: { $nin: activeStockNames },
    });
  } else {
    await Product.deleteMany({});
  }

  const filter = {};

  const category = queryString(req.query.category);
  const type = queryString(req.query.type);
  const q = queryString(req.query.q);

  if (category) filter.category = category;
  if (type) filter.type = type;
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.isNew === 'true') filter.newArrival = true;
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { type: regex }, { category: regex }];
  }

  const sorts = {
    'price-low': { price: 1, _id: 1 },
    'price-high': { price: -1, _id: 1 },
    newest: { createdAt: -1, _id: 1 },
  };
  const sort = sorts[queryString(req.query.sort)] || { featured: -1, _id: 1 };

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await findProductOr404(req.params.id);
  res.json({ product });
});

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pickProductData(req.body));
  res.status(201).json({ product });
});

// PUT /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  await findProductOr404(req.params.id);
  const product = await Product.findByIdAndUpdate(req.params.id, pickProductData(req.body), {
    new: true,
    runValidators: true,
  });
  res.json({ product });
});

// DELETE /api/products/:id (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findProductOr404(req.params.id);
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});

import StockItem from '../models/StockItem.js';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { generateStockExcelWorkbook } from '../utils/excelGenerator.js';

// Auto-seed initial stock items from existing products if the stock collection is empty
export const autoSeedStockIfNeeded = async (userId) => {
  const count = await StockItem.countDocuments();
  if (count > 0) return;

  const products = await Product.find();
  if (!products || products.length === 0) return;

  const itemsToCreate = [];
  const transactionsToCreate = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const catCode = (p.category || 'GEN').substring(0, 3).toUpperCase();
    const itemCode = `SKT-${catCode}-${String(i + 1).padStart(3, '0')}`;
    const openingStock = 30 + (i % 5) * 10; // realistic initial quantities: 30, 40, 50, etc.
    const purchasePrice = Math.round(p.price * 0.6); // 40% margin estimate
    const sellingPrice = p.price;

    const item = new StockItem({
      itemCode,
      name: p.name,
      category: p.category || 'General',
      unit: 'Pieces',
      openingStock,
      totalInward: 0,
      totalOutward: 0,
      currentStock: openingStock,
      lowStockThreshold: 10,
      purchasePrice,
      sellingPrice,
      description: p.description || `${p.name} - ${p.category} ${p.type}`,
      status: openingStock <= 10 ? 'Low Stock' : 'In Stock',
      createdBy: userId,
    });

    itemsToCreate.push(item);
  }

  const savedItems = await StockItem.insertMany(itemsToCreate);

  // Create opening stock transaction records for audit trail
  for (const item of savedItems) {
    transactionsToCreate.push({
      stockItem: item._id,
      itemCode: item.itemCode,
      itemName: item.name,
      category: item.category,
      type: 'INWARD',
      quantity: item.openingStock,
      unit: item.unit,
      unitPrice: item.purchasePrice,
      totalAmount: item.openingStock * item.purchasePrice,
      referenceNumber: 'OPENING-BALANCE',
      partyName: 'Initial Inventory Setup',
      notes: 'Initial opening stock migrated from product catalog',
      stockBefore: 0,
      stockAfter: item.openingStock,
      createdBy: userId,
      createdByName: 'System Admin',
    });
  }

  if (transactionsToCreate.length > 0) {
    await StockTransaction.insertMany(transactionsToCreate);
  }
};

/**
 * GET /api/stock/dashboard
 * Aggregated dashboard metrics & alerts
 */
export const getStockDashboard = asyncHandler(async (req, res) => {
  // Ensure we have initial data if database is fresh
  await autoSeedStockIfNeeded(req.user?._id);

  const items = await StockItem.find().sort({ name: 1 });

  let totalItems = items.length;
  let availableStock = 0;
  let totalInward = 0;
  let totalOutward = 0;
  let totalStockValue = 0;
  let totalSellingValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;

  const lowStockItems = [];
  const outOfStockItems = [];
  const categoryMap = {};

  for (const item of items) {
    availableStock += item.currentStock;
    totalInward += item.totalInward;
    totalOutward += item.totalOutward;
    totalStockValue += item.currentStock * item.purchasePrice;
    totalSellingValue += item.currentStock * item.sellingPrice;

    if (item.currentStock === 0) {
      outOfStockCount++;
      outOfStockItems.push(item);
    } else if (item.currentStock <= item.lowStockThreshold) {
      lowStockCount++;
      lowStockItems.push(item);
    } else {
      inStockCount++;
    }

    const cat = item.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        category: cat,
        itemCount: 0,
        currentStock: 0,
        inward: 0,
        outward: 0,
        valuation: 0,
      };
    }
    categoryMap[cat].itemCount++;
    categoryMap[cat].currentStock += item.currentStock;
    categoryMap[cat].inward += item.totalInward;
    categoryMap[cat].outward += item.totalOutward;
    categoryMap[cat].valuation += item.currentStock * item.purchasePrice;
  }

  const categoryBreakdown = Object.values(categoryMap);

  // Recent 10 transactions
  const recentTransactions = await StockTransaction.find()
    .sort({ date: -1, createdAt: -1 })
    .limit(10);

  const metrics = {
    totalItems,
    totalCurrentStock: availableStock,
    totalInwardStock: totalInward,
    totalOutwardStock: totalOutward,
    totalStockPurchaseValue: Math.round(totalStockValue),
    totalStockSellingValue: Math.round(totalSellingValue),
    lowStockItems: lowStockCount,
    outOfStockItems: outOfStockCount,
    inStockItems: inStockCount,
  };

  res.json({
    totalItems,
    availableStock,
    totalInward,
    totalOutward,
    totalStockValue: Math.round(totalStockValue),
    totalSellingValue: Math.round(totalSellingValue),
    lowStockCount,
    outOfStockCount,
    inStockCount,
    lowStockItems,
    lowStockAlerts: lowStockItems,
    outOfStockItems,
    categoryBreakdown,
    recentTransactions,
    metrics,
  });
});

/**
 * GET /api/stock/items
 * List all stock items with filtering and search
 */
export const getStockItems = asyncHandler(async (req, res) => {
  await autoSeedStockIfNeeded(req.user?._id);

  const { search, category, status } = req.query;
  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (status && status !== 'All') {
    filter.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { itemCode: { $regex: s, $options: 'i' } },
    ];
  }

  const items = await StockItem.find(filter).sort({ name: 1 });
  res.json({ count: items.length, items });
});

/**
 * GET /api/stock/items/:id
 * Get single item and its transaction history
 */
export const getStockItemById = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  if (!item) {
    throw new HttpError(404, 'Stock item not found');
  }

  const transactions = await StockTransaction.find({ stockItem: item._id })
    .sort({ date: -1, createdAt: -1 })
    .limit(50);

  res.json({ item, transactions });
});

/**
 * POST /api/stock/items
 * Create a new stock item (Admin only)
 */
export const createStockItem = asyncHandler(async (req, res) => {
  const {
    itemCode,
    name,
    category,
    unit = 'Pieces',
    type = 'General',
    image = '',
    openingStock = 0,
    lowStockThreshold = 10,
    purchasePrice,
    sellingPrice,
    description,
  } = req.body;

  if (!itemCode || !itemCode.trim()) {
    throw new HttpError(400, 'Item code (SKU) is required');
  }
  if (!name || !name.trim()) {
    throw new HttpError(400, 'Item name is required');
  }
  if (purchasePrice === undefined || purchasePrice < 0) {
    throw new HttpError(400, 'Valid purchase price is required');
  }
  if (sellingPrice === undefined || sellingPrice < 0) {
    throw new HttpError(400, 'Valid selling price is required');
  }

  const cleanCode = itemCode.trim().toUpperCase();
  const existing = await StockItem.findOne({ itemCode: cleanCode });
  if (existing) {
    throw new HttpError(400, `Item with code "${cleanCode}" already exists.`);
  }

  const opStock = Math.max(0, Number(openingStock) || 0);

  const item = new StockItem({
    itemCode: cleanCode,
    name: name.trim(),
    category: category || 'General',
    unit: unit || 'Pieces',
    type: type || 'General',
    image: image || '',
    openingStock: opStock,
    totalInward: 0,
    totalOutward: 0,
    currentStock: opStock,
    lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 10),
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    description: description ? description.trim() : '',
    status: opStock === 0 ? 'Out of Stock' : opStock <= lowStockThreshold ? 'Low Stock' : 'In Stock',
    createdBy: req.user._id,
  });

  await item.save();

  // If opening stock > 0, log an initial inward balance transaction
  if (opStock > 0) {
    await StockTransaction.create({
      stockItem: item._id,
      itemCode: item.itemCode,
      itemName: item.name,
      category: item.category,
      type: 'INWARD',
      quantity: opStock,
      unit: item.unit,
      unitPrice: item.purchasePrice,
      totalAmount: opStock * item.purchasePrice,
      referenceNumber: 'OPENING-BALANCE',
      partyName: 'Initial Inventory Setup',
      notes: 'Initial opening stock entry',
      stockBefore: 0,
      stockAfter: opStock,
      createdBy: req.user._id,
      createdByName: req.user.name || 'Admin',
    });
  }

  // Sync to customer storefront Product catalog if requested
  if (req.body.addToStore !== false) {
    try {
      const catMap = {
        Sarees: 'Women',
        Kurtas: 'Men',
        Suits: 'Women',
        Men: 'Men',
        Women: 'Women',
        Kids: 'Kids',
        General: 'Women',
      };
      await Product.create({
        name: item.name,
        category: catMap[item.category] || (['Men', 'Women', 'Kids'].includes(item.category) ? item.category : 'Women'),
        type: item.type || 'Clothing',
        price: item.sellingPrice,
        oldPrice: Math.round(item.sellingPrice * 1.25),
        sizes: req.body.sizes
          ? typeof req.body.sizes === 'string'
            ? req.body.sizes.split(',').map((s) => s.trim()).filter(Boolean)
            : req.body.sizes
          : ['Free Size'],
        colors: [{ name: 'Standard', hex: '#b8405e' }],
        fabric: req.body.fabric || 'Cotton Blend',
        image: item.image || '',
        tint: '#fdf5f7',
        description: item.description || item.name,
        featured: true,
        newArrival: true,
      });
    } catch (syncErr) {
      console.warn('Could not sync stock item to storefront products:', syncErr.message);
    }
  }

  res.status(201).json({ message: 'Stock item created successfully', item });
});

/**
 * PUT /api/stock/items/:id
 * Edit stock item details (Admin only)
 */
export const updateStockItem = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  if (!item) {
    throw new HttpError(404, 'Stock item not found');
  }

  const {
    name,
    category,
    unit,
    openingStock,
    lowStockThreshold,
    purchasePrice,
    sellingPrice,
    description,
  } = req.body;

  if (name !== undefined) item.name = name.trim();
  if (category !== undefined) item.category = category.trim();
  if (unit !== undefined) item.unit = unit.trim();
  if (description !== undefined) item.description = description.trim();
  if (purchasePrice !== undefined) item.purchasePrice = Math.max(0, Number(purchasePrice));
  if (sellingPrice !== undefined) item.sellingPrice = Math.max(0, Number(sellingPrice));
  if (lowStockThreshold !== undefined) item.lowStockThreshold = Math.max(0, Number(lowStockThreshold));

  // If opening stock is being adjusted, verify it will not produce negative stock
  if (openingStock !== undefined) {
    const newOpening = Math.max(0, Number(openingStock));
    const projectedStock = newOpening + item.totalInward - item.totalOutward;
    if (projectedStock < 0) {
      throw new HttpError(
        400,
        `Cannot change opening stock to ${newOpening}. With total inward of ${item.totalInward} and outward of ${item.totalOutward}, current stock would become negative (${projectedStock}).`
      );
    }
    item.openingStock = newOpening;
  }

  item.updatedBy = req.user._id;
  item.recalculateStock();
  await item.save();

  // Keep storefront Product in sync if it exists
  try {
    await Product.findOneAndUpdate(
      { name: item.name },
      {
        price: item.sellingPrice,
        oldPrice: Math.round(item.sellingPrice * 1.25),
        image: item.image || '',
        fabric: req.body.fabric,
        description: item.description,
      }
    );
  } catch (e) {
    console.warn('Failed to update storefront Product sync:', e.message);
  }

  res.json({ message: 'Stock item updated successfully', item });
});

/**
 * DELETE /api/stock/items/:id
 * Delete stock item (Admin only - protected against items with movements)
 */
export const deleteStockItem = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  if (!item) {
    throw new HttpError(404, 'Stock item not found');
  }

  // Check if transactions other than initial opening balance exist
  const transCount = await StockTransaction.countDocuments({
    stockItem: item._id,
    referenceNumber: { $ne: 'OPENING-BALANCE' },
  });

  if (transCount > 0) {
    throw new HttpError(
      400,
      `Cannot delete "${item.name}" because it has ${transCount} inward/outward transactions. Items with transaction history must be preserved for audit compliance.`
    );
  }

  // Delete opening transaction and item
  await StockTransaction.deleteMany({ stockItem: item._id });
  await StockItem.findByIdAndDelete(item._id);

  res.json({ message: `Item "${item.name}" deleted successfully` });
});

/**
 * POST /api/stock/inward
 * Record new inward stock received (Admin only)
 */
export const recordInwardStock = asyncHandler(async (req, res) => {
  const {
    stockItemId,
    quantity,
    unitPrice,
    referenceNumber = '',
    partyName = '',
    notes = '',
    date,
  } = req.body;

  if (!stockItemId) {
    throw new HttpError(400, 'Please select a stock item');
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0 || !Number.isFinite(qty)) {
    throw new HttpError(400, 'Inward quantity must be a positive number greater than 0');
  }

  const item = await StockItem.findById(stockItemId);
  if (!item) {
    throw new HttpError(404, 'Selected stock item not found');
  }

  const price = unitPrice !== undefined && unitPrice !== '' ? Number(unitPrice) : item.purchasePrice;
  const stockBefore = item.currentStock;

  // Update Stock Item
  item.totalInward += qty;
  item.updatedBy = req.user._id;
  item.recalculateStock();
  await item.save();

  // Create Transaction Record
  const transaction = await StockTransaction.create({
    stockItem: item._id,
    itemCode: item.itemCode,
    itemName: item.name,
    category: item.category,
    type: 'INWARD',
    quantity: qty,
    unit: item.unit,
    unitPrice: price,
    totalAmount: qty * price,
    referenceNumber: referenceNumber.trim(),
    partyName: partyName.trim(),
    notes: notes.trim(),
    stockBefore,
    stockAfter: item.currentStock,
    date: date ? new Date(date) : new Date(),
    createdBy: req.user._id,
    createdByName: req.user.name || 'Admin',
  });

  res.status(201).json({
    message: `Successfully received ${qty} ${item.unit} of "${item.name}". Current stock is now ${item.currentStock}.`,
    item,
    transaction,
  });
});

/**
 * POST /api/stock/outward
 * Record outward stock issued or sold (Admin only)
 * CRITICAL RULE: Never allow negative stock!
 */
export const recordOutwardStock = asyncHandler(async (req, res) => {
  const {
    stockItemId,
    quantity,
    unitPrice,
    referenceNumber = '',
    partyName = '',
    notes = '',
    date,
  } = req.body;

  if (!stockItemId) {
    throw new HttpError(400, 'Please select a stock item');
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0 || !Number.isFinite(qty)) {
    throw new HttpError(400, 'Outward quantity must be a positive number greater than 0');
  }

  const item = await StockItem.findById(stockItemId);
  if (!item) {
    throw new HttpError(404, 'Selected stock item not found');
  }

  // STRICT NEGATIVE STOCK PREVENTION
  if (qty > item.currentStock) {
    throw new HttpError(
      400,
      `Insufficient Stock! Cannot issue ${qty} ${item.unit || 'units'} of "${item.name}". Only ${item.currentStock} ${item.unit || 'units'} currently available in stock.`
    );
  }

  const price = unitPrice !== undefined && unitPrice !== '' ? Number(unitPrice) : item.sellingPrice;
  const stockBefore = item.currentStock;

  // Update Stock Item
  item.totalOutward += qty;
  item.updatedBy = req.user._id;
  item.recalculateStock();
  await item.save();

  // Create Transaction Record
  const transaction = await StockTransaction.create({
    stockItem: item._id,
    itemCode: item.itemCode,
    itemName: item.name,
    category: item.category,
    type: 'OUTWARD',
    quantity: qty,
    unit: item.unit,
    unitPrice: price,
    totalAmount: qty * price,
    referenceNumber: referenceNumber.trim(),
    partyName: partyName.trim(),
    notes: notes.trim(),
    stockBefore,
    stockAfter: item.currentStock,
    date: date ? new Date(date) : new Date(),
    createdBy: req.user._id,
    createdByName: req.user.name || 'Admin',
  });

  res.status(201).json({
    message: `Successfully issued ${qty} ${item.unit} of "${item.name}". Current stock is now ${item.currentStock}.`,
    item,
    transaction,
  });
});

/**
 * GET /api/stock/transactions
 * Retrieve inward/outward transaction history with filters
 */
export const getStockTransactions = asyncHandler(async (req, res) => {
  const { type, category, stockItemId, startDate, endDate, limit = 200 } = req.query;
  const filter = {};

  if (type && type !== 'ALL') {
    filter.type = type.toUpperCase();
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (stockItemId) {
    filter.stockItem = stockItemId;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      filter.date.$lte = eDate;
    }
  }

  const transactions = await StockTransaction.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .limit(Number(limit) || 200);

  res.json({ count: transactions.length, transactions });
});

/**
 * GET /api/stock/export
 * Download complete multi-sheet Excel (.xlsx) file accurately matching database
 * Supports category and date filters
 */
export const exportStockExcel = asyncHandler(async (req, res) => {
  const { category, startDate, endDate } = req.query;

  // 1. Fetch matching stock items
  const itemFilter = {};
  if (category && category !== 'All') {
    itemFilter.category = category;
  }
  const stockItems = await StockItem.find(itemFilter).sort({ category: 1, name: 1 });

  // 2. Fetch matching transactions
  const transFilter = {};
  if (category && category !== 'All') {
    transFilter.category = category;
  }
  if (startDate || endDate) {
    transFilter.date = {};
    if (startDate) transFilter.date.$gte = new Date(startDate);
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      transFilter.date.$lte = eDate;
    }
  }

  const allTransactions = await StockTransaction.find(transFilter).sort({ date: -1 });

  const inwardTransactions = allTransactions.filter((t) => t.type === 'INWARD');
  const outwardTransactions = allTransactions.filter((t) => t.type === 'OUTWARD');

  // 3. Compute exact summary
  let availableStock = 0;
  let totalInward = 0;
  let totalOutward = 0;
  let totalStockValue = 0;
  let totalSellingValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let inStockCount = 0;

  const catMap = {};

  for (const item of stockItems) {
    availableStock += item.currentStock;
    totalInward += item.totalInward;
    totalOutward += item.totalOutward;
    totalStockValue += item.currentStock * item.purchasePrice;
    totalSellingValue += item.currentStock * item.sellingPrice;

    if (item.currentStock === 0) outOfStockCount++;
    else if (item.currentStock <= item.lowStockThreshold) lowStockCount++;
    else inStockCount++;

    const c = item.category || 'General';
    if (!catMap[c]) {
      catMap[c] = {
        category: c,
        itemCount: 0,
        currentStock: 0,
        inward: 0,
        outward: 0,
        valuation: 0,
      };
    }
    catMap[c].itemCount++;
    catMap[c].currentStock += item.currentStock;
    catMap[c].inward += item.totalInward;
    catMap[c].outward += item.totalOutward;
    catMap[c].valuation += item.currentStock * item.purchasePrice;
  }

  const summary = {
    totalItems: stockItems.length,
    availableStock,
    totalInward,
    totalOutward,
    totalStockValue: Math.round(totalStockValue),
    totalSellingValue: Math.round(totalSellingValue),
    lowStockCount,
    outOfStockCount,
    inStockCount,
    categoryBreakdown: Object.values(catMap),
  };

  // 4. Generate multi-sheet .xlsx buffer
  const excelBuffer = generateStockExcelWorkbook({
    stockItems,
    inwardTransactions,
    outwardTransactions,
    summary,
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `SreeKavinyaTex_StockReport_${category && category !== 'All' ? category + '_' : ''}${timestamp}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', excelBuffer.length);

  res.end(excelBuffer);
});

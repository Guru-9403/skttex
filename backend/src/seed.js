// Loads the sample products from the frontend into MongoDB
// and optionally creates an admin account.
//
// Usage:  npm run seed
// WARNING: this deletes all existing products first.

import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import User from './models/User.js';
import StockItem from './models/StockItem.js';
import StockTransaction from './models/StockTransaction.js';
import { autoSeedStockIfNeeded } from './controllers/stockController.js';
import { products as sampleProducts } from '../../frontend/src/data/products.js';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is missing. Copy .env.example to .env first.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

await Product.deleteMany({});
// Drop the numeric sample id (MongoDB creates its own) and rename isNew -> newArrival
await Product.insertMany(sampleProducts.map(({ id, isNew, ...rest }) => ({ ...rest, newArrival: isNew })));
console.log(`Seeded ${sampleProducts.length} products`);

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
let adminUser = null;
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const email = ADMIN_EMAIL.trim().toLowerCase();
  adminUser = await User.findOne({ email });
  if (adminUser) {
    console.log(`Admin ${email} already exists`);
  } else {
    adminUser = await User.create({ name: 'Store Admin', email, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Created admin account: ${email}`);
  }
} else {
  console.log('No ADMIN_EMAIL / ADMIN_PASSWORD set, skipping admin creation');
}

// Clear and seed Stock Items
await StockItem.deleteMany({});
await StockTransaction.deleteMany({});
await autoSeedStockIfNeeded(adminUser?._id);
const stockCount = await StockItem.countDocuments();
console.log(`Seeded ${stockCount} stock items with opening balances`);

await mongoose.disconnect();

import { Router } from 'express';
import {
  getStockDashboard,
  getStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  recordInwardStock,
  recordOutwardStock,
  getStockTransactions,
  exportStockExcel,
} from '../controllers/stockController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Strict security: all stock management operations require admin role
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard & metrics
router.get('/dashboard', getStockDashboard);

// Excel export
router.get('/export', exportStockExcel);

// Inward & outward movements
router.post('/inward', recordInwardStock);
router.post('/outward', recordOutwardStock);
router.get('/transactions', getStockTransactions);

// Stock Items CRUD
router.get('/items', getStockItems);
router.post('/items', createStockItem);
router.get('/items/:id', getStockItemById);
router.put('/items/:id', updateStockItem);
router.delete('/items/:id', deleteStockItem);

export default router;

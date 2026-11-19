import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/', restrictTo('admin'), listAllOrders);
router.get('/mine', myOrders); // must stay above "/:id"
router.get('/:id', getOrder);
router.patch('/:id/status', restrictTo('admin'), updateOrderStatus);

export default router;

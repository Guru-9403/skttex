import { Router } from 'express';
import {
  createWholesaleEnquiry,
  createContactMessage,
  listEnquiries,
  updateEnquiryStatus,
} from '../controllers/enquiryController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public forms
router.post('/wholesale', formLimiter, createWholesaleEnquiry);
router.post('/contact', formLimiter, createContactMessage);

// Admin only
router.get('/', protect, restrictTo('admin'), listEnquiries);
router.patch('/:id/status', protect, restrictTo('admin'), updateEnquiryStatus);

export default router;

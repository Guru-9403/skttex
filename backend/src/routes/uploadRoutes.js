import { Router } from 'express';
import multer from 'multer';
import { uploadProductImage, removeImage } from '../controllers/uploadController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const router = Router();

// Upload image to Cloudinary (Admin only)
router.post('/', protect, restrictTo('admin'), upload.single('image'), uploadProductImage);

// Delete image from Cloudinary (Admin only)
router.delete('/', protect, restrictTo('admin'), removeImage);

export default router;

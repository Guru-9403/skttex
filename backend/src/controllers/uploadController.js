import { uploadImage, deleteImage } from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

/**
 * POST /api/upload
 * Upload an image file (multipart) or base64 data URI / URL to Cloudinary
 */
export const uploadProductImage = asyncHandler(async (req, res) => {
  let fileSource = null;

  if (req.file) {
    fileSource = req.file.buffer;
  } else if (req.body && (req.body.image || req.body.file)) {
    fileSource = req.body.image || req.body.file;
  }

  if (!fileSource) {
    throw new HttpError(400, 'Please provide an image file or data URI');
  }

  try {
    const folder = req.body.folder || 'shree-vastra/products';
    const result = await uploadImage(fileSource, { folder });

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // If the error is due to Cloudinary permission or credential issue
    const message = error.message || 'Image upload failed';
    throw new HttpError(500, `Cloudinary upload failed: ${message}`);
  }
});

/**
 * DELETE /api/upload
 * Delete an image from Cloudinary by publicId
 */
export const removeImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    throw new HttpError(400, 'Public ID is required');
  }

  const result = await deleteImage(publicId);
  res.json({ success: true, result });
});

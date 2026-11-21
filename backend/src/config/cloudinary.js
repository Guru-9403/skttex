import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'rsjsxs77',
  api_key: process.env.CLOUDINARY_API_KEY || '182764324886545',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'iEWsOadTknVUzQJbZq9VrWbA40s',
  secure: true,
});

/**
 * Uploads a file buffer or base64 data to Cloudinary
 * @param {Buffer|string} fileSource - Buffer from multer or data URI / remote URL string
 * @param {object} options - Options like folder, public_id, transformation
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadImage = (fileSource, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'shree-vastra/products',
      resource_type: 'image',
      ...options,
    };

    if (Buffer.isBuffer(fileSource)) {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      uploadStream.end(fileSource);
    } else {
      cloudinary.uploader.upload(fileSource, uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    }
  });
};

/**
 * Deletes an image by publicId from Cloudinary
 * @param {string} publicId
 * @returns {Promise<object>}
 */
export const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;

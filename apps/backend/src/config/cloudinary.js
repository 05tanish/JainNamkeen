import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import logger from '../utils/logger.js';

// Configure Cloudinary — supports both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true, // Always use HTTPS
    });
    logger.info(`☁️  Cloudinary configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
} else if (process.env.CLOUDINARY_URL) {
    // CLOUDINARY_URL is automatically consumed by the SDK — no manual config needed
    logger.info('☁️  Cloudinary configured via CLOUDINARY_URL');
} else {
    logger.warn('⚠️  Cloudinary credentials missing — image uploads will fail');
}

// Multer + Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'sangam_products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
});

// Multer + Cloudinary storage for review images
const reviewStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'sangam_reviews',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }],
    },
});

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

const imageFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false);
    }
};

export const uploadCloudinary = multer({
    storage: productStorage,
    limits: { fileSize: FILE_SIZE_LIMIT },
    fileFilter: imageFilter,
});

export const uploadReviewImages = multer({
    storage: reviewStorage,
    limits: { fileSize: FILE_SIZE_LIMIT },
    fileFilter: imageFilter,
});

export default cloudinary;

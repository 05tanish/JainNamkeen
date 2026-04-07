import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
// It will automatically pick up process.env.CLOUDINARY_URL if defined properly,
// or we can manually configure it using CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (process.env.NODE_ENV === 'development') {
        console.log("CLOUDINARY CONFIG:", {
            cloud: process.env.CLOUDINARY_CLOUD_NAME,
            key: process.env.CLOUDINARY_API_KEY,
        });
    }
} else {
    console.warn('⚠️  Cloudinary credentials missing. Image uploads will fail.');
}

// Setup Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sangam_products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
    },
});

export const uploadCloudinary = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default cloudinary;

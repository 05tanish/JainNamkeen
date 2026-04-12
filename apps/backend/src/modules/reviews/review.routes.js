import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import auth from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { reviewSchema } from './review.schema.js';
import {
    createReview, getProductReviews, updateReview, deleteReview,
    getAllReviewsAdmin, replyToReview, getReviewAnalytics,
} from './review.controller.js';

// ── Upload: review images at <project-root>/uploads/reviews/
const reviewDir = path.join(process.cwd(), 'uploads', 'reviews');
if (!fs.existsSync(reviewDir)) fs.mkdirSync(reviewDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, reviewDir),
    filename: (_req, file, cb) =>
        cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const imageFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('Only JPEG, PNG and WEBP images are allowed'), false);
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFilter,
});

const router = express.Router();

// ── Public routes
router.get('/product/:id', getProductReviews);

// ── Analytics (before /:id to avoid param clash)
router.get('/analytics/highlights', auth, role('admin'), getReviewAnalytics);

// ── Admin routes
router.get('/admin', auth, role('admin', 'staff'), getAllReviewsAdmin);
router.patch('/:id/reply', auth, role('admin'), replyToReview);

// ── Auth-required routes
router.post('/product/:id', auth, upload.array('images', 3), validate(reviewSchema), createReview);
router.put('/:id', auth, upload.array('images', 3), validate(reviewSchema.partial()), updateReview);
router.delete('/:id', auth, deleteReview);

export default router;

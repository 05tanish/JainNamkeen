import express from 'express';
import auth from '../../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import role from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { reviewSchema } from './review.schema.js';
import { 
    createReview, getProductReviews, updateReview, deleteReview,
    getAllReviewsAdmin, replyToReview, getReviewAnalytics
} from './review.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directory exists relative to current file (../../../uploads/reviews)
const reviewUploadsDir = path.join(__dirname, '../../../uploads/reviews');
if (!fs.existsSync(reviewUploadsDir)) {
    fs.mkdirSync(reviewUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, reviewUploadsDir),
    filename: (req, file, cb) => cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1000)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const router = express.Router();

router.get('/product/:id', getProductReviews);
router.post('/product/:id', auth, upload.array('images', 3), validate(reviewSchema), createReview);
router.put('/:id', auth, upload.array('images', 3), validate(reviewSchema.partial()), updateReview);
router.delete('/:id', auth, deleteReview);

// Admin/Staff Routes
router.get('/admin', auth, role('admin', 'staff'), getAllReviewsAdmin);
router.patch('/:id/reply', auth, role('admin'), replyToReview);
router.get('/analytics/highlights', auth, role('admin'), getReviewAnalytics);

export default router;

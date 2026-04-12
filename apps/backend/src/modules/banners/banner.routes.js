import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import auth from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { bannerSchema } from './banner.schema.js';
import {
    createBanner, getBanners, updateBanner,
    deleteBanner, toggleBannerStatus
} from './banner.controller.js';

// ── Upload: banners stored at <project-root>/uploads/banners/
// process.cwd() = apps/backend, then go up one level to project root
const bannerDir = path.join(process.cwd(), 'uploads', 'banners');
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, bannerDir),
    filename: (_req, file, cb) =>
        cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`),
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

router.get('/', getBanners);
router.post('/', auth, role('admin'), upload.single('image'), validate(bannerSchema), createBanner);
router.put('/:id', auth, role('admin'), upload.single('image'), validate(bannerSchema.partial()), updateBanner);
router.delete('/:id', auth, role('admin'), deleteBanner);
router.put('/:id/toggle', auth, role('admin'), toggleBannerStatus);

export default router;

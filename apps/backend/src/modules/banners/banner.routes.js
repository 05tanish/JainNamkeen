import express from 'express';
import auth from '../../middleware/auth.js';
import role from '../../middleware/role.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import validate from '../../middleware/validate.js';
import { bannerSchema } from './banner.schema.js';
import { createBanner, getBanners, updateBanner, deleteBanner, toggleBannerStatus } from './banner.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Destination is root/uploads relative to src/modules/banners (../../../uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../uploads')),
    filename: (req, file, cb) => cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const router = express.Router();

router.post('/', auth, role('admin'), upload.single('image'), validate(bannerSchema), createBanner);
router.get('/', getBanners);
router.put('/:id', auth, role('admin'), upload.single('image'), validate(bannerSchema.partial()), updateBanner);
router.delete('/:id', auth, role('admin'), deleteBanner);
router.put('/:id/toggle', auth, role('admin'), toggleBannerStatus);

export default router;

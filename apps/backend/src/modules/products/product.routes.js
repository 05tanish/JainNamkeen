import express from 'express';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import { uploadCloudinary } from '../../config/cloudinary.js';
import { validate } from '../../middleware/validate.js';
import { productSchema, updateProductSchema } from './product.schema.js';
import {
    getProducts, getAllProducts, getProduct,
    createProduct, updateProduct, deleteProduct,
    toggleProductStatus, getTrending, getAutoSuggest, getAllTags,
    uploadImages, removeImage
} from './product.controller.js';

const router = express.Router();

// Public — discovery endpoints (must be BEFORE /:id)
router.get('/trending', getTrending);
router.get('/suggest', getAutoSuggest);
router.get('/tags', getAllTags);

// Public — list & detail
router.get('/', getProducts);
router.get('/all', auth, role('admin', 'staff'), getAllProducts);
router.get('/:id', getProduct);

// Admin/Staff — CRUD
router.post('/upload-images', auth, role('admin', 'staff'), uploadCloudinary.array('images', 5), uploadImages);
router.post('/remove-image', auth, role('admin', 'staff'), removeImage);

router.post('/', auth, role('admin', 'staff'), validate(productSchema), createProduct);
router.put('/:id', auth, role('admin', 'staff'), validate(updateProductSchema), updateProduct);
router.delete('/:id', auth, role('admin'), deleteProduct);
router.put('/:id/status', auth, role('admin'), toggleProductStatus);

export default router;

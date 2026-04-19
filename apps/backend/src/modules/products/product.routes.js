import express from 'express';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import { uploadCloudinary } from '../../config/cloudinary.js';
import { validate } from '../../middleware/validate.js';
import { productSchema, updateProductSchema, variantSchema } from './product.schema.js';
import {
    getProducts, getAllProducts, getProduct,
    createProduct, updateProduct, deleteProduct,
    toggleProductStatus, getTrending, getAutoSuggest, getAllTags,
    uploadImages, removeImage,
    getVariants, createVariant, updateVariant, deleteVariant,
    setDefaultVariant, migrateProduct
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
// Variant routes
router.get('/:id/variants', getVariants);
router.post('/:id/variants', auth, role('admin', 'staff'), validate(variantSchema), createVariant);
router.put('/:id/variants/:variantId/set-default', auth, role('admin', 'staff'), setDefaultVariant);
router.put('/:id/variants/:variantId', auth, role('admin', 'staff'), validate(variantSchema.partial()), updateVariant);
router.delete('/:id/variants/:variantId', auth, role('admin'), deleteVariant);
router.post('/:id/migrate', auth, role('admin'), migrateProduct);

router.delete('/:id', auth, role('admin'), deleteProduct);
router.put('/:id/status', auth, role('admin'), toggleProductStatus);

export default router;

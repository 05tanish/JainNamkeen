import express from 'express';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import { categorySchema } from './category.schema.js';
import {
    getCategories, getCategory,
    createCategory, updateCategory, deleteCategory
} from './category.controller.js';

const router = express.Router();

// Public
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin only
router.post('/', auth, role('admin'), validate(categorySchema), createCategory);
router.put('/:id', auth, role('admin'), validate(categorySchema.partial()), updateCategory);
router.delete('/:id', auth, role('admin'), deleteCategory);

export default router;

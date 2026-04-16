import express from 'express';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import { validate } from '../../middleware/validate.js';
import { pageSchema } from './page.schema.js';
import { createPage, getPages, getPageBySlug, updatePage, deletePage } from './page.controller.js';

const router = express.Router();

router.get('/', auth, role('admin'), getPages);
router.post('/', auth, role('admin'), validate(pageSchema), createPage);
router.put('/:id', auth, role('admin'), validate(pageSchema.partial()), updatePage);
router.delete('/:id', auth, role('admin'), deletePage);

// Public route for storefront to fetch a page by its slug
router.get('/:slug', getPageBySlug);

export default router;

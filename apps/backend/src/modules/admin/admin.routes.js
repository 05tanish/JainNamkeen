import express from 'express';
import auth from '../../middleware/auth.js';
import role from '../../middleware/role.js';
import { getConversionRate, getLowStockAlerts, getRefundStats } from './admin.controller.js';

const router = express.Router();

router.get('/conversion-rate', auth, role('admin'), getConversionRate);
router.get('/low-stock', auth, role('admin'), getLowStockAlerts);
router.get('/refund-stats', auth, role('admin'), getRefundStats);

export default router;

import express from 'express';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import { getConversionRate, getLowStockAlerts, getRefundStats, getSystemStatus } from './admin.controller.js';

const router = express.Router();

router.get('/conversion-rate', auth, role('admin'), getConversionRate);
router.get('/low-stock', auth, role('admin'), getLowStockAlerts);
router.get('/refund-stats', auth, role('admin'), getRefundStats);
router.get('/system-status', auth, role('admin'), getSystemStatus);

export default router;

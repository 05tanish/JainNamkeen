import express from 'express';
import { z } from 'zod';
import auth from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import {
    createOrderSchema,
    updateOrderStatusSchema,
    refundSchema,
    trackingSchema,
    requestReturnSchema,
} from './order.schema.js';
import {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    getOrderStats,
    processRefund,
    updateTracking,
    requestReturn,
} from './order.controller.js';

const router = express.Router();

// Must be before /:id routes
router.get('/stats', auth, role('admin', 'staff'), getOrderStats);

router.post('/', auth, validate(createOrderSchema), createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrder);

router.put('/:id/status', auth, role('admin', 'staff'), validate(updateOrderStatusSchema), updateOrderStatus);
router.put('/:id/refund', auth, role('admin'), validate(refundSchema), processRefund);
router.put('/:id/tracking', auth, role('admin', 'staff'), validate(trackingSchema), updateTracking);
router.put('/:id/request-return', auth, validate(requestReturnSchema), requestReturn);

export default router;

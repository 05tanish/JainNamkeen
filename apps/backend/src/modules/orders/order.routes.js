import express from 'express';
import { z } from 'zod';
import auth from '../../middleware/auth.js';
import role from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { 
    createOrderSchema, 
    updateOrderStatusSchema, 
    refundSchema, 
    trackingSchema 
} from './order.schema.js';
import {
    createOrder, getOrders, getOrder,
    updateOrderStatus, getOrderStats,
    processRefund, updateTracking, requestReturn
} from './order.controller.js';

const router = express.Router();

// Stats (admin/staff) — must be before :id route
router.get('/stats', auth, role('admin', 'staff'), getOrderStats);

// User creates order
router.post('/', auth, validate(createOrderSchema), createOrder);

// List orders (user sees own, admin/staff see all)
router.get('/', auth, getOrders);

// Get single order
router.get('/:id', auth, getOrder);

// Update status (admin/staff)
router.put('/:id/status', auth, role('admin', 'staff'), validate(updateOrderStatusSchema), updateOrderStatus);

// Refund handling (admin)
router.put('/:id/refund', auth, role('admin'), validate(refundSchema), processRefund);

// Tracking update (admin/staff)
router.put('/:id/tracking', auth, role('admin', 'staff'), validate(trackingSchema), updateTracking);

// User requests return (validation handled via refundReason in order.schema if needed, 
// using a simple schema for now).
router.put('/:id/request-return', auth, validate(z.object({ refundReason: z.string().min(1) })), requestReturn);

export default router;

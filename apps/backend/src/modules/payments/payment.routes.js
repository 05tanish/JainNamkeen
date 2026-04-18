import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import {
    createPaymentOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentDetails,
    initiateRefund,
    handleWebhook
} from './payment.controller.js';

const router = Router();

// Create payment order (authenticated users)
router.post('/create-order', auth, createPaymentOrder);

// Verify payment (authenticated users)
router.post('/verify', auth, verifyPayment);

// Handle payment failure (authenticated users)
router.post('/failure', auth, handlePaymentFailure);

// Initiate refund (admin only) — must be before /:paymentId to avoid param clash
router.post('/refund', auth, requireRole(['ADMIN']), initiateRefund);

// Webhook endpoint (no auth - verified by signature) — must be before /:paymentId
router.post('/webhook', handleWebhook);

// Get payment details (authenticated users) — keep last since it's a catch-all param
router.get('/:paymentId', auth, getPaymentDetails);

export default router;

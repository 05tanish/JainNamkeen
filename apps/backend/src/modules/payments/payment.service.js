import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

// Lazy Razorpay initializer — avoids crash when env vars are missing at startup
let _razorpay = null;
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new ApiError(503, 'Payment gateway not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    if (!_razorpay) {
        _razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return _razorpay;
};

class PaymentService {
    /**
     * Create Razorpay order for payment
     */
    static async createPaymentOrder(orderId, userId) {
        try {
            // Get order details
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { user: { select: { name: true, email: true, phone: true } } }
            });

            if (!order) throw new ApiError(404, 'Order not found');
            if (order.userId !== userId) throw new ApiError(403, 'Not authorized');
            if (order.paymentStatus === 'PAID') {
                throw new ApiError(400, 'Order already paid');
            }

            // Create Razorpay order
            const razorpayOrder = await getRazorpay().orders.create({
                amount: Math.round(Number(order.totalAmount) * 100), // Convert to paise
                currency: 'INR',
                receipt: `order_${orderId}`,
                notes: {
                    orderId: orderId,
                    userId: userId,
                    customerEmail: order.user.email,
                    customerName: order.user.name
                }
            });

            // Store Razorpay order ID in database
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    razorpayOrderId: razorpayOrder.id
                }
            });

            logger.info(`Razorpay order created: ${razorpayOrder.id} for order: ${orderId}`);

            return {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                customerName: order.user.name,
                customerEmail: order.user.email,
                customerPhone: order.user.phone || ''
            };
        } catch (error) {
            logger.error('Failed to create Razorpay order', error);
            throw error;
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    static async verifyPayment(orderId, paymentData) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

            // Verify signature
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            const isValid = expectedSignature === razorpay_signature;

            if (!isValid) {
                logger.warn(`Invalid payment signature for order: ${orderId}`);
                throw new ApiError(400, 'Invalid payment signature');
            }

            // Update order payment status
            const order = await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'PAID',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    paidAt: new Date()
                },
                include: {
                    items: true,
                    user: { select: { name: true, email: true } }
                }
            });

            logger.info(`Payment verified for order: ${orderId}, payment: ${razorpay_payment_id}`);

            return order;
        } catch (error) {
            logger.error('Payment verification failed', error);
            throw error;
        }
    }

    /**
     * Handle payment failure
     */
    static async handlePaymentFailure(orderId, errorData) {
        try {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'UNPAID',
                    paymentError: JSON.stringify(errorData)
                }
            });

            logger.warn(`Payment failed for order: ${orderId}`, errorData);
        } catch (error) {
            logger.error('Failed to handle payment failure', error);
            throw error;
        }
    }

    /**
     * Get payment details
     */
    static async getPaymentDetails(paymentId) {
        try {
            const payment = await getRazorpay().payments.fetch(paymentId);
            return payment;
        } catch (error) {
            logger.error('Failed to fetch payment details', error);
            throw new ApiError(500, 'Failed to fetch payment details');
        }
    }

    /**
     * Initiate refund
     */
    static async initiateRefund(orderId, amount, reason) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!order) throw new ApiError(404, 'Order not found');
            if (order.paymentStatus !== 'PAID') {
                throw new ApiError(400, 'Order not paid, cannot refund');
            }
            if (!order.razorpayPaymentId) {
                throw new ApiError(400, 'No payment ID found');
            }

            // Create refund in Razorpay
            const refund = await getRazorpay().payments.refund(order.razorpayPaymentId, {
                amount: Math.round(Number(amount) * 100), // Convert to paise
                notes: {
                    reason: reason,
                    orderId: orderId
                }
            });

            // Update order
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'REFUNDED',
                    refundStatus: 'COMPLETED',
                    refundAmount: amount,
                    refundReason: reason,
                    refundedAt: new Date(),
                    razorpayRefundId: refund.id
                }
            });

            logger.info(`Refund initiated for order: ${orderId}, refund: ${refund.id}`);

            return refund;
        } catch (error) {
            logger.error('Refund initiation failed', error);
            throw error;
        }
    }

    /**
     * Webhook handler for Razorpay events
     */
    static async handleWebhook(body, signature) {
        try {
            // Verify webhook signature
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
                .update(JSON.stringify(body))
                .digest('hex');

            if (expectedSignature !== signature) {
                throw new ApiError(400, 'Invalid webhook signature');
            }

            const event = body.event;
            const payload = body.payload.payment.entity;

            logger.info(`Webhook received: ${event}`);

            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(payload);
                    break;
                case 'refund.created':
                    await this.handleRefundCreated(payload);
                    break;
                default:
                    logger.info(`Unhandled webhook event: ${event}`);
            }

            return { success: true };
        } catch (error) {
            logger.error('Webhook handling failed', error);
            throw error;
        }
    }

    static async handlePaymentCaptured(payload) {
        const orderId = payload.notes.orderId;
        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'PAID',
                    paidAt: new Date()
                }
            });
            logger.info(`Payment captured for order: ${orderId}`);
        }
    }

    static async handlePaymentFailed(payload) {
        const orderId = payload.notes.orderId;
        if (orderId) {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'UNPAID',
                    paymentError: payload.error_description
                }
            });
            logger.warn(`Payment failed for order: ${orderId}`);
        }
    }

    static async handleRefundCreated(payload) {
        logger.info(`Refund created: ${payload.id}`);
    }
}

export default PaymentService;

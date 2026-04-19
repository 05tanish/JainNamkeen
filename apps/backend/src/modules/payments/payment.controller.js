import { asyncHandler } from '../../utils/asyncHandler.js';
import * as PaymentService from './payment.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const createPaymentOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.body;
    const userId = req.user.id;

    const paymentOrder = await PaymentService.createPaymentOrder(orderId, userId);

    res.status(200).json(
        new ApiResponse(200, paymentOrder, 'Payment order created successfully')
    );
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId, paymentData } = req.body;

    const order = await PaymentService.verifyPayment(orderId, paymentData);

    res.status(200).json(
        new ApiResponse(200, order, 'Payment verified successfully')
    );
});

export const handlePaymentFailure = asyncHandler(async (req, res) => {
    const { orderId, errorData } = req.body;

    await PaymentService.handlePaymentFailure(orderId, errorData);

    res.status(200).json(
        new ApiResponse(200, null, 'Payment failure recorded')
    );
});

export const getPaymentDetails = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const payment = await PaymentService.getPaymentDetails(paymentId);

    res.status(200).json(
        new ApiResponse(200, payment, 'Payment details fetched successfully')
    );
});

export const initiateRefund = asyncHandler(async (req, res) => {
    const { orderId, amount, reason } = req.body;

    const refund = await PaymentService.initiateRefund(orderId, amount, reason);

    res.status(200).json(
        new ApiResponse(200, refund, 'Refund initiated successfully')
    );
});

export const handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];

    await PaymentService.handleWebhook(req.body, signature);

    res.status(200).json({ success: true });
});

import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import OrderService from './order.service.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.createOrder(req.user._id, req.body);
    successResponse(res, { statusCode: 201, data: order, message: 'Order placed successfully' });
});

// GET /api/orders
export const getOrders = asyncHandler(async (req, res) => {
    const orders = await OrderService.getOrders(req.user, req.query);
    successResponse(res, { statusCode: 200, data: { orders }, message: 'Orders fetched' });
});

// GET /api/orders/stats
export const getOrderStats = asyncHandler(async (req, res) => {
    const stats = await OrderService.getOrderStats();
    successResponse(res, { statusCode: 200, data: stats, message: 'Order stats fetched' });
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.getOrder(req.params.id, req.user);
    successResponse(res, { statusCode: 200, data: order, message: 'Order fetched' });
});

// PUT /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user._id);
    successResponse(res, { statusCode: 200, data: order, message: 'Order status updated' });
});

// PUT /api/orders/:id/refund
export const processRefund = asyncHandler(async (req, res) => {
    const order = await OrderService.processRefund(req.params.id, req.body, req.user._id);
    successResponse(res, { statusCode: 200, data: order, message: 'Refund processed' });
});

// PUT /api/orders/:id/tracking
export const updateTracking = asyncHandler(async (req, res) => {
    const order = await OrderService.updateTracking(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: order, message: 'Tracking updated' });
});

// PUT /api/orders/:id/request-return
export const requestReturn = asyncHandler(async (req, res) => {
    const order = await OrderService.requestReturn(req.params.id, req.body.refundReason, req.user);
    successResponse(res, { statusCode: 200, data: order, message: 'Return requested' });
});

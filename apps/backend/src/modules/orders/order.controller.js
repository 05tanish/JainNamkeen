import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as OrderService from './order.service.js';

export const createOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.createOrder(req.user.id, req.body);
    successResponse(res, { statusCode: 201, data: order, message: 'Order placed successfully' });
});

export const getOrders = asyncHandler(async (req, res) => {
    const result = await OrderService.getOrders(req.user, req.query);
    // result already contains { orders: [...], pagination: {...} }
    // Don't wrap it again in { orders: result }
    successResponse(res, { statusCode: 200, data: result, message: 'Orders fetched' });
});

export const getOrderStats = asyncHandler(async (req, res) => {
    const stats = await OrderService.getOrderStats();
    successResponse(res, { statusCode: 200, data: stats, message: 'Order stats fetched' });
});

export const getOrder = asyncHandler(async (req, res) => {
    const order = await OrderService.getOrder(req.params.id, req.user);
    successResponse(res, { statusCode: 200, data: order, message: 'Order fetched' });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user.id);
    successResponse(res, { statusCode: 200, data: order, message: 'Order status updated' });
});

export const processRefund = asyncHandler(async (req, res) => {
    const order = await OrderService.processRefund(req.params.id, req.body, req.user.id);
    successResponse(res, { statusCode: 200, data: order, message: 'Refund processed' });
});

export const updateTracking = asyncHandler(async (req, res) => {
    const order = await OrderService.updateTracking(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: order, message: 'Tracking updated' });
});

export const requestReturn = asyncHandler(async (req, res) => {
    const order = await OrderService.requestReturn(req.params.id, req.body.refundReason, req.user);
    successResponse(res, { statusCode: 200, data: order, message: 'Return requested' });
});

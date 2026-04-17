import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as AdminService from './admin.service.js';

export const getConversionRate = asyncHandler(async (req, res) => {
    const data = await AdminService.getConversionRate();
    successResponse(res, { statusCode: 200, data: data, message: 'Conversion rate fetched' });
});

export const getLowStockAlerts = asyncHandler(async (req, res) => {
    const data = await AdminService.getLowStockAlerts();
    successResponse(res, { statusCode: 200, data: data, message: 'Low stock alerts fetched' });
});

export const getRefundStats = asyncHandler(async (req, res) => {
    const data = await AdminService.getRefundStats();
    successResponse(res, { statusCode: 200, data: data, message: 'Refund stats fetched' });
});

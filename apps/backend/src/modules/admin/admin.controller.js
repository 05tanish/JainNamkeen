import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import AdminService from './admin.service.js';

// GET /api/admin/conversion-rate
export const getConversionRate = asyncHandler(async (req, res) => {
    const data = await AdminService.getConversionRate();
    successResponse(res, { statusCode: 200, data: data, message: 'Conversion rate fetched' });
});

// GET /api/admin/low-stock
export const getLowStockAlerts = asyncHandler(async (req, res) => {
    const data = await AdminService.getLowStockAlerts();
    successResponse(res, { statusCode: 200, data: data, message: 'Low stock alerts fetched' });
});

// GET /api/admin/refund-stats
export const getRefundStats = asyncHandler(async (req, res) => {
    const data = await AdminService.getRefundStats();
    successResponse(res, { statusCode: 200, data: data, message: 'Refund stats fetched' });
});

import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as CouponService from './coupon.service.js';

export const createCoupon = asyncHandler(async (req, res) => {
    const coupon = await CouponService.createCoupon(req.body);
    successResponse(res, { statusCode: 201, data: coupon, message: 'Coupon created' });
});

export const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await CouponService.getCoupons();
    successResponse(res, { statusCode: 200, data: coupons, message: 'Coupons fetched' });
});

export const getActiveCoupons = asyncHandler(async (req, res) => {
    const coupons = await CouponService.getActiveCoupons();
    successResponse(res, { statusCode: 200, data: coupons, message: 'Active coupons fetched' });
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await CouponService.updateCoupon(req.params.id, req.body);
    successResponse(res, { statusCode: 200, data: coupon, message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
    await CouponService.deleteCoupon(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Coupon deleted' });
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
    const coupon = await CouponService.toggleCouponStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: coupon, message: `Coupon ${coupon.isActive ? 'enabled' : 'disabled'}` });
});

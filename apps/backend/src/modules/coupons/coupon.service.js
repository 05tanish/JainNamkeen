import Coupon from './coupon.model.js';
import ApiError from '../../utils/ApiError.js';

class CouponService {
    static async createCoupon(data) {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validUntil, usageLimit } = data;
        if (!code) throw new ApiError(400, 'Coupon code is required');
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) throw new ApiError(409, 'Coupon code already exists');
        return Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            validFrom: validFrom || Date.now(),
            validUntil,
            usageLimit: usageLimit || null,
        });
    }

    static async getCoupons() {
        return Coupon.find().sort({ createdAt: -1 });
    }

    static async getActiveCoupons() {
        const today = new Date();
        return Coupon.find({
            isActive: true,
            validUntil: { $gte: today },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
            ],
        }).sort({ createdAt: -1 });
    }

    static async updateCoupon(id, data) {
        const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
        if (!coupon) throw new ApiError(404, 'Coupon not found');
        return coupon;
    }

    static async deleteCoupon(id) {
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) throw new ApiError(404, 'Coupon not found');
    }

    static async toggleCouponStatus(id) {
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new ApiError(404, 'Coupon not found');
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        return coupon;
    }
}

export default CouponService;

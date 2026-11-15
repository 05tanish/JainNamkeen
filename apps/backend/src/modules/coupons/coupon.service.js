import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

export const createCoupon = async (data) => {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validUntil, usageLimit } = data;
    
    if (!code) throw new ApiError(400, 'Coupon code is required');
    
    const codeUpper = code.toUpperCase();
    const existing = await prisma.coupon.findUnique({
        where: { code: codeUpper }
    });

    if (existing) throw new ApiError(409, 'Coupon code already exists');

    return prisma.coupon.create({
        data: {
            code: codeUpper,
            discountType: discountType.toUpperCase(),
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            validFrom: validFrom ? new Date(validFrom) : new Date(),
            validUntil: new Date(validUntil),
            usageLimit: usageLimit || null
        }
    });
};

export const getCoupons = async () => {
    return prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

export const getActiveCoupons = async () => {
    const today = new Date();
    return prisma.coupon.findMany({
        where: {
            isActive: true,
            validUntil: { gte: today }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateCoupon = async (id, data) => {
    const updateData = { ...data };
    if (data.discountType) {
        updateData.discountType = data.discountType.toUpperCase();
    }
    if (data.validFrom) {
        updateData.validFrom = new Date(data.validFrom);
    }
    if (data.validUntil) {
        updateData.validUntil = new Date(data.validUntil);
    }

    const coupon = await prisma.coupon.update({
        where: { id },
        data: updateData
    }).catch((err) => {
        if (err.code === 'P2025') throw new ApiError(404, 'Coupon not found');
        throw err;
    });

    return coupon;
};

export const deleteCoupon = async (id) => {
    await prisma.coupon.delete({
        where: { id }
    }).catch((err) => {
        if (err.code === 'P2025') throw new ApiError(404, 'Coupon not found');
        throw err;
    });
};

export const toggleCouponStatus = async (id) => {
    const coupon = await prisma.coupon.findUnique({
        where: { id }
    });

    if (!coupon) throw new ApiError(404, 'Coupon not found');

    return prisma.coupon.update({
        where: { id },
        data: { isActive: !coupon.isActive }
    });
};

export const validateCoupon = async (code, orderAmount = 0) => {
    if (!code) throw new ApiError(400, 'Coupon code is required');

    const coupon = await prisma.coupon.findUnique({
        where: { code: code.trim().toUpperCase() }
    });

    if (!coupon) {
        throw new ApiError(404, 'Invalid coupon code');
    }

    if (!coupon.isActive) {
        throw new ApiError(400, 'This coupon is inactive');
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
        throw new ApiError(400, 'This coupon promotion has not started yet');
    }

    if (new Date(coupon.validUntil) < now) {
        throw new ApiError(400, 'This coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, 'Coupon usage limit has been reached');
    }

    const amount = Number(orderAmount) || 0;
    if (amount < Number(coupon.minOrderAmount || 0)) {
        throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
    }

    let discount = 0;
    if (coupon.discountType === 'FLAT') {
        discount = Math.min(amount, Number(coupon.discountValue));
    } else {
        const raw = (amount * Number(coupon.discountValue)) / 100;
        const cap = coupon.maxDiscount ? Number(coupon.maxDiscount) : Infinity;
        discount = Math.min(raw, cap);
    }
    discount = Math.round(discount * 100) / 100;

    return {
        valid: true,
        discount,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            minOrderAmount: Number(coupon.minOrderAmount),
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        }
    };
};

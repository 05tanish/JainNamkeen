import Coupon from './coupon.model.js';

// POST /api/coupons
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validUntil, usageLimit } = req.body;
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            validFrom: validFrom || Date.now(),
            validUntil,
            usageLimit: usageLimit || null
        });
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/coupons
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/coupons/:id
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/coupons/:id/toggle
export const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/coupons/active
// Public: Get all active, valid coupons for frontend display
export const getActiveCoupons = async (req, res) => {
    try {
        const today = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            validUntil: { $gte: today },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
            ]
        }).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

import express from 'express';
import auth from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { couponSchema } from './coupon.schema.js';
import { createCoupon, getCoupons, updateCoupon, deleteCoupon, toggleCouponStatus, getActiveCoupons } from './coupon.controller.js';

const router = express.Router();

router.get('/active', getActiveCoupons);

router.post('/', auth, role('admin'), validate(couponSchema), createCoupon);
router.get('/', auth, role('admin'), getCoupons);
router.put('/:id', auth, role('admin'), validate(couponSchema.partial()), updateCoupon);
router.delete('/:id', auth, role('admin'), deleteCoupon);
router.put('/:id/toggle', auth, role('admin'), toggleCouponStatus);

export default router;

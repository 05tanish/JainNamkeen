import { z } from 'zod';

const datePreprocess = z.preprocess(arg => {
    if (!arg) return undefined;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date());

export const couponSchema = z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').trim().toUpperCase(),
    // Model enum: 'percentage' | 'flat' — NOT 'fixed'
    discountType: z.enum(['percentage', 'flat'], {
        errorMap: () => ({ message: "discountType must be 'percentage' or 'flat'" }),
    }),
    discountValue: z.coerce.number().min(0, 'Discount value must be >= 0'),
    minOrderAmount: z.coerce.number().min(0).optional().default(0),
    maxDiscount: z.coerce.number().min(0).nullable().optional().default(null),
    validFrom: datePreprocess.optional().default(() => new Date()),
    validUntil: datePreprocess,
    usageLimit: z.coerce.number().int().min(1).nullable().optional().default(null),
});

import { z } from 'zod';

export const couponSchema = z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').toUpperCase().trim(),
    discountType: z.enum(['percentage', 'flat']),
    discountValue: z.number().min(0),
    minOrderAmount: z.number().min(0).optional().default(0),
    maxDiscount: z.number().min(0).nullable().optional().default(null),
    validFrom: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional().default(() => new Date())),
    validUntil: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    usageLimit: z.number().nullable().optional().default(null)
});

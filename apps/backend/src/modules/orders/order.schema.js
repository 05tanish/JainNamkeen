import { z } from 'zod';

export const createOrderSchema = z.object({
    items: z
        .array(
            z.object({
                // Prisma uses CUIDs (25 chars), not MongoDB ObjectIds (24 chars)
                product: z
                    .string()
                    .min(1, 'Product ID is required'),
                variantId: z.string().nullable().optional(),
                name: z.string().optional(),
                price: z.coerce.number().min(0).optional(),
                quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
                image: z.string().optional(),
            })
        )
        .min(1, 'Order must contain at least one item'),
    totalAmount: z.coerce.number().min(0),
    shippingAddress: z.object({
        name: z.string().min(1, 'Recipient name is required').trim(),
        street: z.string().min(1, 'Street is required').trim(),
        city: z.string().min(1, 'City is required').trim(),
        state: z.string().min(1, 'State is required').trim(),
        pincode: z
            .string()
            .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
        phone: z
            .string()
            .regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
    }),
    paymentMethod: z.enum(['cod', 'online']).default('cod'),
    couponCode: z.string().trim().transform(v => v.toUpperCase()).nullable().optional(),
});

export const updateOrderStatusSchema = z.object({
    // Accept both cases and normalize to uppercase for the service
    status: z.string().transform(v => v.toUpperCase()).pipe(
        z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    ),
});

export const refundSchema = z.object({
    // Accept both cases and normalize to uppercase for the service
    refundStatus: z.string().transform(v => v.toUpperCase()).pipe(
        z.enum(['NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'])
    ),
    refundReason: z.string().trim().optional(),
    refundAmount: z.coerce.number().min(0).optional(),
});

export const trackingSchema = z.object({
    trackingNumber: z.string().trim().optional(),
    // Accept empty string (clear the URL) or a valid URL
    trackingUrl: z
        .union([z.string().url('Must be a valid URL'), z.literal('')])
        .optional(),
    carrier: z.string().trim().optional(),
});

export const requestReturnSchema = z.object({
    refundReason: z.string().min(1, 'Return reason is required').trim(),
});

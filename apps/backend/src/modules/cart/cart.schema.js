import { z } from 'zod';

export const cartItemSchema = z.object({
    // Prisma uses CUIDs (25 chars), not MongoDB ObjectIds (24 hex chars)
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'), // 0 = remove
});

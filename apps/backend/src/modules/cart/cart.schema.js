import { z } from 'zod';

export const cartItemSchema = z.object({
    productId: z.string().min(24).max(24),
    quantity: z.number().min(1, 'Quantity must be at least 1').default(1)
});

export const updateCartItemSchema = z.object({
    quantity: z.number().min(0, 'Quantity cannot be negative') // 0 means remove
});

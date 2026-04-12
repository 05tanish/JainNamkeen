import { z } from 'zod';

export const cartItemSchema = z.object({
    productId: z.string().length(24, 'productId must be a valid 24-char MongoDB ObjectId'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
});

export const updateCartItemSchema = z.object({
    quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'), // 0 = remove
});

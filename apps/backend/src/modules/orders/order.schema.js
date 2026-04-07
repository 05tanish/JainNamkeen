import { z } from 'zod';

export const createOrderSchema = z.object({
    items: z.array(z.object({
        product: z.string().min(24).max(24),
        name: z.string(),
        price: z.coerce.number().min(0),
        quantity: z.coerce.number().min(1),
        image: z.string().optional()
    })).min(1, 'Order must contain at least one item'),
    totalAmount: z.coerce.number().min(0),
    shippingAddress: z.object({
        name: z.string().min(1, 'Recipient name is required'),
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().min(6, 'Pincode must be 6 digits').max(6),
        phone: z.string().min(10, 'Phone number is required')
    }),
    paymentMethod: z.enum(['cod', 'online']).default('cod')
});

export const updateOrderStatusSchema = z.object({
    // 'confirmed' exists in the Mongoose enum but was missing here — added to align
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
});

export const refundSchema = z.object({
    // 'rejected' added to Mongoose model (order.model.js) to match this schema
    refundStatus: z.enum(['none', 'requested', 'approved', 'rejected', 'completed']),
    refundReason: z.string().optional(),
    refundAmount: z.coerce.number().min(0).optional()
});

export const trackingSchema = z.object({
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional().or(z.literal('')),
    carrier: z.string().optional()
});

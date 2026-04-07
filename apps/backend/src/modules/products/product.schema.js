import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required').trim(),
    description: z.string().min(1, 'Product description is required').trim(),
    price: z.coerce.number().min(0, 'Price must be a positive number'),
    stock: z.coerce.number().min(0, 'Stock cannot be negative'),
    category: z.string().min(24, 'Invalid Category ID').max(24), // Expecting 24-char MongoDB ObjectId
    images: z.array(z.object({
        url: z.string().url(),
        public_id: z.string()
    })).optional().default([]),
    brand: z.string().optional().default(''),
    weight: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    isFeatured: z.boolean().optional().default(false),
    lowStockThreshold: z.coerce.number().optional().default(10),
    isActive: z.boolean().optional().default(true)
});

// For update, we want some fields to be optional
export const updateProductSchema = productSchema.partial();

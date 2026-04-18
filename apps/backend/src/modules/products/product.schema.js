import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required').trim(),
    description: z.string().trim().default(''),
    price: z.coerce.number().min(0, 'Price must be >= 0'),
    costPrice: z.coerce.number().min(0).default(0),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
    category: z
        .string()
        .min(1, 'Category is required'),
    images: z
        .array(z.object({ 
            url: z.string().min(1, 'Image URL is required'), 
            public_id: z.string().optional() 
        }))
        .optional()
        .default([]),
    brand: z.string().trim().optional().default('Sangam Namkeen'),
    weight: z.string().trim().optional().default('250g'),
    tags: z.union([
        z.array(z.string().trim().transform(t => t.toLowerCase())),
        // Accept comma-separated string from FormData
        z.string().transform(s =>
            s.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        ),
    ]).optional().default([]),
    isFeatured: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
    lowStockThreshold: z.coerce.number().int().min(0).optional().default(10),
    flashSalePrice: z.coerce.number().min(0).nullable().optional().default(null),
    flashSaleEnd: z
        .preprocess(arg => {
            if (!arg) return null;
            if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        }, z.date().nullable().optional().default(null)),
});

// For update requests all fields are optional
export const updateProductSchema = productSchema.partial();

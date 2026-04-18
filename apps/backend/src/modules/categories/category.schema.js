import { z } from 'zod';

export const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required').trim(),
    description: z.string().optional().default(''),
    // Note: Category model has no isActive field — strip it to avoid Prisma 500
    image: z.string().optional()
});

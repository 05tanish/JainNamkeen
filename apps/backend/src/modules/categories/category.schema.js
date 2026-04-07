import { z } from 'zod';

export const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required').trim(),
    description: z.string().optional().default(''),
    isActive: z.boolean().optional().default(true)
});

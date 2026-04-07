import { z } from 'zod';

export const pageSchema = z.object({
    title: z.string().min(1, 'Page title is required').trim(),
    slug: z.string().min(1, 'Slug is required').toLowerCase().trim(),
    content: z.string().min(1, 'Content is required').trim(),
    isActive: z.boolean().optional().default(true)
});

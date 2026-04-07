import { z } from 'zod';

export const reviewSchema = z.object({
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().min(1, 'Review comment is required').trim(),
    existingImages: z.union([z.string(), z.array(z.string())]).optional()
});

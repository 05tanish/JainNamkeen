import { z } from 'zod';

export const bannerSchema = z.object({
    title: z.string().min(1, 'Banner title is required').trim(),
    subtitle: z.string().optional().default(''),
    link: z.string().optional().default(''),
    position: z.enum(['hero', 'sidebar', 'popup', 'footer']).default('hero'),
    isActive: z.boolean().optional().default(true),
    startDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional().default(() => new Date())),
    endDate: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().nullable().optional().default(null))
});

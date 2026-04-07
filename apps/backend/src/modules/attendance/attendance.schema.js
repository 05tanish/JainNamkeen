import { z } from 'zod';

export const markAttendanceSchema = z.object({
    userId: z.string().min(24).max(24),
    date: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    status: z.enum(['present', 'absent', 'late', 'half-day']),
    note: z.string().optional().default('')
});

export const getAttendanceQuerySchema = z.object({
    userId: z.string().optional(),
    date: z.string().optional(),
    month: z.string().regex(/^\d+$/).transform(Number).optional(),
    year: z.string().regex(/^\d+$/).transform(Number).optional()
});

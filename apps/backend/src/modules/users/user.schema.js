import { z } from 'zod';

export const updateUserRoleSchema = z.object({
    role: z.enum(['user', 'staff', 'admin'])
});

export const suspendUserSchema = z.object({
    isSuspended: z.boolean(),
    suspendReason: z.string().min(1, 'Reason for suspension is required')
});

// Admin might update some basic info too
export const adminUpdateUserSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    isActive: z.boolean().optional()
});

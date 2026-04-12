import { z } from 'zod';

export const updateUserRoleSchema = z.object({
    role: z.enum(['user', 'staff', 'admin']),
});

/**
 * FIX: removed `isSuspended: z.boolean()` — the service sets isSuspended=true
 * internally; frontend only needs to send the optional reason.
 * The old schema required isSuspended from the body which would cause a 400
 * every time a caller omitted it.
 */
export const suspendUserSchema = z.object({
    reason: z.string().min(1, 'Suspension reason is required').max(500),
});

export const adminUpdateUserSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    isActive: z.boolean().optional(),
});

import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please provide a valid email').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional().default('')
});

export const loginSchema = z.object({
    email: z.string().email('Please provide a valid email').toLowerCase(),
    password: z.string()
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    address: z.object({
        street: z.string().optional().default(''),
        city: z.string().optional().default(''),
        state: z.string().optional().default(''),
        pincode: z.string().optional().default('')
    }).optional()
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

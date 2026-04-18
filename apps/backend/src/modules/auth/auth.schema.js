import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please provide a valid email').transform(v => v.toLowerCase()),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional().default('')
});

export const loginSchema = z.object({
    email: z.string().email('Please provide a valid email').transform(v => v.toLowerCase()),
    password: z.string()
});

// Matches the flat fields expected by auth.service.js updateProfile
export const updateProfileSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    phone: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional()
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

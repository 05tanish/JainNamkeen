import { z } from 'zod';

export const notificationSchema = z.object({
    title: z.string().min(1, 'Notification title is required').trim(),
    body: z.string().min(1, 'Notification body is required').trim(),
    type: z.enum(['broadcast', 'promo', 'system', 'email_campaign']).default('broadcast'),
    recipients: z.enum(['all', 'users', 'staff', 'admin']).default('all'),
    subject: z.string().optional().default('')
});

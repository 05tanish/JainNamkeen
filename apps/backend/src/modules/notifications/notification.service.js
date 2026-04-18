import Notification from './notification.model.js';
import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

class NotificationService {
    static async createNotification({ title, body, type, recipients, subject }, createdBy) {
        return Notification.create({
            title,
            body,
            type: type || 'broadcast',
            recipients: recipients || 'all',
            subject: subject || '',
            createdBy: createdBy || null, // Store as string, not ObjectId
        });
    }

    static async getNotifications({ type } = {}) {
        const query = {};
        if (type) query.type = type;
        // Don't populate createdBy since it's not in MongoDB anymore
        return Notification.find(query).sort({ createdAt: -1 });
    }

    static async broadcastNotification(id) {
        const notification = await Notification.findById(id);
        if (!notification) throw new ApiError(404, 'Notification not found');
        notification.isSent = true;
        notification.sentAt = new Date();
        await notification.save();
        return notification;
    }

    static async deleteNotification(id) {
        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) throw new ApiError(404, 'Notification not found');
    }

    static async getUserNotifications(user) {
        try {
            // Get user's read notifications from Prisma
            const userData = await prisma.user.findUnique({
                where: { id: user.id },
                select: { readNotifications: true }
            });
            const readIds = userData?.readNotifications || [];
            const isStaff = ['STAFF', 'ADMIN'].includes(user.role);
            const query = {
                isSent: true,
                type: 'broadcast',
                _id: { $nin: readIds },
                $or: [
                    { recipients: 'all' },
                    { recipients: isStaff ? 'staff' : 'users' },
                ],
            };
            return Notification.find(query).sort({ sentAt: -1 }).limit(20);
        } catch (error) {
            // If there's an error, return empty array instead of crashing
            logger.error('Error fetching notifications:', error);
            return [];
        }
    }

    static async markAllAsRead(user) {
        try {
            const isStaff = ['STAFF', 'ADMIN'].includes(user.role);
            const notifications = await Notification.find({
                isSent: true,
                type: 'broadcast',
                $or: [{ recipients: 'all' }, { recipients: isStaff ? 'staff' : 'users' }],
            }).select('_id');
            const ids = notifications.map(n => n._id.toString());
            
            // Update user's readNotifications in Prisma
            const currentUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { readNotifications: true }
            });
            
            const existingReadIds = currentUser?.readNotifications || [];
            const newReadIds = [...new Set([...existingReadIds, ...ids])];
            
            await prisma.user.update({
                where: { id: user.id },
                data: { readNotifications: newReadIds }
            });
        } catch (error) {
            logger.error('Error marking notifications as read:', error);
            // Don't throw error, just log it
        }
    }
}

export default NotificationService;

import Notification from './notification.model.js';
import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

class NotificationService {
    static async createNotification({ title, body, type, recipients, subject }, createdBy) {
        return Notification.create({
            title,
            body,
            type: type || 'broadcast',
            recipients: recipients || 'all',
            subject: subject || '',
            createdBy,
        });
    }

    static async getNotifications({ type } = {}) {
        const query = {};
        if (type) query.type = type;
        return Notification.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 });
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
    }

    static async markAllAsRead(user) {
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
    }
}

export default NotificationService;

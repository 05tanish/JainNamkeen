import Notification from './notification.model.js';
import User from '../users/user.model.js';
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
        // readNotifications may not exist on old user docs — guard with || []
        const userData = await User.findById(user._id).select('readNotifications');
        const readIds = userData?.readNotifications || [];
        const isStaff = ['staff', 'admin'].includes(user.role);
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
        const isStaff = ['staff', 'admin'].includes(user.role);
        const notifications = await Notification.find({
            isSent: true,
            type: 'broadcast',
            $or: [{ recipients: 'all' }, { recipients: isStaff ? 'staff' : 'users' }],
        }).select('_id');
        const ids = notifications.map(n => n._id);
        await User.findByIdAndUpdate(user._id, {
            $addToSet: { readNotifications: { $each: ids } },
        });
    }
}

export default NotificationService;

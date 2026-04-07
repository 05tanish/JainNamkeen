import Notification from './notification.model.js';
import User from '../users/user.model.js';

// POST /api/notifications
export const createNotification = async (req, res) => {
    try {
        const { title, body, type, recipients, subject } = req.body;
        const notification = new Notification({
            title,
            body,
            type: type || 'broadcast',
            recipients: recipients || 'all',
            subject: subject || '',
            createdBy: req.user._id
        });
        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/notifications
export const getNotifications = async (req, res) => {
    try {
        const { type } = req.query;
        const query = {};
        if (type) query.type = type;
        const notifications = await Notification.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/notifications/:id/send — broadcast a notification
export const broadcastNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        notification.isSent = true;
        notification.sentAt = new Date();
        await notification.save();

        // In a real app, this would trigger push notifications / emails
        res.json({ message: 'Notification broadcast successfully', notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/notifications/user
export const getUserNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const query = {
            isSent: true,
            type: 'broadcast',
            _id: { $nin: user.readNotifications || [] },
            $or: [
                { recipients: 'all' },
                { recipients: req.user.role === 'staff' || req.user.role === 'admin' ? 'staff' : 'users' }
            ]
        };
        const notifications = await Notification.find(query).sort({ sentAt: -1 }).limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/notifications/user/read-all
export const markAllAsRead = async (req, res) => {
    try {
        const query = {
            isSent: true,
            type: 'broadcast',
            $or: [
                { recipients: 'all' },
                { recipients: req.user.role === 'staff' || req.user.role === 'admin' ? 'staff' : 'users' }
            ]
        };
        const notifications = await Notification.find(query).select('_id');
        const notificationIds = notifications.map(n => n._id);

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { readNotifications: { $each: notificationIds } }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

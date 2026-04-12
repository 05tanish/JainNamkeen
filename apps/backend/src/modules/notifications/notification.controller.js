import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import NotificationService from './notification.service.js';

// POST /api/notifications
export const createNotification = asyncHandler(async (req, res) => {
    const notification = await NotificationService.createNotification(req.body, req.user._id);
    successResponse(res, { statusCode: 201, data: notification, message: 'Notification created' });
});

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await NotificationService.getNotifications(req.query);
    successResponse(res, { statusCode: 200, data: notifications, message: 'Notifications fetched' });
});

// PUT /api/notifications/:id/send
export const broadcastNotification = asyncHandler(async (req, res) => {
    const notification = await NotificationService.broadcastNotification(req.params.id);
    successResponse(res, { statusCode: 200, data: notification, message: 'Notification broadcast successfully' });
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
    await NotificationService.deleteNotification(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Notification deleted' });
});

// GET /api/notifications/user
export const getUserNotifications = asyncHandler(async (req, res) => {
    const notifications = await NotificationService.getUserNotifications(req.user);
    successResponse(res, { statusCode: 200, data: notifications, message: 'User notifications fetched' });
});

// PUT /api/notifications/user/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
    await NotificationService.markAllAsRead(req.user);
    successResponse(res, { statusCode: 200, data: null, message: 'All notifications marked as read' });
});

import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as NotificationService from './notification.service.js';

export const createNotification = asyncHandler(async (req, res) => {
    const notification = await NotificationService.createNotification(req.body, req.user.id);
    successResponse(res, { statusCode: 201, data: notification, message: 'Notification created' });
});

export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await NotificationService.getNotifications(req.query);
    successResponse(res, { statusCode: 200, data: notifications, message: 'Notifications fetched' });
});

export const broadcastNotification = asyncHandler(async (req, res) => {
    const notification = await NotificationService.broadcastNotification(req.params.id);
    successResponse(res, { statusCode: 200, data: notification, message: 'Notification broadcast successfully' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
    await NotificationService.deleteNotification(req.params.id);
    successResponse(res, { statusCode: 200, data: null, message: 'Notification deleted' });
});

export const getUserNotifications = asyncHandler(async (req, res) => {
    try {
        const notifications = await NotificationService.getUserNotifications(req.user);
        successResponse(res, { statusCode: 200, data: notifications, message: 'User notifications fetched' });
    } catch (error) {
        // If notifications fail, return empty array instead of error
        logger.warn('Notification fetch error:', error);
        successResponse(res, { statusCode: 200, data: [], message: 'Notifications unavailable' });
    }
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    await NotificationService.markAllAsRead(req.user);
    successResponse(res, { statusCode: 200, data: null, message: 'All notifications marked as read' });
});

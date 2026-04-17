import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as UserService from './user.service.js';

export const getUsers = asyncHandler(async (req, res) => {
    const result = await UserService.getUsers(req.query);
    successResponse(res, { statusCode: 200, data: result, message: 'Users fetched' });
});

export const getUserStats = asyncHandler(async (req, res) => {
    const stats = await UserService.getUserStats();
    successResponse(res, { statusCode: 200, data: stats, message: 'User stats fetched' });
});

export const getUser = asyncHandler(async (req, res) => {
    const user = await UserService.getUser(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: 'User fetched' });
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const user = await UserService.updateUserRole(req.params.id, req.body.role);
    successResponse(res, { statusCode: 200, data: user, message: 'User role updated' });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await UserService.toggleUserStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

export const suspendUser = asyncHandler(async (req, res) => {
    const user = await UserService.suspendUser(req.params.id, req.body.reason);
    successResponse(res, { statusCode: 200, data: user, message: 'User suspended' });
});

export const unsuspendUser = asyncHandler(async (req, res) => {
    const user = await UserService.unsuspendUser(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: 'User unsuspended' });
});

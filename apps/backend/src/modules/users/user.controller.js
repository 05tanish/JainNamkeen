import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import UserService from './user.service.js';

// GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
    const result = await UserService.getUsers(req.query);
    successResponse(res, { statusCode: 200, data: result, message: 'Users fetched' });
});

// GET /api/users/stats
export const getUserStats = asyncHandler(async (req, res) => {
    const stats = await UserService.getUserStats();
    successResponse(res, { statusCode: 200, data: stats, message: 'User stats fetched' });
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req, res) => {
    const user = await UserService.getUser(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: 'User fetched' });
});

// PUT /api/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
    const user = await UserService.updateUserRole(req.params.id, req.body.role);
    successResponse(res, { statusCode: 200, data: user, message: 'User role updated' });
});

// PUT /api/users/:id/status
export const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await UserService.toggleUserStatus(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

// PUT /api/users/:id/suspend
export const suspendUser = asyncHandler(async (req, res) => {
    const user = await UserService.suspendUser(req.params.id, req.body.reason);
    successResponse(res, { statusCode: 200, data: user, message: 'User suspended' });
});

// PUT /api/users/:id/unsuspend
export const unsuspendUser = asyncHandler(async (req, res) => {
    const user = await UserService.unsuspendUser(req.params.id);
    successResponse(res, { statusCode: 200, data: user, message: 'User unsuspended' });
});

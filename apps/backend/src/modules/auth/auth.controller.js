import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import { sendTokenResponse, extractToken } from '../../utils/TokenHelper.js';
import { getCookieOptions } from '../../utils/JWT.js';
import AuthService from './auth.service.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const { user, token } = await AuthService.register({ name, email, password, phone });
    sendTokenResponse(res, user, token, 201, 'Account created successfully');
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login({ email, password });
    sendTokenResponse(res, user, token, 200, 'Logged in successfully');
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user._id);
    successResponse(res, { statusCode: 200, data: user, message: 'Profile fetched' });
});

// PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, address } = req.body;
    const user = await AuthService.updateProfile(req.user._id, { name, phone, address });
    successResponse(res, { statusCode: 200, data: user, message: 'Profile updated' });
});

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user._id, { currentPassword, newPassword });
    successResponse(res, { statusCode: 200, data: null, message: 'Password changed successfully' });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
    // Clear the cookie by setting it to expire immediately
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
    successResponse(res, { statusCode: 200, data: null, message: 'Logged out successfully' });
});

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import { sendTokenResponse, extractToken } from '../../utils/TokenHelper.js';
import { cacheSet } from '../../config/Redis.js';
import * as AuthService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const result = await AuthService.register({ name, email, password, phone });
    successResponse(res, { statusCode: 201, data: result, message: 'Account created. Please verify your email.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const { user, token } = await AuthService.verifyEmail({ email, otp });
    sendTokenResponse(res, user, token, 200, 'Email verified successfully');
});

export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.resendOtp({ email });
    successResponse(res, { statusCode: 200, data: result, message: result.message });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword({ email });
    successResponse(res, { statusCode: 200, data: null, message: result.message });
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword({ email, otp, newPassword });
    successResponse(res, { statusCode: 200, data: null, message: result.message });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login({ email, password });
    sendTokenResponse(res, user, token, 200, 'Logged in successfully');
});

export const getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.id);
    successResponse(res, { statusCode: 200, data: user, message: 'Profile fetched' });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, street, city, state, pincode } = req.body;
    const user = await AuthService.updateProfile(req.user.id, { name, phone, street, city, state, pincode });
    successResponse(res, { statusCode: 200, data: user, message: 'Profile updated' });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, { currentPassword, newPassword });
    successResponse(res, { statusCode: 200, data: null, message: 'Password changed successfully' });
});

export const logout = asyncHandler(async (req, res) => {
    try {
        const token = extractToken(req);
        const decoded = jwt.decode(token);
        if (decoded?.exp) {
            const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
            if (ttlSeconds > 0) {
                const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
                await cacheSet(`bl:${tokenHash}`, '1', ttlSeconds);
            }
        }
    } catch {
        // No token present or already expired
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
    successResponse(res, { statusCode: 200, data: null, message: 'Logged out successfully' });
});

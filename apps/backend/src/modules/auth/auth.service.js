import { prisma } from '../../config/Postgrsedb.js';
import { generateToken } from '../../utils/JWT.js';
import { ApiError } from '../../utils/ApiError.js';
import { validatePassword } from '../../utils/passwordValidator.js';
import { invalidateUserCache } from '../../middleware/auth.js';
import { cacheGet, cacheSet, cacheDel } from '../../config/Redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/emailService.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const OTP_TTL = 600; // 10 minutes

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const register = async ({ name, email, password, phone }) => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        throw new ApiError(400, passwordValidation.error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone?.trim() || null,
            isActive: false, // inactive until email verified
        },
        select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true }
    });

    const otp = generateOtp();
    await cacheSet(`otp:${normalizedEmail}`, otp, OTP_TTL);

    try {
        await sendVerificationEmail(normalizedEmail, user.name, otp);
    } catch {
        // non-fatal — user can resend
    }

    return { requiresVerification: true, email: normalizedEmail };
};

export const verifyEmail = async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const stored = await cacheGet(`otp:${normalizedEmail}`);

    if (!stored) throw new ApiError(400, 'OTP expired or not found. Please request a new one.');
    if (stored !== otp.trim()) throw new ApiError(400, 'Invalid OTP. Please try again.');

    const user = await prisma.user.update({
        where: { email: normalizedEmail },
        data: { isActive: true },
        select: { id: true, name: true, email: true, role: true, phone: true, street: true, city: true, state: true, pincode: true, isActive: true, createdAt: true, updatedAt: true }
    });

    await cacheDel(`otp:${normalizedEmail}`);

    const token = generateToken(user.id);
    return { user, token };
};

export const resendOtp = async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new ApiError(404, 'No account found with this email');
    if (user.isActive) throw new ApiError(400, 'Email is already verified');

    const otp = generateOtp();
    await cacheSet(`otp:${normalizedEmail}`, otp, OTP_TTL);
    await sendVerificationEmail(normalizedEmail, user.name, otp);

    return { message: 'OTP resent successfully' };
};

export const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new ApiError(401, 'Invalid email or password');

    if (!user.isActive) {
        const pendingOtp = await cacheGet(`otp:${normalizedEmail}`);
        if (pendingOtp !== null) {
            throw new ApiError(403, 'Please verify your email before logging in.');
        }
        throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    }

    if (user.isSuspended) {
        throw new ApiError(403, `Your account is suspended. Reason: ${user.suspendReason || 'No reason provided'}`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    return { user: userWithoutPassword, token };
};

export const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, phone: true, street: true, city: true, state: true, pincode: true, isActive: true, createdAt: true, updatedAt: true }
    });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

export const updateProfile = async (userId, { name, phone, street, city, state, pincode }) => {
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (street !== undefined) updates.street = street;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;

    const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: { id: true, name: true, email: true, role: true, phone: true, street: true, city: true, state: true, pincode: true, isActive: true, createdAt: true, updatedAt: true }
    }).catch((err) => {
        if (err.code === 'P2025') throw new ApiError(404, 'User not found');
        throw err;
    });

    await invalidateUserCache(userId);
    return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) throw new ApiError(400, passwordValidation.error);
    if (currentPassword === newPassword) throw new ApiError(400, 'New password must be different from your current password');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await invalidateUserCache(userId);
};

export const forgotPassword = async ({ email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Don't reveal whether the email exists
    if (!user) return { message: 'If that email is registered, an OTP has been sent.' };

    const otp = generateOtp();
    await cacheSet(`pwd_otp:${normalizedEmail}`, otp, OTP_TTL);

    try {
        await sendPasswordResetEmail(normalizedEmail, user.name, otp);
    } catch {
        // non-fatal
    }

    return { message: 'If that email is registered, an OTP has been sent.' };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) throw new ApiError(400, passwordValidation.error);

    const stored = await cacheGet(`pwd_otp:${normalizedEmail}`);
    if (!stored) throw new ApiError(400, 'OTP expired or not found. Please request a new one.');
    if (stored !== otp.trim()) throw new ApiError(400, 'Invalid OTP. Please try again.');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword }
    });

    await cacheDel(`pwd_otp:${normalizedEmail}`);
    await invalidateUserCache((await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }))?.id);

    return { message: 'Password reset successfully. You can now log in.' };
};

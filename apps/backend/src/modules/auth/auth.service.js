import { prisma } from '../../config/Postgrsedb.js';
import { generateToken } from '../../utils/JWT.js';
import { ApiError } from '../../utils/ApiError.js';
import { validatePassword } from '../../utils/passwordValidator.js';
import { invalidateUserCache } from '../../middleware/auth.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

export const register = async ({ name, email, password, phone }) => {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        throw new ApiError(400, passwordValidation.error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone?.trim() || null
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            pincode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    });

    const token = generateToken(user.id);
    return { user, token };
};

export const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (!user) throw new ApiError(401, 'Invalid email or password');

    if (!user.isActive) {
        throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    }

    if (user.isSuspended) {
        throw new ApiError(
            403,
            `Your account is suspended. Reason: ${user.suspendReason || 'No reason provided'}`
        );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id);
    return { user: userWithoutPassword, token };
};

export const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            pincode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
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
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            pincode: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
        }
    }).catch((err) => {
        if (err.code === 'P2025') throw new ApiError(404, 'User not found');
        throw err;
    });

    // Invalidate cache so updated profile is served immediately
    await invalidateUserCache(userId);

    return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        throw new ApiError(400, passwordValidation.error);
    }

    if (currentPassword === newPassword) {
        throw new ApiError(400, 'New password must be different from your current password');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    // Invalidate cache so any role/status checks use fresh data
    await invalidateUserCache(userId);
};

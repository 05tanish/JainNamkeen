import { prisma } from '../../config/Postgrsedb.js';
import { generateToken } from '../../utils/JWT.js';
import { ApiError } from '../../utils/ApiError.js';
import bcrypt from 'bcryptjs';

export const register = async ({ name, email, password, phone }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    });

    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone?.trim() || null
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

    const token = generateToken(user.id);
    return { user, token };
};

export const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId }
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
        data: updates
    }).catch(() => {
        throw new ApiError(404, 'User not found');
    });

    return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
    if (currentPassword === newPassword) {
        throw new ApiError(400, 'New password must be different from your current password');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
};

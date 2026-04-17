import { prisma } from '../../config/Postgrsedb.js';
import { ApiError } from '../../utils/ApiError.js';

const VALID_ROLES = ['USER', 'STAFF', 'ADMIN'];

export const getUsers = async ({ role, search, page = 1, limit = 20 }) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (pageNum < 1) throw new ApiError(400, 'Page must be at least 1');
    if (limitNum < 1 || limitNum > 100) throw new ApiError(400, 'Limit must be between 1 and 100');
    if (role && !VALID_ROLES.includes(role.toUpperCase())) {
        throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const where = {};
    if (role) where.role = role.toUpperCase();
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum
        })
    ]);

    return { users, total, page: pageNum, pages: Math.ceil(total / limitNum) };
};

export const getUser = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });
    if (!user) throw new ApiError(404, 'User not found');
    return user;
};

export const updateUserRole = async (id, role) => {
    const roleUpper = role.toUpperCase();
    if (!VALID_ROLES.includes(roleUpper)) {
        throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const user = await prisma.user.update({
        where: { id },
        data: { role: roleUpper }
    }).catch(() => {
        throw new ApiError(404, 'User not found');
    });

    return user;
};

export const toggleUserStatus = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) throw new ApiError(404, 'User not found');

    return prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive }
    });
};

export const getUserStats = async () => {
    const [totalUsers, totalStaff, totalAdmins, suspendedUsers] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { role: 'STAFF' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { isSuspended: true } })
    ]);

    return { totalUsers, totalStaff, totalAdmins, suspendedUsers };
};

export const suspendUser = async (id, reason) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) throw new ApiError(404, 'User not found');
    if (user.isSuspended) throw new ApiError(400, 'User is already suspended');

    return prisma.user.update({
        where: { id },
        data: {
            isSuspended: true,
            suspendReason: reason || 'No reason provided',
            suspendedAt: new Date()
        }
    });
};

export const unsuspendUser = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) throw new ApiError(404, 'User not found');

    return prisma.user.update({
        where: { id },
        data: {
            isSuspended: false,
            suspendReason: null,
            suspendedAt: null
        }
    });
};

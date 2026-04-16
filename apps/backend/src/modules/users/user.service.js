import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';

const VALID_ROLES = ['user', 'staff', 'admin'];

class UserService {
    /**
     * List users with pagination, search, and role filter.
     */
    static async getUsers({ role, search, page = 1, limit = 20 }) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (pageNum < 1) throw new ApiError(400, 'Page must be at least 1');
        if (limitNum < 1 || limitNum > 100) throw new ApiError(400, 'Limit must be between 1 and 100');
        if (role && !VALID_ROLES.includes(role)) throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
        ]);

        return { users, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    }

    /**
     * Get a single user by ID.
     */
    static async getUser(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
        const user = await User.findById(id);
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    /**
     * Change a user's role.
     */
    static async updateUserRole(id, role) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
        if (!VALID_ROLES.includes(role)) throw new ApiError(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
        const user = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    /**
     * Toggle user active/inactive status.
     */
    static async toggleUserStatus(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
        const user = await User.findById(id);
        if (!user) throw new ApiError(404, 'User not found');
        user.isActive = !user.isActive;
        await user.save();
        return user;
    }

    /**
     * Get aggregate user stats.
     */
    static async getUserStats() {
        const [totalUsers, totalStaff, totalAdmins, suspendedUsers] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'staff' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ isSuspended: true }),
        ]);
        return { totalUsers, totalStaff, totalAdmins, suspendedUsers };
    }

    /**
     * Suspend a user.
     */
    static async suspendUser(id, reason) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
        const user = await User.findById(id);
        if (!user) throw new ApiError(404, 'User not found');
        if (user.isSuspended) throw new ApiError(400, 'User is already suspended');
        user.isSuspended = true;
        user.suspendReason = reason || 'No reason provided';
        user.suspendedAt = new Date();
        await user.save();
        return user;
    }

    /**
     * Unsuspend a user.
     */
    static async unsuspendUser(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
        const user = await User.findById(id);
        if (!user) throw new ApiError(404, 'User not found');
        user.isSuspended = false;
        user.suspendReason = '';
        user.suspendedAt = null;
        await user.save();
        return user;
    }
}

export default UserService;

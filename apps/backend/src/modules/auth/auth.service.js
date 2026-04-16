import User from '../users/user.model.js';
import { generateToken } from '../../utils/JWT.js';
import { ApiError } from '../../utils/ApiError.js';

class AuthService {
    /**
     * Register a new user.
     * @returns {{ user: Document, token: string }}
     */
    static async register({ name, email, password, phone }) {
        const normalizedEmail = email.trim().toLowerCase();

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) throw new ApiError(409, 'An account with this email already exists');

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone?.trim() || '',
        });

        const token = generateToken(user._id);
        return { user, token };
    }

    /**
     * Login a user.
     * Also blocks deactivated and suspended accounts at the login gate.
     * @returns {{ user: Document, token: string }}
     */
    static async login({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        // Fetch with password (normally excluded) + suspension fields
        const user = await User.findOne({ email: normalizedEmail }).select('+password +isSuspended +suspendReason');
        if (!user) throw new ApiError(401, 'Invalid email or password');

        // Check account status before verifying password (prevents timing oracle)
        if (!user.isActive) {
            throw new ApiError(401, 'Your account has been deactivated. Contact support.');
        }
        if (user.isSuspended) {
            throw new ApiError(
                403,
                `Your account is suspended. Reason: ${user.suspendReason || 'No reason provided'}`
            );
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new ApiError(401, 'Invalid email or password');

        const token = generateToken(user._id);
        return { user, token };
    }

    /**
     * Get current authenticated user profile.
     */
    static async getMe(userId) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    /**
     * Update the user's own profile (name, phone, address).
     * Only permitted fields are updated — no role/status changes allowed here.
     */
    static async updateProfile(userId, { name, phone, address }) {
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (phone !== undefined) updates.phone = phone.trim();
        if (address !== undefined) updates.address = address;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!user) throw new ApiError(404, 'User not found');
        return user;
    }

    /**
     * Change a user's own password.
     */
    static async changePassword(userId, { currentPassword, newPassword }) {
        if (currentPassword === newPassword) {
            throw new ApiError(400, 'New password must be different from your current password');
        }

        const user = await User.findById(userId).select('+password');
        if (!user) throw new ApiError(404, 'User not found');

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

        user.password = newPassword;
        await user.save(); // triggers bcrypt pre-save hook
    }
}

export default AuthService;

import User from './user.model.js';

// GET /api/users — list all users (admin)
export const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        
        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (pageNum < 1) {
            return res.status(400).json({ message: 'Page number must be at least 1' });
        }
        if (limitNum < 1 || limitNum > 100) {
            return res.status(400).json({ message: 'Limit must be between 1 and 100' });
        }
        
        const query = {};

        if (role) {
            if (!['user', 'staff', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role filter' });
            }
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        res.json({ users, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/users/:id
export const getUser = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/role — change user role (admin)
export const updateUserRole = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const { role } = req.body;
        if (!['user', 'staff', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/status — toggle active status (admin)
export const toggleUserStatus = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = !user.isActive;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/users/stats — admin dashboard
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalStaff = await User.countDocuments({ role: 'staff' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const suspendedUsers = await User.countDocuments({ isSuspended: true });
        res.json({ totalUsers, totalStaff, totalAdmins, suspendedUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/suspend
export const suspendUser = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isSuspended = true;
        user.suspendReason = reason || 'No reason provided';
        user.suspendedAt = new Date();
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/unsuspend
export const unsuspendUser = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isSuspended = false;
        user.suspendReason = '';
        user.suspendedAt = null;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

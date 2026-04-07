import Attendance from './attendance.model.js';
import User from '../users/user.model.js';

// POST /api/attendance — mark attendance (admin)
export const markAttendance = async (req, res) => {
    try {
        const { userId, date, status, note } = req.body;

        // Normalize date to midnight UTC to avoid time zone issues
        const attendanceDate = new Date(date);
        attendanceDate.setUTCHours(0, 0, 0, 0);

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Upsert attendance record
        const attendance = await Attendance.findOneAndUpdate(
            { user: userId, date: attendanceDate },
            {
                status,
                note,
                markedBy: req.user._id
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/attendance — get all attendance records (admin)
export const getAllAttendance = async (req, res) => {
    try {
        const { date, month, year, userId } = req.query;
        let query = {};

        if (userId) query.user = userId;

        if (date) {
            const d = new Date(date);
            d.setUTCHours(0, 0, 0, 0);
            query.date = d;
        } else if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            query.date = { $gte: start, $lte: end };
        }

        const records = await Attendance.find(query)
            .populate('user', 'name role')
            .populate('markedBy', 'name')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/attendance/me — get current user's attendance (staff)
export const getMyAttendance = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = { user: req.user._id };

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            query.date = { $gte: start, $lte: end };
        }

        const records = await Attendance.find(query)
            .populate('markedBy', 'name')
            .sort({ date: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/attendance/stats — get monthly attendance summary (admin)
export const getAttendanceStats = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required' });
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);

        // Aggregate from User to ensure all staff are included
        const stats = await User.aggregate([
            { $match: { role: 'staff', isActive: { $ne: false } } },
            {
                $lookup: {
                    from: 'attendances',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$user', '$$userId'] },
                                        { $gte: ['$date', start] },
                                        { $lte: ['$date', end] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'records'
                }
            },
            {
                $project: {
                    userId: '$_id',
                    name: 1,
                    email: 1,
                    present: {
                        $size: {
                            $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'present'] } }
                        }
                    },
                    late: {
                        $size: {
                            $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'late'] } }
                        }
                    },
                    absent: {
                        $size: {
                            $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'absent'] } }
                        }
                    },
                    halfDay: {
                        $size: {
                            $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'half-day'] } }
                        }
                    }
                }
            },
            { $sort: { name: 1 } }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

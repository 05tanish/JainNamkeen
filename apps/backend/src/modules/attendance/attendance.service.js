import Attendance from './attendance.model.js';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';

class AttendanceService {
    /**
     * Mark (upsert) attendance for a user on a given date.
     */
    static async markAttendance({ userId, date, status, note }, markedBy) {
        if (!userId?.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');

        // Normalize to midnight UTC to prevent timezone drift
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) throw new ApiError(400, 'Invalid date format');
        attendanceDate.setUTCHours(0, 0, 0, 0);

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, 'User not found');

        const record = await Attendance.findOneAndUpdate(
            { user: userId, date: attendanceDate },
            { status, note, markedBy },
            { upsert: true, new: true, runValidators: true }
        );

        return record;
    }

    /**
     * Get all attendance records (admin).
     */
    static async getAllAttendance({ date, month, year, userId }) {
        const query = {};

        if (userId) {
            if (!userId.match(/^[0-9a-fA-F]{24}$/)) throw new ApiError(400, 'Invalid user ID');
            query.user = userId;
        }

        if (date) {
            const d = new Date(date);
            if (isNaN(d.getTime())) throw new ApiError(400, 'Invalid date format');
            d.setUTCHours(0, 0, 0, 0);
            query.date = d;
        } else if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            if (m < 1 || m > 12) throw new ApiError(400, 'Month must be between 1 and 12');
            query.date = {
                $gte: new Date(y, m - 1, 1),
                $lte: new Date(y, m, 0, 23, 59, 59),
            };
        }

        return Attendance.find(query)
            .populate('user', 'name role')
            .populate('markedBy', 'name')
            .sort({ date: -1 });
    }

    /**
     * Get the current user's own attendance.
     */
    static async getMyAttendance(userId, { month, year }) {
        const query = { user: userId };

        if (month && year) {
            const m = parseInt(month);
            const y = parseInt(year);
            if (m < 1 || m > 12) throw new ApiError(400, 'Month must be between 1 and 12');
            query.date = {
                $gte: new Date(y, m - 1, 1),
                $lte: new Date(y, m, 0, 23, 59, 59),
            };
        }

        return Attendance.find(query).populate('markedBy', 'name').sort({ date: -1 });
    }

    /**
     * Aggregate monthly attendance stats for all active staff.
     */
    static async getAttendanceStats({ month, year }) {
        const m = parseInt(month);
        const y = parseInt(year);

        if (!month || !year) throw new ApiError(400, 'Month and year are required');
        if (m < 1 || m > 12) throw new ApiError(400, 'Month must be between 1 and 12');

        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59);

        return User.aggregate([
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
                                        { $lte: ['$date', end] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'records',
                },
            },
            {
                $project: {
                    userId: '$_id',
                    name: 1,
                    email: 1,
                    present: {
                        $size: { $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'present'] } } },
                    },
                    late: {
                        $size: { $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'late'] } } },
                    },
                    absent: {
                        $size: { $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'absent'] } } },
                    },
                    halfDay: {
                        $size: { $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'half-day'] } } },
                    },
                },
            },
            { $sort: { name: 1 } },
        ]);
    }
}

export default AttendanceService;

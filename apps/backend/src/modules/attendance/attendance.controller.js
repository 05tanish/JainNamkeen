import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import AttendanceService from './attendance.service.js';

// POST /api/attendance/mark
export const markAttendance = asyncHandler(async (req, res) => {
    const record = await AttendanceService.markAttendance(req.body, req.user._id);
    successResponse(res, { statusCode: 200, data: record, message: 'Attendance marked' });
});

// GET /api/attendance/all
export const getAllAttendance = asyncHandler(async (req, res) => {
    const records = await AttendanceService.getAllAttendance(req.query);
    successResponse(res, { statusCode: 200, data: records, message: 'Attendance records fetched' });
});

// GET /api/attendance/me
export const getMyAttendance = asyncHandler(async (req, res) => {
    const records = await AttendanceService.getMyAttendance(req.user._id, req.query);
    successResponse(res, { statusCode: 200, data: records, message: 'Your attendance fetched' });
});

// GET /api/attendance/stats
export const getAttendanceStats = asyncHandler(async (req, res) => {
    const stats = await AttendanceService.getAttendanceStats(req.query);
    successResponse(res, { statusCode: 200, data: stats, message: 'Attendance stats fetched' });
});

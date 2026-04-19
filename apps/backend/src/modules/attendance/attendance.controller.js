import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import * as AttendanceService from './attendance.service.js';

export const markAttendance = asyncHandler(async (req, res) => {
    const record = await AttendanceService.markAttendance(req.body, req.user.id);
    successResponse(res, { statusCode: 200, data: record, message: 'Attendance marked' });
});

export const getAllAttendance = asyncHandler(async (req, res) => {
    const records = await AttendanceService.getAllAttendance(req.query);
    successResponse(res, { statusCode: 200, data: records, message: 'Attendance records fetched' });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
    const records = await AttendanceService.getMyAttendance(req.user.id, req.query);
    successResponse(res, { statusCode: 200, data: records, message: 'Your attendance fetched' });
});

export const getAttendanceStats = asyncHandler(async (req, res) => {
    const stats = await AttendanceService.getAttendanceStats(req.query);
    successResponse(res, { statusCode: 200, data: stats, message: 'Attendance stats fetched' });
});

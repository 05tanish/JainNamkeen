import express from 'express';
import auth from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { markAttendanceSchema, getAttendanceQuerySchema } from './attendance.schema.js';
import {
    markAttendance,
    getAllAttendance,
    getMyAttendance,
    getAttendanceStats
} from './attendance.controller.js';

const router = express.Router();

// All routes require auth
router.use(auth);

// Admin routes
router.post('/mark', role('admin'), validate(markAttendanceSchema), markAttendance);
router.get('/all', role('admin'), validate(getAttendanceQuerySchema, 'query'), getAllAttendance);
router.get('/stats', role('admin'), validate(getAttendanceQuerySchema, 'query'), getAttendanceStats);

// Staff routes
router.get('/me', role('staff'), validate(getAttendanceQuerySchema, 'query'), getMyAttendance);

export default router;

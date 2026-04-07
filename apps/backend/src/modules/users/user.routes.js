import express from 'express';
import auth from '../../middleware/auth.js';
import role from '../../middleware/role.js';
import validate from '../../middleware/validate.js';
import { updateUserRoleSchema, suspendUserSchema } from './user.schema.js';
import { 
    getUsers, 
    getUser, 
    updateUserRole, 
    toggleUserStatus, 
    getUserStats, 
    suspendUser, 
    unsuspendUser 
} from './user.controller.js';

const router = express.Router();

router.get('/', auth, role('admin'), getUsers);
router.get('/stats', auth, role('admin'), getUserStats);
router.get('/:id', auth, getUser);
router.put('/:id/role', auth, role('admin'), validate(updateUserRoleSchema), updateUserRole);
router.put('/:id/status', auth, role('admin'), toggleUserStatus);
router.put('/:id/suspend', auth, role('admin'), validate(suspendUserSchema), suspendUser);
router.put('/:id/unsuspend', auth, role('admin'), unsuspendUser);

export default router;

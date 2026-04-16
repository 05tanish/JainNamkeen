import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { 
    registerSchema, 
    loginSchema, 
    updateProfileSchema, 
    changePasswordSchema 
} from './auth.schema.js';
import { register, login, getMe, updateProfile, changePassword, logout } from './auth.controller.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.put('/profile', auth, validate(updateProfileSchema), updateProfile);
router.put('/password', auth, validate(changePasswordSchema), changePassword);

export default router;

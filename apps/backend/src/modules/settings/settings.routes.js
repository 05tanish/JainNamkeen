import { Router } from 'express';
import * as SettingsController from './settings.controller.js';
import { auth } from '../../middleware/auth.js';
import { role } from '../../middleware/role.js';

const router = Router();

// Public endpoint - no auth required
router.get('/public', SettingsController.getPublicSettings);

// Admin endpoints - require authentication and admin role
router.get('/', auth, role('ADMIN'), SettingsController.getAllSettings);
router.put('/', auth, role('ADMIN'), SettingsController.updateSetting);
router.post('/toggle-online-payment', auth, role('ADMIN'), SettingsController.toggleOnlinePayment);

export default router;

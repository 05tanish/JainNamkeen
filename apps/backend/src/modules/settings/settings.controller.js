import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/ApiResponse.js';
import { prisma } from '../../config/Postgrsedb.js';

// Get public settings (no auth required)
export const getPublicSettings = asyncHandler(async (req, res) => {
    // Try to get from database first
    const onlinePaymentSetting = await prisma.settings.findUnique({
        where: { key: 'ENABLE_ONLINE_PAYMENT' }
    });
    
    // Fallback to environment variable if not in database
    const onlinePaymentEnabled = onlinePaymentSetting 
        ? onlinePaymentSetting.value === 'true'
        : process.env.ENABLE_ONLINE_PAYMENT === 'true';
    
    const settings = {
        onlinePaymentEnabled,
        razorpayKeyId: onlinePaymentEnabled ? process.env.RAZORPAY_KEY_ID : null
    };
    
    successResponse(res, { 
        statusCode: 200, 
        data: settings, 
        message: 'Settings fetched' 
    });
});

// Get all settings (admin only)
export const getAllSettings = asyncHandler(async (req, res) => {
    const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' }
    });
    
    successResponse(res, { 
        statusCode: 200, 
        data: settings, 
        message: 'Settings fetched' 
    });
});

// Update setting (admin only)
export const updateSetting = asyncHandler(async (req, res) => {
    const { key, value, description } = req.body;
    
    const setting = await prisma.settings.upsert({
        where: { key },
        update: { 
            value, 
            description,
            updatedBy: req.user.id 
        },
        create: { 
            key, 
            value, 
            description,
            updatedBy: req.user.id 
        }
    });
    
    successResponse(res, { 
        statusCode: 200, 
        data: setting, 
        message: 'Setting updated successfully' 
    });
});

// Toggle online payment (admin only)
export const toggleOnlinePayment = asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    
    const setting = await prisma.settings.upsert({
        where: { key: 'ENABLE_ONLINE_PAYMENT' },
        update: { 
            value: enabled ? 'true' : 'false',
            updatedBy: req.user.id 
        },
        create: { 
            key: 'ENABLE_ONLINE_PAYMENT', 
            value: enabled ? 'true' : 'false',
            description: 'Enable or disable online payment (Razorpay)',
            updatedBy: req.user.id 
        }
    });
    
    successResponse(res, { 
        statusCode: 200, 
        data: { 
            enabled: setting.value === 'true',
            updatedAt: setting.updatedAt 
        }, 
        message: `Online payment ${enabled ? 'enabled' : 'disabled'} successfully` 
    });
});

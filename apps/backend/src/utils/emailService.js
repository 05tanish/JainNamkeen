import { Resend } from 'resend';
import logger from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// List of disposable/temporary email domains to block
const BLOCKED_EMAIL_DOMAINS = [
    // Temporary email services
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'throwaway.email', 'maildrop.cc', 'getnada.com',
    'trashmail.com', 'yopmail.com', 'fakeinbox.com', 'sharklasers.com',
    'guerrillamail.info', 'grr.la', 'guerrillamail.biz', 'guerrillamail.de',
    'spam4.me', 'mailnesia.com', 'emailondeck.com', 'mintemail.com',
    'mytemp.email', 'temp-mail.io', 'mohmal.com', 'dispostable.com',
    'mailcatch.com', 'mailsac.com', 'tempinbox.com', 'throwawaymail.com',
    'getairmail.com', 'anonbox.net', 'anonymousemail.me', 'deadaddress.com',
    'emailsensei.com', 'filzmail.com', 'gishpuppy.com', 'jetable.org',
    'mailexpire.com', 'mailforspam.com', 'mailfreeonline.com', 'mailmoat.com',
    'mailtemp.info', 'meltmail.com', 'mt2014.com', 'mytrashmail.com',
    'no-spam.ws', 'nobulk.com', 'noclickemail.com', 'nospam.ze.tc',
    'nospamfor.us', 'nowmymail.com', 'objectmail.com', 'obobbo.com',
    'oneoffemail.com', 'onewaymail.com', 'pookmail.com', 'reallymymail.com',
    'recode.me', 'recursor.net', 'rtrtr.com', 'safe-mail.net',
    'selfdestructingmail.com', 'sendspamhere.com', 'shiftmail.com', 'slaskpost.se',
    'sneakemail.com', 'snkmail.com', 'sofort-mail.de', 'soodonims.com',
    'spam.la', 'spamavert.com', 'spambob.com', 'spambog.com',
    'spambox.us', 'spamcannon.com', 'spamcannon.net', 'spamcon.org',
    'spamcorptastic.com', 'spamcowboy.com', 'spamday.com', 'spamex.com',
    'spamfree24.com', 'spamfree24.de', 'spamfree24.eu', 'spamfree24.info',
    'spamfree24.net', 'spamfree24.org', 'spamgourmet.com', 'spamherelots.com',
    'spamhereplease.com', 'spamhole.com', 'spamify.com', 'spaminator.de',
    'spamkill.info', 'spaml.com', 'spaml.de', 'spammotel.com',
    'spamobox.com', 'spamoff.de', 'spamslicer.com', 'spamspot.com',
    'spamthis.co.uk', 'spamthisplease.com', 'spamtrail.com', 'speed.1s.fr',
    'supergreatmail.com', 'supermailer.jp', 'suremail.info', 'teewars.org',
    'teleworm.com', 'teleworm.us', 'tempalias.com', 'tempe-mail.com',
    'tempemail.biz', 'tempemail.com', 'tempemail.net', 'tempinbox.co.uk',
    'tempmail.eu', 'tempmaildemo.com', 'tempmailer.com', 'tempmailer.de',
    'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br', 'temporaryemail.net',
    'temporaryemail.us', 'temporaryforwarding.com', 'temporaryinbox.com', 'thanksnospam.info',
    'thankyou2010.com', 'thisisnotmyrealemail.com', 'throwawayemailaddress.com', 'tilien.com',
    'tmailinator.com', 'tradermail.info', 'trash-amil.com', 'trash-mail.at',
    'trash-mail.com', 'trash-mail.de', 'trash2009.com', 'trashemail.de',
    'trashymail.com', 'trialmail.de', 'trillianpro.com', 'twinmail.de',
    'tyldd.com', 'uggsrock.com', 'wegwerfadresse.de', 'wegwerfemail.de',
    'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org', 'wetrainbayarea.com',
    'wetrainbayarea.org', 'wh4f.org', 'whyspam.me', 'willselfdestruct.com',
    'winemaven.info', 'wronghead.com', 'wuzup.net', 'wuzupmail.net',
    'www.e4ward.com', 'www.gishpuppy.com', 'www.mailinator.com', 'wwwnew.eu',
    'xagloo.com', 'xemaps.com', 'xents.com', 'xmaily.com',
    'xoxy.net', 'yapped.net', 'yopmail.fr', 'yopmail.net',
    'yourdomain.com', 'ypmail.webarnak.fr.eu.org', 'yuurok.com', 'zehnminuten.de',
    'zippymail.info', 'zoaxe.com', 'zoemail.org', 'zomg.info'
];

/**
 * Check if email domain is blocked
 */
export const isEmailBlocked = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return BLOCKED_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validate email format and domain
 */
export const validateEmail = (email) => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, reason: 'Invalid email format' };
    }

    // Check if domain is blocked
    if (isEmailBlocked(email)) {
        return { valid: false, reason: 'Temporary email addresses are not allowed' };
    }

    return { valid: true };
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, name, verificationToken) => {
    try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Sangam Namkeen <noreply@sangamnamkeen.com>',
            to: email,
            subject: 'Verify Your Email - Sangam Namkeen',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify Your Email</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Sangam Namkeen</h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${name}!</h2>
                                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Thank you for registering with Sangam Namkeen. To complete your registration and start shopping, please verify your email address.
                                            </p>
                                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                                Click the button below to verify your email:
                                            </p>
                                            
                                            <!-- Button -->
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${verificationUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                                                            Verify Email Address
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                                Or copy and paste this link into your browser:<br>
                                                <a href="${verificationUrl}" style="color: #f97316; word-break: break-all;">${verificationUrl}</a>
                                            </p>
                                            
                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                                This link will expire in 24 hours.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                                If you didn't create an account, you can safely ignore this email.
                                            </p>
                                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                                © ${new Date().getFullYear()} Sangam Namkeen. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            logger.error('Failed to send verification email', { error, email });
            throw new Error('Failed to send verification email');
        }

        logger.info('Verification email sent successfully', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Error sending verification email', { error: error.message, email });
        throw error;
    }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, resetToken) => {
    try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Sangam Namkeen <noreply@sangamnamkeen.com>',
            to: email,
            subject: 'Reset Your Password - Sangam Namkeen',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reset Your Password</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Sangam Namkeen</h1>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Hi ${name},
                                            </p>
                                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                We received a request to reset your password. Click the button below to create a new password:
                                            </p>
                                            
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${resetUrl}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                                                            Reset Password
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                                Or copy and paste this link:<br>
                                                <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a>
                                            </p>
                                            
                                            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                                This link will expire in 1 hour.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="background-color: #fff3cd; padding: 20px 30px; border-top: 1px solid #ffc107;">
                                            <p style="color: #856404; font-size: 14px; margin: 0;">
                                                ⚠️ If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                                © ${new Date().getFullYear()} Sangam Namkeen. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            logger.error('Failed to send password reset email', { error, email });
            throw new Error('Failed to send password reset email');
        }

        logger.info('Password reset email sent successfully', { email, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Error sending password reset email', { error: error.message, email });
        throw error;
    }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (email, name, orderDetails) => {
    try {
        const { orderId, items, totalAmount, shippingAddress } = orderDetails;

        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">₹${item.price}</td>
            </tr>
        `).join('');

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Sangam Namkeen <orders@sangamnamkeen.com>',
            to: email,
            subject: `Order Confirmation #${orderId} - Sangam Namkeen`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Order Confirmation</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Order Confirmed!</h1>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #333333; margin: 0 0 10px 0; font-size: 24px;">Thank you, ${name}!</h2>
                                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Your order has been confirmed and will be shipped soon.
                                            </p>
                                            
                                            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                                                <p style="color: #666666; font-size: 14px; margin: 0 0 5px 0;">Order Number:</p>
                                                <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0;">#${orderId}</p>
                                            </div>
                                            
                                            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Order Items</h3>
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                                <thead>
                                                    <tr style="background-color: #f8f8f8;">
                                                        <th style="padding: 10px; text-align: left; color: #666666; font-size: 14px;">Item</th>
                                                        <th style="padding: 10px; text-align: center; color: #666666; font-size: 14px;">Qty</th>
                                                        <th style="padding: 10px; text-align: right; color: #666666; font-size: 14px;">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${itemsHtml}
                                                    <tr>
                                                        <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; color: #333333;">Total:</td>
                                                        <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #f97316; font-size: 18px;">₹${totalAmount}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            
                                            <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Shipping Address</h3>
                                            <div style="background-color: #f8f8f8; padding: 20px; border-radius: 6px;">
                                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                                                    ${shippingAddress.name}<br>
                                                    ${shippingAddress.street}<br>
                                                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}<br>
                                                    Phone: ${shippingAddress.phone}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                                Track your order at <a href="${process.env.FRONTEND_URL}/my-orders" style="color: #f97316;">My Orders</a>
                                            </p>
                                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                                © ${new Date().getFullYear()} Sangam Namkeen. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        if (error) {
            logger.error('Failed to send order confirmation email', { error, email, orderId });
            throw new Error('Failed to send order confirmation email');
        }

        logger.info('Order confirmation email sent successfully', { email, orderId, messageId: data?.id });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Error sending order confirmation email', { error: error.message, email });
        throw error;
    }
};

export default {
    validateEmail,
    isEmailBlocked,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail
};

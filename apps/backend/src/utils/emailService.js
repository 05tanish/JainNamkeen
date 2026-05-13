import { Resend } from 'resend';
import { logger } from './logger.js';

let _resend = null;

const getResend = () => {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured. Email sending is unavailable.');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

const FROM_ADDRESS = process.env.EMAIL_FROM || 'delivered@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const BLOCKED_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'throwaway.email', 'maildrop.cc', 'getnada.com',
  'trashmail.com', 'yopmail.com', 'fakeinbox.com', 'sharklasers.com',
  'guerrillamail.info', 'grr.la', 'spam4.me', 'mailnesia.com',
  'emailondeck.com', 'mintemail.com', 'mytemp.email', 'temp-mail.io',
  'mohmal.com', 'dispostable.com', 'mailcatch.com', 'mailsac.com',
  'tempinbox.com', 'throwawaymail.com', 'getairmail.com', 'anonbox.net',
  'deadaddress.com', 'filzmail.com', 'jetable.org', 'mailexpire.com',
  'meltmail.com', 'mytrashmail.com', 'nowmymail.com', 'pookmail.com',
  'spamex.com', 'spamgourmet.com', 'spaml.com', 'tempalias.com',
  'tempe-mail.com', 'tempemail.com', 'tempmailer.com', 'tempmail.eu',
  'yopmail.fr', 'yopmail.net', 'trashymail.com', 'wegwerfmail.de',
  'spambox.us', 'nospam.ze.tc', 'zoemail.org',
]);

export const isEmailBlocked = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? BLOCKED_DOMAINS.has(domain) : true;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, reason: 'Invalid email format' };
  if (isEmailBlocked(email)) return { valid: false, reason: 'Temporary email addresses are not allowed' };
  return { valid: true };
};

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jain Namkeen</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        ${content}
        <tr>
          <td style="background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#999;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} Jain Namkeen. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendVerificationEmail = async (email, name, otp) => {
  const html = emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:40px 20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Verify Your Email</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 30px;">
          <h2 style="color:#333;margin:0 0 10px;">Hello, ${name}!</h2>
          <p style="color:#666;font-size:16px;line-height:1.6;">
            Thank you for registering. Use the OTP below to verify your email address.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <div style="display:inline-block;background:#f97316;color:#fff;padding:20px 40px;border-radius:8px;font-size:36px;font-weight:bold;letter-spacing:8px;">
              ${otp}
            </div>
          </div>
          <p style="color:#999;font-size:14px;text-align:center;">
            This OTP expires in 10 minutes. If you did not sign up, please ignore this email.
          </p>
        </td>
      </tr>`);

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Your Verification OTP — Jain Namkeen',
      html,
    });
    if (error) throw new Error(error.message || 'Resend API error');
    logger.info('Verification OTP sent', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.error('Failed to send verification OTP', { error: err.message, email });
    throw err;
  }
};

export const sendPasswordResetEmail = async (email, name, otp) => {
  const html = emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:40px 20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Reset Your Password</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 30px;">
          <h2 style="color:#333;margin:0 0 10px;">Hello, ${name}!</h2>
          <p style="color:#666;font-size:16px;line-height:1.6;">
            We received a request to reset your password. Use the OTP below.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <div style="display:inline-block;background:#3b82f6;color:#fff;padding:20px 40px;border-radius:8px;font-size:36px;font-weight:bold;letter-spacing:8px;">
              ${otp}
            </div>
          </div>
          <p style="color:#999;font-size:14px;text-align:center;">
            This OTP expires in 10 minutes. If you did not request this, please ignore this email.
          </p>
        </td>
      </tr>`);

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Reset Your Password — Jain Namkeen',
      html,
    });
    if (error) throw new Error(error.message || 'Resend API error');
    logger.info('Password reset OTP sent', { email, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.error('Failed to send password reset OTP', { error: err.message, email });
    throw err;
  }
};

export const sendOrderConfirmationEmail = async (email, name, orderDetails) => {
  const { orderId, items, totalAmount, shippingAddress } = orderDetails;

  const itemsHtml = Array.isArray(items)
    ? items.map(item => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eee;">${item.name ?? 'Item'}</td>
              <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">₹${item.price}</td>
            </tr>`).join('')
    : '';

  const html = emailWrapper(`
      <tr>
        <td style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 20px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">✓ Order Confirmed!</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 30px;">
          <h2 style="color:#333;margin:0 0 10px;">Thank you, ${name}!</h2>
          <p style="color:#666;font-size:16px;line-height:1.6;">
            Your order has been confirmed and will be shipped soon.
          </p>
          <div style="background:#f8f8f8;padding:20px;border-radius:6px;margin-bottom:30px;">
            <p style="color:#666;font-size:14px;margin:0 0 5px;">Order Number:</p>
            <p style="color:#333;font-size:18px;font-weight:bold;margin:0;">#${orderId}</p>
          </div>
          <h3 style="color:#333;margin:0 0 15px;">Order Items</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:10px;text-align:left;color:#666;font-size:14px;">Item</th>
                <th style="padding:10px;text-align:center;color:#666;font-size:14px;">Qty</th>
                <th style="padding:10px;text-align:right;color:#666;font-size:14px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:15px 10px;text-align:right;font-weight:bold;color:#333;">Total:</td>
                <td style="padding:15px 10px;text-align:right;font-weight:bold;color:#f97316;font-size:18px;">₹${totalAmount}</td>
              </tr>
            </tbody>
          </table>
          <h3 style="color:#333;margin:0 0 15px;">Shipping Address</h3>
          <div style="background:#f8f8f8;padding:20px;border-radius:6px;">
            <p style="color:#666;font-size:14px;line-height:1.8;margin:0;">
              ${shippingAddress?.name ?? ''}<br>
              ${shippingAddress?.street ?? ''}<br>
              ${shippingAddress?.city ?? ''}, ${shippingAddress?.state ?? ''} ${shippingAddress?.pincode ?? ''}<br>
              Phone: ${shippingAddress?.phone ?? ''}
            </p>
          </div>
          <div style="text-align:center;margin:30px 0;">
            <a href="${FRONTEND_URL}/my-orders"
               style="background:#f97316;color:#fff;padding:14px 32px;border-radius:6px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Track Your Order
            </a>
          </div>
        </td>
      </tr>`);

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Jain Namkeen <orders@jainnamkeen.com>',
      to: email,
      subject: `Order Confirmed #${orderId} — Jain Namkeen`,
      html,
    });
    if (error) throw new Error(error.message || 'Resend API error');
    logger.info('Order confirmation email sent', { email, orderId, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.error('Failed to send order confirmation email', { error: err.message, email, orderId });
    throw err;
  }
};

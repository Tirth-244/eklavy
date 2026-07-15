import { Resend } from 'resend';

// Lazily initialize Resend so it doesn't crash if imported before dotenv.config()
let resendClient = null;
const getResend = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_prevent_crash');
  }
  return resendClient;
};

export const verifySmtpConnection = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is missing. Emails will not be sent.');
    return false;
  }
  console.log('✅ Email service initialized with Resend');
  return true;
};

/**
 * Base HTML Template Wrapper for Eklavya
 */
const getBaseTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                <tr>
                  <td style="background-color: #d97706; padding: 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">Eklavya</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; color: #333333; font-size: 15px; line-height: 1.6;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">This is an automated message from Eklavya. Please do not reply.</p>
                    <p style="margin: 4px 0 0; color: #999999; font-size: 12px;">&copy; ${new Date().getFullYear()} Eklavya. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/**
 * Send Verification Email
 */
export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  
  const content = `
    <h2 style="color: #d97706; margin-top: 0;">Welcome to Eklavya, ${name}!</h2>
    <p style="color: #333333;">Thank you for signing up to master 11th and 12th Science. Before you can start learning, please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${verifyUrl}" style="background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Verify Email Address</a>
    </div>
    <p style="color: #555555;">If the button doesn't work, copy and paste the following link into your browser:</p>
    <p style="word-break: break-all;"><a href="${verifyUrl}" style="color: #d97706;">${verifyUrl}</a></p>
    <p style="color: #555555;">This verification link will expire in 24 hours.</p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `Eklavya <${fromAddress}>`,
      reply_to: fromAddress,
      to: [email],
      subject: 'Verify your Eklavya account',
      html: getBaseTemplate('Verify Email Address', content),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Verification email sent successfully to:', email);
    return data;
  } catch (err) {
    console.error('❌ Verification email FAILED:', err.message);
    throw err;
  }
};

/**
 * Send Forgot Password OTP Email
 */
export const sendForgotPasswordOTPEmail = async (email, name, otp) => {
  const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const content = `
    <h2 style="color: #d97706; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #333333;">Hello ${name},</p>
    <p style="color: #333333;">We received a request to reset the password for your Eklavya account. Use the following 6-digit OTP code to proceed with resetting your password:</p>
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #d97706; background-color: #f9f9f9; padding: 16px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px dashed #cccccc;">${otp}</div>
    <p style="color: #555555;">This OTP code is valid for <strong>10 minutes</strong>. If you did not request this, please secure your account or ignore this email.</p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `Eklavya <${fromAddress}>`,
      reply_to: fromAddress,
      to: [email],
      subject: 'Reset your Eklavya password - OTP Code',
      html: getBaseTemplate('Reset Your Password', content),
    });

    if (error) throw new Error(error.message);

    console.log('✅ OTP email sent successfully to:', email);
    return data;
  } catch (err) {
    console.error('❌ OTP email FAILED:', err.message);
    throw err;
  }
};

/**
 * Send Password Reset Confirmation Email
 */
export const sendPasswordResetConfirmationEmail = async (email, name) => {
  const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const content = `
    <h2 style="color: #22c55e; margin-top: 0;">Password Changed Successfully!</h2>
    <p style="color: #333333;">Hello ${name},</p>
    <p style="color: #333333;">This is a confirmation that the password for your Eklavya account was recently changed.</p>
    <p style="color: #555555;">If you did not make this change, please contact our support team immediately to secure your account.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Go to Login</a>
    </div>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `Eklavya <${fromAddress}>`,
      reply_to: fromAddress,
      to: [email],
      subject: 'Eklavya - Password reset successful',
      html: getBaseTemplate('Password Reset Successful', content),
    });

    if (error) throw new Error(error.message);

    console.log('✅ Password reset confirmation email sent successfully to:', email);
    return data;
  } catch (err) {
    console.error('❌ Password reset confirmation email FAILED:', err.message);
    throw err;
  }
};

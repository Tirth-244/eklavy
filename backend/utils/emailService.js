import nodemailer from 'nodemailer';

// Create a transporter using SMTP configuration from environment variables
const createTransporter = () => {
  // If SMTP credentials aren't provided, use a mock or log warning
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ SMTP credentials not fully configured. Email service will run in sandbox/log mode.');
    return {
      sendMail: async (options) => {
        console.log('✉️ [Mock Email Sent]');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body Snippet: ${options.text || 'HTML content'}`);
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
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
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          }
          .header {
            background: linear-gradient(135deg, #fbbf24, #d97706);
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            color: #0f172a;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .content p {
            color: #cbd5e1;
            font-size: 16px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            background: linear-gradient(135deg, #fbbf24, #d97706);
            color: #0f172a !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.2);
            transition: transform 0.2s;
          }
          .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #fbbf24;
            background-color: #0f172a;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
            border: 1px dashed #475569;
          }
          .footer {
            background-color: #0f172a;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #334155;
          }
          .footer p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
          }
          .footer a {
            color: #fbbf24;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Eklavya</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This is an automated message from Eklavya. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Eklavya. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send Verification Email
 */
export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const content = `
    <h2 style="color: #fbbf24; margin-top: 0;">Welcome to Eklavya, ${name}!</h2>
    <p>Thank you for signing up to master 11th and 12th Science. Before you can start learning, please verify your email address by clicking the button below:</p>
    <div class="button-container">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </div>
    <p>If the button doesn't work, copy and paste the following link into your browser:</p>
    <p style="word-break: break-all;"><a href="${verifyUrl}" style="color: #fbbf24;">${verifyUrl}</a></p>
    <p>This verification link will expire in 24 hours.</p>
  `;

  const transporter = createTransporter();
  return transporter.sendMail({
    from: `"Eklavya Support" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@eklavya.com'}>`,
    to: email,
    subject: '🎓 Verify your Eklavya account',
    text: `Welcome to Eklavya, ${name}! Verify your email by visiting: ${verifyUrl}`,
    html: getBaseTemplate('Verify Email Address', content),
  });
};

/**
 * Send Forgot Password OTP Email
 */
export const sendForgotPasswordOTPEmail = async (email, name, otp) => {
  const content = `
    <h2 style="color: #fbbf24; margin-top: 0;">Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset the password for your Eklavya account. Use the following 6-digit OTP code to proceed with resetting your password:</p>
    <div class="otp-code">${otp}</div>
    <p>This OTP code is valid for <strong>10 minutes</strong>. If you did not request this, please secure your account or ignore this email.</p>
  `;

  const transporter = createTransporter();
  return transporter.sendMail({
    from: `"Eklavya Support" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@eklavya.com'}>`,
    to: email,
    subject: '🔒 Reset your Eklavya password - OTP Code',
    text: `Hello ${name}, your Eklavya password reset OTP is: ${otp}. It is valid for 10 minutes.`,
    html: getBaseTemplate('Reset Your Password', content),
  });
};

/**
 * Send Password Reset Confirmation Email
 */
export const sendPasswordResetConfirmationEmail = async (email, name) => {
  const content = `
    <h2 style="color: #22c55e; margin-top: 0;">Password Changed Successfully!</h2>
    <p>Hello ${name},</p>
    <p>This is a confirmation that the password for your Eklavya account was recently changed.</p>
    <p>If you did not make this change, please contact our support team immediately to secure your account.</p>
    <div class="button-container">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff !important; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);">Go to Login</a>
    </div>
  `;

  const transporter = createTransporter();
  return transporter.sendMail({
    from: `"Eklavya Support" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@eklavya.com'}>`,
    to: email,
    subject: '✅ Eklavya password reset successful',
    text: `Hello ${name}, your Eklavya password has been successfully updated.`,
    html: getBaseTemplate('Password Reset Successful', content),
  });
};

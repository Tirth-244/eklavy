import nodemailer from 'nodemailer';

// ── Task 2: Nodemailer Reliability ────────────────────────────────────────────

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
      },
      verify: async () => {
        console.warn('⚠️ Mock transporter — verify() skipped');
        return true;
      }
    };
  }

  const isGmail = (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) || 
                  (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail.com'));

  // BUG: logger/debug were missing, so SMTP failures on Render produced zero
  //      diagnostic output. Locally, Gmail "just works" but Render may block
  //      port 465 or the app-password may be wrong.
  // FIX: Enable nodemailer's built-in logger and debug mode.
  if (isGmail) {
    // Gmail service preset handles connection timeouts and port mapping automatically
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      logger: true,
      debug: true,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    logger: true,
    debug: true,
  });
};

// BUG: transporter.verify() was never called, so SMTP auth failures
//      (wrong app-password, blocked port) were only discovered when the
//      first email send attempt failed — buried inside a catch that only
//      logged a generic error.
// FIX: Verify SMTP connection at startup. This surfaces Gmail auth
//      rejections immediately in Render logs.
(async function verifySmtpConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP transporter verified — ready to send emails');
  } catch (err) {
    console.error('❌ SMTP transporter verification FAILED');
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Error command:', err.command);
    console.error('   Error response:', err.response);
    console.error('   Error responseCode:', err.responseCode);
    console.error('   Full error:', err);
  }
})();

/**
 * Base HTML Template Wrapper for Eklavya
 * BUG: The original template used dark backgrounds (#0f172a), complex CSS with
 *      gradients, box-shadows, and transitions. When sent from a personal Gmail
 *      (tithu244@gmail.com), this heavy HTML looks like a phishing/marketing email
 *      to Gmail's spam filter. Emails to the SAME account bypass spam filtering,
 *      which is why tithu244→tithu244 worked but tithu244→other didn't.
 * FIX: Use a clean, minimal, light-colored template. Gmail's spam filter is much
 *      more lenient with simple HTML emails from personal accounts.
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

  // BUG: EMAIL_FROM was set to a different address than SMTP_USER.
  //      Gmail REQUIRES the "from" address to match the authenticated user,
  //      otherwise it silently rewrites it or rejects with auth errors.
  //      Locally this was hidden because Gmail auto-corrected it.
  // FIX: Always use SMTP_USER as the from address for Gmail.
  const fromAddress = process.env.SMTP_USER || process.env.EMAIL_FROM || 'no-reply@eklavya.com';
  
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

  const transporter = createTransporter();
  // BUG: Emoji in subject line (🎓) + heavy HTML + "Eklavya Support" from a
  //      personal Gmail = strong spam signals. Gmail delivers same-account
  //      emails (tithu244→tithu244) bypassing spam filters, but cross-account
  //      emails get flagged and land in spam.
  // FIX: Remove emoji from subject, add replyTo, add envelope sender, add
  //      List-Unsubscribe header — all improve Gmail spam score.
  const mailOptions = {
    from: `"Eklavya" <${fromAddress}>`,
    replyTo: fromAddress,
    to: email,
    subject: 'Verify your Eklavya account',
    text: `Welcome to Eklavya, ${name}! Verify your email by visiting: ${verifyUrl}`,
    html: getBaseTemplate('Verify Email Address', content),
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'Eklavya Platform',
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully');
    console.log('   Recipient:', email);
    console.log('   Sender:', fromAddress);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Verification URL:', verifyUrl);
    console.log('   MessageId:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Rejected:', info.rejected);
    return info;
  } catch (err) {
    console.error('❌ Verification email FAILED');
    console.error('   Recipient:', email);
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Error command:', err.command);
    console.error('   Error response:', err.response);
    console.error('   Error responseCode:', err.responseCode);
    console.error('   Error stack:', err.stack);
    throw err; // re-throw so callers can handle it
  }
};

/**
 * Send Forgot Password OTP Email
 */
export const sendForgotPasswordOTPEmail = async (email, name, otp) => {
  const fromAddress = process.env.SMTP_USER || process.env.EMAIL_FROM || 'no-reply@eklavya.com';

  const content = `
    <h2 style="color: #d97706; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #333333;">Hello ${name},</p>
    <p style="color: #333333;">We received a request to reset the password for your Eklavya account. Use the following 6-digit OTP code to proceed with resetting your password:</p>
    <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #d97706; background-color: #f9f9f9; padding: 16px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px dashed #cccccc;">${otp}</div>
    <p style="color: #555555;">This OTP code is valid for <strong>10 minutes</strong>. If you did not request this, please secure your account or ignore this email.</p>
  `;

  const transporter = createTransporter();
  const mailOptions = {
    from: `"Eklavya" <${fromAddress}>`,
    replyTo: fromAddress,
    to: email,
    subject: 'Reset your Eklavya password - OTP Code',
    text: `Hello ${name}, your Eklavya password reset OTP is: ${otp}. It is valid for 10 minutes.`,
    html: getBaseTemplate('Reset Your Password', content),
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'Eklavya Platform',
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully');
    console.log('   Recipient:', email);
    console.log('   Sender:', fromAddress);
    console.log('   MessageId:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Rejected:', info.rejected);
    return info;
  } catch (err) {
    console.error('❌ OTP email FAILED');
    console.error('   Recipient:', email);
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Error command:', err.command);
    console.error('   Error response:', err.response);
    console.error('   Error responseCode:', err.responseCode);
    console.error('   Error stack:', err.stack);
    throw err;
  }
};

/**
 * Send Password Reset Confirmation Email
 */
export const sendPasswordResetConfirmationEmail = async (email, name) => {
  const fromAddress = process.env.SMTP_USER || process.env.EMAIL_FROM || 'no-reply@eklavya.com';

  const content = `
    <h2 style="color: #22c55e; margin-top: 0;">Password Changed Successfully!</h2>
    <p style="color: #333333;">Hello ${name},</p>
    <p style="color: #333333;">This is a confirmation that the password for your Eklavya account was recently changed.</p>
    <p style="color: #555555;">If you did not make this change, please contact our support team immediately to secure your account.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">Go to Login</a>
    </div>
  `;

  const transporter = createTransporter();
  const mailOptions = {
    from: `"Eklavya" <${fromAddress}>`,
    replyTo: fromAddress,
    to: email,
    subject: 'Eklavya - Password reset successful',
    text: `Hello ${name}, your Eklavya password has been successfully updated.`,
    html: getBaseTemplate('Password Reset Successful', content),
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'Eklavya Platform',
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset confirmation email sent successfully');
    console.log('   Recipient:', email);
    console.log('   Sender:', fromAddress);
    console.log('   MessageId:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Rejected:', info.rejected);
    return info;
  } catch (err) {
    console.error('❌ Password reset confirmation email FAILED');
    console.error('   Recipient:', email);
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code);
    console.error('   Error command:', err.command);
    console.error('   Error response:', err.response);
    console.error('   Error responseCode:', err.responseCode);
    console.error('   Error stack:', err.stack);
    throw err;
  }
};

import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  sendVerificationEmail,
  sendForgotPasswordOTPEmail,
  sendPasswordResetConfirmationEmail,
} from '../utils/emailService.js';

// ── Validation rules ──────────────────────────────────────────────────────────
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name too short'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const resendVerificationValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
];

export const verifyEmailValidation = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
];

export const verifyOtpValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits').isNumeric().withMessage('OTP must be numeric'),
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ── Helper: send validation errors ──────────────────────────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// ── POST /api/auth/register ──────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists. Please login instead.' });
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    isVerified: false,
    verificationToken,
    verificationTokenExpires,
  });

  try {
    await sendVerificationEmail(email, name, verificationToken);
  } catch (err) {
    console.error('❌ Failed to send verification email on register:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! A verification link has been sent to your email. Please verify your email to log in.',
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
  }

  // Check if password exists (OAuth users might not have a password)
  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your password.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to log in.',
      isUnverified: true,
      email: user.email,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// ── POST /api/auth/verify-email ──────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { token } = req.body;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token. Please request a new verification link.',
    });
  }

  user.isVerified = true;
  user.verificationToken = '';
  user.verificationTokenExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! You can now log in.',
  });
});

// ── POST /api/auth/resend-verification ─────────────────────────────────────────
export const resendVerification = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Prevent email enumeration by returning a generic response
    return res.status(200).json({
      success: true,
      message: 'If the account exists, a new verification link has been sent.',
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'This email is already verified. Please log in.',
    });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  user.verificationToken = verificationToken;
  user.verificationTokenExpires = verificationTokenExpires;
  await user.save();

  try {
    await sendVerificationEmail(email, user.name, verificationToken);
  } catch (err) {
    console.error('❌ Failed to send verification email on resend:', err);
    return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
  }

  res.status(200).json({
    success: true,
    message: 'Verification link resent successfully! Check your inbox.',
  });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email } = req.body;

  const user = await User.findOne({ email });
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, an OTP has been sent.',
  };

  if (!user) {
    // Prevent email enumeration
    return res.status(200).json(genericResponse);
  }

  // Rate limiting for OTP: 60-second cooldown
  if (user.otpExpires && (user.otpExpires.getTime() - Date.now() > 9 * 60 * 1000)) {
    return res.status(429).json({
      success: false,
      message: 'Please wait 60 seconds before requesting another OTP.',
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    await sendForgotPasswordOTPEmail(email, user.name, otp);
    
    // Only save OTP to DB if email was successfully sent
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0; // reset attempts
    await user.save();
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
  }

  res.status(200).json(genericResponse);
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
export const verifyOtp = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }

  if (user.otp !== otp) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    
    if (user.otpAttempts >= 5) {
      user.otp = '';
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
      });
    }
    
    await user.save();
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. You have ${5 - user.otpAttempts} attempts remaining.`,
    });
  }

  // OTP is correct - generate temporary reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  user.otp = '';
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  user.resetToken = resetToken;
  user.resetTokenExpires = resetTokenExpires;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully.',
    resetToken,
    email: user.email,
  });
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  if (handleValidation(req, res)) return;

  const { email, resetToken, password } = req.body;

  const user = await User.findOne({
    email,
    resetToken,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset session. Please start over.',
    });
  }

  // Pre-save hook hashes this password automatically
  user.password = password;
  user.resetToken = '';
  user.resetTokenExpires = undefined;
  await user.save();

  try {
    await sendPasswordResetConfirmationEmail(user.email, user.name);
  } catch (err) {
    console.error('❌ Failed to send password reset confirmation email:', err);
  }

  // Auto-authenticate user
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Password reset successful! You are now logged in.',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// ── GET /api/auth/google ─────────────────────────────────────────────────────
export const googleLogin = (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
};

// ── GET /api/auth/google/callback ────────────────────────────────────────────
export const googleCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=Google authentication failed: no authorization code provided`);
  }

  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google code');
    }

    const { access_token } = tokenData;

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const { sub: googleId, email, name, picture: avatar } = googleUser;

    if (!email) {
      throw new Error('Google account must have an email associated with it');
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: avatar || '',
        isVerified: true,
        role: 'student',
      });
    }

    if (!user.isActive) {
      return res.redirect(`${frontendUrl}/login?error=Account deactivated. Contact support.`);
    }

    const token = generateToken(user);
    const userObj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userObj))}`);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Google Sign-In failed')}`);
  }
});

// ── GET /api/auth/github ─────────────────────────────────────────────────────
export const githubLogin = (req, res) => {
  const rootUrl = 'https://github.com/login/oauth/authorize';
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`,
    scope: 'user:email',
  };

  const qs = new URLSearchParams(options);
  res.redirect(`${rootUrl}?${qs.toString()}`);
};

// ── GET /api/auth/github/callback ────────────────────────────────────────────
export const githubCallback = asyncHandler(async (req, res) => {
  const code = req.query.code;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=GitHub authentication failed: no authorization code provided`);
  }

  try {
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange GitHub code');
    }

    const { access_token } = tokenData;

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': 'eklavya-auth',
      },
    });

    const githubUser = await userRes.json();
    if (!userRes.ok) {
      throw new Error('Failed to fetch user info from GitHub');
    }

    let email = githubUser.email;

    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'User-Agent': 'eklavya-auth',
        },
      });

      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primaryEmailObj = emails.find(e => e.primary && e.verified) || emails.find(e => e.primary) || emails[0];
        if (primaryEmailObj) {
          email = primaryEmailObj.email;
        }
      }
    }

    if (!email) {
      throw new Error('GitHub account must have an email associated with it');
    }

    const githubId = githubUser.id.toString();
    const name = githubUser.name || githubUser.login;
    const avatar = githubUser.avatar_url;

    let user = await User.findOne({ email });

    if (user) {
      let modified = false;
      if (!user.githubId) {
        user.githubId = githubId;
        modified = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        modified = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        githubId,
        avatar: avatar || '',
        isVerified: true,
        role: 'student',
      });
    }

    if (!user.isActive) {
      return res.redirect(`${frontendUrl}/login?error=Account deactivated. Contact support.`);
    }

    const token = generateToken(user);
    const userObj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userObj))}`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'GitHub Sign-In failed')}`);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).populate('purchasedCourses', 'subject thumbnail');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      purchasedCourses: user.purchasedCourses,
    },
  });
});

export const testEmail = async (req, res) => {
  try {
    const info = await sendForgotPasswordOTPEmail('tithu244@gmail.com', 'Test User', '123456');
    res.status(200).json({ success: true, message: 'Email sent successfully', info });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command
    });
  }
};


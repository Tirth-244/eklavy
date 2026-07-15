import express from 'express';
import {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
  googleCallback,
  githubLogin,
  githubCallback,
  registerValidation,
  loginValidation,
  resendVerificationValidation,
  verifyEmailValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
} from '../controllers/authController.js';


import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', verifyJWT, getMe);

// Email verification
router.post('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/resend-verification', resendVerificationValidation, resendVerification);

// Forgot / Reset Password flow
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', verifyOtpValidation, verifyOtp);
router.post('/reset-password', resetPasswordValidation, resetPassword);



// OAuth
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);

export default router;

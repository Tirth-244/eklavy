import express from 'express';
import {
  register,
  login,
  getMe,
  registerValidation,
  loginValidation,
} from '../controllers/authController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', verifyJWT, getMe);

export default router;

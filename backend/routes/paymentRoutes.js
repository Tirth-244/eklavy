import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/create-order', verifyJWT, createOrder);
router.post('/verify', verifyJWT, verifyPayment);

export default router;

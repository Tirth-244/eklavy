import express from 'express';
import { getUserPurchases, checkPurchase } from '../controllers/purchaseController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/my', verifyJWT, getUserPurchases);
router.get('/check/:courseId', verifyJWT, checkPurchase);

export default router;

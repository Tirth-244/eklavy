import express from 'express';
import { getUserPurchases, checkPurchase, getPurchaseStatus } from '../controllers/purchaseController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/my', verifyJWT, getUserPurchases);
router.get('/check/:courseId', verifyJWT, checkPurchase);
router.get('/status/:courseId', verifyJWT, getPurchaseStatus);

export default router;

import express from 'express';
import { markComplete, getUserProgress, getCourseProgress } from '../controllers/progressController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/complete', verifyJWT, markComplete);
router.get('/my', verifyJWT, getUserProgress);
router.get('/course/:courseId', verifyJWT, getCourseProgress);

export default router;

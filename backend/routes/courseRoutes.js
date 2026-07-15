import express from 'express';
import {
  getAllCourses,
  getCourseBySubject,
  createCourse,
  updateCourse,
} from '../controllers/courseController.js';
import { getAccessToken } from '../controllers/streamController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/:subject', getCourseBySubject);
router.post('/', verifyJWT, requireRole('teacher'), createCourse);
router.put('/:id', verifyJWT, requireRole('teacher'), updateCourse);
router.post('/:id/access-token', verifyJWT, getAccessToken);

export default router;

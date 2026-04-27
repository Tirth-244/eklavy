import express from 'express';
import { getAllStudents, getStudentDetails } from '../controllers/studentController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', verifyJWT, requireRole('teacher'), getAllStudents);
router.get('/:id', verifyJWT, requireRole('teacher'), getStudentDetails);

export default router;

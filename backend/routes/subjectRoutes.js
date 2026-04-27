import express from 'express';
import { createSubject, getSubjects, deleteSubject } from '../controllers/subjectController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', getSubjects);
router.post('/', verifyJWT, requireRole('teacher'), createSubject);
router.delete('/:id', verifyJWT, requireRole('teacher'), deleteSubject);

export default router;

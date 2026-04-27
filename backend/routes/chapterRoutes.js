import express from 'express';
import { createChapter, getChapters, updateChapter, deleteChapter } from '../controllers/chapterController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';

const router = express.Router();

// Optional auth for fetching chapters
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    import('jsonwebtoken').then(({ default: jwt }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
      } catch (_) {}
      next();
    });
  } else {
    next();
  }
};

router.get('/:subject', optionalAuth, getChapters);
router.post('/', verifyJWT, requireRole('teacher'), createChapter);
router.put('/:id', verifyJWT, requireRole('teacher'), updateChapter);
router.delete('/:id', verifyJWT, requireRole('teacher'), deleteChapter);

export default router;

import express from 'express';
import {
  getContentByCourse,
  getContentById,
  uploadContent,
  deleteContent,
  getTeacherUploads,
} from '../controllers/contentController.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';

const router = express.Router();

// Optional auth — middleware reads userId if token present
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    import('jsonwebtoken').then(({ default: jwt }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
      } catch (_) { /* unauthenticated — ok for demo content */ }
      next();
    });
  } else {
    next();
  }
};

router.get('/teacher/my-uploads', verifyJWT, requireRole('teacher'), getTeacherUploads);
router.get('/item/:id', verifyJWT, getContentById);
router.get('/:courseId', optionalAuth, getContentByCourse);
router.post('/', verifyJWT, requireRole('teacher'), uploadContent);
router.delete('/:id', verifyJWT, requireRole('teacher'), deleteContent);

export default router;

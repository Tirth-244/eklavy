import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';
import {
  createLecture,
  getLecturesByCourse,
  deleteLecture,
} from '../controllers/lectureController.js';

const router = express.Router();

// Ensure temp directory exists for local disk storage
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer disk storage for streaming large video files to temp folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (req, file, cb) => {
    const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (videoMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, MOV, and AVI videos are allowed'), false);
    }
  },
});

// ── Lecture Routes ────────────────────────────────────────────────────────────
router.get('/course/:courseId', verifyJWT, getLecturesByCourse);
router.post('/', verifyJWT, requireRole('teacher'), upload.single('video'), createLecture);
router.delete('/:id', verifyJWT, requireRole('teacher'), deleteLecture);

export default router;

import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import verifyJWT from '../middleware/verifyJWT.js';
import requireRole from '../middleware/roleCheck.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Use memory storage so buffer can be piped to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for videos
  fileFilter: (req, file, cb) => {
    const videoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const pdfMimes = ['application/pdf'];
    const allowed = [...videoMimes, ...pdfMimes];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, MOV, AVI videos and PDF files are allowed'), false);
    }
  },
});

// ── POST /api/upload/video ────────────────────────────────────────────────── (teacher only)
router.post(
  '/video',
  verifyJWT,
  requireRole('teacher'),
  upload.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'eklavya/videos', 'video');

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration, // Cloudinary provides this for videos
    });
  })
);

// ── POST /api/upload/pdf ──────────────────────────────────────────────────── (teacher only)
router.post(
  '/pdf',
  verifyJWT,
  requireRole('teacher'),
  upload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'eklavya/notes', 'raw');

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
    });
  })
);

export default router;

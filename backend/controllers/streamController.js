import jwt from 'jsonwebtoken';
import Lecture from '../models/Lecture.js';
import Purchase from '../models/Purchase.js';
import { getFromR2 } from '../utils/r2Service.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper to convert readable stream to string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// ── POST /api/courses/:id/access-token ─────────────────────────────────────────
export const getAccessToken = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const { lectureId } = req.body;

  if (!lectureId) {
    return res.status(400).json({ success: false, message: 'Lecture ID is required' });
  }

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    return res.status(404).json({ success: false, message: 'Lecture not found' });
  }

  if (lecture.courseId.toString() !== courseId) {
    return res.status(400).json({ success: false, message: 'Lecture does not belong to this course' });
  }

  // Access Control: If the lecture is NOT free, check if student has purchased the course
  if (!lecture.isFree) {
    const purchase = await Purchase.findOne({
      userId: req.userId,
      courseId,
      paymentStatus: 'completed',
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You must purchase this course to view this lecture.',
      });
    }
  }

  // Issue short-lived JWT (10 min expiry)
  const token = jwt.sign(
    { studentId: req.userId, courseId, lectureId },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  res.status(200).json({ success: true, token });
});

// ── GET /api/stream/:lectureId/playlist.m3u8 ──────────────────────────────────
export const getPlaylist = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(403).json({ success: false, message: 'Access denied: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.lectureId !== lectureId) {
      return res.status(403).json({ success: false, message: 'Access denied: Invalid token for this lecture' });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture || !lecture.r2Path) {
      return res.status(404).json({ success: false, message: 'Lecture or playlist not found' });
    }

    // Fetch playlist file from R2
    const fileStream = await getFromR2(lecture.r2Path);
    const m3u8Content = await streamToString(fileStream);

    // Rewrite HLS segment URLs to include the verification token as a query parameter
    const lines = m3u8Content.split('\n');
    const rewrittenLines = lines.map((line) => {
      const trimmed = line.trim();
      // If the line doesn't start with '#' and isn't empty, it's a segment file (.ts)
      if (trimmed && !trimmed.startsWith('#')) {
        return `${trimmed}?token=${encodeURIComponent(token)}`;
      }
      return line;
    });

    const rewrittenContent = rewrittenLines.join('\n');

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.status(200).send(rewrittenContent);

  } catch (error) {
    console.error('Playlist Token Verification Failed:', error);
    return res.status(403).json({ success: false, message: 'Access denied: Token expired or invalid' });
  }
});

// ── GET /api/stream/:lectureId/:segment.ts ────────────────────────────────────
export const getSegment = asyncHandler(async (req, res) => {
  const { lectureId, segment } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(403).json({ success: false, message: 'Access denied: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.lectureId !== lectureId) {
      return res.status(403).json({ success: false, message: 'Access denied: Invalid token for this segment' });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    // Construct R2 path: courses/{courseId}/lectures/{lectureId}/{segment}
    const r2Key = `courses/${lecture.courseId}/lectures/${lectureId}/${segment}`;

    const segmentStream = await getFromR2(r2Key);

    res.setHeader('Content-Type', 'video/MP2T');
    segmentStream.pipe(res);

  } catch (error) {
    console.error('Segment Token Verification Failed:', error);
    return res.status(403).json({ success: false, message: 'Access denied: Token expired or invalid' });
  }
});

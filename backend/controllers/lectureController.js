import fs from 'fs';
import path from 'path';
import Lecture from '../models/Lecture.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';
import { processVideoToHLS } from '../utils/videoProcessor.js';

// ── GET /api/lectures/course/:courseId ─────────────────────────────────────────
export const getLecturesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const lectures = await Lecture.find({ courseId }).sort({ order: 1 });
  res.status(200).json({ success: true, data: lectures });
});

// ── POST /api/lectures ─────────────────────────────────────────────────────────
export const createLecture = asyncHandler(async (req, res) => {
  const { courseId, title, description, order } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a video file' });
  }

  // Verify course exists
  const course = await Course.findById(courseId);
  if (!course) {
    // Delete temp file since course not found
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Create pending lecture record
  const lecture = await Lecture.create({
    courseId,
    title,
    description: description || '',
    order: order ? parseInt(order, 10) : 0,
    status: 'pending',
  });

  // Increment totalLectures count on course
  await Course.findByIdAndUpdate(courseId, { $inc: { totalLectures: 1 } });

  // Trigger HLS processing background job
  // DO NOT await this so it runs asynchronously in background
  processVideoToHLS(lecture._id, req.file.path).catch((err) => {
    console.error(`Failed to trigger HLS processing for lecture ${lecture._id}:`, err);
  });

  res.status(201).json({
    success: true,
    message: 'Lecture created, video processing started in the background.',
    data: lecture,
  });
});

// ── DELETE /api/lectures/:id ──────────────────────────────────────────────────
export const deleteLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, message: 'Lecture not found' });
  }

  // Decrement totalLectures on Course
  await Course.findByIdAndUpdate(lecture.courseId, { $inc: { totalLectures: -1 } });

  // Delete lecture from database
  await Lecture.findByIdAndDelete(req.params.id);

  // Note: Cleanup of R2 assets could be done here as an enhancement,
  // but for MVP scale a basic database delete is sufficient.

  res.status(200).json({ success: true, message: 'Lecture deleted successfully' });
});

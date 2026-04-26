import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── GET /api/courses ─────────────────────────────────────────────────────────
export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isActive: true })
    .populate('teacher', 'name avatar')
    .sort({ subject: 1 });

  res.status(200).json({ success: true, data: courses });
});

// ── GET /api/courses/:subject ────────────────────────────────────────────────
export const getCourseBySubject = asyncHandler(async (req, res) => {
  const { subject } = req.params;
  const capitalised = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();

  const course = await Course.findOne({ subject: capitalised, isActive: true }).populate(
    'teacher',
    'name avatar'
  );

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  res.status(200).json({ success: true, data: course });
});

// ── POST /api/courses ─────────────────────────────────────────────────────── (teacher only)
export const createCourse = asyncHandler(async (req, res) => {
  const { subject, description, price, thumbnail } = req.body;

  const existing = await Course.findOne({ subject });
  if (existing) {
    return res.status(409).json({ success: false, message: `Course for ${subject} already exists` });
  }

  const course = await Course.create({
    subject,
    description,
    price: price || 999,
    thumbnail: thumbnail || '',
    teacher: req.userId,
  });

  res.status(201).json({ success: true, message: 'Course created', data: course });
});

// ── PUT /api/courses/:id ─────────────────────────────────────────────────── (teacher only)
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  res.status(200).json({ success: true, message: 'Course updated', data: course });
});

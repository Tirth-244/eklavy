import Subject from '../models/Subject.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/subjects
export const createSubject = asyncHandler(async (req, res) => {
  const { name, label } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Subject name is required' });
  }

  // Create Subject
  const subject = await Subject.create({
    name,
    label: label || name,
  });

  // Implicitly create a Course for this subject so payments work out of the box
  // We use a default price of 999. Can be updated later by admin if needed.
  try {
    await Course.create({
      subject: name,
      description: `Complete syllabus for ${name}`,
      price: 999,
      isActive: true,
      teacher: req.userId,
    });
  } catch (err) {
    console.error('Failed to auto-create course for subject', err);
    // Continue anyway, admin might have to create it manually if it fails
  }

  res.status(201).json({ success: true, data: subject });
});

// GET /api/subjects
export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ isActive: true }).sort({ createdAt: 1 });
  res.status(200).json({ success: true, data: subjects });
});

// DELETE /api/subjects/:id
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  // Cascade delete associated Course and Chapters
  await Course.deleteOne({ subject: subject.name });
  await Chapter.deleteMany({ subject: subject.name });

  res.status(200).json({ success: true, message: 'Subject and associated data deleted' });
});

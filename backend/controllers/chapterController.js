import Chapter from '../models/Chapter.js';
import Purchase from '../models/Purchase.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/chapters
export const createChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.create(req.body);
  res.status(201).json({ success: true, data: chapter });
});

// GET /api/chapters/:subject
export const getChapters = asyncHandler(async (req, res) => {
  const { subject } = req.params;
  
  // Find chapters
  // If user is not admin, only show published chapters
  const subjectRegex = new RegExp('^' + subject + '$', 'i');
  const query = { subject: subjectRegex };
  if (req.userRole !== 'teacher' && req.userRole !== 'admin') {
    query.isPublished = true;
  }
  
  const chapters = await Chapter.find(query).sort({ classLevel: 1, chapterNumber: 1 });

  // If user is teacher, send full data
  if (req.userRole === 'teacher' || req.userRole === 'admin') {
    return res.status(200).json({ success: true, data: chapters });
  }

  // Check if user has purchased the course for this subject
  let isPurchased = false;
  if (req.userId) {
    const course = await Course.findOne({ subject: subjectRegex });
    if (course) {
      const purchase = await Purchase.findOne({
        userId: req.userId,
        courseId: course._id,
        paymentStatus: 'completed'
      });
      if (purchase) isPurchased = true;
    }
  }

  // Sanitize video URLs if not purchased and chapter is locked
  const sanitizedChapters = chapters.map(ch => {
    const chapterObj = ch.toObject();
    if (!chapterObj.isFree && !isPurchased) {
      delete chapterObj.videoUrl;
    }
    return chapterObj;
  });

  res.status(200).json({ success: true, data: sanitizedChapters });
});

// PUT /api/chapters/:id
export const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  res.status(200).json({ success: true, data: chapter });
});

// DELETE /api/chapters/:id
export const deleteChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndDelete(req.params.id);
  if (!chapter) {
    return res.status(404).json({ success: false, message: 'Chapter not found' });
  }
  res.status(200).json({ success: true, message: 'Chapter deleted' });
});

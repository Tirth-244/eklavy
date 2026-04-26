import Progress from '../models/Progress.js';
import Content from '../models/Content.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── POST /api/progress/complete ───────────────────────────────────────────────
export const markComplete = asyncHandler(async (req, res) => {
  const { contentId } = req.body;
  const userId = req.userId;

  const content = await Content.findById(contentId);
  if (!content) {
    return res.status(404).json({ success: false, message: 'Content not found' });
  }

  const progress = await Progress.findOneAndUpdate(
    { userId, contentId },
    { userId, contentId, courseId: content.courseId, completed: true, watchedAt: new Date() },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, message: 'Marked as complete', data: progress });
});

// ── GET /api/progress/my ──────────────────────────────────────────────────────
export const getUserProgress = asyncHandler(async (req, res) => {
  const progressList = await Progress.find({ userId: req.userId, completed: true })
    .populate('contentId', 'title subject type')
    .populate('courseId', 'subject');

  // Group by course for frontend convenience
  const byCourse = progressList.reduce((acc, p) => {
    const key = p.courseId?.subject || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  res.status(200).json({ success: true, data: progressList, byCourse });
});

// ── GET /api/progress/course/:courseId ───────────────────────────────────────
export const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.userId;

  const [total, completed] = await Promise.all([
    Content.countDocuments({ courseId, isActive: true }),
    Progress.countDocuments({ userId, courseId, completed: true }),
  ]);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.status(200).json({ success: true, data: { total, completed, percentage } });
});

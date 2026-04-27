import Content from '../models/Content.js';
import Course from '../models/Course.js';
import Purchase from '../models/Purchase.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── GET /api/content/:courseId ────────────────────────────────────────────────
// Returns all content for a course; strips videoUrl from premium if not purchased
export const getContentByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.userId; // may be undefined for unauthenticated

  const contents = await Content.find({ courseId, isActive: true })
    .sort({ order: 1 })
    .populate('uploadedBy', 'name');

  // Check if user has purchased this course
  let hasPurchased = false;
  if (userId) {
    const purchase = await Purchase.findOne({
      userId,
      courseId,
      paymentStatus: 'completed',
    });
    hasPurchased = !!purchase;
  }

  // Sanitize premium content for non-purchasers
  const sanitized = contents.map((item) => {
    const obj = item.toObject();
    if (obj.type === 'premium' && !hasPurchased) {
      delete obj.videoUrl;
      delete obj.notesUrl;
      obj.locked = true;
    } else {
      obj.locked = false;
    }
    return obj;
  });

  res.status(200).json({ success: true, hasPurchased, data: sanitized });
});

// ── GET /api/content/item/:id ─────────────────────────────────────────────────
export const getContentById = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id).populate('uploadedBy', 'name');
  if (!content || !content.isActive) {
    return res.status(404).json({ success: false, message: 'Content not found' });
  }

  // Access control for premium content
  if (content.type === 'premium') {
    const purchase = await Purchase.findOne({
      userId: req.userId,
      courseId: content.courseId,
      paymentStatus: 'completed',
    });
    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'Purchase this course to access premium content',
      });
    }
  }

  res.status(200).json({ success: true, data: content });
});

// ── POST /api/content ─────────────────────────────────────────────────────── (teacher only)
export const uploadContent = asyncHandler(async (req, res) => {
  const { title, subject, courseId, videoUrl, notesUrl, type, duration, description, order } =
    req.body;

  // Verify the course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const content = await Content.create({
    title,
    subject,
    courseId,
    videoUrl: videoUrl || '',
    notesUrl: notesUrl || '',
    type,
    uploadedBy: req.userId,
    duration: duration || '',
    description: description || '',
    order: order || 0,
  });

  // Update totalLectures on the course
  await Course.findByIdAndUpdate(courseId, { $inc: { totalLectures: 1 } });

  res.status(201).json({ success: true, message: 'Content uploaded', data: content });
});

// ── DELETE /api/content/:id ───────────────────────────────────────────────── (teacher only)
export const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findById(req.params.id);
  if (!content) {
    return res.status(404).json({ success: false, message: 'Content not found' });
  }

  // Only the uploader or admin can delete
  if (content.uploadedBy.toString() !== req.userId && req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this content' });
  }

  content.isActive = false;
  await content.save();

  // Decrement totalLectures
  await Course.findByIdAndUpdate(content.courseId, { $inc: { totalLectures: -1 } });

  res.status(200).json({ success: true, message: 'Content deleted' });
});

// ── GET /api/content/teacher/my-uploads ───────────────────────────────────── (teacher only)
export const getTeacherUploads = asyncHandler(async (req, res) => {
  const contents = await Content.find({ uploadedBy: req.userId, isActive: true })
    .populate('courseId', 'subject')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: contents });
});

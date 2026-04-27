import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import Progress from '../models/Progress.js';
import Chapter from '../models/Chapter.js';
import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/students
export const getAllStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: students });
});

// GET /api/students/:id
export const getStudentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await User.findById(id).select('-password');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  // Find purchased courses
  const purchases = await Purchase.find({ userId: id, paymentStatus: 'completed' }).populate('courseId');
  const purchasedSubjects = purchases.map(p => p.courseId?.subject).filter(Boolean);

  // Calculate progress per subject
  const progressData = [];
  for (const subject of purchasedSubjects) {
    const course = await Course.findOne({ subject: new RegExp('^' + subject + '$', 'i') });
    if (!course) continue;

    const chapters = await Chapter.find({ subject: new RegExp('^' + subject + '$', 'i') });
    const totalChapters = chapters.length;

    const completed = await Progress.countDocuments({
      userId: id,
      courseId: course._id,
      completed: true
    });

    progressData.push({
      subject,
      totalChapters,
      completedChapters: completed,
      percentage: totalChapters === 0 ? 0 : Math.round((completed / totalChapters) * 100)
    });
  }

  res.status(200).json({
    success: true,
    data: {
      student,
      purchasedSubjects,
      progress: progressData
    }
  });
});

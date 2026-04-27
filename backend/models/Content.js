import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    notesUrl: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['demo', 'premium'],
      required: [true, 'Content type is required'],
      default: 'demo',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    duration: {
      type: String, // e.g., "45:30"
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookups by course
contentSchema.index({ courseId: 1, order: 1 });

const Content = mongoose.model('Content', contentSchema);
export default Content;

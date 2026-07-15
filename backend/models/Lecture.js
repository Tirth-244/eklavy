import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready'],
      default: 'pending',
    },
    r2Path: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    isFree: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

// Index for sorting by course and sequence order
lectureSchema.index({ courseId: 1, order: 1 });

const Lecture = mongoose.model('Lecture', lectureSchema);
export default Lecture;

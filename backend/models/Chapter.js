import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    titleGu: {
      type: String,
      required: [true, 'Gujarati title is required'],
      trim: true,
    },
    titleEn: {
      type: String,
      required: [true, 'English title is required'],
      trim: true,
    },
    chapterNumber: {
      type: Number,
      required: [true, 'Chapter number is required'],
    },
    classLevel: {
      type: Number,
      required: [true, 'Class level is required'],
      enum: [11, 12],
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Sort chapters correctly
chapterSchema.index({ subject: 1, classLevel: 1, chapterNumber: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);
export default Chapter;

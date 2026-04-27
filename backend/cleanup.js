import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject.js';
import Course from './models/Course.js';
import Chapter from './models/Chapter.js';

dotenv.config();

const cleanup = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const validSubjects = await Subject.find({});
    const validNames = validSubjects.map(s => s.name);
    
    // Delete courses that don't match active subjects
    const courseRes = await Course.deleteMany({ subject: { $nin: validNames } });
    console.log(`Deleted ${courseRes.deletedCount} orphaned courses`);
    
    // Delete chapters that don't match active subjects
    const chapterRes = await Chapter.deleteMany({ subject: { $nin: validNames } });
    console.log(`Deleted ${chapterRes.deletedCount} orphaned chapters`);
    
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
cleanup();

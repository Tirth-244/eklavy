import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const drop = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  try {
    await mongoose.connection.collection('chapters').dropIndex('subject_1_class_1_chapter_1');
    console.log('Index dropped');
  } catch (err) {
    console.error(err.message);
  }
  process.exit();
}
drop();

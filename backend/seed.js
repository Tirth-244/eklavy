import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './models/Subject.js';
import Chapter from './models/Chapter.js';
import Course from './models/Course.js';
import User from './models/User.js';

dotenv.config();

const mongoUrl =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/eklavya';

const demoData = [
  {
    subject: { name: 'Physics', label: 'ભૌતિક વિજ્ઞાન' },
    chapters: [
      { titleEn: 'Units and Measurements', titleGu: 'એકમ અને માપન', classLevel: 11 },
      { titleEn: 'Motion in a Straight Line', titleGu: 'સુરેખ પથ પર ગતિ', classLevel: 11 },
      { titleEn: 'Laws of Motion', titleGu: 'ગતિના નિયમો', classLevel: 11 },
      { titleEn: 'Work, Energy and Power', titleGu: 'કાર્ય, ઉર્જા અને પાવર', classLevel: 11 },
    ]
  },
  {
    subject: { name: 'Chemistry', label: 'રસાયણ વિજ્ઞાન' },
    chapters: [
      { titleEn: 'Some Basic Concepts of Chemistry', titleGu: 'રસાયણ વિજ્ઞાનની કેટલીક પાયાની સંકલ્પનાઓ', classLevel: 11 },
      { titleEn: 'Structure of Atom', titleGu: 'પરમાણુનું બંધારણ', classLevel: 11 },
      { titleEn: 'Classification of Elements', titleGu: 'તત્વોનું વર્ગીકરણ', classLevel: 11 },
      { titleEn: 'Chemical Bonding', titleGu: 'રાસાયણિક બંધન', classLevel: 11 },
    ]
  },
  {
    subject: { name: 'Mathematics', label: 'ગણિત' },
    chapters: [
      { titleEn: 'Sets', titleGu: 'ગણ', classLevel: 11 },
      { titleEn: 'Relations and Functions', titleGu: 'સંબંધ અને વિધેય', classLevel: 11 },
      { titleEn: 'Trigonometric Functions', titleGu: 'ત્રિકોણમિતીય વિધેયો', classLevel: 11 },
      { titleEn: 'Complex Numbers', titleGu: 'સંકર સંખ્યાઓ', classLevel: 11 },
    ]
  },
  {
    subject: { name: 'Biology', label: 'જીવ વિજ્ઞાન' },
    chapters: [
      { titleEn: 'The Living World', titleGu: 'સજીવ વિશ્વ', classLevel: 11 },
      { titleEn: 'Biological Classification', titleGu: 'જૈવિક વર્ગીકરણ', classLevel: 11 },
      { titleEn: 'Plant Kingdom', titleGu: 'વનસ્પતિ સૃષ્ટિ', classLevel: 11 },
      { titleEn: 'Animal Kingdom', titleGu: 'પ્રાણી સૃષ્ટિ', classLevel: 11 },
    ]
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB Connected');

    // Get an admin/teacher user for the course reference
    const adminUser = await User.findOne({ role: { $in: ['admin', 'teacher'] } });

    for (const data of demoData) {
      let subName = data.subject.name;

      // 1. Create Subject
      let subject = await Subject.findOne({ name: subName });
      if (!subject) {
        subject = await Subject.create(data.subject);
        console.log(`Created Subject: ${subName}`);
      } else {
        console.log(`Subject already exists: ${subName}`);
      }

      // Ensure Course exists so purchases work, even when Subject already exists.
      const existingCourse = await Course.findOne({ subject: subName });
      if (!existingCourse) {
        await Course.create({
          subject: subName,
          description: `Complete syllabus for ${subName}`,
          price: 999,
          isActive: true,
          teacher: adminUser ? adminUser._id : undefined,
        });
        console.log(`Created Course: ${subName}`);
      }

      // 2. Create Chapters
      for (let i = 0; i < data.chapters.length; i++) {
        const ch = data.chapters[i];
        
        const existingChapter = await Chapter.findOne({
          subject: subName,
          chapterNumber: i + 1,
          classLevel: ch.classLevel
        });

        if (!existingChapter) {
          // Schema uses isFree and isPublished, matching Admin UI values
          // isFree = true for chapter 1 (Demo), false for others
          await Chapter.create({
            subject: subName,
            titleGu: ch.titleGu,
            titleEn: ch.titleEn,
            chapterNumber: i + 1,
            classLevel: ch.classLevel,
            videoUrl: 'https://www.youtube.com/embed/1F3hm6MfR1k', // valid string
            isFree: i === 0, 
            isPublished: true
          });
          console.log(`  - Created Chapter ${i + 1}: ${ch.titleEn}`);
        } else {
          console.log(`  - Chapter ${i + 1} already exists`);
        }
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();

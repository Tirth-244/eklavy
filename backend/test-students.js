import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import User from './models/User.js';
import Purchase from './models/Purchase.js';
import Course from './models/Course.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const students = await User.find({ role: 'student' }).lean();
  console.log('>> Students count:', students.length);
  const allPurchases = await Purchase.find({ paymentStatus: 'completed' }).populate('courseId');
  console.log('>> Purchases count:', allPurchases.length);
  
  const enrolledStudents = students.map(student => {
    const studentPurchases = allPurchases.filter(p => p.userId && p.userId.toString() === student._id.toString());
    const purchasedSubjects = studentPurchases.map(p => p.courseId ? p.courseId.subject : null).filter(Boolean);
    return {
      name: student.name,
      email: student.email,
      role: student.role,
      purchasedSubjects: [...new Set(purchasedSubjects)]
    };
  }).filter(st => st.purchasedSubjects && st.purchasedSubjects.length > 0);
  
  console.log('>> Enrolled students:', enrolledStudents.length);
  console.dir(enrolledStudents, { depth: null });
  process.exit();
}).catch(console.error);

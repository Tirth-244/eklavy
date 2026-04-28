import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config({ path: './.env' });
import User from './models/User.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    let admin = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("Token:", token);
    process.exit();
});

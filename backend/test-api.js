import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config({ path: './.env' });
import User from './models/User.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    let admin = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    try {
        const res = await axios.get('http://localhost:5001/api/students', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Students:", res.data);
    } catch(e) {
        console.error("API failed:", e.response ? e.response.data : e.message);
    }
    process.exit();
});

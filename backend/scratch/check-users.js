import mongoose from 'mongoose';
import User from '../models/User.js';

const mongoUrl = 'mongodb+srv://tithu244_db_user:t1rth2412@tirth001.euzrbtp.mongodb.net/eklavy';

async function run() {
  try {
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, 'name email role isVerified');
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();

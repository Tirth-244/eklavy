import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log(users.map(u => ({ email: u.email, avatar: u.avatar })));
  process.exit(0);
});

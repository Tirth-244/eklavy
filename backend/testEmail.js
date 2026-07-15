import dotenv from 'dotenv';
import { sendVerificationEmail } from './utils/emailService.js';

dotenv.config();

const testEmail = async () => {
  try {
    console.log('Testing email service with Nodemailer...');
    await sendVerificationEmail('vrund4591@gmail.com', 'Vrund', 'test-token-123456');
    console.log('✅ Test complete! Email should be in the inbox.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testEmail();

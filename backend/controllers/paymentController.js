import Razorpay from 'razorpay';
import crypto from 'crypto';
import Purchase from '../models/Purchase.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Lazy initialise — avoids crash when env vars are not yet set at module load

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'), { statusCode: 503 });
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── POST /api/payment/create-order ───────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.userId;

  // Check already purchased
  const alreadyPurchased = await Purchase.findOne({
    userId,
    courseId,
    paymentStatus: 'completed',
  });
  if (alreadyPurchased) {
    return res.status(409).json({ success: false, message: 'You have already purchased this course' });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const amount = course.price * 100; // Razorpay expects paise

  const options = {
    amount,
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
    notes: {
      courseId: courseId.toString(),
      userId: userId.toString(),
    },
  };

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create(options);

  // Create pending purchase record
  await Purchase.findOneAndUpdate(
    { userId, courseId },
    {
      userId,
      courseId,
      amount: course.price,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    order,
    key: process.env.RAZORPAY_KEY_ID,
    course: { subject: course.subject, price: course.price },
  });
});

// ── POST /api/payment/verify ─────────────────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
  const userId = req.userId;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    await Purchase.findOneAndUpdate(
      { userId, razorpayOrderId: razorpay_order_id },
      { paymentStatus: 'failed' }
    );
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  // Update purchase to completed
  await Purchase.findOneAndUpdate(
    { userId, razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'completed',
    }
  );

  // Add course to user's purchasedCourses
  await User.findByIdAndUpdate(userId, {
    $addToSet: { purchasedCourses: courseId },
  });

  res.status(200).json({ success: true, message: 'Payment verified. Course unlocked!' });
});

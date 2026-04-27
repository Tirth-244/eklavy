import Purchase from '../models/Purchase.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── GET /api/purchase/my ──────────────────────────────────────────────────────
export const getUserPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({
    userId: req.userId,
    paymentStatus: 'completed',
  }).populate('courseId', 'subject description thumbnail price');

  res.status(200).json({ success: true, data: purchases });
});

// ── GET /api/purchase/check/:courseId ────────────────────────────────────────
export const checkPurchase = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const purchase = await Purchase.findOne({
    userId: req.userId,
    courseId,
    paymentStatus: 'completed',
  });

  res.status(200).json({ success: true, hasPurchased: !!purchase });
});

// ── GET /api/purchase/status/:courseId ───────────────────────────────────────
// Returns purchase status only — never exposes video URLs
export const getPurchaseStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const purchase = await Purchase.findOne({
    userId: req.userId,
    courseId,
    paymentStatus: 'completed',
  }).select('_id paymentStatus createdAt');

  res.status(200).json({
    success: true,
    isPurchased: !!purchase,
    purchasedAt: purchase?.createdAt || null,
  });
});

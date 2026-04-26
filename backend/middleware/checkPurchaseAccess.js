import Purchase from '../models/Purchase.js';
import Content from '../models/Content.js';

const checkPurchaseAccess = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    // Get content to find course
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if demo (accessible to all)
    if (content.type === 'demo') {
      return next();
    }

    // Check if user has purchased
    const purchase = await Purchase.findOne({
      userId,
      courseId: content.courseId,
      paymentStatus: 'completed',
    });

    if (!purchase) {
      return res.status(403).json({ message: 'You need to purchase this course to access this content' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Access check failed', error: error.message });
  }
};

export default checkPurchaseAccess;

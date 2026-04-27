/**
 * Role-based access control middleware factory.
 * Usage: router.post('/upload', verifyJWT, requireRole('teacher'), handler)
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.userRole) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  // Treat 'admin' as an alias for 'teacher' to support legacy tokens/setup
  const userRole = req.userRole === 'admin' ? 'teacher' : req.userRole;

  if (!roles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

export default requireRole;

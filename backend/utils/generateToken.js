import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a user
 * @param {Object} user - Mongoose user document
 * @returns {string} signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default generateToken;

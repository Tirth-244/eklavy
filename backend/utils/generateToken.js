import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token for a user
 * @param {Object} user - Mongoose user document
 * @returns {string} signed JWT token
 */
const generateToken = (user) => {
  // Task 4: JWT secret validation
  // BUG: If JWT_SECRET is not set on Render, jwt.sign() throws a cryptic
  //      "secretOrPrivateKey must have a value" error. Locally it works
  //      because .env always has the secret.
  // FIX: Check and log explicitly before signing.
  if (!process.env.JWT_SECRET) {
    console.error('🚨 [JWT] JWT_SECRET is undefined — cannot sign tokens!');
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    console.log(`✅ [JWT] Token generated for user ${user._id} (role: ${user.role})`);
    return token;
  } catch (err) {
    console.error('❌ [JWT] Token generation FAILED');
    console.error('   Error:', err.message);
    throw err;
  }
};

export default generateToken;

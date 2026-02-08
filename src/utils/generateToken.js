/**
 * JWT Token Generator
 * 
 * Generates a signed JWT token with user data.
 * The token includes user id and role for authorization.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object from database
 * @param {string} user._id - User ID
 * @param {string} user.role - User role (user, organizer, super_admin)
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;

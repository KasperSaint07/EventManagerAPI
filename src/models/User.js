/**
 * User Model
 * 
 * Defines the schema for users in the system.
 * Roles: user, organizer, super_admin
 * Password is hashed before saving.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'super_admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ======================
// PRE-SAVE HOOK
// ======================

/**
 * Hash the password before saving to the database.
 * Only hashes if the password field was modified.
 */
userSchema.pre('save', async function (next) {
  // Skip hashing if password was not modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ======================
// INSTANCE METHODS
// ======================

/**
 * Compare entered password with the hashed password in the database.
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

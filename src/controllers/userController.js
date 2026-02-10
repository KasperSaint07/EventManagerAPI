const User = require('../models/User');
const { validateEmail, validatePassword } = require('../utils/validators');

// GET /api/users/me
const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: { id: req.user._id, email: req.user.email, role: req.user.role, createdAt: req.user.createdAt }
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching profile' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!email && !password) return res.status(400).json({ success: false, message: 'Provide email or password to update' });

    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) return res.status(400).json({ success: false, message: emailCheck.message });

      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(409).json({ success: false, message: 'Email is already taken' });
      }
      user.email = email;
    }

    if (password) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) return res.status(400).json({ success: false, message: passwordCheck.message });
      user.password = password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
};

module.exports = { getProfile, updateProfile };

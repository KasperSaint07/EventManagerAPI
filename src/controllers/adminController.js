const User = require('../models/User');
const { isValidObjectId } = require('../utils/validators');

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/users/:id/make-super-admin
const makeSuperAdmin = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'super_admin') return res.status(400).json({ success: false, message: 'User is already a super_admin' });

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role: 'super_admin' }, { new: true }).select('-password');

    res.status(200).json({
      success: true,
      message: `User ${updatedUser.email} is now super_admin`,
      data: { id: updatedUser._id, email: updatedUser.email, role: updatedUser.role }
    });
  } catch (error) {
    console.error('Make super admin error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllUsers, makeSuperAdmin };

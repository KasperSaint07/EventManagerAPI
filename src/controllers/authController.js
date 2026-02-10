const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateEmail, validatePassword } = require('../utils/validators');
const sendEmail = require('../utils/sendEmail');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) return res.status(400).json({ success: false, message: emailCheck.message });

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) return res.status(400).json({ success: false, message: passwordCheck.message });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const user = await User.create({ email, password });
    const token = generateToken(user);

    // Welcome email (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to EventManager!',
        text: 'Your account has been created. You can now browse and register for events.',
        html: '<h2>Welcome to EventManager!</h2><p>Your account has been created successfully.</p>'
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { id: user._id, email: user.email, role: user.role, token }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) return res.status(400).json({ success: false, message: emailCheck.message });

    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { id: user._id, email: user.email, role: user.role, token }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

module.exports = { register, login };

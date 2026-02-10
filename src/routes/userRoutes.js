const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');
const { getUserRegistrations } = require('../controllers/registrationController');

router.get('/me', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/registrations', auth, getUserRegistrations);

module.exports = router;

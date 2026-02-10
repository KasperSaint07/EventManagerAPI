const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { submitOrganizerRequest } = require('../controllers/organizerRequestController');

router.post('/request', auth, submitOrganizerRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { submitOrganizerRequest, getMyRequestStatus } = require('../controllers/organizerRequestController');

router.post('/request', auth, submitOrganizerRequest);
router.get('/request/status', auth, getMyRequestStatus);

module.exports = router;

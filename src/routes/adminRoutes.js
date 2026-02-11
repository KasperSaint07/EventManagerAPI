const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { getOrganizerRequests, approveOrganizerRequest, rejectOrganizerRequest } = require('../controllers/organizerRequestController');
const { getDeleteRequests, approveDeleteRequest, rejectDeleteRequest } = require('../controllers/eventDeleteRequestController');
const { getAllUsers, makeSuperAdmin } = require('../controllers/adminController');

// All routes require super_admin
router.use(auth, authorize('super_admin'));

// Organizer requests
router.get('/organizer-requests', getOrganizerRequests);
router.post('/organizer-requests/:id/approve', approveOrganizerRequest);
router.post('/organizer-requests/:id/reject', rejectOrganizerRequest);

// Event delete requests
router.get('/event-delete-requests', getDeleteRequests);
router.post('/event-delete-requests/:id/approve', approveDeleteRequest);
router.post('/event-delete-requests/:id/reject', rejectDeleteRequest);

// User management
router.get('/users', getAllUsers);
router.post('/users/:id/make-super-admin', makeSuperAdmin);

module.exports = router;

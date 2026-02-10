const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { createEvent, getEvents, getEventById, updateEvent, getEventParticipants, deleteEvent } = require('../controllers/eventController');
const { registerForEvent, cancelRegistration } = require('../controllers/registrationController');
const { submitDeleteRequest } = require('../controllers/eventDeleteRequestController');

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Organizer / Admin
router.post('/', auth, authorize('organizer', 'super_admin'), createEvent);
router.put('/:id', auth, authorize('organizer', 'super_admin'), updateEvent);
router.get('/:id/participants', auth, authorize('organizer', 'super_admin'), getEventParticipants);
router.post('/:id/delete-request', auth, authorize('organizer'), submitDeleteRequest);

// User registration
router.post('/:id/register', auth, registerForEvent);
router.delete('/:id/register', auth, cancelRegistration);

// Admin only
router.delete('/:id', auth, authorize('super_admin'), deleteEvent);

module.exports = router;

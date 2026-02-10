const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { isValidObjectId } = require('../utils/validators');

// POST /api/events/:id/register
const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const existing = await Registration.findOne({ userId, eventId });
    if (existing) return res.status(409).json({ success: false, message: 'You are already registered for this event' });

    const currentCount = await Registration.countDocuments({ eventId });
    if (currentCount >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is full. No available spots' });
    }

    const registration = await Registration.create({ userId, eventId });
    res.status(201).json({ success: true, message: 'Successfully registered for the event', data: registration });
  } catch (error) {
    console.error('Register for event error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while registering for event' });
  }
};

// DELETE /api/events/:id/register
const cancelRegistration = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const registration = await Registration.findOneAndDelete({ userId, eventId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.status(200).json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while cancelling registration' });
  }
};

// GET /api/users/registrations
const getUserRegistrations = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Registration.countDocuments({ userId });
    const registrations = await Registration.find({ userId })
      .populate({ path: 'eventId', select: 'title description dateTime city address capacity' })
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true, count: registrations.length, total, page,
      pages: Math.ceil(total / limit), data: registrations
    });
  } catch (error) {
    console.error('Get registrations error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching registrations' });
  }
};

module.exports = { registerForEvent, cancelRegistration, getUserRegistrations };

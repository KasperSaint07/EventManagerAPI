const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { validateEventFields, isValidObjectId } = require('../utils/validators');

// POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, dateTime, city, address, capacity } = req.body;

    const validation = validateEventFields({ title, description, dateTime, city, address, capacity });
    if (!validation.isValid) return res.status(400).json({ success: false, message: validation.message });

    const event = await Event.create({
      title, description, dateTime, city, address, capacity,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Create event error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while creating event' });
  }
};

// GET /api/events?page=1&limit=10&search=query
const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search filter
    const filter = {};
    if (req.query.search) {
      const search = req.query.search.trim();
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add available spots to each event
    const eventsWithSpots = await Promise.all(events.map(async (event) => {
      const registered = await Registration.countDocuments({ eventId: event._id });
      const eventObj = event.toObject();
      eventObj.registered = registered;
      eventObj.availableSpots = event.capacity - registered;
      return eventObj;
    }));

    res.status(200).json({
      success: true, count: eventsWithSpots.length, total, page,
      pages: Math.ceil(total / limit), data: eventsWithSpots
    });
  } catch (error) {
    console.error('Get events error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching events' });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(req.params.id).populate('createdBy', 'email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const registered = await Registration.countDocuments({ eventId: event._id });
    const eventObj = event.toObject();
    eventObj.registered = registered;
    eventObj.availableSpots = event.capacity - registered;

    // Check if current user is registered (if auth header present)
    let isUserRegistered = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const userReg = await Registration.findOne({ userId: decoded.id, eventId: event._id });
        isUserRegistered = !!userReg;
      } catch (e) { /* token invalid, ignore */ }
    }
    eventObj.isUserRegistered = isUserRegistered;

    res.status(200).json({ success: true, data: eventObj });
  } catch (error) {
    console.error('Get event error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching event' });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Organizer can only update own events
    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own events' });
    }

    const allowedFields = ['title', 'description', 'dateTime', 'city', 'address', 'capacity'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    if (updates.dateTime) {
      const eventDate = new Date(updates.dateTime);
      if (isNaN(eventDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid date and time' });
      if (eventDate <= new Date()) return res.status(400).json({ success: false, message: 'Event date must be in the future' });
    }

    if (updates.capacity !== undefined) {
      const cap = Number(updates.capacity);
      if (!Number.isInteger(cap) || cap < 1) return res.status(400).json({ success: false, message: 'Capacity must be a positive whole number' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('createdBy', 'email');

    res.status(200).json({ success: true, message: 'Event updated successfully', data: updatedEvent });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Update event error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while updating event' });
  }
};

// GET /api/events/:id/participants
const getEventParticipants = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view participants of your own events' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Registration.countDocuments({ eventId: req.params.id });
    const registrations = await Registration.find({ eventId: req.params.id })
      .populate('userId', 'email role')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true, event: event.title, count: registrations.length,
      total, page, pages: Math.ceil(total / limit), data: registrations
    });
  } catch (error) {
    console.error('Get participants error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching participants' });
  }
};

// DELETE /api/events/:id (super_admin only)
const deleteEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ eventId: req.params.id });

    res.status(200).json({ success: true, message: 'Event and all related registrations deleted' });
  } catch (error) {
    console.error('Delete event error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while deleting event' });
  }
};

module.exports = { createEvent, getEvents, getEventById, updateEvent, getEventParticipants, deleteEvent };

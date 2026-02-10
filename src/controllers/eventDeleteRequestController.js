const EventDeleteRequest = require('../models/EventDeleteRequest');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { isValidObjectId } = require('../utils/validators');

// POST /api/events/:id/delete-request
const submitDeleteRequest = async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user._id;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (event.createdBy.toString() !== organizerId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only request deletion of your own events' });
    }

    const existing = await EventDeleteRequest.findOne({ eventId, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'A pending delete request already exists for this event' });

    const deleteRequest = await EventDeleteRequest.create({ eventId, organizerId });
    res.status(201).json({ success: true, message: 'Delete request submitted. Waiting for admin approval', data: deleteRequest });
  } catch (error) {
    console.error('Submit delete request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/event-delete-requests
const getDeleteRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const total = await EventDeleteRequest.countDocuments(filter);
    const requests = await EventDeleteRequest.find(filter)
      .populate('eventId', 'title city dateTime')
      .populate('organizerId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true, count: requests.length, total, page,
      pages: Math.ceil(total / limit), data: requests
    });
  } catch (error) {
    console.error('Get delete requests error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/event-delete-requests/:id/approve
const approveDeleteRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const deleteRequest = await EventDeleteRequest.findById(req.params.id);
    if (!deleteRequest) return res.status(404).json({ success: false, message: 'Delete request not found' });
    if (deleteRequest.status !== 'pending') return res.status(400).json({ success: false, message: `Request already ${deleteRequest.status}` });

    deleteRequest.status = 'approved';
    await deleteRequest.save();

    await Event.findByIdAndDelete(deleteRequest.eventId);
    await Registration.deleteMany({ eventId: deleteRequest.eventId });

    res.status(200).json({ success: true, message: 'Delete request approved. Event and registrations removed', data: deleteRequest });
  } catch (error) {
    console.error('Approve delete request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/event-delete-requests/:id/reject
const rejectDeleteRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const deleteRequest = await EventDeleteRequest.findById(req.params.id);
    if (!deleteRequest) return res.status(404).json({ success: false, message: 'Delete request not found' });
    if (deleteRequest.status !== 'pending') return res.status(400).json({ success: false, message: `Request already ${deleteRequest.status}` });

    deleteRequest.status = 'rejected';
    await deleteRequest.save();

    res.status(200).json({ success: true, message: 'Delete request rejected', data: deleteRequest });
  } catch (error) {
    console.error('Reject delete request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitDeleteRequest, getDeleteRequests, approveDeleteRequest, rejectDeleteRequest };

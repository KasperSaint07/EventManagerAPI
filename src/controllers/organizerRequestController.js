const OrganizerRequest = require('../models/OrganizerRequest');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validators');
const sendEmail = require('../utils/sendEmail');

// POST /api/organizer/request
const submitOrganizerRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'user') {
      return res.status(400).json({ success: false, message: `You already have the role '${req.user.role}'` });
    }

    const existing = await OrganizerRequest.findOne({ userId, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'You already have a pending request' });

    const request = await OrganizerRequest.create({ userId });
    res.status(201).json({ success: true, message: 'Organizer request submitted. Wait for admin approval', data: request });
  } catch (error) {
    console.error('Submit organizer request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/organizer-requests
const getOrganizerRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const total = await OrganizerRequest.countDocuments(filter);
    const requests = await OrganizerRequest.find(filter)
      .populate('userId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true, count: requests.length, total, page,
      pages: Math.ceil(total / limit), data: requests
    });
  } catch (error) {
    console.error('Get organizer requests error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/organizer-requests/:id/approve
const approveOrganizerRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await OrganizerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: `Request already ${request.status}` });

    request.status = 'approved';
    await request.save();

    const user = await User.findByIdAndUpdate(request.userId, { role: 'organizer' }, { new: true });

    // Notify user (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Organizer Request Approved!',
        text: 'Your request to become an organizer has been approved. You can now create events.',
        html: '<h2>Organizer Request Approved!</h2><p>You can now create and manage events.</p>'
      });
    } catch (emailError) {
      console.error('Approval email failed:', emailError.message);
    }

    res.status(200).json({ success: true, message: 'Request approved. User is now an organizer', data: request });
  } catch (error) {
    console.error('Approve request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/organizer-requests/:id/reject
const rejectOrganizerRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await OrganizerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: `Request already ${request.status}` });

    request.status = 'rejected';
    await request.save();

    res.status(200).json({ success: true, message: 'Request rejected', data: request });
  } catch (error) {
    console.error('Reject request error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/organizer/request/status
const getMyRequestStatus = async (req, res) => {
  try {
    const request = await OrganizerRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (!request) return res.status(404).json({ success: false, message: 'No request found' });
    res.status(200).json({ success: true, data: { status: request.status, createdAt: request.createdAt } });
  } catch (error) {
    console.error('Get request status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitOrganizerRequest, getOrganizerRequests, approveOrganizerRequest, rejectOrganizerRequest, getMyRequestStatus };

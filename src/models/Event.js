const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'], trim: true },
  dateTime: { type: Date, required: [true, 'Date and time are required'] },
  city: { type: String, required: [true, 'City is required'], trim: true },
  address: { type: String, required: [true, 'Address is required'], trim: true },
  capacity: { type: Number, required: [true, 'Capacity is required'], min: [1, 'Capacity must be at least 1'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);

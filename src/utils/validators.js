// EMAIL
const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required' };
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) return { isValid: false, message: 'Please provide a valid email address' };
  return { isValid: true, message: '' };
};

// PASSWORD
const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters long' };
  return { isValid: true, message: '' };
};

// EVENT FIELDS
const validateEventFields = (fields) => {
  const { title, description, dateTime, city, address, capacity } = fields;

  if (!title || !description || !dateTime || !city || !address || !capacity) {
    return { isValid: false, message: 'All fields are required: title, description, dateTime, city, address, capacity' };
  }
  if (title.trim().length < 3) return { isValid: false, message: 'Title must be at least 3 characters' };
  if (description.trim().length < 10) return { isValid: false, message: 'Description must be at least 10 characters' };

  const eventDate = new Date(dateTime);
  if (isNaN(eventDate.getTime())) return { isValid: false, message: 'Invalid date and time' };
  if (eventDate <= new Date()) return { isValid: false, message: 'Event date must be in the future' };

  if (city.trim().length < 2) return { isValid: false, message: 'City must be at least 2 characters' };
  if (address.trim().length < 5) return { isValid: false, message: 'Address must be at least 5 characters' };

  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1) return { isValid: false, message: 'Capacity must be a positive whole number' };

  return { isValid: true, message: '' };
};

// MONGODB OBJECTID
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

module.exports = { validateEmail, validatePassword, validateEventFields, isValidObjectId };

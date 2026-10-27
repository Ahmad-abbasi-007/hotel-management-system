const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['Single', 'Double', 'Suite', 'Deluxe'], required: true },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, default: 2, min: 1 },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Occupied', 'Cleaning', 'Maintenance'],
    default: 'Available'
  },
  amenities: { type: [String], default: ['WiFi', 'AC'] },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
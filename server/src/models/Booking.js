const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },
  services: [{
    name: String,
    price: Number
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'],
    default: 'Confirmed'
  },
  createdBy: {
    type: String,
    enum: ['guest', 'receptionist'],
    default: 'guest'
  }
}, { timestamps: true });

/**
 * 🔑 MOST IMPORTANT: Date Overlap Check
 *
 * Do dates overlap karti hain agar:
 *   existing.checkIn < new.checkOut  AND  existing.checkOut > new.checkIn
 *
 * Example:
 *   Booking A: 10 Jan → 15 Jan
 *   Booking B: 13 Jan → 18 Jan   → OVERLAP ✅ (reject)
 *   Booking C: 15 Jan → 20 Jan   → NO OVERLAP (allowed - same day checkout/checkin)
 */
bookingSchema.statics.isRoomAvailable = async function (
  roomId,
  checkIn,
  checkOut,
  excludeBookingId = null
) {
  const query = {
    room: roomId,
    status: { $in: ['Confirmed', 'CheckedIn'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existing = await this.findOne(query);
  return !existing;
};

module.exports = mongoose.model('Booking', bookingSchema);
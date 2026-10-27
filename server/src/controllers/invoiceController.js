const Booking = require('../models/Booking');
const { generateInvoice } = require('../utils/invoice');

exports.downloadInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('guest', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner or admin/receptionist can download
    const isOwner = booking.guest._id.toString() === req.user._id.toString();
    const isStaff = ['admin', 'receptionist'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only checked-out or confirmed bookings get invoice
    if (!['Confirmed', 'CheckedIn', 'CheckedOut'].includes(booking.status)) {
      return res.status(400).json({ message: 'Invoice not available for this booking' });
    }

    generateInvoice(booking, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
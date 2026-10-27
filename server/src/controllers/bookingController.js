const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Service = require('../models/Service');
const { sendBookingConfirmation, sendCancellationEmail } = require('../utils/email');

const TAX_RATE = 0.1; // 10% tax

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Protected (guest + receptionist)
 */
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, serviceIds = [] } = req.body;

    // 1. Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({ message: 'Past dates not allowed' });
    }
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // 2. Room exists?
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // 3. 🔑 Date overlap check
    const available = await Booking.isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!available) {
      return res.status(409).json({
        message: 'Room already booked for these dates. Please choose different dates.'
      });
    }

    // 4. Calculate nights & price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const subtotal = nights * room.price;

    // 5. Fetch selected services
    let servicesTotal = 0;
    let services = [];
    if (serviceIds.length > 0) {
      const dbServices = await Service.find({ _id: { $in: serviceIds } });
      services = dbServices.map(s => ({ name: s.name, price: s.price }));
      servicesTotal = services.reduce((sum, s) => sum + s.price, 0);
    }

    const tax = Math.round((subtotal + servicesTotal) * TAX_RATE);
    const totalPrice = subtotal + servicesTotal + tax;

    // 6. Create booking
    const booking = await Booking.create({
      guest: req.user._id,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      services,
      subtotal,
      tax,
      totalPrice,
      createdBy: req.user.role === 'receptionist' ? 'receptionist' : 'guest'
    });

    // 7. Update room status if check-in is today
    const checkInIsToday = checkInDate.toDateString() === new Date().toDateString();
    if (checkInIsToday) {
      room.status = 'Occupied';
      await room.save();
    } else {
      room.status = 'Booked';
      await room.save();
    }

    const populated = await booking.populate(['room', 'guest']);

    // 8. 📧 Send confirmation email (non-blocking — won't crash if it fails)
    if (populated.guest && populated.guest.email) {
      sendBookingConfirmation(populated, populated.guest.email, populated.guest.name)
        .catch((err) => console.error('Confirmation email error:', err.message));
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get logged-in user's bookings
 * @route   GET /api/bookings/my
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Get all bookings (admin/receptionist)
 * @route   GET /api/bookings
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('room')
      .populate('guest', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner or admin can cancel
    const isOwner = booking.guest.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }
    if (booking.status === 'CheckedOut') {
      return res.status(400).json({ message: 'Cannot cancel completed stay' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Free the room
    const room = await Room.findById(booking.room);
    if (room && room.status !== 'Maintenance') {
      room.status = 'Available';
      await room.save();
    }

    // 📧 Send cancellation email (non-blocking)
    const populated = await Booking.findById(booking._id)
      .populate('guest', 'name email')
      .populate('room');

    if (populated.guest && populated.guest.email) {
      sendCancellationEmail(populated, populated.guest.email, populated.guest.name)
        .catch((err) => console.error('Cancellation email error:', err.message));
    }

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Check-in / Check-out (receptionist)
 * @route   PUT /api/bookings/:id/status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['CheckedIn', 'CheckedOut'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    // Update room status
    const room = await Room.findById(booking.room._id);
    if (room) {
      if (status === 'CheckedIn') room.status = 'Occupied';
      if (status === 'CheckedOut') room.status = 'Cleaning';
      await room.save();
    }

    res.json({ message: `Booking ${status}`, booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
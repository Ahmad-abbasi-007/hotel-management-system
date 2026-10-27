const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/', protect, authorize('admin', 'receptionist'), getAllBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, authorize('admin', 'receptionist'), updateBookingStatus);

module.exports = router;
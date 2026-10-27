const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

/**
 * @desc    Dashboard stats + charts data
 * @route   GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 * @access  Admin only
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const bookingMatch = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    // 1. Summary cards
    const totalRooms = await Room.countDocuments();
    const totalGuests = await User.countDocuments({ role: 'guest' });
    const allBookings = await Booking.find(bookingMatch);
    const totalBookings = allBookings.length;
    const revenue = allBookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const occupancyRate = totalRooms
      ? Math.round((allBookings.filter(b => ['Confirmed', 'CheckedIn'].includes(b.status)).length / totalRooms) * 100)
      : 0;

    // 2. Revenue per month (last 6 months)
    const revenueByMonth = await Booking.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueChart = revenueByMonth.map(r => ({
      month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      revenue: r.revenue
    }));

    // 3. Bookings by room type
    const bookingsByType = await Booking.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $lookup: { from: 'rooms', localField: 'room', foreignField: '_id', as: 'roomData' } },
      { $unwind: '$roomData' },
      { $group: { _id: '$roomData.type', count: { $sum: 1 } } }
    ]);
    const typeChart = bookingsByType.map(b => ({ type: b._id, count: b.count }));

    // 4. Occupancy over time (bookings per day - last 30 days)
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const occupancyOverTime = await Booking.aggregate([
      { $match: { createdAt: { $gte: last30 }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const occupancyChart = occupancyOverTime.map(o => ({ date: o._id.slice(5), count: o.count }));

    res.json({
      summary: { totalRooms, totalBookings, totalGuests, revenue, occupancyRate },
      revenueChart,
      typeChart,
      occupancyChart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
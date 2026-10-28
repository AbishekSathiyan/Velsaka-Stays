
const Booking = require("../models/Booking");

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId,
    })
      .populate("hotel", "name city address images")
      .sort({ checkIn: -1 });

    const now = new Date();

    const data = bookings.map((booking) => {
      const item = booking.toObject();

      const isUpcoming =
        item.status !== "cancelled" &&
        new Date(item.checkOut) > now;

      return {
        ...item,
        category: isUpcoming ? "upcoming" : "past",
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

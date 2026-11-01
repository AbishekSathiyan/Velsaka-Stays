
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// ==========================================
// DASHBOARD STATISTICS
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    // Current month + previous 6 months
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    );

    const [
      totalHotels,
      totalCustomers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      revenueResult,
      monthlyRevenue,
      recentBookings,
    ] = await Promise.all([
      Hotel.countDocuments(),

      User.countDocuments({ role: "user" }),

      Booking.countDocuments(),

      Booking.countDocuments({ status: "pending" }),

      Booking.countDocuments({ status: "confirmed" }),

      // Total confirmed booking revenue
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Monthly confirmed revenue
      Booking.aggregate([
        {
          $match: {
            status: "confirmed",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            bookings: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Latest 5 bookings
      Booking.find()
        .populate("user", "name email phone")
        .populate("hotel", "name city")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Build all 7 chart months, including zero-revenue months
    const chartData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 6 + i,
        1
      );

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const matchingMonth = monthlyRevenue.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month
      );

      chartData.push({
        month: date.toLocaleString("en-IN", {
          month: "short",
        }),
        revenue: matchingMonth?.revenue || 0,
        bookings: matchingMonth?.bookings || 0,
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalHotels,
        totalCustomers,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue,
      },
      chartData,
      recentBookings,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
    });
  }
};

// ==========================================
// GET ALL BOOKINGS
// ==========================================
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email phone")
      .populate("hotel", "name city address")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("ADMIN BOOKINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
};

// ==========================================
// GET ALL CUSTOMERS
// ==========================================
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find()
  .select("-__v")
  .sort({ createdAt: -1 })
  .lean();

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers.",
    });
  }
};

// ==========================================
// GET ALL HOTELS
// ==========================================
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    console.error("ADMIN HOTELS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch hotels.",
    });
  }
};

// ==========================================
// CREATE HOTEL
// ==========================================
exports.createHotel = async (req, res) => {
  try {
    const {
      name,
      city,
      address,
      description,
      pricePerNight,
      starRating,
      images,
      amenities,
      isActive,
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof city !== "string" ||
      typeof address !== "string" ||
      !name.trim() ||
      !city.trim() ||
      !address.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Hotel name, city and address are required.",
      });
    }

    const price = Number(pricePerNight);
    const rating = Number(starRating ?? 3);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid hotel price.",
      });
    }

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Star rating must be between 1 and 5.",
      });
    }

    if (
      images !== undefined &&
      !Array.isArray(images)
    ) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array.",
      });
    }

    if (
      amenities !== undefined &&
      !Array.isArray(amenities)
    ) {
      return res.status(400).json({
        success: false,
        message: "Amenities must be an array.",
      });
    }

    const slugBase = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const hotel = await Hotel.create({
      name: name.trim(),
      slug,
      city: city.trim(),
      address: address.trim(),
      description: description || "",
      pricePerNight: price,
      starRating: rating,
      images: images || [],
      amenities: amenities || [],
      isActive: isActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully.",
      hotel,
    });
  } catch (error) {
    console.error("CREATE HOTEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create hotel.",
    });
  }
};

// ==========================================
// UPDATE HOTEL
// ==========================================
exports.updateHotel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    const allowedFields = [
      "name",
      "city",
      "address",
      "description",
      "pricePerNight",
      "starRating",
      "images",
      "amenities",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    // Validate text fields
    for (const field of ["name", "city", "address"]) {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] !== "string" ||
          !updates[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be empty.`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    // Validate price
    if (updates.pricePerNight !== undefined) {
      updates.pricePerNight = Number(
        updates.pricePerNight
      );

      if (
        !Number.isFinite(updates.pricePerNight) ||
        updates.pricePerNight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid hotel price.",
        });
      }
    }

    // Validate rating
    if (updates.starRating !== undefined) {
      updates.starRating = Number(updates.starRating);

      if (
        !Number.isInteger(updates.starRating) ||
        updates.starRating < 1 ||
        updates.starRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Star rating must be between 1 and 5.",
        });
      }
    }

    // Validate images
    if (
      updates.images !== undefined &&
      !Array.isArray(updates.images)
    ) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array.",
      });
    }

    // Validate amenities
    if (
      updates.amenities !== undefined &&
      !Array.isArray(updates.amenities)
    ) {
      return res.status(400).json({
        success: false,
        message: "Amenities must be an array.",
      });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully.",
      hotel,
    });
  } catch (error) {
    console.error("UPDATE HOTEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update hotel.",
    });
  }
};

// ==========================================
// DELETE HOTEL
// ==========================================
exports.deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    // Preserve existing booking history
    const hasBookings = await Booking.exists({
      hotel: id,
    });

    if (hasBookings) {
      return res.status(409).json({
        success: false,
        message:
          "This hotel has booking records. Deactivate it instead of deleting it.",
      });
    }

    const hotel = await Hotel.findByIdAndDelete(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE HOTEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete hotel.",
    });
  }
};

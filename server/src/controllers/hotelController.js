const Hotel = require("../models/Hotel");

// GET /api/hotels
exports.getHotels = async (req, res, next) => {
  try {
    const { city, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter = { isActive: true };

    if (city?.trim()) {
      filter.city = {
        $regex: city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};

      if (minPrice !== undefined && minPrice !== "") {
        const value = Number(minPrice);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid minimum price",
          });
        }
        priceFilter.$gte = value;
      }

      if (maxPrice !== undefined && maxPrice !== "") {
        const value = Number(maxPrice);
        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid maximum price",
          });
        }
        priceFilter.$lte = value;
      }

      if (
        priceFilter.$gte !== undefined &&
        priceFilter.$lte !== undefined &&
        priceFilter.$gte > priceFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Minimum price cannot exceed maximum price",
        });
      }

      filter.pricePerNight = priceFilter;
    }

    const [hotels, total] = await Promise.all([
      Hotel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Hotel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hotels/:id
exports.getHotelById = async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const hotel = await Hotel.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hotels/nearby?lat=9.9252&lng=78.1198&radiusKm=10
// GET /api/hotels/nearby?lat=13.0827&lng=80.2707&radiusKm=10
exports.getNearbyHotels = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm ?? 10);
    const limit = Number(req.query.limit ?? 20);

    if (
      req.query.lat === undefined ||
      req.query.lng === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 100) {
      return res.status(400).json({
        success: false,
        message: "radiusKm must be between 1 and 100.",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "limit must be between 1 and 50.",
      });
    }

    const hotels = await Hotel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          key: "location",
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: radiusKm * 1000,
          query: { isActive: true },
        },
      },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      count: hotels.length,
      radiusKm,
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

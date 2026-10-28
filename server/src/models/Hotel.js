const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: 120,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    // GeoJSON coordinates must be [longitude, latitude].
    // Optional so existing hotel documents remain valid.
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            if (value == null) return true;

            if (value.length !== 2) return false;

            const [longitude, latitude] = value;

            return (
              Number.isFinite(longitude) &&
              Number.isFinite(latitude) &&
              longitude >= -180 &&
              longitude <= 180 &&
              latitude >= -90 &&
              latitude <= 90
            );
          },
          message:
            "Location coordinates must be [longitude, latitude] within valid ranges",
        },
      },
    },

    starRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 1,
    },

    images: {
      type: [String],
      default: [],
    },

    amenities: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Enables MongoDB's geospatial queries.
hotelSchema.index({ location: "2dsphere" });

module.exports =
  mongoose.models.Hotel || mongoose.model("Hotel", hotelSchema);
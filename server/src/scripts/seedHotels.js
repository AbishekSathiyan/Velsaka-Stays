
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Hotel = require("../models/Hotel");

const hotels = [
  {
    name: "The Grand Palm Residency",
    slug: "grand-palm-residency",
    description:
      "A comfortable premium stay featuring modern rooms, attentive service, and convenient access to the city.",
    city: "Coimbatore",
    address: "Avinashi Road, Coimbatore, Tamil Nadu",
    starRating: 4,
    pricePerNight: 3200,
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    ],
    amenities: ["Free Wi-Fi", "Swimming Pool", "Restaurant", "Air Conditioning"],
    isActive: true,
  },
  {
    name: "Marina Bay Comforts",
    slug: "marina-bay-comforts",
    description:
      "A contemporary city hotel with stylish interiors, comfortable beds, and easy access to popular attractions.",
    city: "Chennai",
    address: "OMR, Chennai, Tamil Nadu",
    starRating: 4,
    pricePerNight: 4500,
    images: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
    ],
    amenities: ["Free Wi-Fi", "Restaurant", "Gym", "Parking"],
    isActive: true,
  },
  {
    name: "Emerald Garden Suites",
    slug: "emerald-garden-suites",
    description:
      "Relax in spacious rooms surrounded by greenery, with thoughtful amenities for business and leisure travellers.",
    city: "Bengaluru",
    address: "Whitefield, Bengaluru, Karnataka",
    starRating: 5,
    pricePerNight: 6200,
    images: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
    ],
    amenities: ["Free Wi-Fi", "Swimming Pool", "Spa", "Restaurant", "Gym"],
    isActive: true,
  },
  {
    name: "Heritage Courtyard Inn",
    slug: "heritage-courtyard-inn",
    description:
      "A welcoming boutique stay with elegant rooms, regional hospitality, and a peaceful atmosphere.",
    city: "Madurai",
    address: "KK Nagar, Madurai, Tamil Nadu",
    starRating: 3,
    pricePerNight: 2200,
    images: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
    ],
    amenities: ["Free Wi-Fi", "Restaurant", "Parking", "Air Conditioning"],
    isActive: true,
  },
  {
    name: "Coral Shore Retreat",
    slug: "coral-shore-retreat",
    description:
      "An inviting coastal-inspired retreat offering comfortable accommodation for a relaxing getaway.",
    city: "Pondicherry",
    address: "White Town, Puducherry",
    starRating: 4,
    pricePerNight: 3800,
    images: [
      "https://images.unsplash.com/photo-1582719508461-905c673771fd",
    ],
    amenities: ["Free Wi-Fi", "Swimming Pool", "Restaurant", "Parking"],
    isActive: true,
  },
];

async function seedHotels() {
  try {
    await connectDB();

    const operations = hotels.map((hotel) => ({
      updateOne: {
        filter: { slug: hotel.slug },
        update: { $set: hotel },
        upsert: true,
      },
    }));

    const result = await Hotel.bulkWrite(operations);

    console.log("Hotel seed completed successfully.");
    console.log(`Hotels processed: ${hotels.length}`);
    console.log(`Inserted: ${result.upsertedCount}`);
    console.log(`Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Hotel seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedHotels();

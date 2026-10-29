
const express = require("express");
const router = express.Router();

const hotelController = require("../controllers/hotelController");

// Get all hotels
router.get("/", hotelController.getHotels);

// IMPORTANT: This must be before "/:id"
router.get("/nearby", hotelController.getNearbyHotels);

// Get hotel by ID
router.get("/:id", hotelController.getHotelById);

module.exports = router;

module.exports = router;
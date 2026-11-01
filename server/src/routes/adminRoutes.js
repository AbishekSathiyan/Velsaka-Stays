
const express = require("express");
const router = express.Router();

const {
  verifyFirebaseToken,
  requireDbUser,
} = require("../middleware/authMiddleware");

const requireAdmin = require("../middleware/requireAdmin");

const adminController = require("../controllers/adminController");

// Authentication and authorization
router.use(verifyFirebaseToken);
router.use(requireDbUser);
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// Bookings
router.get("/bookings", adminController.getAllBookings);

// Customers
router.get("/customers", adminController.getAllCustomers);

// Hotels CRUD
router.get("/hotels", adminController.getAllHotels);
router.post("/hotels", adminController.createHotel);
router.put("/hotels/:id", adminController.updateHotel);
router.delete("/hotels/:id", adminController.deleteHotel);

module.exports = router;

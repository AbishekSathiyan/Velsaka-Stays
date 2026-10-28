
const express = require("express");
const authMiddleware = require("../middleware/authmiddleware");
const bookingController = require("../controllers/bookingController");

const router = express.Router();

router.get("/my", authMiddleware, bookingController.getMyBookings);

module.exports = router;

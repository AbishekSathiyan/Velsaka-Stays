const express = require("express");
const router = express.Router();

const {
  verifyFirebaseToken,
  requireDbUser,
} = require("../middleware/authmiddleware");

const {
  getMyBookings,
} = require("../controllers/bookingController");

router.get(
  "/my",
  verifyFirebaseToken,
  requireDbUser,
  getMyBookings
);

module.exports = router;
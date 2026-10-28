
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

// Require a valid login for both payment endpoints.
router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;

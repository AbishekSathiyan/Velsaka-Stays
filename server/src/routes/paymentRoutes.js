const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

const {
  verifyFirebaseToken,
  requireDbUser,
} = require("../middleware/authMiddleware");

router.post(
  "/create-order",
  verifyFirebaseToken,
  requireDbUser,
  createPaymentOrder
);

router.post(
  "/verify",
  verifyFirebaseToken,
  requireDbUser,
  verifyPayment
);

module.exports = router;
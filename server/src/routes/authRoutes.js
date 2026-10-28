const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);

router.get("/me", authMiddleware, authController.getMe);
router.patch("/me", authMiddleware, authController.updateProfile);

router.post("/logout", authController.logout);

module.exports = router;
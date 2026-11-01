const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

const {
  verifyFirebaseToken,
  requireDbUser,
} = require("../middleware/authmiddleware");

// Register / Login synchronization
router.post(
  "/sync",
  verifyFirebaseToken,
  authController.syncUser
);

// Get profile
router.get(
  "/me",
  verifyFirebaseToken,
  requireDbUser,
  authController.getMe
);

// Update profile
router.put(
  "/profile",
  verifyFirebaseToken,
  requireDbUser,
  authController.updateProfile
);


// Logout
router.post(
  "/logout",
  verifyFirebaseToken,
  authController.logout
);

module.exports = router;

const admin = require("../config/firebaseAdmin");
const User = require("../models/User");

// ======================================
// VERIFY FIREBASE ID TOKEN
// ======================================

exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token.",
      });
    }

    // Verify Firebase ID token.
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Keep verified Firebase identity.
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error("FIREBASE TOKEN VERIFICATION ERROR:", {
      code: error.code,
      message: error.message,
    });

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase token.",
    });
  }
};

// ======================================
// FIND MONGODB USER
// ======================================

exports.requireDbUser = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Firebase UID not found.",
      });
    }

    // Find user using Firebase UID.
    const user = await User.findOne({
      firebaseUid,
    }).select("_id firebaseUid name email phone role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "MongoDB user profile not found. Please synchronize your account.",
      });
    }

    // Attach MongoDB user ID for existing controllers.
    req.user.userId = user._id.toString();

    // Keep complete MongoDB profile available too.
    req.dbUser = user;

    console.log("AUTHENTICATED USER:", {
      firebaseUid: req.user.uid,
      mongoUserId: req.user.userId,
      email: req.user.email,
    });

    next();
  } catch (error) {
    console.error("MONGODB USER LOOKUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your database user profile.",
    });
  }
};
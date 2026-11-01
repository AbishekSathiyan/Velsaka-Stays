const User = require("../models/User");

// Format user response
const formatUser = (user) => ({
  id: user._id,
  firebaseUid: user.firebaseUid,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
});

// ======================================
// SYNC FIREBASE USER
// ======================================

exports.syncUser = async (req, res, next) => {
  try {
    const {
      uid,
      email,
      name: firebaseName,
      emailVerified,
    } = req.user;

    const { name, phone } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: "Firebase user information is incomplete.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      firebaseUid: uid,
    });

    if (!user) {
      user = await User.findOne({
        email: cleanEmail,
      });

      if (user) {
        if (!emailVerified) {
          return res.status(403).json({
            success: false,
            message: "Please verify your email before linking your account.",
          });
        }

        user.firebaseUid = uid;
      }
    }

    const requestedName =
      typeof name === "string" ? name.trim() : "";

    const verifiedFirebaseName =
      typeof firebaseName === "string"
        ? firebaseName.trim()
        : "";

    const finalName =
      requestedName ||
      user?.name ||
      verifiedFirebaseName ||
      cleanEmail.split("@")[0];

    if (finalName.length < 2 || finalName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    if (!user) {
      user = new User({
        firebaseUid: uid,
        email: cleanEmail,
        name: finalName,
        phone: typeof phone === "string" ? phone.trim() : "",
        role: "user",
      });
    } else {
      user.firebaseUid = uid;
      user.email = cleanEmail;
      user.name = finalName;

      if (typeof phone === "string") {
        user.phone = phone.trim();
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account synchronized successfully.",
      data: {
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error("Sync user error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or Firebase account already exists.",
      });
    }

    next(error);
  }
};

// ======================================
// GET CURRENT USER
// ======================================

exports.getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: {
        user: formatUser(req.dbUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// UPDATE PROFILE
// ======================================

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    if (!req.dbUser) {
      return res.status(404).json({
        success: false,
        message: "Database user not found.",
      });
    }

    const updates = {};

    // Name validation
    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be a string.",
        });
      }

      const cleanName = name.trim();

      if (cleanName.length < 2 || cleanName.length > 80) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 80 characters.",
        });
      }

      updates.name = cleanName;
    }

    // Phone validation
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a string.",
        });
      }

      const cleanPhone = phone.trim();

      if (
        cleanPhone &&
        !/^[6-9]\d{9}$/.test(cleanPhone)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10-digit Indian mobile number.",
        });
      }

      updates.phone = cleanPhone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile changes provided.",
      });
    }

    console.log("PROFILE UPDATE:", {
      firebaseUid: req.user.uid,
      mongoUserId: req.dbUser._id,
      updates,
    });

    // Update MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.dbUser._id,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log("PROFILE SAVED:", {
      database: User.db.name,
      collection: User.collection.name,
      userId: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: formatUser(updatedUser),
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    next(error);
  }
};

// ======================================
// LOGOUT
// ======================================

exports.logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Sign out from Firebase on the client.",
  });
};
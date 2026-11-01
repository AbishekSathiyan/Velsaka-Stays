const requireAdmin = (req, res, next) => {
  try {
    const user = req.dbUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User profile not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN AUTHORIZATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin permissions.",
    });
  }
};

module.exports = requireAdmin;
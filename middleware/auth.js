const jwt = require("jsonwebtoken");
const User = require("../models/OpenScheema");

// Protect routes - verifies JWT from cookies or Authorization Bearer header
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Authorize routes - restricts access to specific user roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in first.",
      });
    }

    const userRole = (req.user.role || "patient").toLowerCase();
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    const hasRole =
      normalizedRoles.includes(userRole) ||
      (userRole === "user" && normalizedRoles.includes("patient")) ||
      (userRole === "patient" && normalizedRoles.includes("user")) ||
      userRole === "admin";

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

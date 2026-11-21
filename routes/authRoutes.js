const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} = require("../controllers/cINcontroller");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes (any logged-in user)
router.get("/me", protect, getMe);
router.get("/user/profile", protect, getMe);
router.get("/profile", protect, getMe);
router.put("/user/profile", protect, updateProfile);
router.put("/profile", protect, updateProfile);

// Role-protected routes (demonstrating role-based authorization)
router.get(
  "/doctor-only",
  protect,
  authorize("doctor", "doctor/hospital"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Access granted: Welcome to the Doctor portal!",
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
    });
  }
);

router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted: Welcome to the Admin portal!",
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
  });
});

module.exports = router;

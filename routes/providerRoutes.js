const express = require("express");
const router = express.Router();
const {
  createOrUpdateProfile,
  getMyProfile,
  getProfileById,
  getAllProviders,
} = require("../controllers/providerController");
const { protect, authorize } = require("../middleware/auth");

// Public provider listing and detail
router.get("/", getAllProviders);
router.get("/me", protect, getMyProfile);
router.get("/:id", getProfileById);

// Protected provider registration and profile updates
router.post(
  "/",
  protect,
  authorize("doctor", "doctor/hospital", "admin"),
  createOrUpdateProfile
);

router.post(
  "/register",
  protect,
  authorize("doctor", "doctor/hospital", "admin"),
  createOrUpdateProfile
);

router.put(
  "/",
  protect,
  authorize("doctor", "doctor/hospital", "admin"),
  createOrUpdateProfile
);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getBookedSlots,
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");

// Public route to check locked/booked time slots for a doctor on a specific date
router.get("/booked-slots", getBookedSlots);

// Protected routes (require valid JWT session)
router.use(protect);

router.post("/", authorize("patient", "user"), createAppointment);
router.get("/my", getMyAppointments);
router.get("/doctor", getDoctorAppointments);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/status", updateAppointmentStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/", authorize("patient", "user"), createAppointment);
router.get("/my", getMyAppointments);
router.get("/doctor", getDoctorAppointments);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/status", updateAppointmentStatus);

module.exports = router;

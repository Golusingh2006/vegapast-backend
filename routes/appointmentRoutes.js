const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", createAppointment);
router.get("/my", getMyAppointments);
router.get("/doctor", getDoctorAppointments);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/status", updateAppointmentStatus);

module.exports = router;

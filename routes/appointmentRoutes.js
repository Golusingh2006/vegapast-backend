const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  cancelAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", createAppointment);
router.get("/my", getMyAppointments);
router.put("/:id/cancel", cancelAppointment);

module.exports = router;

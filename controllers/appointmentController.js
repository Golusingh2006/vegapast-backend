const Appointment = require("../models/Appointment");

// Create / Book a new Appointment (Protected)
exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      patientName,
      patientPhone,
      patientEmail,
      doctorName,
      doctorSpeciality,
      hospitalName,
      appointmentDate,
      appointmentTime,
      consultType,
      symptoms,
    } = req.body;

    if (!patientName || !patientPhone || !doctorName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: "Patient name, phone, doctor name, date, and time are required.",
      });
    }

    const bookingId = `APT-${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900
    )}`;

    const appointment = await Appointment.create({
      patient: userId,
      patientName: patientName.trim(),
      patientPhone: String(patientPhone).trim(),
      patientEmail: patientEmail ? patientEmail.trim().toLowerCase() : "",
      doctorName: doctorName.trim(),
      doctorSpeciality: doctorSpeciality || "Specialist",
      hospitalName: hospitalName || "Hospital / Clinic",
      appointmentDate,
      appointmentTime,
      consultType: consultType || "hospital",
      symptoms: symptoms ? symptoms.trim() : "",
      status: "Confirmed",
      bookingId,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully!",
      appointment,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to book appointment",
    });
  }
};

// Get all appointments for the logged-in user
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const appointments = await Appointment.find({ patient: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch appointments",
    });
  }
};

// Cancel an appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, patient: userId },
      { status: "Cancelled" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel appointment",
    });
  }
};

// Get all appointments assigned to the logged-in doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorName = req.user.name || "";
    const cleanName = doctorName.replace(/^Dr\.\s*/i, "").trim();

    // Query appointments where doctor name matches or patient booked this doctor
    const appointments = await Appointment.find({
      $or: [
        { doctorName: new RegExp(cleanName, "i") },
        { doctor: req.user._id || req.user.id },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch doctor appointments",
    });
  }
};

// Update appointment status by doctor (e.g. In-Progress, Completed, Cancelled)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update appointment status",
    });
  }
};

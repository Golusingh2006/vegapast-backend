const Appointment = require("../models/Appointment");
const DoctorHospital = require("../models/DoctorHospital");
const User = require("../models/OpenScheema");

// Get currently locked / booked slots for a specific doctor and date
// A slot is locked from the moment a patient books it until:
// 1) The doctor marks it as "Completed" (doctor sees the patient), OR
// 2) Either the patient or the doctor cancels the appointment
exports.getBookedSlots = async (req, res) => {
  try {
    const { doctorName, appointmentDate, doctorId } = req.query;

    if (!doctorName || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "doctorName and appointmentDate are required query parameters.",
        bookedSlots: [],
      });
    }

    const cleanDoc = doctorName.replace(/^Dr\.\s*/i, "").trim();

    // Query active appointments that lock the slot
    const query = {
      $or: [
        { doctorName: new RegExp(cleanDoc, "i") },
        ...(doctorId ? [{ doctorId: doctorId }] : []),
      ],
      appointmentDate: appointmentDate.trim(),
      status: { $in: ["Confirmed", "Scheduled", "In-Progress"] },
    };

    const activeAppointments = await Appointment.find(query).select(
      "appointmentTime status bookingId"
    );

    const bookedSlots = activeAppointments.map((apt) => apt.appointmentTime);

    return res.status(200).json({
      success: true,
      doctorName,
      appointmentDate,
      count: bookedSlots.length,
      bookedSlots,
    });
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch booked slots",
      bookedSlots: [],
    });
  }
};

// Create / Book a new Appointment (Protected - Patient Only)
exports.createAppointment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      patientName,
      patientPhone,
      patientEmail,
      doctorId,
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

    const cleanDoctorName = doctorName.replace(/^Dr\.\s*/i, "").trim();

    // STRICT TIME SLOT LOCK CHECK:
    // Verify if this exact (doctor, date, time) slot is currently locked by an active appointment
    const existingActiveAppointment = await Appointment.findOne({
      doctorName: new RegExp(cleanDoctorName, "i"),
      appointmentDate: appointmentDate.trim(),
      appointmentTime: appointmentTime.trim(),
      status: { $in: ["Confirmed", "Scheduled", "In-Progress"] },
    });

    if (existingActiveAppointment) {
      return res.status(409).json({
        success: false,
        message: `The appointment time slot "${appointmentTime}" on ${appointmentDate} is already booked and locked. It remains locked until the doctor marks it completed or the appointment is cancelled. Please select another slot.`,
      });
    }

    // Attempt to link doctor user account if registered
    let doctorUserId = null;
    try {
      const matchedDoctorUser = await User.findOne({
        name: new RegExp(cleanDoctorName, "i"),
        role: { $in: ["doctor", "doctor/hospital"] },
      }).select("_id");
      if (matchedDoctorUser) {
        doctorUserId = matchedDoctorUser._id;
      }
    } catch {
      // Non-blocking lookup
    }

    const bookingId = `APT-${Date.now().toString().slice(-6)}${Math.floor(
      100 + Math.random() * 900
    )}`;

    const appointment = await Appointment.create({
      patient: userId,
      patientName: patientName.trim(),
      patientPhone: String(patientPhone).trim(),
      patientEmail: patientEmail ? patientEmail.trim().toLowerCase() : "",
      doctor: doctorUserId,
      doctorId: doctorId || "",
      doctorName: doctorName.trim(),
      doctorSpeciality: doctorSpeciality || "Specialist",
      hospitalName: hospitalName || "Hospital / Clinic",
      appointmentDate: appointmentDate.trim(),
      appointmentTime: appointmentTime.trim(),
      consultType: consultType || "hospital",
      symptoms: symptoms ? symptoms.trim() : "",
      status: "Confirmed",
      bookingId,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully! Time slot is now locked for you.",
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

// Get all appointments for the logged-in user (Patient view)
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

// Cancel an appointment (Can be cancelled by either Patient or Doctor)
// Cancelling unlocks the time slot immediately
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();
    const isDoctorOrHospital = userRole === "doctor" || userRole === "doctor/hospital";
    const { id } = req.params;

    // If doctor/hospital, they can cancel their assigned appointment.
    // If patient, they can cancel their own booked appointment.
    const filter = isDoctorOrHospital
      ? { _id: id }
      : { _id: id, patient: userId };

    const appointment = await Appointment.findOneAndUpdate(
      filter,
      {
        status: "Cancelled",
        cancelledBy: isDoctorOrHospital ? "doctor" : "patient",
      },
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
      message: "Appointment cancelled successfully. The time slot is now unlocked.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel appointment",
    });
  }
};

// Get all appointments assigned to the logged-in doctor or hospital
exports.getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const doctorName = req.user.name || "";
    const cleanName = doctorName.replace(/^Dr\.\s*/i, "").trim();

    // Check if the provider has a registered DoctorHospital profile
    const providerProfile = await DoctorHospital.findOne({ user: userId });

    let queryConditions = [
      { doctorName: new RegExp(cleanName, "i") },
      { doctor: userId },
    ];

    if (providerProfile) {
      if (providerProfile.registrationType === "hospital") {
        // For hospital, match appointments booked for the hospital or any doctor on its roster
        if (providerProfile.facilityProfile?.facilityName) {
          queryConditions.push({
            hospitalName: new RegExp(providerProfile.facilityProfile.facilityName.trim(), "i"),
          });
        }
        if (Array.isArray(providerProfile.doctors)) {
          providerProfile.doctors.forEach((doc) => {
            if (doc.name) {
              const cleanDoc = doc.name.replace(/^Dr\.\s*/i, "").trim();
              queryConditions.push({ doctorName: new RegExp(cleanDoc, "i") });
            }
          });
        }
      } else if (providerProfile.registrationType === "doctor" && providerProfile.doctorProfile?.name) {
        const docName = providerProfile.doctorProfile.name.replace(/^Dr\.\s*/i, "").trim();
        queryConditions.push({ doctorName: new RegExp(docName, "i") });
      }
    }

    const appointments = await Appointment.find({
      $or: queryConditions,
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
// Marking "Completed" or "Cancelled" unlocks the slot!
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Confirmed", "Scheduled", "In-Progress", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateFields = { status };
    if (status === "Completed") {
      updateFields.completedAt = new Date();
    } else if (status === "Cancelled") {
      updateFields.cancelledBy = "doctor";
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.${
        status === "Completed" || status === "Cancelled"
          ? " The time slot has now been unlocked."
          : ""
      }`,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update appointment status",
    });
  }
};

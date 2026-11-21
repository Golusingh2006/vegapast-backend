const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "openSchema",
      required: [true, "Patient ID is required"],
    },
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    patientPhone: {
      type: String,
      required: [true, "Patient phone is required"],
      trim: true,
    },
    patientEmail: {
      type: String,
      trim: true,
      default: "",
    },
    doctorName: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    doctorSpeciality: {
      type: String,
      default: "Specialist",
      trim: true,
    },
    hospitalName: {
      type: String,
      default: "Hospital / Clinic",
      trim: true,
    },
    appointmentDate: {
      type: String,
      required: [true, "Appointment date is required"],
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
    },
    consultType: {
      type: String,
      enum: ["hospital", "video", "clinic"],
      default: "hospital",
    },
    symptoms: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Confirmed", "Scheduled", "In-Progress", "Completed", "Cancelled"],
      default: "Confirmed",
    },
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);

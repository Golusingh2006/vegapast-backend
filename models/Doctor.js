const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
      default: "Consultant",
    },
    speciality: {
      type: String,
      required: true,
      trim: true,
    },
    allSpecialities: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: String,
      default: "₹1,500",
    },
    feeAmount: {
      type: Number,
      default: 1500,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 100,
    },
    hospital: {
      type: String,
      default: "",
    },
    hospitalName: {
      type: String,
      default: "",
    },
    clinicAddress: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "New Delhi",
    },
    image: {
      type: String,
      default: "",
    },
    education: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
      default: "",
    },
    awards: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    languages: {
      type: [String],
      default: ["English", "Hindi"],
    },
    availability: {
      type: String,
      default: "Mon - Sat (09:00 AM - 05:00 PM)",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    successRate: {
      type: String,
      default: "99%",
    },
    surgeriesCount: {
      type: String,
      default: "1,000+",
    },
    timeSlots: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "openSchema",
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ email: 1 });
doctorSchema.index({ speciality: 1 });
doctorSchema.index({ city: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);

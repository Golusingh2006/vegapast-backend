const mongoose = require("mongoose");

// Sub-schema for individual doctor in a hospital (no contact info as per requirements)
const hospitalDoctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    position: {
      type: String,
      trim: true,
      default: "Consultant",
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    specialities: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    availability: {
      type: String,
      trim: true,
      default: "Mon - Sat (10:00 AM - 05:00 PM)",
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

// Sub-schema for individual doctor personal profile
const doctorPersonalProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
      default: "Senior Consultant",
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    specialities: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    languages: {
      type: [String],
      default: ["English", "Hindi"],
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    availability: {
      type: String,
      trim: true,
      default: "Mon - Sat (09:00 AM - 05:00 PM)",
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Sub-schema for facility/clinic/hospital
const facilityProfileSchema = new mongoose.Schema(
  {
    facilityName: {
      type: String,
      required: [true, "Facility / Clinic / Hospital name is required"],
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: "",
    },
    hospitalGroup: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    timings: {
      type: String,
      trim: true,
      default: "Mon - Sat (09:00 AM - 07:00 PM)",
    },
    // Contact Information (Shared by all doctors in this facility)
    primaryContact: {
      type: String,
      required: [true, "Primary contact number is required"],
      trim: true,
    },
    secondaryContact: {
      type: String,
      trim: true,
      default: "",
    },
    tertiaryContact: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyNumber: {
      type: String,
      trim: true,
      default: "",
    },
    ambulancePhone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    // Hospital infrastructure (used primarily for hospital registration)
    bedsCount: {
      type: String,
      trim: true,
      default: "",
    },
    icuBeds: {
      type: String,
      trim: true,
      default: "",
    },
    operationTheatres: {
      type: String,
      trim: true,
      default: "",
    },
    accreditations: {
      type: [String],
      default: [],
    },
    specialities: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    bannerImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Main DoctorHospital schema supporting both 'doctor' and 'hospital'
const doctorHospitalSchema = new mongoose.Schema(
  {
    // Link to the authenticated user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "openSchema",
      required: [true, "User reference is required"],
      unique: true,
    },
    registrationType: {
      type: String,
      enum: ["doctor", "hospital"],
      required: [true, "Registration type must be 'doctor' or 'hospital'"],
    },
    // Individual Doctor Profile (filled when registrationType === 'doctor')
    doctorProfile: {
      type: doctorPersonalProfileSchema,
      default: null,
    },
    // Facility / Clinic Profile (filled for both types; holds facility contact info)
    facilityProfile: {
      type: facilityProfileSchema,
      required: [true, "Facility profile details are required"],
    },
    // Multiple Doctors under a Hospital (filled when registrationType === 'hospital')
    doctors: {
      type: [hospitalDoctorSchema],
      default: [],
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
doctorHospitalSchema.index({ user: 1 }, { unique: true });
doctorHospitalSchema.index({ registrationType: 1 });
doctorHospitalSchema.index({ "facilityProfile.city": 1 });

const DoctorHospital = mongoose.model("DoctorHospital", doctorHospitalSchema);

module.exports = DoctorHospital;

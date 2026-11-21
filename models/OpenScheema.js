const mongoose = require("mongoose");

const openSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["patient", "user", "doctor", "doctor/hospital", "admin"],
      default: "patient",
    },
    // Patient Profile details
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    insuranceProvider: {
      type: String,
      default: "",
    },
    policyNumber: {
      type: String,
      default: "",
    },
    allergies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const openScheema = mongoose.model("openSchema", openSchema);

module.exports = openScheema;

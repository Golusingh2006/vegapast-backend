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
  },
  {
    timestamps: true,
  }
);

const openScheema = mongoose.model("openSchema", openSchema);

module.exports = openScheema;

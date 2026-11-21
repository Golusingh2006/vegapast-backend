const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    day: { type: String, default: "" },
    title: { type: String, default: "" },
    desc: { type: String, default: "" },
  },
  { _id: false }
);

const patientReviewSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    patientAge: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    treatment: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviewTitle: {
      type: String,
      default: "",
    },
    hospital: {
      type: String,
      default: "",
    },
    doctor: {
      type: String,
      default: "",
    },
    doctorSpeciality: {
      type: String,
      default: "",
    },
    doctorExperience: {
      type: String,
      default: "",
    },
    ytId: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    recoveryTime: {
      type: String,
      default: "",
    },
    costSavings: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: "",
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    detailedReview: {
      type: String,
      default: "",
    },
    keyHighlights: {
      type: [String],
      default: [],
    },
    treatmentMilestones: {
      type: [milestoneSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

patientReviewSchema.index({ category: 1 });
patientReviewSchema.index({ country: 1 });

module.exports = mongoose.model("PatientReview", patientReviewSchema);

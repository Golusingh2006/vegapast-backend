const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    q: { type: String, default: "" },
    a: { type: String, default: "" },
  },
  { _id: false }
);

const specialitySchema = new mongoose.Schema(
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
    shortDescription: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Surgical & Medical",
    },
    iconName: {
      type: String,
      default: "Activity",
    },
    color: {
      type: String,
      default: "#0284c7",
    },
    bgColor: {
      type: String,
      default: "#e0f2fe",
    },
    doctorsCount: {
      type: String,
      default: "50+",
    },
    successRate: {
      type: String,
      default: "98%",
    },
    heroImage: {
      type: String,
      default: "",
    },
    overview: {
      type: String,
      default: "",
    },
    procedures: {
      type: [String],
      default: [],
    },
    conditions: {
      type: [String],
      default: [],
    },
    faqs: {
      type: [faqSchema],
      default: [],
    },
    columnIndex: {
      type: Number,
      default: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

specialitySchema.index({ category: 1 });
specialitySchema.index({ columnIndex: 1 });

module.exports = mongoose.model("Speciality", specialitySchema);

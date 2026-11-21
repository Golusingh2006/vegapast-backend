const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
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
    shortName: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      default: "",
    },
    zone: {
      type: String,
      default: "",
    },
    regionName: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    landmark: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    gallery: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    googleRating: {
      type: String,
      default: "4.8",
    },
    established: {
      type: Number,
      default: 2000,
    },
    bedsCount: {
      type: String,
      default: "",
    },
    icuBeds: {
      type: String,
      default: "",
    },
    operationTheatres: {
      type: String,
      default: "",
    },
    accreditations: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    phone: {
      type: String,
      default: "",
    },
    emergencyNumber: {
      type: String,
      default: "",
    },
    ambulancePhone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    mapUrl: {
      type: String,
      default: "",
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timings: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    overviewAccordion: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    insuranceAccordion: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    specialities: {
      type: [String],
      default: [],
    },
    specialityDetails: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    procedures: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    articles: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    videos: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    facilities: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    awards: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    insurances: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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

hospitalSchema.index({ city: 1 });
hospitalSchema.index({ group: 1 });
hospitalSchema.index({ user: 1 });

module.exports = mongoose.model("Hospital", hospitalSchema);

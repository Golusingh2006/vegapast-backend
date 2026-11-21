const mongoose = require("mongoose");

const hospitalMetadataSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    regionalHospitalsTree: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    hospitalZones: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    hospitalStates: {
      type: [String],
      default: [],
    },
    hospitalTopCities: {
      type: [String],
      default: [],
    },
    hospitalChains: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HospitalMetadata", hospitalMetadataSchema);

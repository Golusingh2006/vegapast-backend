const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const PatientReview = require("../models/PatientReview");
const Speciality = require("../models/Speciality");
const User = require("../models/OpenScheema");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 15000 });
    console.log("=== ATLAS DATABASE VERIFICATION ===");
    console.log("Doctors in Atlas:           ", await Doctor.countDocuments());
    console.log("Hospitals in Atlas:         ", await Hospital.countDocuments());
    console.log("Patient Reviews in Atlas:   ", await PatientReview.countDocuments());
    console.log("Specialities in Atlas:      ", await Speciality.countDocuments());
    console.log("Doctor User Accounts:       ", await User.countDocuments({ role: "doctor" }));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
})();

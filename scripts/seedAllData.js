const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/OpenScheema");
const DoctorHospital = require("../models/DoctorHospital");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const HospitalMetadata = require("../models/HospitalMetadata");
const PatientReview = require("../models/PatientReview");
const Speciality = require("../models/Speciality");

const dataDir = path.join(
  __dirname,
  "..",
  "..",
  "careinindia",
  "caresinindia",
  "src",
  "data"
);

const { DOCTORS_DATA } = require(path.join(dataDir, "doctorsData.js"));
const {
  HOSPITALS_DATA,
  REGIONAL_HOSPITALS_TREE,
  HOSPITAL_ZONES,
  HOSPITAL_STATES,
  HOSPITAL_TOP_CITIES,
  HOSPITAL_CHAINS,
} = require(path.join(dataDir, "hospitalsData.js"));
const { PATIENT_REVIEWS_DATA } = require(path.join(dataDir, "patientReviewsData.js"));
const { SPECIALIST_COLUMNS, ALL_SPECIALISTS } = require(path.join(dataDir, "specialistsData.js"));

const seedAll = async () => {
  const mongoUri =
    process.env.MONGO_URL ||
    "mongodb+srv://admin:E4WEYDTO0q8iaz7V@vegapastcluster.rctcxb1.mongodb.net/cIn?retryWrites=true&w=majority";

  console.log("=== SEEDING ALL DATA INTO MONGODB ATLAS ===");
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log("MongoDB Atlas connected successfully!");

  // -------------------------------------------------------------
  // 1. SEED DOCTORS, USERS & DOCTOR_HOSPITALS
  // -------------------------------------------------------------
  console.log(`\n--- Seeding ${DOCTORS_DATA.length} Doctors & Doctor Accounts ---`);
  const hashedPassword = await bcrypt.hash("12345678", 12);

  for (let i = 0; i < DOCTORS_DATA.length; i++) {
    const doc = DOCTORS_DATA[i];
    const email = doc.email.toLowerCase().trim();
    const uniqueContact = `981000${String(1001 + i).slice(-4)}`;

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: doc.name,
        email,
        contact: uniqueContact,
        password: hashedPassword,
        role: "doctor",
        address: doc.clinicAddress || "",
        city: doc.city || "New Delhi",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await DoctorHospital.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        registrationType: "doctor",
        doctorProfile: {
          name: doc.name,
          position: doc.position,
          qualifications: doc.education || [],
          experienceYears: doc.experienceYears || 0,
          specialities: doc.allSpecialities || [doc.speciality],
          consultationFee: doc.feeAmount || 1500,
          languages: doc.languages || ["English", "Hindi"],
          about: doc.about || "",
          availability: doc.availability || "Mon - Sat (09:00 AM - 05:00 PM)",
          profileImage: doc.image || "",
        },
        facilityProfile: {
          facilityName: doc.hospitalName || doc.hospital || "Care in India Clinic",
          shortName: doc.hospital || "",
          address: doc.clinicAddress || "New Delhi, India",
          city: doc.city || "New Delhi",
          state: "Delhi",
          timings: doc.availability || "Mon - Sat (09:00 AM - 07:00 PM)",
          primaryContact: doc.phone || "+91 11 2692 5858",
          email: email,
          specialities: doc.allSpecialities || [doc.speciality],
          bannerImage: doc.image || "",
        },
        doctors: [],
        verified: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Doctor.findOneAndUpdate(
      { id: doc.id },
      {
        id: doc.id,
        name: doc.name,
        position: doc.position,
        speciality: doc.speciality,
        allSpecialities: doc.allSpecialities || [doc.speciality],
        experience: doc.experience || `${doc.experienceYears || 15}+ Years Experience`,
        experienceYears: doc.experienceYears || 15,
        consultationFee: doc.consultationFee || `₹${doc.feeAmount || 1500}`,
        feeAmount: doc.feeAmount || 1500,
        rating: doc.rating || 4.9,
        reviewsCount: doc.reviewsCount || 100,
        hospital: doc.hospital || "",
        hospitalName: doc.hospitalName || doc.hospital || "",
        clinicAddress: doc.clinicAddress || "",
        city: doc.city || "New Delhi",
        image: doc.image || "",
        education: doc.education || [],
        about: doc.about || "",
        awards: doc.awards || [],
        languages: doc.languages || ["English", "Hindi"],
        availability: doc.availability || "Mon - Sat (09:00 AM - 05:00 PM)",
        phone: doc.phone || "+91 11 2692 5858",
        email: email,
        verified: true,
        successRate: doc.successRate || "99%",
        surgeriesCount: doc.surgeriesCount || "1,000+",
        timeSlots: doc.timeSlots || {},
        user: user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`✓ Doctors & Doctor accounts seeded successfully!`);

  // -------------------------------------------------------------
  // 2. SEED HOSPITALS & HOSPITAL METADATA
  // -------------------------------------------------------------
  console.log(`\n--- Seeding ${HOSPITALS_DATA.length} Hospitals & Metadata ---`);
  for (const hosp of HOSPITALS_DATA) {
    await Hospital.findOneAndUpdate(
      { id: hosp.id },
      {
        id: hosp.id,
        name: hosp.name,
        shortName: hosp.shortName || "",
        group: hosp.group || "",
        zone: hosp.zone || "",
        regionName: hosp.regionName || "",
        state: hosp.state || "",
        city: hosp.city || "",
        address: hosp.address || "",
        landmark: hosp.landmark || "",
        image: hosp.image || "",
        bannerImage: hosp.bannerImage || "",
        gallery: hosp.gallery || [],
        rating: hosp.rating || 4.8,
        reviewsCount: hosp.reviewsCount || 0,
        googleRating: hosp.googleRating || "4.8",
        established: hosp.established || 2000,
        bedsCount: hosp.bedsCount || "",
        icuBeds: hosp.icuBeds || "",
        operationTheatres: hosp.operationTheatres || "",
        accreditations: hosp.accreditations || [],
        phone: hosp.phone || "",
        emergencyNumber: hosp.emergencyNumber || "",
        ambulancePhone: hosp.ambulancePhone || "",
        email: hosp.email || "",
        mapUrl: hosp.mapUrl || "",
        coordinates: hosp.coordinates || {},
        timings: hosp.timings || "",
        about: hosp.about || "",
        overviewAccordion: hosp.overviewAccordion || {},
        insuranceAccordion: hosp.insuranceAccordion || {},
        specialities: hosp.specialities || [],
        specialityDetails: hosp.specialityDetails || [],
        procedures: hosp.procedures || [],
        articles: hosp.articles || [],
        videos: hosp.videos || [],
        facilities: hosp.facilities || [],
        awards: hosp.awards || [],
        insurances: hosp.insurances || [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Save Hospital Metadata (tree, zones, states, top cities, chains)
  await HospitalMetadata.findOneAndUpdate(
    { key: "default" },
    {
      key: "default",
      regionalHospitalsTree: REGIONAL_HOSPITALS_TREE,
      hospitalZones: HOSPITAL_ZONES,
      hospitalStates: HOSPITAL_STATES,
      hospitalTopCities: HOSPITAL_TOP_CITIES,
      hospitalChains: HOSPITAL_CHAINS,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`✓ Hospitals and Hospital Metadata seeded successfully!`);

  // -------------------------------------------------------------
  // 3. SEED PATIENT REVIEWS / BLOGS
  // -------------------------------------------------------------
  console.log(`\n--- Seeding ${PATIENT_REVIEWS_DATA.length} Patient Reviews / Blogs ---`);
  for (const rev of PATIENT_REVIEWS_DATA) {
    await PatientReview.findOneAndUpdate(
      { id: rev.id },
      {
        id: rev.id,
        name: rev.name,
        patientAge: rev.patientAge || "",
        gender: rev.gender || "",
        treatment: rev.treatment || "",
        category: rev.category || "General",
        state: rev.state || "",
        country: rev.country || "",
        countryCode: rev.countryCode || "",
        rating: rev.rating || 5.0,
        reviewTitle: rev.reviewTitle || "",
        hospital: rev.hospital || "",
        doctor: rev.doctor || "",
        doctorSpeciality: rev.doctorSpeciality || "",
        doctorExperience: rev.doctorExperience || "",
        ytId: rev.ytId || "",
        duration: rev.duration || "",
        recoveryTime: rev.recoveryTime || "",
        costSavings: rev.costSavings || "",
        date: rev.date || "",
        isNew: Boolean(rev.isNew),
        detailedReview: rev.detailedReview || "",
        keyHighlights: rev.keyHighlights || [],
        treatmentMilestones: rev.treatmentMilestones || [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`✓ Patient Reviews seeded successfully!`);

  // -------------------------------------------------------------
  // 4. SEED 42 SPECIALITIES
  // -------------------------------------------------------------
  console.log(`\n--- Seeding ${ALL_SPECIALISTS.length} Medical Specialties ---`);
  // Map columnIndex from SPECIALIST_COLUMNS
  const colMap = new Map();
  [1, 2, 3, 4].forEach((colNum) => {
    (SPECIALIST_COLUMNS[colNum] || []).forEach((spec, idx) => {
      colMap.set(spec.id, { col: colNum, order: idx });
    });
  });

  for (const spec of ALL_SPECIALISTS) {
    const colInfo = colMap.get(spec.id) || { col: 1, order: 0 };
    await Speciality.findOneAndUpdate(
      { id: spec.id },
      {
        id: spec.id,
        name: spec.name,
        shortDescription: spec.shortDescription || "",
        category: spec.category || "Surgical & Medical",
        iconName: spec.iconName || "Activity",
        color: spec.color || "#0284c7",
        bgColor: spec.bgColor || "#e0f2fe",
        doctorsCount: spec.doctorsCount || "50+",
        successRate: spec.successRate || "98%",
        heroImage: spec.heroImage || "",
        overview: spec.overview || "",
        procedures: spec.procedures || [],
        conditions: spec.conditions || [],
        faqs: spec.faqs || [],
        columnIndex: colInfo.col,
        order: colInfo.order,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`✓ Specialities seeded successfully!`);

  // -------------------------------------------------------------
  // 5. VERIFY DATABASE COUNTS
  // -------------------------------------------------------------
  const doctorsCount = await Doctor.countDocuments();
  const hospitalsCount = await Hospital.countDocuments();
  const reviewsCount = await PatientReview.countDocuments();
  const specialitiesCount = await Speciality.countDocuments();
  const usersCount = await User.countDocuments({ role: "doctor" });

  console.log("\n========================================");
  console.log("DATABASE SEEDING VERIFICATION SUMMARY:");
  console.log(`- Doctors in MongoDB:       ${doctorsCount}`);
  console.log(`- Doctor Users in MongoDB:  ${usersCount}`);
  console.log(`- Hospitals in MongoDB:     ${hospitalsCount}`);
  console.log(`- Patient Reviews in MongoDB: ${reviewsCount}`);
  console.log(`- Specialities in MongoDB:  ${specialitiesCount}`);
  console.log("========================================\n");

  await mongoose.disconnect();
  console.log("Seeding script completed cleanly!");
  process.exit(0);
};

seedAll().catch((err) => {
  console.error("FATAL ERROR during seeding:", err);
  process.exit(1);
});

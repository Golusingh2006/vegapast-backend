const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/OpenScheema");
const DoctorHospital = require("../models/DoctorHospital");
const Doctor = require("../models/Doctor");

const { DOCTORS_DATA } = require(path.join(
  __dirname,
  "..",
  "..",
  "careinindia",
  "caresinindia",
  "src",
  "data",
  "doctorsData.js"
));

const seedDoctors = async () => {
  const mongoUri =
    process.env.MONGO_URL ||
    "mongodb+srv://admin:E4WEYDTO0q8iaz7V@vegapastcluster.rctcxb1.mongodb.net/cIn?retryWrites=true&w=majority";

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected successfully to MongoDB Atlas!");

  const hashedPassword = await bcrypt.hash("12345678", 12);
  console.log(`Hashing password '12345678' for all doctor profiles...`);

  let seededCount = 0;

  for (let i = 0; i < DOCTORS_DATA.length; i++) {
    const doc = DOCTORS_DATA[i];
    const email = doc.email.toLowerCase().trim();
    // Unique 10-digit contact for the User account
    const uniqueContact = `981000${String(1001 + i).slice(-4)}`;

    console.log(`Processing [${i + 1}/${DOCTORS_DATA.length}]: ${doc.name} (${email})`);

    // 1. Create or update User in MongoDB
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

    // 2. Create or update DoctorHospital in MongoDB
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

    // 3. Create or update Doctor collection document in MongoDB
    await Doctor.findOneAndUpdate(
      { id: doc.id },
      {
        id: doc.id,
        name: doc.name,
        position: doc.position,
        speciality: doc.speciality,
        allSpecialities: doc.allSpecialities || [],
        experience: doc.experience || `${doc.experienceYears}+ Years Experience`,
        experienceYears: doc.experienceYears || 0,
        consultationFee: doc.consultationFee || `₹${doc.feeAmount}`,
        feeAmount: doc.feeAmount || 1500,
        rating: doc.rating || 4.8,
        reviewsCount: doc.reviewsCount || 100,
        hospital: doc.hospital || "",
        hospitalName: doc.hospitalName || "",
        clinicAddress: doc.clinicAddress || "",
        city: doc.city || "New Delhi",
        image: doc.image || "",
        education: doc.education || [],
        about: doc.about || "",
        awards: doc.awards || [],
        languages: doc.languages || ["English", "Hindi"],
        availability: doc.availability || "Mon - Sat (09:00 AM - 05:00 PM)",
        phone: doc.phone || "",
        email: email,
        verified: doc.verified ?? true,
        successRate: doc.successRate || "99%",
        surgeriesCount: doc.surgeriesCount || "1,000+",
        timeSlots: doc.timeSlots || {},
        user: user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    seededCount++;
  }

  console.log(`\n=============================================`);
  console.log(`SUCCESS: All ${seededCount} doctors saved to MongoDB!`);
  console.log(`All accounts created with role: 'doctor'`);
  console.log(`All doctor accounts password set to: '12345678'`);
  console.log(`=============================================\n`);

  await mongoose.disconnect();
  process.exit(0);
};

seedDoctors().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

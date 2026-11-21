const DoctorHospital = require("../models/DoctorHospital");
const User = require("../models/OpenScheema");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const Speciality = require("../models/Speciality");

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Create or Update Provider Profile (Doctor or Hospital)
// Also synchronizes the data directly into Doctor, Hospital, and Speciality collections
// so that patients can immediately browse and book appointments with newly registered providers.
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { registrationType, doctorProfile, facilityProfile, doctors } = req.body;

    if (!registrationType || !["doctor", "hospital"].includes(registrationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration type. Must be either 'doctor' or 'hospital'.",
      });
    }

    if (!facilityProfile || !facilityProfile.facilityName || !facilityProfile.address || !facilityProfile.city) {
      return res.status(400).json({
        success: false,
        message: "Facility details (name, address, and city) are required.",
      });
    }

    if (!facilityProfile.primaryContact) {
      return res.status(400).json({
        success: false,
        message: "Facility primary contact number is required.",
      });
    }

    let payload = {
      user: userId,
      registrationType,
      facilityProfile: {
        facilityName: facilityProfile.facilityName.trim(),
        shortName: facilityProfile.shortName ? facilityProfile.shortName.trim() : "",
        hospitalGroup: facilityProfile.hospitalGroup ? facilityProfile.hospitalGroup.trim() : "",
        address: facilityProfile.address.trim(),
        city: facilityProfile.city.trim(),
        state: facilityProfile.state ? facilityProfile.state.trim() : "",
        timings: facilityProfile.timings || "Mon - Sat (09:00 AM - 07:00 PM)",
        primaryContact: String(facilityProfile.primaryContact).trim(),
        secondaryContact: facilityProfile.secondaryContact ? String(facilityProfile.secondaryContact).trim() : "",
        tertiaryContact: facilityProfile.tertiaryContact ? String(facilityProfile.tertiaryContact).trim() : "",
        emergencyNumber: facilityProfile.emergencyNumber ? String(facilityProfile.emergencyNumber).trim() : "",
        ambulancePhone: facilityProfile.ambulancePhone ? String(facilityProfile.ambulancePhone).trim() : "",
        email: facilityProfile.email ? facilityProfile.email.toLowerCase().trim() : "",
        bedsCount: facilityProfile.bedsCount || "",
        icuBeds: facilityProfile.icuBeds || "",
        operationTheatres: facilityProfile.operationTheatres || "",
        accreditations: Array.isArray(facilityProfile.accreditations) ? facilityProfile.accreditations : [],
        specialities: Array.isArray(facilityProfile.specialities) ? facilityProfile.specialities : [],
        about: facilityProfile.about || "",
        bannerImage: facilityProfile.bannerImage || "",
      },
    };

    if (registrationType === "doctor") {
      if (!doctorProfile || !doctorProfile.name) {
        return res.status(400).json({
          success: false,
          message: "Doctor's name is required for individual doctor registration.",
        });
      }

      payload.doctorProfile = {
        name: doctorProfile.name.trim(),
        position: doctorProfile.position || "Senior Consultant",
        qualifications: Array.isArray(doctorProfile.qualifications)
          ? doctorProfile.qualifications
          : (doctorProfile.qualifications || "").split(",").map((q) => q.trim()).filter(Boolean),
        experienceYears: Number(doctorProfile.experienceYears) || 0,
        specialities: Array.isArray(doctorProfile.specialities)
          ? doctorProfile.specialities
          : (doctorProfile.specialities || "").split(",").map((s) => s.trim()).filter(Boolean),
        consultationFee: Number(doctorProfile.consultationFee) || 0,
        languages: Array.isArray(doctorProfile.languages)
          ? doctorProfile.languages
          : ["English", "Hindi"],
        about: doctorProfile.about || "",
        availability: doctorProfile.availability || "Mon - Sat (09:00 AM - 05:00 PM)",
        profileImage: doctorProfile.profileImage || "",
      };

      // Clear doctors array for individual doctor
      payload.doctors = [];
    } else if (registrationType === "hospital") {
      payload.doctorProfile = null;

      // Validate & clean hospital doctors array (they share hospital contacts)
      if (Array.isArray(doctors)) {
        payload.doctors = doctors.map((doc) => ({
          name: doc.name ? doc.name.trim() : "Doctor",
          position: doc.position ? doc.position.trim() : "Consultant",
          qualifications: Array.isArray(doc.qualifications)
            ? doc.qualifications
            : (doc.qualifications || "").split(",").map((q) => q.trim()).filter(Boolean),
          experienceYears: Number(doc.experienceYears) || 0,
          specialities: Array.isArray(doc.specialities)
            ? doc.specialities
            : (doc.specialities || "").split(",").map((s) => s.trim()).filter(Boolean),
          consultationFee: Number(doc.consultationFee) || 0,
          availability: doc.availability || "Mon - Sat (10:00 AM - 05:00 PM)",
          about: doc.about || "",
          image: doc.image || "",
        }));
      } else {
        payload.doctors = [];
      }
    }

    // Upsert the profile linked to the user account
    const profile = await DoctorHospital.findOneAndUpdate(
      { user: userId },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email contact role");

    // Also ensure user role reflects doctor/hospital
    await User.findByIdAndUpdate(userId, {
      role: registrationType === "hospital" ? "doctor/hospital" : "doctor",
    });

    // ==============================================================
    // SYNCHRONIZATION WITH PATIENT-FACING COLLECTIONS
    // ==============================================================
    const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";

    if (registrationType === "doctor" && payload.doctorProfile) {
      const docSlug = `dr-${slugify(payload.doctorProfile.name)}-${userId.toString().slice(-4)}`;
      const cleanDocName = payload.doctorProfile.name.startsWith("Dr.")
        ? payload.doctorProfile.name
        : `Dr. ${payload.doctorProfile.name}`;

      const specialitiesArr = payload.doctorProfile.specialities.length > 0
        ? payload.doctorProfile.specialities
        : ["General Physician"];

      const fee = Number(payload.doctorProfile.consultationFee) || 1000;

      // 1. Sync into Doctor collection
      await Doctor.findOneAndUpdate(
        { $or: [{ user: userId }, { id: docSlug }] },
        {
          id: docSlug,
          name: cleanDocName,
          position: payload.doctorProfile.position || "Senior Consultant",
          speciality: specialitiesArr[0],
          allSpecialities: specialitiesArr,
          experience: `${payload.doctorProfile.experienceYears || 5} Years`,
          experienceYears: Number(payload.doctorProfile.experienceYears) || 5,
          consultationFee: `₹${fee}`,
          feeAmount: fee,
          rating: 4.9,
          reviewsCount: 15,
          hospital: payload.facilityProfile.facilityName,
          hospitalName: payload.facilityProfile.facilityName,
          clinicAddress: `${payload.facilityProfile.address}, ${payload.facilityProfile.city}`,
          city: payload.facilityProfile.city,
          phone: payload.facilityProfile.primaryContact,
          email: payload.facilityProfile.email || userEmail,
          education: payload.doctorProfile.qualifications,
          languages: payload.doctorProfile.languages,
          availability: payload.doctorProfile.availability,
          about: payload.doctorProfile.about || payload.facilityProfile.about,
          image: payload.doctorProfile.profileImage || "",
          verified: true,
          user: userId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 2. Sync Clinic into Hospital collection
      const clinicSlug = `clinic-${slugify(payload.facilityProfile.facilityName)}-${userId.toString().slice(-4)}`;
      await Hospital.findOneAndUpdate(
        { $or: [{ user: userId }, { id: clinicSlug }] },
        {
          id: clinicSlug,
          name: payload.facilityProfile.facilityName,
          shortName: payload.facilityProfile.shortName || payload.facilityProfile.facilityName,
          group: payload.facilityProfile.hospitalGroup || "Independent Clinic",
          city: payload.facilityProfile.city,
          state: payload.facilityProfile.state || "",
          address: payload.facilityProfile.address,
          phone: payload.facilityProfile.primaryContact,
          emergencyNumber: payload.facilityProfile.emergencyNumber || "",
          ambulancePhone: payload.facilityProfile.ambulancePhone || "",
          email: payload.facilityProfile.email || userEmail,
          timings: payload.facilityProfile.timings,
          about: payload.facilityProfile.about || payload.doctorProfile.about,
          specialities: specialitiesArr,
          rating: 4.8,
          user: userId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 3. Sync Specialities into Speciality collection
      for (const spec of specialitiesArr) {
        if (!spec) continue;
        const specSlug = slugify(spec);
        await Speciality.findOneAndUpdate(
          { $or: [{ id: specSlug }, { name: new RegExp(`^${spec}$`, "i") }] },
          {
            $setOnInsert: {
              id: specSlug,
              name: spec,
              category: "Surgical & Medical",
              shortDescription: `Expert consultations and care in ${spec}`,
              doctorsCount: "10+",
              successRate: "98%",
            },
          },
          { upsert: true, new: true }
        );
      }
    } else if (registrationType === "hospital") {
      const hospitalSlug = `hosp-${slugify(payload.facilityProfile.facilityName)}-${userId.toString().slice(-4)}`;
      const hospitalSpecs = payload.facilityProfile.specialities || [];

      // 1. Sync into Hospital collection
      await Hospital.findOneAndUpdate(
        { $or: [{ user: userId }, { id: hospitalSlug }] },
        {
          id: hospitalSlug,
          name: payload.facilityProfile.facilityName,
          shortName: payload.facilityProfile.shortName || payload.facilityProfile.facilityName,
          group: payload.facilityProfile.hospitalGroup || payload.facilityProfile.facilityName,
          city: payload.facilityProfile.city,
          state: payload.facilityProfile.state || "",
          address: payload.facilityProfile.address,
          phone: payload.facilityProfile.primaryContact,
          emergencyNumber: payload.facilityProfile.emergencyNumber || "",
          ambulancePhone: payload.facilityProfile.ambulancePhone || "",
          email: payload.facilityProfile.email || userEmail,
          timings: payload.facilityProfile.timings,
          about: payload.facilityProfile.about || "",
          bedsCount: payload.facilityProfile.bedsCount || "100+ Beds",
          icuBeds: payload.facilityProfile.icuBeds || "20+ ICU Beds",
          operationTheatres: payload.facilityProfile.operationTheatres || "4 Modular OTs",
          accreditations: payload.facilityProfile.accreditations || ["NABH"],
          specialities: hospitalSpecs,
          bannerImage: payload.facilityProfile.bannerImage || "",
          rating: 4.9,
          user: userId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // 2. Sync Hospital's doctors into Doctor collection
      if (Array.isArray(payload.doctors)) {
        for (const doc of payload.doctors) {
          if (!doc.name) continue;
          const docSlug = `dr-${slugify(doc.name)}-${hospitalSlug}`;
          const cleanDocName = doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`;
          const docSpecs = Array.isArray(doc.specialities) && doc.specialities.length > 0
            ? doc.specialities
            : hospitalSpecs;
          const fee = Number(doc.consultationFee) || 800;

          await Doctor.findOneAndUpdate(
            { id: docSlug },
            {
              id: docSlug,
              name: cleanDocName,
              position: doc.position || "Senior Consultant",
              speciality: docSpecs[0] || "Specialist",
              allSpecialities: docSpecs,
              experience: `${doc.experienceYears || 5} Years`,
              experienceYears: Number(doc.experienceYears) || 5,
              consultationFee: `₹${fee}`,
              feeAmount: fee,
              rating: 4.8,
              reviewsCount: 10,
              hospital: payload.facilityProfile.facilityName,
              hospitalName: payload.facilityProfile.facilityName,
              clinicAddress: `${payload.facilityProfile.address}, ${payload.facilityProfile.city}`,
              city: payload.facilityProfile.city,
              phone: payload.facilityProfile.primaryContact,
              email: payload.facilityProfile.email || userEmail,
              education: doc.qualifications || ["MBBS", "MD"],
              availability: doc.availability || payload.facilityProfile.timings,
              about: doc.about || "",
              image: doc.image || "",
              verified: true,
              user: userId,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }

      // 3. Sync Specialities into Speciality collection
      for (const spec of hospitalSpecs) {
        if (!spec) continue;
        const specSlug = slugify(spec);
        await Speciality.findOneAndUpdate(
          { $or: [{ id: specSlug }, { name: new RegExp(`^${spec}$`, "i") }] },
          {
            $setOnInsert: {
              id: specSlug,
              name: spec,
              category: "Surgical & Medical",
              shortDescription: `Expert consultations and healthcare in ${spec}`,
              doctorsCount: "15+",
              successRate: "98%",
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `${
        registrationType === "hospital" ? "Hospital & Doctors" : "Individual Doctor"
      } profile saved and published to patient discovery successfully!`,
      profile,
    });
  } catch (error) {
    console.error("Error creating/updating provider profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save provider profile",
    });
  }
};

// Get current logged in provider's profile
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await DoctorHospital.findOne({ user: userId }).populate(
      "user",
      "name email contact role"
    );

    if (!profile) {
      return res.status(200).json({
        success: true,
        exists: false,
        profile: null,
        message: "No provider profile registered yet.",
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch provider profile",
    });
  }
};

// Get single provider profile by ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await DoctorHospital.findById(req.params.id).populate(
      "user",
      "name email contact role"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch provider profile",
    });
  }
};

// List providers (public endpoint with filters)
exports.getAllProviders = async (req, res) => {
  try {
    const { type, city, speciality } = req.query;
    let query = {};

    if (type && ["doctor", "hospital"].includes(type)) {
      query.registrationType = type;
    }

    if (city) {
      query["facilityProfile.city"] = new RegExp(city, "i");
    }

    if (speciality) {
      query.$or = [
        { "doctorProfile.specialities": new RegExp(speciality, "i") },
        { "facilityProfile.specialities": new RegExp(speciality, "i") },
        { "doctors.specialities": new RegExp(speciality, "i") },
      ];
    }

    const providers = await DoctorHospital.find(query)
      .populate("user", "name email contact role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch providers list",
    });
  }
};

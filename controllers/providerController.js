const DoctorHospital = require("../models/DoctorHospital");
const User = require("../models/OpenScheema");

// Create or Update Provider Profile (Doctor or Hospital)
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

      // Validate & clean hospital doctors array (notice: no individual contacts; they share hospital contacts)
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

    return res.status(200).json({
      success: true,
      message: `${
        registrationType === "hospital" ? "Hospital & Doctors" : "Individual Doctor"
      } profile saved successfully!`,
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

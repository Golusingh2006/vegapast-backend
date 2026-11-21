const Doctor = require("../models/Doctor");

// Get all doctors with optional filters
exports.getAllDoctors = async (req, res) => {
  try {
    const { search, speciality, hospital, city, sortBy } = req.query;
    let query = {};

    if (search) {
      const q = search.trim();
      query.$or = [
        { name: new RegExp(q, "i") },
        { speciality: new RegExp(q, "i") },
        { allSpecialities: new RegExp(q, "i") },
        { hospitalName: new RegExp(q, "i") },
        { city: new RegExp(q, "i") },
      ];
    }

    if (speciality && speciality !== "All Specialities") {
      query.$or = [
        { speciality: new RegExp(speciality, "i") },
        { allSpecialities: new RegExp(speciality, "i") },
      ];
    }

    if (hospital && hospital !== "All Hospitals") {
      query.$or = [
        { hospital: new RegExp(hospital, "i") },
        { hospitalName: new RegExp(hospital, "i") },
      ];
    }

    if (city && city !== "All Cities") {
      query.city = new RegExp(city, "i");
    }

    let sort = { rating: -1 };
    if (sortBy === "experience") {
      sort = { experienceYears: -1 };
    } else if (sortBy === "fee_low") {
      sort = { feeAmount: 1 };
    } else if (sortBy === "fee_high") {
      sort = { feeAmount: -1 };
    }

    const doctors = await Doctor.find(query).sort(sort);

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch doctors",
    });
  }
};

// Get single doctor by slug ID or Mongo ObjectId
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    let doctor = await Doctor.findOne({ id });

    if (!doctor && id.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await Doctor.findById(id);
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch doctor details",
    });
  }
};

const Hospital = require("../models/Hospital");
const HospitalMetadata = require("../models/HospitalMetadata");

// @desc    Get all hospitals with optional filtering and metadata
// @route   GET /api/hospitals
// @access  Public
const getAllHospitals = async (req, res) => {
  try {
    const { zone, state, city, group, search } = req.query;
    const filter = {};

    if (zone && zone !== "all") filter.zone = zone;
    if (state && state !== "All States") filter.state = state;
    if (city && city !== "All Cities") filter.city = city;
    if (group && group !== "All Networks") filter.group = group;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { group: { $regex: search, $options: "i" } },
      ];
    }

    const hospitals = await Hospital.find(filter).sort({ rating: -1, established: 1 });
    const metadata = (await HospitalMetadata.findOne({ key: "default" })) || {};

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
      metadata: {
        regionalHospitalsTree: metadata.regionalHospitalsTree || {},
        hospitalZones: metadata.hospitalZones || [],
        hospitalStates: metadata.hospitalStates || [],
        hospitalTopCities: metadata.hospitalTopCities || [],
        hospitalChains: metadata.hospitalChains || [],
      },
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching hospitals",
      error: error.message,
    });
  }
};

// @desc    Get single hospital by id slug or ObjectId
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    let hospital = await Hospital.findOne({ id });

    if (!hospital && id.match(/^[0-9a-fA-F]{24}$/)) {
      hospital = await Hospital.findById(id);
    }

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: `Hospital not found with id ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital by id:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching hospital",
      error: error.message,
    });
  }
};

module.exports = {
  getAllHospitals,
  getHospitalById,
};

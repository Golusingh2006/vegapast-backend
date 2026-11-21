const Speciality = require("../models/Speciality");

const SPECIALTY_CATEGORIES = [
  "All Specialties",
  "Surgical & Medical",
  "Medical Sciences",
  "Diagnostics & Oncology",
  "Diagnostics & Critical Care",
  "Women & Child Care",
  "Allied & Rehab",
];

// @desc    Get all 42 specialties grouped or list
// @route   GET /api/specialities
// @access  Public
const getAllSpecialities = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== "All Specialties") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { overview: { $regex: search, $options: "i" } },
      ];
    }

    const specialities = await Speciality.find(filter).sort({ columnIndex: 1, order: 1 });

    // Group into 4 columns matching original UI mega menu
    const columns = { 1: [], 2: [], 3: [], 4: [] };
    specialities.forEach((item) => {
      const col = item.columnIndex || 1;
      if (columns[col]) {
        columns[col].push(item);
      } else {
        columns[1].push(item);
      }
    });

    res.status(200).json({
      success: true,
      count: specialities.length,
      data: specialities,
      columns,
      categories: SPECIALTY_CATEGORIES,
    });
  } catch (error) {
    console.error("Error fetching specialities:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching specialities",
      error: error.message,
    });
  }
};

// @desc    Get single speciality by id slug or ObjectId
// @route   GET /api/specialities/:id
// @access  Public
const getSpecialityById = async (req, res) => {
  try {
    const { id } = req.params;
    let speciality = await Speciality.findOne({ id });

    if (!speciality && id.match(/^[0-9a-fA-F]{24}$/)) {
      speciality = await Speciality.findById(id);
    }

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: `Speciality not found with id ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: speciality,
    });
  } catch (error) {
    console.error("Error fetching speciality by id:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching speciality",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSpecialities,
  getSpecialityById,
};

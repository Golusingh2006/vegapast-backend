const PatientReview = require("../models/PatientReview");

// @desc    Get all patient reviews / blogs
// @route   GET /api/patient-reviews or /api/blogs
// @access  Public
const getAllReviews = async (req, res) => {
  try {
    const { category, country } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (country) filter.country = country;

    const reviews = await PatientReview.find(filter).sort({ id: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching patient reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching patient reviews",
      error: error.message,
    });
  }
};

// @desc    Get single review/blog by id
// @route   GET /api/patient-reviews/:id
// @access  Public
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    let review = null;
    const numId = Number(id);
    if (!isNaN(numId)) {
      review = await PatientReview.findOne({ id: numId });
    }
    if (!review && id.match(/^[0-9a-fA-F]{24}$/)) {
      review = await PatientReview.findById(id);
    }

    if (!review) {
      return res.status(404).json({
        success: false,
        message: `Review not found with id ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error fetching review by id:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching review",
      error: error.message,
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
};

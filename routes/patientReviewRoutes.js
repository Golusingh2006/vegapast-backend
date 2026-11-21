const express = require("express");
const router = express.Router();
const { getAllReviews, getReviewById } = require("../controllers/patientReviewController");

router.get("/", getAllReviews);
router.get("/:id", getReviewById);

module.exports = router;

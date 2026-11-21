const express = require("express");
const router = express.Router();
const { getAllSpecialities, getSpecialityById } = require("../controllers/specialityController");

router.get("/", getAllSpecialities);
router.get("/:id", getSpecialityById);

module.exports = router;

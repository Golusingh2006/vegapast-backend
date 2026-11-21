const User = require("../models/OpenScheema");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Cookie configuration
const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, contact, password, role } = req.body;

    // Check empty fields
    if (!name || !email || !contact || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (name, email, contact, password)",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address format",
      });
    }

    // Validate contact number (10 digits)
    const cleanContact = String(contact).trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit contact number",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check existing contact
    const existingContact = await User.findOne({ contact: cleanContact });
    if (existingContact) {
      return res.status(409).json({
        success: false,
        message: "Contact number is already registered",
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 12);

    // Create user in DB
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      contact: cleanContact,
      password: hashPassword,
      role: role || "patient",
    });

    // If registered as doctor or hospital, auto-create initial profile for patient discovery
    if (role === "doctor") {
      const slug = `dr-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${user._id.toString().slice(-4)}`;
      await Doctor.findOneAndUpdate(
        { email: normalizedEmail },
        {
          id: slug,
          name: name.startsWith("Dr.") ? name.trim() : `Dr. ${name.trim()}`,
          position: "Consultant Specialist",
          speciality: "General Physician",
          allSpecialities: ["General Physician"],
          experience: "5+ Years",
          experienceYears: 5,
          consultationFee: "₹800",
          feeAmount: 800,
          rating: 4.8,
          reviewsCount: 10,
          hospital: "Care in India Medical Centre",
          hospitalName: "Care in India Medical Centre",
          clinicAddress: "Medical Enclave, New Delhi",
          city: "New Delhi",
          email: normalizedEmail,
          phone: cleanContact,
          verified: true,
          user: user._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch((e) => console.warn("Initial doctor record notice:", e.message));
    } else if (role === "doctor/hospital") {
      const slug = `hosp-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${user._id.toString().slice(-4)}`;
      await Hospital.findOneAndUpdate(
        { email: normalizedEmail },
        {
          id: slug,
          name: name.trim(),
          shortName: name.trim(),
          group: name.trim(),
          city: "New Delhi",
          address: "Healthcare Hub, New Delhi",
          phone: cleanContact,
          email: normalizedEmail,
          rating: 4.8,
          timings: "24x7 Emergency & OPD",
          specialities: ["General Medicine", "Emergency and Trauma"],
          user: user._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).catch((e) => console.warn("Initial hospital record notice:", e.message));
    }

    // Generate token
    const token = generateToken(user._id);

    // Store token in HTTP-only cookie
    res.cookie("token", token, cookieOption);

    return res.status(201).json({
      success: true,
      message: "Registration Successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "Email or Contact";
      return res.status(409).json({
        success: false,
        message: `${field} is already registered`,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email including select password
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Role-based Authorization: Ensure credentials match the selected role
    if (role) {
      const selectedRole = String(role).toLowerCase().trim();
      const actualRole = (user.role || "patient").toLowerCase().trim();

      const isSelectedPatient = selectedRole === "patient" || selectedRole === "user";
      const isSelectedDoctor = selectedRole === "doctor" || selectedRole === "doctor/hospital";
      const isSelectedAdmin = selectedRole === "admin";

      const isActualPatient = actualRole === "patient" || actualRole === "user";
      const isActualDoctor = actualRole === "doctor" || actualRole === "doctor/hospital";
      const isActualAdmin = actualRole === "admin";

      // If user selected "patient" but credentials belong to a Doctor/Hospital
      if (isSelectedPatient && !isActualPatient) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: You selected 'Patient', but these credentials belong to a registered ${isActualDoctor ? "Doctor / Hospital" : actualRole} account. You do not have authority to log in as a Patient with Doctor credentials. Please select 'Doctor / Hospital' role to log in.`,
        });
      }

      // If user selected "doctor/hospital" but credentials belong to a Patient
      if (isSelectedDoctor && !isActualDoctor) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: You selected 'Doctor / Hospital', but these credentials belong to a registered Patient account. You do not have authority to log in as a Doctor with Patient credentials. Please select 'Patient' role to log in.`,
        });
      }

      // If user selected "admin" but account is not Admin
      if (isSelectedAdmin && !isActualAdmin) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: You do not have administrator authority to log in with these credentials.`,
        });
      }
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Set cookie
    res.cookie("token", token, cookieOption);

    return res.status(200).json({
      success: true,
      message: "Login Successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        bloodGroup: user.bloodGroup || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        emergencyContact: user.emergencyContact || "",
        insuranceProvider: user.insuranceProvider || "",
        policyNumber: user.policyNumber || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// Logout User
exports.logout = async (req, res) => {
  res.clearCookie("token", cookieOption);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully!",
  });
};

// Get Current User (Protected)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        bloodGroup: user.bloodGroup || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        emergencyContact: user.emergencyContact || "",
        insuranceProvider: user.insuranceProvider || "",
        policyNumber: user.policyNumber || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch user",
    });
  }
};

// Update User Profile (Protected)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      name,
      contact,
      gender,
      dateOfBirth,
      bloodGroup,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      insuranceProvider,
      policyNumber,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name.trim();
    if (contact) {
      const cleanContact = String(contact).trim();
      if (!/^\d{10}$/.test(cleanContact)) {
        return res.status(400).json({
          success: false,
          message: "Contact must be a valid 10-digit number",
        });
      }
      user.contact = cleanContact;
    }

    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (insuranceProvider !== undefined) user.insuranceProvider = insuranceProvider;
    if (policyNumber !== undefined) user.policyNumber = policyNumber;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        bloodGroup: user.bloodGroup || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        emergencyContact: user.emergencyContact || "",
        insuranceProvider: user.insuranceProvider || "",
        policyNumber: user.policyNumber || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This contact number is already associated with another account",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

const User = require("../models/OpenScheema");
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
    const { email, password } = req.body;

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

    // Role-based validation if role was chosen on login
    const requestedRole = (req.body.role || "").toLowerCase().trim();
    if (requestedRole) {
      const actualRole = (user.role || "patient").toLowerCase().trim();
      const isDoctorReq = requestedRole === "doctor" || requestedRole === "doctor/hospital";
      const isDoctorActual = actualRole === "doctor" || actualRole === "doctor/hospital";

      if (isDoctorReq && !isDoctorActual) {
        return res.status(403).json({
          success: false,
          message: "This account is registered as a Patient. Please select 'Patient' role to sign in.",
        });
      }

      if (!isDoctorReq && isDoctorActual && requestedRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "This account is registered as a Doctor/Hospital. Please select 'Doctor / Hospital' role to sign in.",
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch user",
    });
  }
};

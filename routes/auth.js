// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { role, email, username, password, confirmPassword } = req.body;

    // Check if the passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email }).exec();

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "A user with the same email already exists." });
    }

    // Define the user role based on the provided data
    let userRole;
    let isCompany = false; // Set the default value for isCompany
    let companyName = false;

    if (role === "company") {
      userRole = "company";
      isCompany = true; // Set isCompany to true for company registrations
      companyName = req.body.companyName;
    } else {
      userRole = "user";
    }

    // Create the user
    const user = new User({
      role: userRole,
      isCompany: isCompany, // Set the isCompany field based on the role
      companyName: companyName,
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: null, // Initially, there is no last login, so it is set to null
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, "carbonrelay", {
      expiresIn: "1h", // Token will expire in 1 hour (adjust as needed)
    });

    // Update the user's lastLogin field
    user.lastLogin = new Date();
    await user.save();

    // Send the token and user data in the response
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Error during login", error: err.message });
  }
});

// Create Offer route
router.post("/createOffer", verifyToken, async (req, res) => {
  try {
    const { projectId, period, offerRate, biddingRate } = req.body;

    // Get the user from the token
    const user = await User.findById(req.userId);

    // Check if the user is allowed to create offers (individuals and companies can create offers)
    if (!user || !(user.role === "user" || user.role === "company")) {
      return res.status(403).json({ message: "Unauthorized to create offers" });
    }

    // Determine the offer creator (user or company) and set the projectName field accordingly
    let projectName;
    if (user.role === "company") {
      // If the user is a company, set the projectName to the company's companyName
      projectName = user.companyName;
    } else {
      // If the user is not a company, set the projectName to a custom value (e.g., "Individual Offer")
      projectName = "Individual Offer";
    }

    // Create the offer object
    const offer = {
      status: "created",
      projectId,
      projectName,
      period,
      offerRate,
      biddingRate,
      createdAt: new Date(),
    };

    // Add the offer to the user's offers array
    user.offers.push(offer);
    await user.save();

    res.status(201).json({ message: "Offer created successfully", offer });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating offer", error: err.message });
  }
});

// Protected route example
router.get("/protected", (req, res) => {
  // Check if the user is authenticated (token present and valid)
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, "carbonrelay", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // Do something if the token is valid
    res.json({ message: "Protected route accessed successfully" });
  });
});

const {
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");

// Fetch user profile
router.get("/profile", verifyToken, getUserProfile);

// Update user profile
router.put("/profile", verifyToken, updateUserProfile);

module.exports = router;

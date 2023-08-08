// app.js (or index.js)
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// Connected to your MongoDB database
const dbURI =
  "mongodb+srv://admin:admin@cluster0.rxnpu.mongodb.net/carbon-relay";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

// Added middleware to parse incoming JSON data
app.use(express.json());

// Routes for login, signup, and protected routes will go here
// Import and use the authentication routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const placeBidRoute = require("./routes/placeBid"); // Import the placeBid route
app.use("/placebid", placeBidRoute);

const offerRoutes = require("./routes/offers"); // Add this line
const bidRoutes = require("./routes/bids"); // Add this line

// ... Other middleware and configurations ...

app.use("/offers", offerRoutes); // Add this line
app.use("/bids", bidRoutes);

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

module.exports = app;

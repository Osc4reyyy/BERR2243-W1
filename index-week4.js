// index-week4.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
let db;

// 🔹 Connect to MongoDB
async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("maximDB");
  console.log("✅ Connected to MongoDB (maximDB)");
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Example Route to Test Connection
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Maxim Backend API 🚕' });
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 User Registration API
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    console.log("📦 Received user data:", req.body);
    
    // Validate Input 
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['customer', 'driver','admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "customer" or "driver"' });
    }

    // Check for existing user 
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered '});
    }

    // Hash the password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user 
    // Insert new user (with debug logs)
      const newUser = { username, email, password: hashedPassword, role, createdAt: new Date() };
      console.log("🧠 Data being inserted into MongoDB:", newUser);

      const result = await db.collection('users').insertOne(newUser);
      console.log("✅ Insert result:", result);


    // Respond success - FIXED
    res.status(201).json({
      message: `✅ ${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!`,
      userId: result.insertedId,
      role: role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 User Login API
app.post('/login',async (req, res) => {
  try{
    const { email, password } = req.body;

    console.log(" Login attempt:", { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: ' Email and password are required' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log("no user found for email:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ❌ Blocked user cannot login
    if (user.blocked) {
      return res.status(403).json({ error: 'Your account has been blocked by admin' });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Incorrect password for:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // token expires in 2 hours
    );

    // Respond success
    console.log(`✅ ${user.role.toUpperCase()} logged in successfully:`, user.email);

    res.status(200).json({
      message: '✅ Login successful !',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: new Date()
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔒 Middleware: Verify JWT Token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(403).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    console.log("🔐 Token verified for:", decoded.email);
    next(); // continue to next route
  } catch (error) {
    console.error("❌ Invalid token:", error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// 🔒 Admin Only Middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}

// 🔹 AUTH MIDDLEWARE
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;  // attach user info for later use
    next(); // proceed to next middleware/route
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Token Verification Middleware
app.get('/profile', verifyToken, async (req, res) => {
  try{
    const user = await db.collection('users').findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: ' Profile fetched successfully ',
      profile: user
    });

  } catch (error) {
    console.error(" Error fetching profile:", error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer or Driver View Profile
app.get('/my-profile', authMiddleware, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);

    // Fetch user data
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } } // Hide password
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "📄 Your profile details",
      profile: user
    });

  } catch (error) {
    console.error("❌ Fetch profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer or Driver Update Profile
app.patch('/my-profile', authMiddleware, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const { username, email, password } = req.body;

    // Nothing provided?
    if (!username && !email && !password) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updateFields = {};

    if (username) updateFields.username = username;
    if (email) {
      // Check if email is already used by someone else
      const emailExists = await db.collection("users").findOne({
        email,
        _id: { $ne: userId }
      });

      if (emailExists) {
        return res.status(400).json({ error: "Email already used by another user" });
      }

      updateFields.email = email;
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    res.status(200).json({
      message: "✅ Profile updated successfully!",
      updatedFields: updateFields
    });

  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer or Driver Delete Profile
app.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);

    // 1️⃣ Delete user profile
    const userDelete = await db.collection('users').deleteOne({ _id: userId });

    if (userDelete.deletedCount === 0) {
      return res.status(404).json({ error: "User not found or already deleted" });
    }

    // 2️⃣ Delete all rides created by this user (customer)
    const deleteCustomerRides = await db.collection('rides').deleteMany({ customerId: req.user.userId });

    // 3️⃣ Delete all rides assigned to this user (driver)
    const deleteDriverRides = await db.collection('rides').deleteMany({ driverId: req.user.userId });

    // 4️⃣ Delete all ratings GIVEN by this user
    const deleteGivenRatings = await db.collection('ratings').deleteMany({ customerId: req.user.userId });

    // 5️⃣ Delete all ratings RECEIVED by this user (if user is a driver)
    const deleteReceivedRatings = await db.collection('ratings').deleteMany({ driverId: req.user.userId });

    // 6️⃣ Delete driver's vehicle (if exists)
    const deleteVehicle = await db.collection('vehicles').deleteOne({ driverId: userId });

    res.status(200).json({
      message: "🗑️ Your account and ALL related data have been permanently deleted.",
      deleted: {
        userProfile: userDelete.deletedCount,
        customerRides: deleteCustomerRides.deletedCount,
        driverRides: deleteDriverRides.deletedCount,
        ratingsGiven: deleteGivenRatings.deletedCount,
        ratingsReceived: deleteReceivedRatings.deletedCount,
        vehicle: deleteVehicle.deletedCount
      }
    });

  } catch (error) {
    console.error("❌ Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver Creates Vehicle
app.post('/driver/vehicle', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can add vehicles' });
    }

    const { vehicleType, plateNumber, color } = req.body;

    // Validate input
    if (!vehicleType || !plateNumber || !color) {
      return res.status(400).json({ error: 'All fields (vehicleType, plateNumber, color) are required' });
    }

    // ❌ Check if driver already has a vehicle
    const existingVehicle = await db.collection('vehicles').findOne({
      driverId: new ObjectId(req.user.userId)
    });

    if (existingVehicle) {
      return res.status(400).json({
        error: "Driver already has a registered vehicle. Only one vehicle is allowed."
      });
    }

    // Create new vehicle
    const vehicle = {
      driverId: new ObjectId(req.user.userId),
      vehicleType,
      plateNumber,
      color,
      createdAt: new Date()
    };

    const result = await db.collection('vehicles').insertOne(vehicle);

    res.status(201).json({
      message: "🚗 Vehicle added successfully!",
      vehicleId: result.insertedId,
      vehicle
    });

  } catch (error) {
    console.error("❌ Add vehicle error:", error);
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver Deletes Their Vehicle
app.delete('/driver/vehicle/:vehicleId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: "Only drivers can delete vehicles" });
    }

    const vehicleId = req.params.vehicleId;

    const result = await db.collection("vehicles").deleteOne({
      _id: new ObjectId(vehicleId),
      driverId: new ObjectId(req.user.userId) // ensure driver owns the vehicle
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Vehicle not found or you are not the owner" });
    }

    res.status(200).json({
      message: "🚗 Vehicle deleted successfully",
      vehicleId
    });

  } catch (error) {
    console.error("❌ Delete vehicle error:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer Creates a Ride
app.post('/rides', verifyToken, async (req, res) => {
  try {
    // Only customers can request rides
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can request rides' });
    }

    const { pickup, destination, price } = req.body;

    if (!pickup || !destination || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const ride = {
      customerId: new ObjectId(req.user.userId),
      pickup,
      destination,
      price,
      status: 'pending',
      driverId: null,
      createdAt: new Date()
    };

    const result = await db.collection('rides').insertOne(ride);

    res.status(201).json({
      message: "🚕 Ride created successfully!",
      rideId: result.insertedId
    });

  } catch (error) {
    console.error("❌ Ride creation error:", error);
    res.status(500).json({ error: "Failed to create ride" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver View All Available Rides
app.get('/rides/available', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can view available rides' });
    }

    const rides = await db.collection('rides')
      .find({ status: 'pending' })
      .toArray();

    res.status(200).json({
      message: "📋 Available rides:",
      rides
    });

  } catch (error) {
    console.error("❌ Error fetching rides:", error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver Accepts a Ride
app.patch('/rides/accept/:rideId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can accept rides' });
    }

    const rideId = req.params.rideId;

    // 1️⃣ Find ride first
    const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ error: 'Ride already accepted or completed' });
    }

    // 2️⃣ Update the ride
    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId), status: 'pending' },
      {
        $set: {
          status: 'accepted',
          driverId: req.user.userId,
          acceptedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Ride not found or already accepted' });
    }

    res.status(200).json({ 
      message: '🚗 Ride accepted successfully!',
      rideId: rideId,
      driverId: req.user.userId,
      pickup: ride.pickup,
      destination: ride.destination,
      price: ride.price
     });

  } catch (error) {
    console.error("❌ Accept ride error:", error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer Updates Ride
app.patch('/rides/update/:rideId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can update rides' });
    }

    const rideId = req.params.rideId;

    const ride = await db.collection('rides').findOne({
      _id: new ObjectId(rideId),
      customerId: req.user.userId
    });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Only allow update if still pending
    if (ride.status !== 'pending') {
      return res.status(400).json({
        error: "Ride can only be updated before a driver accepts it"
      });
    }

    // Allowed fields
    const allowedUpdates = ['pickup', 'destination', 'notes', 'passengers'];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field]) updateData[field] = req.body[field];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId) },
      { $set: updateData }
    );

    res.status(200).json({
      message: "🚕 Ride updated successfully",
      updatedFields: updateData
    });

  } catch (err) {
    console.error("❌ Update ride error:", err);
    res.status(500).json({ error: "Failed to update ride" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver Updates Ride Status
app.patch('/rides/status/:rideId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can update ride status' });
    }

    const { status } = req.body;
    const allowed = ['picked-up', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const rideId = req.params.rideId;

    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId), driverId: req.user.userId },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Ride not found or not assigned to this driver' });
    }

    res.status(200).json({ message: `🚦 Ride status updated to: ${status}` });

  } catch (error) {
    console.error("❌ Status update error:", error);
    res.status(500).json({ error: 'Failed to update ride status' });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer Checks Ride Status
app.get('/rides/status/:rideId', verifyToken, async (req, res) => {
  try {
    const rideId = req.params.rideId;

    const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Ensure customer can only view their own ride
    if (ride.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only view your own ride' });
    }

    let vehicleInfo = null;
    let driverInfo = null;

    // If a driver accepted the ride, fetch driver details + vehicle details
    if (ride.driverId) {
      // Fetch driver user profile
      const driver = await db.collection("users").findOne({
        _id: new ObjectId(ride.driverId)
      });

      if (driver) {
        driverInfo = {
          driverId: driver._id,
          driverName: driver.username,
        };
      }

      // Fetch vehicle info
      const vehicle = await db.collection("vehicles").findOne({
        driverId: new ObjectId(ride.driverId)
      });

      if (vehicle) {
        vehicleInfo = {
          vehicleType: vehicle.vehicleType,
          plateNumber: vehicle.plateNumber,
          color: vehicle.color
        };
      }
    }

    res.status(200).json({
      rideId: ride._id,
      pickup: ride.pickup,
      destination: ride.destination,
      price: ride.price,
      status: ride.status,
      requestedAt: ride.requestedAt,
      acceptedAt: ride.acceptedAt || null,

      // 👍 Added driver profile
      driver: driverInfo,

      // 👍 Added vehicle info
      driverVehicle: vehicleInfo
    });

  } catch (error) {
    console.error("❌ Error checking ride status:", error);
    res.status(500).json({ error: "Failed to fetch ride status" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer Cancel Ride
app.delete('/cancel-ride/:rideId', authMiddleware, async (req, res) => {
  try {
    const rideId = req.params.rideId;
    const userId = req.user.userId; // from JWT token

    // Find the ride
    const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // Only customer who booked can cancel
    if (ride.customerId !== userId.toString()) {
      return res.status(403).json({ error: "You cannot cancel this ride" });
    }

    // If ride already completed or canceled
    if (ride.status === "completed") {
      return res.status(400).json({ error: "Ride already completed. Cannot cancel." });
    }

    // If driver already picked-up
    if (ride.status === "picked-up") {
      return res.status(400).json({ error: "Driver already picked-up. Cannot cancel." });
    }

    // If ride already canceled
    if (ride.status === "cancelled") {
      return res.status(400).json({ error: "Ride already cancelled." });
    }

    // Update status to "cancelled"
    await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId) },
      { $set: { status: "cancelled", cancelledAt: new Date() } }
    );

    res.status(200).json({
      message: "🚫 Ride cancelled successfully",
      rideId: rideId
    });

  } catch (error) {
    console.error("❌ Cancel ride error:", error);
    res.status(500).json({ error: "Failed to cancel ride" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Customer Rates a Driver
app.post('/rate-driver', authMiddleware, async (req, res) => {
  try {
    const { driverId, rating, comment } = req.body;

    // Validate rating
    if (!driverId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if driver exists
    const driver = await db.collection('users').findOne({ _id: new ObjectId(driverId), role: "driver" });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Insert rating
    await db.collection('ratings').insertOne({
      driverId: new ObjectId(driverId),
      customerId: new ObjectId(req.user.userId),
      rating,
      comment: comment || "",
      createdAt: new Date()
    });

    res.status(201).json({ message: "⭐ Rating submitted successfully" });

  } catch (error) {
    console.error("Rating error:", error);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Driver Views Their Rating
app.get('/driver/:id/ratings', authMiddleware, async (req, res) => {
  try {
    const driverId = req.params.id;

    // Check if driver exists
    const driver = await db.collection('users').findOne({ _id: new ObjectId(driverId), role: "driver" });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Get all ratings
    const ratings = await db.collection('ratings')
      .find({ driverId: new ObjectId(driverId) })
      .toArray();

    // Calculate average rating
    let avg = 0;
    if (ratings.length > 0) {
      avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    }

    res.status(200).json({
      message: "Driver ratings fetched",
      driverId,
      averageRating: avg.toFixed(2),
      totalReviews: ratings.length,
      ratings
    });

  } catch (error) {
    console.error("Rating fetch error:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Admin Blocks or Unblocks User (Driver/Customer)
app.patch('/admin/block/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { block } = req.body;   // true / false

    if (block === undefined) {
      return res.status(400).json({ error: "block field is required (true/false)" });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { blocked: block } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: block ? "🚫 User blocked" : "✅ User unblocked",
      userId
    });

  } catch (error) {
    console.error("❌ Admin block error:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Admin View System Analytics
app.get('/admin/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = db.collection('users');
    const rides = db.collection('rides');

    const totalUsers = await users.countDocuments();
    const totalDrivers = await users.countDocuments({ role: "driver" });
    const totalCustomers = await users.countDocuments({ role: "customer" });

    const pendingRides = await rides.countDocuments({ status: "pending" });
    const acceptedRides = await rides.countDocuments({ status: "accepted" });
    const completedRides = await rides.countDocuments({ status: "completed" });

    const earnings = await rides.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]).toArray();

    res.json({
      totalUsers,
      totalDrivers,
      totalCustomers,
      pendingRides,
      acceptedRides,
      completedRides,
      totalEarnings: earnings.length > 0 ? earnings[0].total : 0
    });

  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 Passenger Analytics (Week 7)
app.get('/analytics/passengers', verifyToken, async (req, res) => {
  try {
    // Optional: only admin can view analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const pipeline = [
      { $match: { role: "customer" } },

      {
        $lookup: {
          from: "rides",
          localField: "_id",
          foreignField: "customerId",
          as: "rides"
        }
      },

      { $unwind: "$rides" },

      {
        $group: {
          _id: "$_id",
          name: { $first: "$username" },
          totalRides: { $sum: 1 },
          totalFare: { $sum: "$rides.price" }
        }
      },

      {
        $project: {
          _id: 0,
          name: 1,
          totalRides: 1,
          totalFare: { $round: ["$totalFare", 2] }
        }
      }
    ];

    const result = await db.collection('users').aggregate(pipeline).toArray();
    res.status(200).json(result);

  } catch (error) {
    console.error("❌ Passenger analytics error:", error);
    res.status(500).json({ error: "Failed to generate passenger analytics" });
  }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// DONEE !!!!


// 🔹 Start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Database connection failed:", err));

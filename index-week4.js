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

// 🔹 Example route to test connection
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Maxim Backend API 🚕' });
});

// 🔹 STEP 3: User Registration API
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    console.log("📦 Received user data:", req.body);
    
    // Validate Input 
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate role
    if (!['customer', 'driver'].includes(role)) {
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


// 🔹 STEP 4: User Login API
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

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Incorrect password fpr:", email);
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
      },
      token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

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


// 🔹 Step 5: Protected Route Example
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

// 🔹 Step 6A:
// 🔹 Create Ride (Customer)
app.post('/ride', verifyToken, async (req, res) => {
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
      customerId: req.user.userId,
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

// 🔹 Step 6B: 
// 🔹 Driver: View Available Rides
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

// 🔹 Step 6C:
// 🔹 Driver Accept Ride
app.patch('/rides/accept/:rideId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ error: 'Only drivers can accept rides' });
    }

    const rideId = req.params.rideId;

    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(rideId), status: 'pending' },
      {
        $set: {
          status: 'accepted',
          driverId: req.user.userId
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Ride not found or already accepted' });
    }

    res.status(200).json({ message: '🚗 Ride accepted successfully!' });

  } catch (error) {
    console.error("❌ Accept ride error:", error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
});

// 🔹 Step 6D:
// 🔹 Driver Update Ride Status
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



// 🔹 Start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Database connection failed:", err));

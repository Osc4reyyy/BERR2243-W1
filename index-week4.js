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
    res.status(200).json({
      message: '✅ Login successful as ${user.role}',
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

// 🔹 Start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Database connection failed:", err));

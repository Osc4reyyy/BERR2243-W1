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

// STEP 3: User Registration API
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate Input 
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for existing user 
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered '});
    }

    // Hash the password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user 
    const newUser = { username, email, password: hashedPassword, createdAt: new Date() };
    const result = await db.collection('users').insertOne(newUser);

    // Respond success
    res.status(201).json({
      message: 'User registered succesfully!',
      userId: result.InsertedId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// 🔹 Start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Database connection failed:", err));

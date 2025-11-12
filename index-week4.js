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

// 🔹 Start server
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Database connection failed:", err));

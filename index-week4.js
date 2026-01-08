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
// 🔹 PROFESSIONAL API DASHBOARD (HTML UI)
app.get('/', async (req, res) => {
    
    // Check if DB is connected
    const dbStatus = db ? "Connected 🟢" : "Disconnected 🔴";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maxim API Dashboard 🚕</title>
        <style>
            :root { --taxi-yellow: #FFC107; --dark-bg: #1a1a1a; --card-bg: #2d2d2d; --text: #ffffff; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--dark-bg); color: var(--text); margin: 0; padding: 0; }
            .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
            header { text-align: center; margin-bottom: 50px; }
            h1 { font-size: 3rem; margin: 0; color: var(--taxi-yellow); text-shadow: 0px 0px 10px rgba(255, 193, 7, 0.3); }
            p.subtitle { color: #aaa; font-size: 1.2rem; margin-top: 10px; }
            .status-badge { background: #155724; color: #d4edda; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; border: 1px solid #c3e6cb; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .card { background-color: var(--card-bg); border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s; border-left: 5px solid var(--taxi-yellow); }
            .card:hover { transform: translateY(-5px); }
            .card h3 { margin-top: 0; color: var(--taxi-yellow); }
            .card ul { list-style: none; padding: 0; }
            .card li { margin: 8px 0; font-size: 0.9rem; color: #ddd; display: flex; justify-content: space-between; }
            .method { font-weight: bold; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; }
            .get { background: #007bff; color: white; }
            .post { background: #28a745; color: white; }
            .patch { background: #ffc107; color: black; }
            .delete { background: #dc3545; color: white; }
            footer { margin-top: 50px; text-align: center; color: #666; font-size: 0.9rem; border-top: 1px solid #333; padding-top: 20px; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: var(--taxi-yellow); color: black; text-decoration: none; font-weight: bold; border-radius: 5px; }
            .btn:hover { background: #e0a800; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>Maxim API 🚕</h1>
                <p class="subtitle">Secure Backend System for Ride Sharing</p>
                <div class="status-badge">System Operational • ${dbStatus}</div>
                <br>
                <a href="#" class="btn">📄 View Postman Docs</a>
            </header>

            <div class="grid">
                <div class="card">
                    <h3>🔐 Authentication</h3>
                    <ul>
                        <li><span>Register User</span> <span class="method post">POST</span></li>
                        <li><span>Login</span> <span class="method post">POST</span></li>
                        <li><span>View Profile</span> <span class="method get">GET</span></li>
                        <li><span>Delete Account</span> <span class="method delete">DEL</span></li>
                    </ul>
                </div>
                <div class="card">
                    <h3>🛵 Driver Ops</h3>
                    <ul>
                        <li><span>Register Vehicle</span> <span class="method post">POST</span></li>
                        <li><span>Available Rides</span> <span class="method get">GET</span></li>
                        <li><span>Accept Ride</span> <span class="method patch">PATCH</span></li>
                        <li><span>Update Status</span> <span class="method patch">PATCH</span></li>
                    </ul>
                </div>
                <div class="card">
                    <h3>📱 Customer Ops</h3>
                    <ul>
                        <li><span>Book Ride</span> <span class="method post">POST</span></li>
                        <li><span>Check Status</span> <span class="method get">GET</span></li>
                        <li><span>Cancel Ride</span> <span class="method delete">DEL</span></li>
                        <li><span>Rate Driver</span> <span class="method post">POST</span></li>
                    </ul>
                </div>
                <div class="card">
                    <h3>🛡️ Admin Portal</h3>
                    <ul>
                        <li><span>System Analytics</span> <span class="method get">GET</span></li>
                        <li><span>Passenger Stats</span> <span class="method get">GET</span></li>
                        <li><span>Block User</span> <span class="method patch">PATCH</span></li>
                    </ul>
                </div>
            </div>

            <footer>
                <p>🚀 Powered by Node.js, Express & MongoDB Atlas | Deployed on Azure</p>
                <p>&copy; ${new Date().getFullYear()} Maxim Backend</p>
            </footer>
        </div>
    </body>
    </html>
    `;

    res.send(html);
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 PUBLIC ADMIN DASHBOARD (For Presentation Demo Only) 📊
app.get('/dashboard/admin', async (req, res) => {
    try {
        const users = db.collection('users');
        const rides = db.collection('rides');

        // 1. Fetch Real Data
        const totalUsers = await users.countDocuments();
        const totalDrivers = await users.countDocuments({ role: "driver" });
        const totalCustomers = await users.countDocuments({ role: "customer" });

        const pendingRides = await rides.countDocuments({ status: "pending" });
        const activeRides = await rides.countDocuments({ status: "accepted" }); 
        const completedRides = await rides.countDocuments({ status: "completed" });

        // Calculate Revenue
        const earnings = await rides.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]).toArray();
        const totalRevenue = earnings.length > 0 ? earnings[0].total : 0;

        // 2. Generate HTML
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Analytics 📊</title>
            <style>
                :root { --taxi-yellow: #FFC107; --dark-bg: #1a1a1a; --card-bg: #2d2d2d; --text: #ffffff; }
                body { font-family: 'Segoe UI', sans-serif; background-color: var(--dark-bg); color: var(--text); padding: 40px; }
                .container { max-width: 1000px; margin: 0 auto; }
                h1 { color: var(--taxi-yellow); text-align: center; font-size: 2.5rem; margin-bottom: 10px; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .card { background: var(--card-bg); padding: 25px; border-radius: 12px; text-align: center; border-bottom: 4px solid var(--taxi-yellow); }
                .card .number { font-size: 3rem; font-weight: bold; color: white; margin: 10px 0; }
                .chart-container { margin-top: 40px; background: var(--card-bg); padding: 30px; border-radius: 12px; }
                .bar-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding-top: 20px; }
                .bar { width: 50px; background: var(--taxi-yellow); border-radius: 5px 5px 0 0; }
                .btn-home { display: inline-block; margin-top: 30px; padding: 10px 20px; background: #333; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>System Analytics 📊</h1>
                <p style="text-align:center; color:#888;">Real-time Data from MongoDB Atlas</p>
                <br>
                <div class="stats-grid">
                    <div class="card">
                        <h3>Total Users</h3>
                        <p class="number">${totalUsers}</p>
                        <small>Drivers: ${totalDrivers} | Customers: ${totalCustomers}</small>
                    </div>
                    <div class="card">
                        <h3>Total Revenue</h3>
                        <p class="number" style="color:var(--taxi-yellow)">RM ${totalRevenue.toFixed(2)}</p>
                    </div>
                    <div class="card">
                        <h3>Completed Rides</h3>
                        <p class="number" style="color:#28a745">${completedRides}</p>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 style="text-align:center; color:#aaa;">Ride Status Overview</h3>
                    <div class="bar-chart">
                        <div style="text-align:center">
                            <div class="bar" style="height: ${pendingRides * 20 + 10}px; background: #ffc107;"></div>
                            <small>Pending (${pendingRides})</small>
                        </div>
                        <div style="text-align:center">
                            <div class="bar" style="height: ${activeRides * 20 + 10}px; background: #17a2b8;"></div>
                            <small>Active (${activeRides})</small>
                        </div>
                        <div style="text-align:center">
                            <div class="bar" style="height: ${completedRides * 20 + 10}px; background: #28a745;"></div>
                            <small>Done (${completedRides})</small>
                        </div>
                    </div>
                </div>

                <div style="text-align:center;">
                    <a href="/" class="btn-home">⬅ Back to Home Dashboard</a>
                </div>
            </div>
        </body>
        </html>
        `;

        res.send(html);

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).send("<h3>❌ Error loading dashboard</h3>");
    }
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 🔹 PUBLIC LOGIN & REGISTER UI (For Presentation Demo) 🔐
app.get('/dashboard/login', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login & Register 🔐</title>
        <style>
            :root { --taxi-yellow: #FFC107; --dark-bg: #1a1a1a; --card-bg: #2d2d2d; --text: #ffffff; }
            body { font-family: 'Segoe UI', sans-serif; background-color: var(--dark-bg); color: var(--text); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { display: flex; gap: 40px; max-width: 900px; width: 100%; padding: 20px; flex-wrap: wrap; }
            .form-box { flex: 1; background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); border-top: 5px solid var(--taxi-yellow); min-width: 300px; }
            h2 { color: var(--taxi-yellow); text-align: center; margin-bottom: 30px; }
            
            input, select { width: 100%; padding: 12px; margin: 10px 0; background: #333; border: 1px solid #444; color: white; border-radius: 5px; box-sizing: border-box; }
            input:focus { border-color: var(--taxi-yellow); outline: none; }
            
            button { width: 100%; padding: 12px; margin-top: 20px; background: var(--taxi-yellow); color: black; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; transition: 0.3s; }
            button:hover { background: #e0a800; }
            
            .result-box { margin-top: 20px; padding: 15px; background: #222; border-radius: 5px; font-size: 0.9rem; color: #aaa; word-break: break-all; display: none; border-left: 3px solid #777; }
            .success { border-color: #28a745; color: #d4edda; }
            .error { border-color: #dc3545; color: #f8d7da; }

            .home-link { text-align: center; width: 100%; margin-top: 20px; }
            .home-link a { color: #888; text-decoration: none; }
            .home-link a:hover { color: var(--taxi-yellow); }
        </style>
    </head>
    <body>
        <div class="container">
            
            <div class="form-box">
                <h2>Login 🔑</h2>
                <input type="email" id="loginEmail" placeholder="Email Address">
                <input type="password" id="loginPassword" placeholder="Password">
                <button onclick="login()">Sign In</button>
                <div id="loginResult" class="result-box"></div>
            </div>

            <div class="form-box">
                <h2>Register 📝</h2>
                <input type="text" id="regUser" placeholder="Username">
                <input type="email" id="regEmail" placeholder="Email Address">
                <input type="password" id="regPass" placeholder="Password">
                <select id="regRole">
                    <option value="customer">Customer</option>
                    <option value="driver">Driver</option>
                </select>
                <button onclick="register()">Create Account</button>
                <div id="regResult" class="result-box"></div>
            </div>

            <div class="home-link">
                <a href="/">⬅ Back to Home Dashboard</a>
            </div>
        </div>

        <script>
            // LOGIN FUNCTION
            async function login() {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const resultBox = document.getElementById('loginResult');

                try {
                    const res = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();

                    resultBox.style.display = 'block';
                    if (res.ok) {
                        resultBox.className = 'result-box success';
                        resultBox.innerHTML = '✅ Login Successful!<br><br><b>Token:</b> ' + data.token.substring(0, 20) + '...';
                        // Save token (Optional for this demo)
                        localStorage.setItem('token', data.token);
                    } else {
                        resultBox.className = 'result-box error';
                        resultBox.innerText = '❌ ' + data.error;
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            // REGISTER FUNCTION
            async function register() {
                const username = document.getElementById('regUser').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPass').value;
                const role = document.getElementById('regRole').value;
                const resultBox = document.getElementById('regResult');

                try {
                    const res = await fetch('/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, password, role })
                    });
                    const data = await res.json();

                    resultBox.style.display = 'block';
                    if (res.ok) {
                        resultBox.className = 'result-box success';
                        resultBox.innerText = '✅ ' + data.message;
                    } else {
                        resultBox.className = 'result-box error';
                        resultBox.innerText = '❌ ' + data.error;
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        </script>
    </body>
    </html>
    `;
    res.send(html);
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
    const newUser = { username, email, password: hashedPassword, role, createdAt: new Date() };
    console.log("🧠 Data being inserted into MongoDB:", newUser);

    const result = await db.collection('users').insertOne(newUser);
    console.log("✅ Insert result:", result);


    // Respond success
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

// 🔹 AUTH MIDDLEWARE (Alternative)
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
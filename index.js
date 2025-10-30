const express = require('express');
const { MongoClient, ObjectId } = require("mongodb");
const port = 3000;

const app = express();
app.use(express.json());

let db;

// --- Task 1: Define Drivers ---
const drivers = [
  { name: "John Doe", vehicleType: "Sedan", isAvailable: true, rating: 4.8 },
  { name: "Alice Smith", vehicleType: "SUV", isAvailable: false, rating: 4.5 }
];

// --- Task 2: JSON Operations ---
console.log("\nDrivers Names:\n");
drivers.forEach(driver => console.log(driver.name));

drivers.push(
  { name: "Alief Irfan", vehicleType: "MPV", isAvailable: true, rating: 4.2 },
  { name: "Firdaus Ibrahim", vehicleType: "Hatchback", isAvailable: false, rating: 4.6 }
);

console.log("\nUpdated Drivers Array:");
console.log(drivers);

// --- Connect to MongoDB ---
async function connectDB() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("testDB");
  console.log("✅ Connected to MongoDB!");
}

// --- Task 3 to 6 ---
async function main() {
  const users = db.collection("users");

  await users.deleteMany({});
  const insertResult = await users.insertMany(drivers);
  console.log(`Inserted ${insertResult.insertedCount} drivers into MongoDB.`);

  const availableDrivers = await users.find({ isAvailable: true, rating: { $gte: 4.5 } }).toArray();
  console.log("\nAvailable drivers with rating ≥ 4.5:", availableDrivers);

  const updateResult = await users.updateOne(
    { name: "John Doe" },
    { $inc: { rating: 0.1 } }
  );
  console.log(`\nUpdated ${updateResult.modifiedCount} driver (John Doe).`);

  const updatedJohn = await users.findOne({ name: "John Doe" });
  console.log(`John Doe's new rating: ${updatedJohn.rating}`);

  const deleteResult = await users.deleteMany({ isAvailable: false });
  console.log(`\nDeleted ${deleteResult.deletedCount} unavailable drivers.`);

  const remainingDrivers = await users.find().toArray();
  console.log("\nRemaining drivers in the database:");
  console.log(remainingDrivers);
}

// --- Express Routes ---
app.get('/rides', async (req, res) => {
  try {
    const rides = await db.collection('rides').find().toArray();
    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

app.post('/rides', async (req, res) => {
  try {
    const result = await db.collection('rides').insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch (err) {
    res.status(400).json({ error: "Invalid ride data" });
  }
});

app.patch('/rides/:id', async (req, res) => {
  try {
    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );
    if (result.modifiedCount === 0)
      return res.status(404).json({ error: "Ride not found" });
    res.status(200).json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(400).json({ error: "Invalid ride ID or data" });
  }
});

app.delete('/rides/:id', async (req, res) => {
  try {
    const result = await db.collection('rides').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Ride not found" });
    res.status(200).json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(400).json({ error: "Invalid ride ID" });
  }
});

// --- Run Everything ---
connectDB()
  .then(async () => {
    await main();
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => console.error("❌ Failed to start app:", err));

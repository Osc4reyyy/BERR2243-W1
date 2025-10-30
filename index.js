const express = require('express');
const { MongoClient } = require("mongodb");
const port = 3000

const app = express();
app.use(express.json());

let db;

// Task 1: Define Drivers
const drivers = [
  {
    name: "John Doe",
    vehicleType: "Sedan",
    isAvailable: true,
    rating: 4.8
  },
  {
    name: "Alice Smith",  
    vehicleType: "SUV",
    isAvailable: false,
    rating: 4.5
  }
];


// Task 2: JSON Data Operations
// TODO : show all the drivers name in the console
console.log("\nDrivers Names:\n");
drivers.forEach(driver=> console.log(driver.name));

// TODO: add additional driver to drivers array
drivers.push({
      name: "Alief Irfan",
      vehicleType: "MPV",
      isAvailable: true,
      rating: 4.2
},
{
      name: "Firdaus Ibrahim",
      vehicleType: "Hatchback",
      isAvailable: false,
      rating: 4.6
});

// show the data in console
console.log("\nUpdated Drivers Array:");
console.log(drivers);


async function main() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("\nConnected to MongoDB !");

    const db = client.db("testDB");
    const users = db.collection("users");

    // Task 3: Insert Drivers into MongoDB
    await users.deleteMany({});
    const insertResult = await users.insertMany(drivers);
    console.log(`Inserted ${insertResult.insertedCount} drivers into MongoDB.`); 
    await users.insertMany(drivers);


    // Task 4: Query and Updates Drivers
    const availableDrivers = await users.find({ isAvailable: true, rating: { $gte: 4.5 } }).toArray();
    console.log("\nAvailable drivers with rating ≥ 4.5: ",availableDrivers);
    //console.log(availableDrivers);

    // Task 5: Update John Doe's rating +0.1
    const updateResult = await users.updateOne(
      { name: "John Doe"},
      { $inc: { rating: 0.10 }}
    );
    console.log(`\nUpdated ${updateResult.modifiedCount} driver (John Doe).`);

    const updatedJohn = await users.findOne({ name: "John Doe" });
    console.log(`John Doe's new rating: ${updatedJohn.rating}`);

    console.log(updateResult);

    // Task 6: Delete Unavailable Drivers
    const deleteResult = await users.deleteMany({ isAvailable: false});
    console.log(`\nDeleted ${deleteResult.deletedCount} unavailable drivers.`);

    const remainingDrivers = await users.find().toArray();
    console.log("\nRemaining drivers in the database: ");
    console.log(remainingDrivers);




  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}


main();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// WEEK 3 GET /rides - Fetch all rides
app.get('/rides', async (req, res) =>{
  try {
    const rides = awaitdb.collection('rides').find().toArray();
    res.status(200).json(rides);
  }catch (err) {
    res.status(500).json({ error: "Failed to fetch rides"});
  }
});

// WEEK 3 POST /rides - Create a new ride
app.post('/rides', async (req, res) => {
  try {
    const result = await db.collection('rides').insertOne(req.body);
    res.status(201).json({ id: result.insertID });
  } catch (err) {
    res.status(400).json({ error: "Invalid ride data" });
  }
});

// WEEK 3 PATCH /rides/:id - Update ride status
app.patch('/rides/:id', async (req, res) => {
  try {
    const result = await db.collection('rides').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }
    res.status(200).json({ updated: result.modifiedCount });
  
  } catch (err) {
    //Handle invalid ID format or DB errors
    res.status(400).json({ error: "Invalid ride ID or data" });
  }
});

// DELETE /rides/:id - Cancel a ride
app.delete('/rides/:id', async (req, res) => {
  try {
    const result = await db.collection('rides').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: " Ride not found" });
    }
    res.status(200).json({ deleted: result.deleteCount });
  
  } catch (err) {
    res.status(400).json({ error: "Invalid ride ID"});
  }
});


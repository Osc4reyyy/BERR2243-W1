const { MongoClient } = require("mongodb");

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
    const insertResult = await users.insertMany(drivers);
    console.log(`Inserted ${insertResult.insertedCount} drivers into MongoDB.`); 
    await users.deleteMany({});
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

    


  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
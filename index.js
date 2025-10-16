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
console.log("Drivers Names:");
drivers.forEach(driver=> console.log(driver.name));

// TODO: add additional driver to drivers array
drivers.push({
      name: "Alief Irfan",
      vehicleType: "MPV",
      isAvailable: true,
      rating: 4.2
});

// show the data in console
console.log("\nUpdated Drivers Array:");
console.log(drivers);


async function main() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();   
    const db = client.db("testDB");

    // Task 3: Insert Drivers into MongoDB
    const driversCollection = db.collection("drivers");

    drivers.forEach(async (driver) => {
      const result = await driversCollection.insertOne(driver);
      console.log('New driver created with result: ${result}');
    });

  } finally {
    await client.close();
  }

    const result = await users.insertOne({ name: "Test User", age: 25 });
    console.log("Inserted document with _id:", result.insertedId);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
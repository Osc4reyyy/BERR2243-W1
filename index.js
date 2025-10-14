const { MongoClient } = require("mongodb");

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

// show the data in console
console.log(drivers);

// TODO: show all the drivers name in the console

// TODO: add additional driver to drivers array

async function main() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("testDB");
    const users = db.collection("users");

    const result = await users.insertOne({ name: "Test User", age: 25 });
    console.log("Inserted document with _id:", result.insertedId);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();
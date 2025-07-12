const { MongoClient } = require("mongodb");
const  config  = require('../utils/config')

const client = new MongoClient(config.MONGODB_URI);

let db;

const connectDB = async () => {
  if (!db) {
    await client.connect();
    db = client.db("authDB");
    console.log("✅ MongoDB Connected");
  }
  return db;
};

module.exports = connectDB

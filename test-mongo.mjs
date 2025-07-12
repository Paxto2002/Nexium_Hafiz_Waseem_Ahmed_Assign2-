import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

console.log("🔍 URI Loaded:", uri); // ← ADD THIS LINE

async function testMongoConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
    const db = client.db(dbName);
    const blogs = await db.collection("blogs").find().toArray();
    console.log(`📄 Total blog documents: ${blogs.length}`);
    await client.close();
  } catch (err) {
    console.error("❌ MongoDB Test Error:", err);
  }
}

testMongoConnection();

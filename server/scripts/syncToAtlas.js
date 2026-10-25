/**
 * MongoDB Localhost to MongoDB Atlas Data Migration Script
 * 
 * Usage:
 *   node scripts/syncToAtlas.js "<your-mongodb-atlas-connection-string>"
 *   OR set ATLAS_URI in .env and run: npm run sync-atlas
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const LOCAL_URI = "mongodb://127.0.0.1:27017/imovies";
const TARGET_URI = process.argv[2] || process.env.ATLAS_URI || (process.env.MONGO_URI && !process.env.MONGO_URI.includes("127.0.0.1") && !process.env.MONGO_URI.includes("localhost") ? process.env.MONGO_URI : null);

const COLLECTIONS = ["admins", "users", "movies", "theatres", "shows", "reviews", "bookings"];

async function sync() {
  console.log("==========================================================");
  console.log("🚀 iMovies MongoDB Localhost → Atlas Migration Tool");
  console.log("==========================================================");

  if (!TARGET_URI) {
    console.error("❌ ERROR: No target MongoDB Atlas connection string provided!");
    console.log("\nUsage:\n  node scripts/syncToAtlas.js \"mongodb+srv://<username>:<password>@cluster.mongodb.net/imovies\"");
    console.log("  OR set ATLAS_URI in server/.env\n");
    process.exit(1);
  }

  console.log(`📡 Connecting to Source (Localhost): ${LOCAL_URI}`);
  const sourceConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Connected to Localhost database.");

  console.log(`📡 Connecting to Destination (MongoDB Atlas)...`);
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
  console.log("✅ Connected to MongoDB Atlas database.");

  console.log("\n----------------------------------------------------------");
  console.log("📦 Transferring collections with preserved ObjectIDs...");
  console.log("----------------------------------------------------------");

  for (const colName of COLLECTIONS) {
    try {
      const sourceCol = sourceConn.collection(colName);
      const targetCol = targetConn.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length === 0) {
        console.log(`ℹ️  [${colName}] 0 documents in local database (skipping).`);
        continue;
      }

      console.log(`🔄 [${colName}] Found ${docs.length} local documents. Upserting into Atlas...`);

      const bulkOps = docs.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      const result = await targetCol.bulkWrite(bulkOps);
      const targetCount = await targetCol.countDocuments();
      console.log(`✅ [${colName}] Synced! Atlas now has ${targetCount} documents (Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}).`);
    } catch (err) {
      console.error(`❌ [${colName}] Migration error:`, err.message);
    }
  }

  // Final verification of Admin
  const adminDoc = await targetConn.collection("admins").findOne({ email: "admin@imovies.com" });
  console.log("\n----------------------------------------------------------");
  if (adminDoc) {
    console.log("✅ VERIFIED: Admin account exists on MongoDB Atlas!");
    console.log(`   Email:    ${adminDoc.email}`);
    console.log(`   Username: ${adminDoc.username}`);
    console.log(`   Role:     ${adminDoc.role}`);
  } else {
    console.warn("⚠️ Warning: Admin account not found in Atlas after sync.");
  }
  console.log("==========================================================");
  console.log("🎉 Migration completed successfully!");
  console.log("==========================================================");

  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

sync().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

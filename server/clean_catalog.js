require("dotenv").config({ path: require("path").resolve(__dirname, "./.env") });
const mongoose = require("mongoose");
const Movie = require("./models/movieModel");
const Show = require("./models/showModel");
const { syncTMDBMovies } = require("./services/tmdbService");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies";

const cleanCatalog = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB:", MONGO_URI);

    // 1. Tag all existing Admin movies with category="custom", isAdminAdded=true, isCustom=true
    await Movie.updateMany(
      { $or: [{ isAdminAdded: true }, { isCustom: true }] },
      { $set: { category: "custom", isAdminAdded: true, isCustom: true } }
    );

    const adminMovies = await Movie.find({
      $or: [{ isAdminAdded: true }, { isCustom: true }],
    });
    console.log(`Protected ${adminMovies.length} Admin/Custom movies:`);
    adminMovies.forEach((m) => console.log(` - [ADMIN] ${m.movieName} (${m._id})`));

    // 2. Perform live sync of now_playing and upcoming (1 page each)
    console.log("\nStarting fresh sync for 'now_playing' and 'upcoming' (1 page each)...");
    const { synced, errors } = await syncTMDBMovies({
      endpoints: ["/movie/now_playing", "/movie/upcoming"],
      pages: 1,
      fetchDetail: true,
    });
    console.log(`Sync finished: ${synced} movies synced, ${errors} errors.`);

    // 3. Purge movies that are NOT admin added and NOT categorized as now_playing or upcoming
    const removeResult = await Movie.deleteMany({
      isAdminAdded: { $ne: true },
      isCustom: { $ne: true },
      category: { $nin: ["now_playing", "upcoming"] },
    });
    console.log(`\nPurged ${removeResult.deletedCount} non-in-theatre / obsolete catalog movies.`);

    // 4. Clean orphan shows whose movieId no longer exists
    const allValidMovieIds = (await Movie.find().select("_id")).map((m) => m._id.toString());
    const validMovieSet = new Set(allValidMovieIds);

    const allShows = await Show.find().select("movieId showId");
    let orphanShowCount = 0;
    const orphanShowIds = [];

    allShows.forEach((s) => {
      if (!s.movieId || !validMovieSet.has(s.movieId.toString())) {
        orphanShowIds.push(s._id);
        orphanShowCount++;
      }
    });

    if (orphanShowIds.length > 0) {
      await Show.deleteMany({ _id: { $in: orphanShowIds } });
      console.log(`Cleaned ${orphanShowCount} orphan shows referencing deleted movies.`);
    } else {
      console.log("No orphan shows found.");
    }

    // 5. Final summary
    const finalCount = await Movie.countDocuments();
    const finalCategoryBreakdown = await Movie.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    console.log(`\nFinal movie count in DB: ${finalCount}`);
    console.log("Category breakdown:", JSON.stringify(finalCategoryBreakdown, null, 2));

    const moviesList = await Movie.find().select("movieName category isAdminAdded rating").sort({ isAdminAdded: -1, createdAt: -1 });
    console.log("\nAll Current Movies in DB (Admin movies at top):");
    moviesList.forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.category?.toUpperCase() || 'UNKNOWN'}] ${m.movieName} ${m.isAdminAdded ? '⭐ (ADMIN)' : ''}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Clean catalog error:", err);
    process.exit(1);
  }
};

cleanCatalog();

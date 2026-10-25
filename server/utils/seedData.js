const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const User = require("../models/userModel");
const Admin = require("../models/adminModel");
const Movie = require("../models/movieModel");
const Theatre = require("../models/theatreModel");
const Show = require("../models/showModel");
const Review = require("../models/reviewModel");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies";

const seedDatabase = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log("[Seed] Connecting to MongoDB at:", MONGO_URI);
      await mongoose.connect(MONGO_URI);
      console.log("[Seed] Connected successfully!");
    }

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log("[Seed] Cleared existing collections.");

    // 1. Create Default Users & Admin
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const userPassword = await bcrypt.hash("user123", salt);

    const admin = await Admin.create({
      username: "admin",
      email: "admin@imovies.com",
      password: adminPassword,
      role: "admin",
    });

    const user = await User.create({
      username: "moviefan",
      email: "demo@imovies.com",
      password: userPassword,
      role: "user",
    });

    console.log("[Seed] Created Admin (admin@imovies.com / admin123) and User (demo@imovies.com / user123)");

    // 2. Create Blockbuster Movies
    const moviesData = [
      {
        movieName: "Oppenheimer",
        description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        genres: ["Biography", "Drama", "History"],
        releaseDate: new Date("2023-07-21"),
        language: "English",
        duration: "3h 0m",
        certification: "R",
        posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/fm6K9vYI79FG9AgUQirAvYnWqbs.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
        director: "Christopher Nolan",
        rating: 8.9,
        voteCount: 14200,
      },
      {
        movieName: "Dune: Part Two",
        description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        genres: ["Action", "Adventure", "Sci-Fi"],
        releaseDate: new Date("2024-03-01"),
        language: "English",
        duration: "2h 46m",
        certification: "PG-13",
        posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b42.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
        director: "Denis Villeneuve",
        rating: 8.7,
        voteCount: 9800,
      },
      {
        movieName: "Interstellar",
        description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
        genres: ["Adventure", "Drama", "Sci-Fi"],
        releaseDate: new Date("2014-11-07"),
        language: "English",
        duration: "2h 49m",
        certification: "PG-13",
        posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/rAiYTsqJiO2Myl4vM1U6Fj7V46r.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
        director: "Christopher Nolan",
        rating: 8.7,
        voteCount: 22000,
      },
      {
        movieName: "The Dark Knight",
        description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        genres: ["Action", "Crime", "Drama"],
        releaseDate: new Date("2008-07-18"),
        language: "English",
        duration: "2h 32m",
        certification: "PG-13",
        posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
        director: "Christopher Nolan",
        rating: 9.0,
        voteCount: 31000,
      },
      {
        movieName: "Spider-Man: Across the Spider-Verse",
        description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
        genres: ["Animation", "Action", "Adventure"],
        releaseDate: new Date("2023-06-02"),
        language: "English",
        duration: "2h 20m",
        certification: "PG",
        posterUrl: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
        cast: ["Shameik Moore", "Hailee Steinfeld", "Oscar Isaac", "Daniel Kaluuya"],
        director: "Joaquim Dos Santos, Kemp Powers",
        rating: 8.8,
        voteCount: 11500,
      },
      {
        movieName: "Avatar: The Way of Water",
        description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
        genres: ["Action", "Adventure", "Fantasy"],
        releaseDate: new Date("2022-12-16"),
        language: "English",
        duration: "3h 12m",
        certification: "PG-13",
        posterUrl: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=d9MyW72ELq0",
        cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Stephen Lang"],
        director: "James Cameron",
        rating: 7.8,
        voteCount: 15400,
      },
      {
        movieName: "Gladiator II",
        description: "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome.",
        genres: ["Action", "Adventure", "Drama"],
        releaseDate: new Date("2024-11-22"),
        language: "English",
        duration: "2h 28m",
        certification: "R",
        posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL69ovr.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo",
        cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington", "Connie Nielsen"],
        director: "Ridley Scott",
        rating: 8.4,
        voteCount: 4200,
      },
      {
        movieName: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        genres: ["Action", "Adventure", "Sci-Fi"],
        releaseDate: new Date("2010-07-16"),
        language: "English",
        duration: "2h 28m",
        certification: "PG-13",
        posterUrl: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
        bannerUrl: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
        trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
        cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
        director: "Christopher Nolan",
        rating: 8.8,
        voteCount: 25000,
      },
    ];

    const createdMovies = await Movie.insertMany(moviesData);
    console.log(`[Seed] Inserted ${createdMovies.length} movies.`);

    // 3. Create Theatres
    const theatresData = [
      {
        theatreName: "iMovies IMAX - Downtown Grand",
        theatreId: "th-imax-01",
        location: "Downtown City Center, 5th Avenue",
        balconySeatPrice: 450,
        middleSeatPrice: 320,
        lowerSeatPrice: 200,
        balconySeats: { rows: ["A", "B"], seatsPerRow: 10, totalSeats: 20 },
        middleSeats: { rows: ["C", "D", "E", "F"], seatsPerRow: 12, totalSeats: 48 },
        lowerSeats: { rows: ["G", "H"], seatsPerRow: 12, totalSeats: 24 },
        amenities: ["IMAX with Laser", "Dolby Atmos 128-channel", "Recliner Seats", "Valet Parking"],
      },
      {
        theatreName: "iMovies PVR Luxe - Metro Mall",
        theatreId: "th-pvr-02",
        location: "Metro Galleria Mall, Level 4",
        balconySeatPrice: 400,
        middleSeatPrice: 280,
        lowerSeatPrice: 180,
        balconySeats: { rows: ["A", "B"], seatsPerRow: 10, totalSeats: 20 },
        middleSeats: { rows: ["C", "D", "E"], seatsPerRow: 12, totalSeats: 36 },
        lowerSeats: { rows: ["F", "G"], seatsPerRow: 12, totalSeats: 24 },
        amenities: ["4K RGB Laser", "Dolby 7.1", "Gourmet Concessions", "VIP Lounge"],
      },
      {
        theatreName: "iMovies Cinepolis 4DX - Cyber City",
        theatreId: "th-cine-03",
        location: "Cyber City Tech Hub, Block B",
        balconySeatPrice: 500,
        middleSeatPrice: 350,
        lowerSeatPrice: 220,
        balconySeats: { rows: ["A", "B"], seatsPerRow: 8, totalSeats: 16 },
        middleSeats: { rows: ["C", "D", "E"], seatsPerRow: 10, totalSeats: 30 },
        lowerSeats: { rows: ["F", "G"], seatsPerRow: 10, totalSeats: 20 },
        amenities: ["4DX Motion Seats", "Environmental Wind & Fog", "Dolby Atmos", "Arcade"],
      },
    ];

    const createdTheatres = await Theatre.insertMany(theatresData);
    console.log(`[Seed] Inserted ${createdTheatres.length} theatres.`);

    // 4. Helper to generate seat tickets for shows
    const createTicketsLayout = (theatre) => {
      const tickets = {};
      const tiers = [
        { name: "balcony", label: "Balcony (VIP)", price: theatre.balconySeatPrice, config: theatre.balconySeats },
        { name: "middle", label: "Middle (Premium)", price: theatre.middleSeatPrice, config: theatre.middleSeats },
        { name: "lower", label: "Lower (Standard)", price: theatre.lowerSeatPrice, config: theatre.lowerSeats },
      ];

      tiers.forEach((tier) => {
        const rows = tier.config.rows;
        const seatsPerRow = tier.config.seatsPerRow;
        rows.forEach((row) => {
          for (let col = 1; col <= seatsPerRow; col++) {
            const seatId = `${row}${col}`;
            tickets[seatId] = {
              seatNumber: seatId,
              row,
              col,
              tier: tier.name,
              tierLabel: tier.label,
              price: tier.price,
              status: "available",
              lockedBy: null,
              lockExpiresAt: null,
              bookingId: null,
            };
          }
        });
      });
      return tickets;
    };

    // Dates: Today, Tomorrow, Day+2
    const today = new Date();
    const dates = [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().split("T")[0];
    });

    const times = ["10:30 AM", "02:15 PM", "06:45 PM", "10:00 PM"];

    // 5. Generate Shows linking Movies and Theatres
    const showsToInsert = [];
    let showCounter = 1;

    for (const movie of createdMovies) {
      for (const theatre of createdTheatres) {
        for (const showDate of dates) {
          // Add 2 showtimes per theatre per movie per date
          for (let i = 0; i < 2; i++) {
            const showTime = times[(showCounter + i) % times.length];
            const tickets = createTicketsLayout(theatre);

            // Pre-simulate 3 booked seats for realism
            if (tickets["B5"]) {
              tickets["B5"].status = "booked";
              tickets["B5"].bookingId = "BK-SAMPLE-01";
            }
            if (tickets["D6"]) {
              tickets["D6"].status = "booked";
              tickets["D6"].bookingId = "BK-SAMPLE-02";
            }
            if (tickets["D7"]) {
              tickets["D7"].status = "booked";
              tickets["D7"].bookingId = "BK-SAMPLE-02";
            }

            showsToInsert.push({
              adminEmail: admin.email,
              showId: `show-im-${showCounter++}`,
              movieId: movie._id.toString(),
              theatreName: theatre.theatreName,
              theatreId: theatre.theatreId,
              showDate,
              showTime,
              pricing: {
                balcony: theatre.balconySeatPrice,
                middle: theatre.middleSeatPrice,
                lower: theatre.lowerSeatPrice,
              },
              tickets,
            });
          }
        }
      }
    }

    const createdShows = await Show.insertMany(showsToInsert);
    console.log(`[Seed] Inserted ${createdShows.length} shows scheduled across 3 dates.`);

    // 6. Create Sample Reviews
    const reviewsData = [
      {
        userEmail: "demo@imovies.com",
        username: "moviefan",
        movieId: createdMovies[0]._id.toString(),
        rating: 5,
        reviewText: "Cillian Murphy gives the performance of a lifetime! The sound design during the Trinity test was breathtaking.",
      },
      {
        userEmail: "alex@example.com",
        username: "Alex_Cinema",
        movieId: createdMovies[0]._id.toString(),
        rating: 5,
        reviewText: "Nolan masterclass. The tension in the third act is unreal.",
      },
      {
        userEmail: "demo@imovies.com",
        username: "moviefan",
        movieId: createdMovies[1]._id.toString(),
        rating: 5,
        reviewText: "Visually the most stunning sci-fi epic since Blade Runner 2049! IMAX is an absolute must.",
      },
      {
        userEmail: "sarah@example.com",
        username: "SarahM",
        movieId: createdMovies[2]._id.toString(),
        rating: 5,
        reviewText: "Emotional, scientifically thought-provoking, and Hans Zimmer's organ score gives me chills every time.",
      },
    ];

    await Review.insertMany(reviewsData);
    console.log(`[Seed] Inserted sample reviews.`);

    console.log("[Seed] Database seeding completed successfully!");
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error("[Seed] Error during seeding:", error);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Ensures essential default admin, users, and catalog data exist in the connected MongoDB.
 * Useful for automated setup when connected to MongoDB Atlas.
 */
const autoSeedIfEmpty = async () => {
  try {
    const admin = await Admin.findOne({ email: "admin@imovies.com" });
    if (!admin) {
      console.log("[Bootstrap] 🛡️  Default admin not found in database. Initializing admin account...");
      const salt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash("admin123", salt);
      await Admin.create({
        username: "admin",
        email: "admin@imovies.com",
        password: adminPassword,
        role: "admin",
      });
      console.log("[Bootstrap] ✅ Default admin (admin@imovies.com / admin123) successfully initialized in database.");
    } else {
      console.log("[Bootstrap] ✅ Admin account verified in database (admin@imovies.com).");
    }

    const demoUser = await User.findOne({ email: "demo@imovies.com" });
    if (!demoUser) {
      console.log("[Bootstrap] 👤 Initializing default demo user...");
      const salt = await bcrypt.genSalt(10);
      const userPassword = await bcrypt.hash("user123", salt);
      await User.create({
        username: "moviefan",
        email: "demo@imovies.com",
        password: userPassword,
        role: "user",
        isVerified: true,
      });
      console.log("[Bootstrap] ✅ Default demo user (demo@imovies.com / user123) initialized in database.");
    }

    const userAccount = await User.findOne({ email: "user@imovies.com" });
    if (!userAccount) {
      const salt = await bcrypt.genSalt(10);
      const userPassword = await bcrypt.hash("user1234", salt);
      await User.create({
        username: "testuser",
        email: "user@imovies.com",
        password: userPassword,
        role: "user",
        isVerified: true,
      });
    }

    const theatreCount = await Theatre.countDocuments();
    if (theatreCount === 0) {
      console.log("[Bootstrap] 🏛️  No theatres found in database. Running initial catalog seeding...");
      await seedDatabase(false);
    }
  } catch (err) {
    console.error("[Bootstrap] Auto-seed check error:", err.message);
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = {
  seedDatabase,
  autoSeedIfEmpty,
};

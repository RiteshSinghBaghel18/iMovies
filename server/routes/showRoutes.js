const express = require("express");
const router = express.Router();
const showController = require("../controllers/showController");
const { fetchAdmin } = require("../middlewares/fetchUser");

// Public
router.get("/", showController.getAllShows);
router.get("/movie/:movieId", showController.getShowsByMovie);
router.get("/:showId", showController.getShowById);

// Admin
router.post("/", fetchAdmin, showController.createShow);
router.delete("/:showId", fetchAdmin, showController.deleteShow);

module.exports = router;

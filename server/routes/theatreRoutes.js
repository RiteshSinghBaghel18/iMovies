const express = require("express");
const router = express.Router();
const theatreController = require("../controllers/theatreController");
const { fetchAdmin } = require("../middlewares/fetchUser");

// Public
router.get("/", theatreController.getAllTheatres);
router.get("/:theatreId", theatreController.getTheatreById);

// Admin
router.post("/", fetchAdmin, theatreController.createTheatre);
router.put("/:theatreId", fetchAdmin, theatreController.updateTheatre);
router.delete("/:theatreId", fetchAdmin, theatreController.deleteTheatre);

module.exports = router;

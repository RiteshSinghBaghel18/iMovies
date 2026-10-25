const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const { fetchUser } = require("../middlewares/fetchUser");

router.get("/", fetchUser, favoriteController.getUserFavorites);
router.post("/", fetchUser, favoriteController.addFavorite);
router.delete("/:movieId", fetchUser, favoriteController.removeFavorite);
router.get("/check/:movieId", fetchUser, favoriteController.checkFavorite);

module.exports = router;

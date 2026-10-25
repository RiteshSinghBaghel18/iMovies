const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { fetchAdmin } = require("../middlewares/fetchUser");

// All routes require administrative permissions
router.use(fetchAdmin);

// Transactions & Refund Management
router.get("/transactions", adminController.getAllTransactions);
router.post("/refund/:paymentId", adminController.processRefund);

module.exports = router;

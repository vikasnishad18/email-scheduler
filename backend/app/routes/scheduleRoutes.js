const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

router.post("/schedule-email", scheduleController.scheduleEmail);

module.exports = router;

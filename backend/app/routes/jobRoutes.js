const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

router.get("/jobs", jobController.getAllJobs);
router.get("/jobs/:id", jobController.getJobById);
router.get("/stats", jobController.getStats);
router.post("/jobs/:id/retry", jobController.retryJob);
router.delete("/jobs/:id", jobController.removeJob);


module.exports = router;

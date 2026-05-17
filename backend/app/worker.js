const { io: clientIO } = require("socket.io-client");
const socket = clientIO("http://api:3000");
const db = require("./db/knex");

socket.emit("identify", "worker");

socket.on("connect", () => {
  console.log("Worker connected to API WS:", socket.id);
});

socket.on("connect_error", err => {
  console.log("WS connection failed:", err.message);
});

const { Worker } = require("bullmq");
const redis = require("./utils/redis");
const sendEmailProcessor = require("./jobs/processors/sendEmail");

const worker = new Worker("emailQueue", job => sendEmailProcessor(job), {
  connection: redis
});

worker.on("active", async (job) => {
  await db("jobs")
    .where({ id: job.id })
    .update({
      status: "active",
      started_at: new Date()
    });

  await db("job_events").insert({
    job_id: job.id,
    event_type: "started",
    created_at: new Date()
  });

  socket.emit("job:started", { id: job.id });
});

worker.on("completed", async (job, result) => {
  await db("jobs")
    .where({ id: job.id })
    .update({
      status: "completed",
      completed_at: new Date()
    });

  await db("job_events").insert({
    job_id: job.id,
    event_type: "completed",
    data: result,
    created_at: new Date()
  });

  socket.emit("job:completed", { id: job.id });
});

worker.on("failed", async (job, err) => {
  await db("jobs")
    .where({ id: job.id })
    .update({
      status: "failed",
      failed_reason: err.message
    });

  await db("job_events").insert({
    job_id: job.id,
    event_type: "failed",
    data: { error: err.message },
    created_at: new Date()
  });

  socket.emit("job:failed", { id: job.id, error: err.message });
});


console.log("Worker is running...");

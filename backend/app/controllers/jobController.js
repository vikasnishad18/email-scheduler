const db = require("../db/knex");
const emailQueue = require("../jobs/emailQueue");

exports.getAllJobs = async (req, res) => {
  const jobs = await db("jobs")
    .select("*")
    .orderBy("queued_at", "desc");

  res.json(jobs);
};

exports.getJobById = async (req, res) => {
  const job = await db("jobs").where({ id: req.params.id }).first();
  if (!job) return res.status(404).json({ error: "Not found" });

  const events = await db("job_events")
    .where({ job_id: req.params.id })
    .orderBy("created_at");

  res.json({ job, events });
};


exports.getStats = async (req, res) => {
  const rows = await db("jobs")
    .select("status")
    .count("* as count")
    .groupBy("status");

  res.json(rows);
};


exports.retryJob = async (req, res) => {
  const id = req.params.id;

  const job = await db("jobs").where({ id }).first();
  if (!job) return res.status(404).json({ error: "Job not found" });

  if (job.status !== "failed") {
    return res.status(400).json({ error: "Only failed jobs can be retried" });
  }

  // Create a new BullMQ job
  const newJob = await emailQueue.add(
    "send",
    {
      to: job.to_email,
      subject: job.subject,
      body: job.body
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 }
    }
  );

  // Insert new job in DB
  await db("jobs").insert({
    id: newJob.id,
    type: job.type,
    to_email: job.to_email,
    subject: job.subject,
    body: job.body,
    status: "queued",
    attempts: 0,
    queued_at: new Date(),
    retry_of: id  // Optional
  });

  await db("job_events").insert({
    job_id: newJob.id,
    event_type: "requeued",
    created_at: new Date()
  });

  res.json({ retried: true, newJobId: newJob.id });
};

exports.removeJob = async (req, res) => {
  const id = req.params.id;

  const job = await emailQueue.getJob(id);
  if (job) {
    try {
      await job.remove();
    } catch (e) {
      console.warn(`Job ${id} could not be removed from BullMQ (probably completed).`);
    }
  }

  await db("job_events").where({ job_id: id }).del();
  await db("jobs").where({ id }).del();

  res.json({ deleted: true });
};



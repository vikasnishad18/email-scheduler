const emailQueue = require("../jobs/emailQueue");
const { getIO } = require("../socket");
const db = require("../db/knex");

exports.sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const job = await emailQueue.add("send", { to, subject, body }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  });

  await db("jobs").insert({
    id: job.id,
    type: "send",
    to_email: to,
    subject,
    body,
    status: "queued",
    attempts: 0,
    queued_at: new Date()
  });

  await db("job_events").insert({
    job_id: job.id,
    event_type: "queued",
    data: { to, subject },
    created_at: new Date()
  });

  getIO().emit("job:queued", { id: job.id, data: job.data });

  return res.json({ queued: true, jobId: job.id });
};

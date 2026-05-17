const emailQueue = require("../jobs/emailQueue");
const { getIO } = require("../socket");
const db = require("../db/knex");

exports.scheduleEmail = async (req, res) => {
  const { to, subject, body, sendAt } = req.body;

  if (!to || !subject || !body || !sendAt) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const sendTime = new Date(sendAt);

  if (isNaN(sendTime.getTime())) {
    return res.status(400).json({ error: "Invalid sendAt datetime" });
  }

  const delay = sendTime.getTime() - Date.now();

  console.log("Scheduling email to:", to, "at:", sendTime, "with delay (ms):", delay);

  if (delay <= 0) {
    return res.status(400).json({ error: "sendAt must be in the future" });
  }

  const job = await emailQueue.add("send", { to, subject, body }, {
    delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: false,
    removeOnFail: false
  });

  await db("jobs").insert({
    id: job.id,
    type: "scheduled",
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
    data: { to, subject, sendAt },
    created_at: new Date()
  });


  getIO().emit("job:queued", { id: job.id, data: job.data });

  return res.json({ scheduled: true, jobId: job.id });
};

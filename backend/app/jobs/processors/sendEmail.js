const emailService = require("../../services/emailService");

module.exports = async function sendEmailProcessor(job) {
  const { to, subject, body } = job.data;

  await emailService.send(to, subject, body);

  return { status: "sent" };
};

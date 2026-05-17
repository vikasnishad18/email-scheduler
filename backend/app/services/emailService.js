const mailer = require("../utils/mailer");

module.exports = {
  send: async (to, subject, body) => {
    console.log("Sending email...");

    await mailer.sendMail({
      from: "no-reply@example.com",
      to,
      subject,
      text: body
    });
    console.log("Email sent to:", to);
  }
};


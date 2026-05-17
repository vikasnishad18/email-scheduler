const { Queue } = require("bullmq");
const redis = require('../utils/redis');

const emailQueue = new Queue("emailQueue", {
    connection: redis
});

module.exports = emailQueue;
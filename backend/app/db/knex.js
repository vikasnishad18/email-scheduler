const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    host: process.env.PGHOST || process.env.POSTGRES_HOST || "postgres",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "notif_user",
    password: process.env.PGPASSWORD || "notif_pass",
    database: process.env.PGDATABASE || "notif_db"
  }
});

module.exports = db;

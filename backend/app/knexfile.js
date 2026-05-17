module.exports = {
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST || "postgres",
    user: process.env.POSTGRES_USER || "notif_user",
    password: process.env.POSTGRES_PASSWORD || "notif_pass",
    database: process.env.POSTGRES_DB || "notif_db"
  },
  migrations: {
    directory: "./db/migrations"
  }
};

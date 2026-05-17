const express = require("express");
const http = require("http");
const cors = require("cors");
const db = require("./db/knex");

const app = express();
app.use(express.json());

app.use(cors({
  origin: "*" 
}));

const server = http.createServer(app);

const { initIO } = require("./socket");
initIO(server);

app.use("/api", require("./routes/emailRoutes"));
app.use("/api", require("./routes/scheduleRoutes"));
app.use("/api", require("./routes/jobRoutes"));

server.listen(3000, () => {
  console.log("API + Socket.io running on 3000");
});

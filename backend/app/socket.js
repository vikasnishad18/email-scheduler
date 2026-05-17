const { Server } = require("socket.io");

let io;

function initIO(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initIO(server) first.");
  }
  return io;
}

module.exports = { initIO, getIO };


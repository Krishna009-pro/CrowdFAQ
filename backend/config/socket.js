const { Server } = require("socket.io");

const { corsOptions } = require("./cors");

const configureSocket = (server, app) => {
  const io = new Server(server, {
    cors: corsOptions,
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_question", (questionId) => {
      socket.join(`question_${questionId}`);
      console.log(`User ${socket.id} joined room for question_${questionId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = {
  configureSocket,
};

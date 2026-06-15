const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config({ path: path.join(__dirname, ".env") });

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const answerRoutes = require("./routes/answerRoutes");
const questionRoutes = require("./routes/questionRoutes");
const searchRoutes = require("./routes/searchRoutes");
const authRoutes = require("./routes/authRoutes");

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const allowedOrigins = new Set([
  CLIENT_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://192.168.55.103:3000",
  "http://192.168.55.103:3001",
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

const app = express();
const server = http.createServer(app);
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

const MONGODB_URI = process.env.MONGODB_URI;
let databaseStatus = "disconnected";

app.use(
  cors(corsOptions)
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Samagama AQ Portal API (v1)",
    docs: "Usage: /api/v1/health, /api/v1/search, /api/v1/questions, /api/v1/answers"
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "aq-portal-api",
      status: "ok",
      database: databaseStatus,
    },
  });
});

app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/answers", answerRoutes);
app.use("/api/v1/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const connectToDatabase = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const isLocalMongo = MONGODB_URI.includes("localhost") || MONGODB_URI.includes("127.0.0.1");
  const options = {
    serverSelectionTimeoutMS: 10000,
  };

  if (!isLocalMongo) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = true;
    options.retryWrites = true;
    options.w = "majority";
  }

  await mongoose.connect(MONGODB_URI, options);
  databaseStatus = "connected";
};

const startServer = async () => {
  if (MONGODB_URI) {
    try {
      await connectToDatabase();
    } catch (error) {
      databaseStatus = "connection_failed";
      console.error("MongoDB connection failed:");
      console.error("- Error:", error.message);
      if (error.message.includes("SSL") || error.message.includes("IP")) {
        console.error("- Tip: Check your Atlas IP Whitelist and your local network firewall.");
      }
    }
  }

  server.listen(PORT, () => {
    console.log(`AQ Portal API listening on port ${PORT}`);
  });
};

startServer();

module.exports = app;

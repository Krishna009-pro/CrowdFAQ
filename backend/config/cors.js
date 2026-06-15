const env = require("./env");

const allowedOrigins = new Set([
  env.clientOrigin,
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

    if (env.nodeEnv !== "production") {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};

// Imports Mongoose for MongoDB connection management.
const mongoose = require("mongoose");

// Reads MongoDB URI from the centralized environment config.
const env = require("./env");

// Tracks connection state for the /api/v1/health endpoint.
let databaseStatus = "disconnected";

// Returns the latest known database connection status.
const getDatabaseStatus = () => databaseStatus;

// Builds connection options differently for local MongoDB vs Atlas.
const buildMongoOptions = (uri) => {
  // Local MongoDB should not use Atlas-only TLS options.
  const isLocalMongo =
    uri.includes("localhost") || uri.includes("127.0.0.1");

  // Fail quickly when MongoDB is unreachable.
  const options = {
    serverSelectionTimeoutMS: 10000,
  };

  // Atlas connections need retry/write settings and TLS handling.
  if (!isLocalMongo) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = true;
    options.retryWrites = true;
    options.w = "majority";
  }

  return options;
};

// Connects to MongoDB and updates health-check status.
const connectToDatabase = async (uri = env.mongodbUri) => {
  // Allow the API to boot without DB config, but report that clearly.
  if (!uri) {
    databaseStatus = "not_configured";
    return null;
  }

  try {
    // Opens the Mongoose connection using the appropriate options.
    await mongoose.connect(uri, buildMongoOptions(uri));
    // Mark health status as connected after a successful connection.
    databaseStatus = "connected";
    console.log(
      `Database connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
    return mongoose.connection;
  } catch (error) {
    // Mark health status as failed while preserving the original error.
    databaseStatus = "connection_failed";
    console.log(
      `Database not connected - check mongodb is running or not!`);
    throw error;
  }
};

// Export connection helpers for server startup and health routes.
module.exports = {
  connectToDatabase,
  getDatabaseStatus,
};

const mongoose = require("mongoose");

const env = require("./env");

let databaseStatus = "disconnected";

const getDatabaseStatus = () => databaseStatus;

const buildMongoOptions = (uri) => {
  const isLocalMongo =
    uri.includes("localhost") || uri.includes("127.0.0.1");

  const options = {
    serverSelectionTimeoutMS: 10000,
  };

  if (!isLocalMongo) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = true;
    options.retryWrites = true;
    options.w = "majority";
  }

  return options;
};

const connectToDatabase = async (uri = env.mongodbUri) => {
  if (!uri) {
    databaseStatus = "not_configured";
    return null;
  }

  try {
    await mongoose.connect(uri, buildMongoOptions(uri));
    databaseStatus = "connected";
    return mongoose.connection;
  } catch (error) {
    databaseStatus = "connection_failed";
    throw error;
  }
};

module.exports = {
  connectToDatabase,
  getDatabaseStatus,
};

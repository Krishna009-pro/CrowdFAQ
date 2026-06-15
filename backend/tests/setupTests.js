const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  // Prevent Mongoose from using real MongoDB Atlas configuration in test environment
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set test environment variables
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "testsecret12345";
  process.env.GEMINI_API_KEY = "testgeminiapikey12345";
  process.env.NODE_ENV = "test";

  // Disconnect any existing connections before connecting to in-memory db
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Clear all database collections before each test run
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

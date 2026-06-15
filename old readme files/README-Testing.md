# Testing Strategy & Mocking Blueprint (MERN Stack)

This document details the testing framework setup, isolated database test fixtures, and AI SDK mocking routines for CrowdFAQ.

---

## 1. Directory Structure

```
testing/
├── backend/                  # Node.js/Express Jest tests
│   ├── setup.js              # Setup / Teardown hooks for mongodb-memory-server
│   ├── auth.test.js          # Authentication endpoint verification
│   ├── questions.test.js     # Question posting, tag validation
│   └── mocks/
│       └── aiService.mock.js # Mock scripts for Gemini API SDK
├── frontend/                 # React unit and integration tests
│   ├── setup.js              # Vitest global browser mocks
│   ├── test-utils.jsx        # Wrappers for React Router / Auth Context
│   └── components/
│       └── QuestionCard.test.jsx
└── README.md
```

---

## 2. Backend Testing (Jest + Supertest)

We use `Jest` as our test runner and `supertest` for making mock HTTP requests directly against our Express app object.

### 2.1 Database Isolation via `mongodb-memory-server`
To run test suites locally without modifying a real database, we run an in-memory MongoDB daemon:

```javascript
// testing/backend/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

const disconnectDB = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
};

const clearDB = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

module.exports = { connectDB, disconnectDB, clearDB };
```

Using this inside individual test files:
```javascript
// testing/backend/auth.test.js
const request = require('supertest');
const app = require('../../backend/src/app');
const { connectDB, disconnectDB, clearDB } = require('./setup');

beforeAll(async () => await connectDB());
afterAll(async () => await disconnectDB());
beforeEach(async () => await clearDB());

describe('POST /api/v1/auth/register', () => {
    it('should register a user with correct details', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: "Test User",
                email: "test@crowdfaq.com",
                password: "password123"
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
    });
});
```

---

### 2.2 Mocking `@google/generative-ai` SDK
To prevent network request timeouts and costs during test execution, mock the Gemini SDK:

```javascript
// testing/backend/mocks/aiService.mock.js
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: jest.fn().mockReturnValue({
                    embedContent: jest.fn().mockResolvedValue({
                        embedding: { values: new Array(768).fill(0.1) }
                    }),
                    generateContent: jest.fn().mockResolvedValue({
                        response: {
                            text: () => "Mocked Gemini Output"
                        }
                    })
                })
            };
        })
    };
});
```

---

## 3. Running Test Suites

### 3.1 Install Test Libraries
```bash
cd backend
npm install --save-dev jest supertest mongodb-memory-server
```

### 3.2 Add scripts in `backend/package.json`
```json
"scripts": {
  "test": "jest --runInBand --detectOpenHandles"
}
```

### 3.3 Execute Command
```bash
npm run test
```

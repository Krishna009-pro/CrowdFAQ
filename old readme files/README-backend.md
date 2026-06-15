# Backend Architecture Blueprint (Express & Node.js)

This document details the project structure, routing patterns, authentication middleware, and development configurations for the Node.js & Express.js backend of CrowdFAQ.

---

## 1. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB connection logic (Mongoose connection)
│   │   └── keys.js           # Configuration keys and constants (dotenv)
│   ├── controllers/          # Business logic handlers (req/res lifecycles)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── questionController.js
│   │   ├── answerController.js
│   │   └── moderationController.js
│   ├── middlewares/          # Request validation, security, and handlers
│   │   ├── authMiddleware.js # JWT payload decryption & validation
│   │   ├── roleMiddleware.js # Access authorization check
│   │   └── errorMiddleware.js# Catch-all Express error handler
│   ├── models/               # Mongoose schemas (see Database blueprint)
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── Answer.js
│   ├── routes/               # Express endpoints routers
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   └── moderationRoutes.js
│   ├── services/             # Integrations (Gemini API interactions, notifications)
│   │   └── aiService.js
│   ├── app.js                # Express app initialization, CORS, and json wrappers
│   └── server.js             # Server startup, port listening, database triggers
├── package.json
└── .env
```

---

## 2. API Endpoints Reference

All paths are prefixed by `/api/v1`.

### 2.1 Authentication (`/auth`)
* `POST /register`: Registers a new user.
* `POST /login`: Authenticates user, returns JWT cookie or payload.
* `POST /forgot-password`: Generates reset token & sends password recovery link.
* `POST /reset-password`: Validates token and updates password.

### 2.2 User Profiles (`/users`)
* `GET /me`: Returns profile of the currently logged-in user.
* `PUT /me`: Updates profile details (name, profile picture).
* `GET /profile/:userId`: Views public user profile, reputation points, active badges.
* `GET /leaderboard`: Returns gamification leaderboard list (daily/weekly/monthly/all-time).

### 2.3 Question Management (`/questions`)
* `GET /`: Lists questions (supports keyword query, filters, paginations).
* `POST /`: Creates a question. Runs duplicate vector similarity checks and tag recommendations.
* `GET /:slug`: Retrieves single question detail, related questions list, and answer list.
* `PUT /:id`: Edits title, description, or tags (Owner or Moderator/Admin only).
* `DELETE /:id`: Deletes question (Owner or Moderator/Admin only).
* `POST /:id/follow`: Toggles following a question for updates.

### 2.4 Answer Management (`/answers`)
* `POST /:questionId`: Post answer to a question. Triggers reputation updates.
* `PUT /:id`: Edits content.
* `DELETE /:id`: Deletes answer.
* `POST /:id/best`: Marks the answer as "Best Answer" (Question Author only).
* `POST /:id/verify`: Endorses the answer (Faculty or Expert only).

### 2.5 Voting (`/votes`)
* `POST /questions/:id`: Upvotes/Downvotes/Removes vote on a question.
* `POST /answers/:id`: Upvotes/Downvotes/Removes vote on an answer.

### 2.6 Moderation & Reports (`/moderation`)
* `POST /report`: Flags content (question/answer/comment) for spam or offensive details.
* `GET /reports`: Lists all pending flags (Moderator/Admin only).
* `POST /reports/:id/resolve`: Resolves a reported item (dismiss, hide, suspend).

---

## 3. Role-Based Access Control (RBAC) Middleware

Express middlewares verify the JSON Web Token (JWT) and validate the user's role:

```javascript
// src/middlewares/roleMiddleware.js
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        // req.user is populated by the authMiddleware.js JWT check
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. No session found.' });
        }
        
        const userRoleName = req.user.role.name; // assuming populated role reference
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleName)) {
            return res.status(403).json({ 
                message: `Forbidden. Role '${userRoleName}' does not have access.` 
            });
        }
        
        next();
    };
};

module.exports = { authorize };

// Route Usage Example:
// router.post('/categories', protect, authorize(['Admin']), createCategory);
```

---

## 4. Local Development Setup

1. **Initialize & Install Dependencies**:
   ```bash
   npm init -y
   npm install express mongoose jsonwebtoken bcryptjs cors dotenv
   npm install --save-dev nodemon
   ```
2. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=8000
   MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/crowdfaq"
   JWT_SECRET="your-jwt-secret-token-key"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
3. **Configure package.json scripts**:
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon src/server.js"
   }
   ```
4. **Run Server**:
   ```bash
   npm run dev
   ```
   * Access API locally at [http://localhost:8000](http://localhost:8000).

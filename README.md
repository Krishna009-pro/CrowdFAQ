# CrowdFAQ

CrowdFAQ is a crowdsourced FAQ and community Q&A portal. It combines a React TypeScript frontend, an Express API, MongoDB-backed question and answer data, real-time updates, and Gemini-powered semantic search.

## What It Solves

- Reduces repeated support work by centralizing common questions and official answers.
- Gives users one searchable place to find FAQs and community answers.
- Lets community members ask questions, contribute answers, and build reputation.
- Lets admins publish verified official responses.

## Tech Stack

### Frontend

- React 19 (TypeScript)
- Craco (CRA config override)
- Tailwind CSS & Tailwind Animate
- Radix UI Primitives
- Framer Motion
- Axios
- TanStack React Query & SWR
- React Hook Form & Zod
- Recharts (for Analytics visualization)

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Socket.IO
- Gemini API integration for semantic search, summaries, and FAQ assistant features

## Project Structure

```text
CrowdFAQ/
  backend/      Express API, routes, models, services, seed script
  frontend/     React TypeScript app, Craco config, UI source
  database/     Database-related project files
  docs/         Documentation
  testing/      Testing support files
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Gemini API key if you want AI search/embedding/chatbot features

## Installation & Setup

Since the frontend and backend are standalone packages, dependencies must be installed in their respective directories.

### 1. Setup Backend
From the repository root:
```bash
cd backend
npm install
```
Create `backend/.env` and add:
```env
MONGODB_URI=mongodb://localhost:27017/CrowdFAQ
JWT_SECRET=change-this-secret
PORT=5000
CLIENT_ORIGIN=http://localhost:3001
NODE_ENV=development
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Setup Frontend
From the repository root:
```bash
cd frontend
npm install --legacy-peer-deps --no-workspaces
```

---

## Running the Project

### Terminal 1: Run Backend
```bash
cd backend
npm run dev
# Runs backend on http://localhost:5000
```

### Terminal 2: Run Frontend
```bash
cd frontend
npm start
# Runs frontend on http://localhost:3001
```

---

## Available Scripts

### Backend Scripts
```bash
npm run dev    # Start backend with node --watch
npm start      # Start backend normally
npm test       # Run backend tests
```

### Frontend Scripts
```bash
npm start      # Start React development server
npm run build  # Build production frontend assets to frontend/build/
npm test       # Run frontend tests
```

---

## Admin APIs & Moderation

The backend includes a moderation/admin API surface implemented under:
```text
backend/routes/adminRoutes.js
backend/controllers/adminController.js
backend/middleware/adminMiddleware.js
```

Available admin endpoints:
```text
GET    /api/v1/admin/stats
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/role
GET    /api/v1/admin/questions
PATCH  /api/v1/admin/questions/:id/status
DELETE /api/v1/admin/questions/:id
GET    /api/v1/admin/answers
PATCH  /api/v1/admin/answers/:id/official
DELETE /api/v1/admin/answers/:id
```

Role rules:
- `moderator` and `admin` can access moderation dashboards and content controls.
- Only `admin` can change user roles and permanently delete moderated content.

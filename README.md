# CrowdFAQ

CrowdFAQ is a crowdsourced FAQ and community Q&A portal. It combines a React frontend, an Express API, MongoDB-backed question and answer data, real-time updates, and optional OpenAI-powered semantic search.

## What It Solves

- Reduces repeated support work by centralizing common questions and official answers.
- Gives users one searchable place to find FAQs and community answers.
- Lets community members ask questions, contribute answers, and build reputation.
- Lets admins publish verified official responses.

## Tech Stack

### Frontend

- React 18
- React Router
- Webpack Dev Server
- Tailwind CSS
- Framer Motion
- Axios
- Zustand
- Socket.IO client

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT authentication
- Socket.IO
- OpenAI API integration for semantic search features

## Project Structure

```text
CrowdFAQ/
  backend/      Express API, routes, models, services, seed script
  frontend/     React app, Webpack config, UI source
  database/     Database-related project files
  docs/         Documentation
  testing/      Testing support files
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- OpenAI API key if you want AI search/embedding features

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the script execution policy.

## Installation

From the repository root:

```powershell
npm.cmd install
```

You can also use plain `npm install` if your shell allows it.

## Environment Setup

Create `backend/.env` and add:

```env
MONGODB_URI=mongodb://localhost:27017/CrowdFAQ
JWT_SECRET=change-this-secret
PORT=5000
CLIENT_ORIGIN=http://localhost:3001
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key
```

Notes:

- `OPENAI_API_KEY` is only required for OpenAI-backed features.
- Use your MongoDB Atlas URI instead of the local MongoDB URI if you are not running MongoDB locally.
- Do not commit `backend/.env`.

## How To Run The Project

Open two terminals.

### Terminal 1: Start Backend

From the repository root:

```powershell
npm.cmd run backend:dev
```

Or from the backend folder:

```powershell
cd backend
npm.cmd run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/v1/health
```

### Terminal 2: Start Frontend

From the repository root:

```powershell
npm.cmd run frontend:dev
```

Or from the frontend folder:

```powershell
cd frontend
npm.cmd run dev
```

Frontend URL:

```text
http://localhost:3001
```

## Available Scripts

### Root Scripts

```powershell
npm.cmd run frontend:dev   # Start the React dev server
npm.cmd run backend:dev    # Start the Express API in watch mode
npm.cmd run backend:start  # Start the Express API normally
npm.cmd run build          # Build the frontend for production
npm.cmd test               # Run tests across workspaces
```

### Backend Scripts

```powershell
npm.cmd run dev    # Start backend with node --watch
npm.cmd start      # Start backend normally
npm.cmd test       # Run backend tests
```

### Frontend Scripts

```powershell
npm.cmd run dev    # Start Webpack Dev Server
npm.cmd start      # Same as dev
npm.cmd run build  # Build production frontend assets
npm.cmd test       # Run frontend tests
```

## Common Issues

### `Missing script: "dev"` in frontend

Make sure you have the latest `frontend/package.json`. The frontend now includes:

```json
"dev": "webpack serve --mode development"
```

### `'webpack' is not recognized`

Install dependencies from the repository root:

```powershell
npm.cmd install
```

Then run the frontend again.

### `Cannot find module ...`

This usually means `node_modules` is incomplete or corrupted. Run:

```powershell
npm.cmd install
```

If OneDrive interrupted package extraction, reinstalling from the root usually repairs the missing package files.

### Backend port already in use

The backend uses port `5000` by default. Stop the old backend terminal with `Ctrl+C`, or change `PORT` in `backend/.env`.

### MongoDB connection failed

Start local MongoDB, or update `MONGODB_URI` in `backend/.env` with a valid MongoDB Atlas connection string.

## Build

To create a production frontend build:

```powershell
npm.cmd run build
```

The build output is written to:

```text
frontend/dist
```

## Team Workflow

```powershell
git checkout -b feature/my-update
git add .
git commit -m "Describe the change"
git push origin feature/my-update
```

Then open a pull request to `main`.

## Notes

- Keep secrets in `backend/.env`.
- Do not commit `node_modules`.
- Run `npm.cmd install` from the repository root so both workspaces are installed correctly.

# FAQ-VLED

FAQ and community Q&A portal with separate frontend and backend workspaces.

## Problem Statement & Solution

### What Problem Does This Solve?
- **Support fatigue**: Repetitive questions take time to answer manually
- **Knowledge fragmentation**: FAQs scattered across docs; no single source of truth
- **Poor discoverability**: Users can't find answers to common questions
- **No community involvement**: Users can't help each other or contribute knowledge

### How It Solves It
1. **Unified Knowledge Base** - All FAQs and community Q&A in one searchable portal
2. **Smart Search** - AI-powered semantic search using OpenAI embeddings to find similar questions
3. **Community Contributions** - Users can ask questions and community/admins can provide official answers
4. **Official Responses** - Admins can mark answers as "Official" from Vicharanashala System
5. **Verified Badges** - Official answers stand out with verified badges
6. **User Reputation** - Gamification with reputation scores and badges for active contributors

### Methodology
- **Agile Development** - Iterative updates with feature releases in phases
- **Monorepo Structure** - Frontend and backend in one repo for easier coordination
- **Separation of Concerns** - Clean API boundaries between frontend/backend
- **Environment Management** - Secrets in .env files, never committed to Git
- **Team Collaboration** - Feature branches, pull requests, code review workflow

## Architecture

### Frontend (React 18 + Webpack)
- SPA built with React Router for navigation
- Tailwind CSS + Framer Motion for styling and animations
- Axios for API communication
- State management with Zustand
- Responsive design for mobile, tablet, desktop

### Backend (Node.js + Express)
- REST API on port 5000
- MongoDB Atlas for data storage
- OpenAI API for semantic search embeddings
- JWT authentication for users
- Socket.io for real-time updates
- CORS enabled for LAN access

### Database (MongoDB)
- **Question** collection - stores community questions
- **Answer** collection - stores user and official answers
- **User** collection - stores user profiles and reputation
- Full-text and vector search indexes for semantic matching

## Key Features Implemented
- ✅ 130 seeded FAQ questions with official responses
- ✅ Community Q&A feed with real-time updates
- ✅ Semantic search using OpenAI embeddings
- ✅ Admin dashboard to manage questions and create official answers
- ✅ Official response badges for verified Vicharanashala System answers
- ✅ User authentication with JWT tokens
- ✅ Reputation scoring system
- ✅ Pastel color theme with premium dark mode UI
- ✅ LAN/Network accessibility for team development

## Prerequisites
- Node.js 18+ 
- npm
- MongoDB Atlas connection string
- OpenAI API key, if you want embeddings/search features enabled

## Local setup

### 1) Clone the repo
```bash
git clone https://github.com/yogeshkamisetty/FAQ-VLED.git
cd FAQ-VLED
```

### 2) Install dependencies
From the repo root:
```bash
npm install
```

### 3) Configure backend environment
Copy the example file and fill in real values locally:
```bash
cp backend/.env.example backend/.env
```

Add your own values for:
- `MONGODB_URI`
- `OPENAI_API_KEY`
- `JWT_SECRET`

Do not commit `backend/.env`.

### 4) Start the backend
```bash
npm run backend:dev
```
Backend runs on `http://localhost:5000` by default.

### 5) Start the frontend
In a second terminal:
```bash
npm run frontend:dev
```
Frontend runs on `http://localhost:3001` by default.

## Team workflow
- Create a new branch for each task.
- Make changes locally.
- Test the app before pushing.
- Open a pull request to `main`.

Suggested branch flow:
```bash
git checkout -b feature/my-update
```
Then:
```bash
git add .
git commit -m "Describe the change"
git push origin feature/my-update
```

## Notes
- `backend/.env` is ignored by Git.
- `backend/.env.example` is safe to share.
- If a secret was ever pushed by mistake, rotate it immediately.

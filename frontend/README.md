# Frontend Architecture Blueprint (MERN Integration)

This document details the folder structure, design parameters, React components, and local configuration files to connect the React application to the Express.js backend.

---

## 1. Directory Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # CSS styling, custom SVGs, default user avatars
│   ├── components/         # Modular layout units
│   │   ├── common/         # Premium Card, Button, Input, Modal wrapper, Spinner
│   │   ├── layout/         # Header/Navbar, Sidebar, Footer, ProtectedRoute
│   │   ├── question/       # QuestionFeedCard, AskQuestionForm, TagFilter
│   │   ├── answer/         # AnswerBlock, WriteAnswerForm, CommentsList
│   │   └── ai/             # ChatBotPanel, DuplicateWarningModal
│   ├── context/            # Global context (AuthContext, ThemeContext)
│   ├── hooks/              # useAuth, useDebounce, useQuestionQuery
│   ├── pages/              # Routing templates
│   │   ├── AuthPage.jsx          # Login & SignUp Forms
│   │   ├── Dashboard.jsx         # Question feed, categories filter
│   │   ├── QuestionDetail.jsx    # Thread details, comments, verified answers
│   │   ├── Leaderboard.jsx       # Daily / Weekly / Monthly reputation lists
│   │   ├── Profile.jsx           # Activity graphs, earned badges list
│   │   └── AdminDashboard.jsx    # Report logs, moderation panel, category CRUD
│   ├── services/           # Network request clients
│   │   └── api.js          # Axios config with JWT header injection
│   ├── utils/              # Text formatting, parsing dates
│   ├── App.jsx             # React router switch mappings
│   ├── index.css           # Global custom classes & Tailwind setup
│   └── main.jsx            # Entry mount point
├── package.json
├── tailwind.config.js
└── vite.config.js          # Vite configuration with proxy configurations
```

---

## 2. Connecting to Express Backend (Vite Proxy)

To prevent Cross-Origin Resource Sharing (CORS) errors during local development, configure a reverse proxy in Vite to forward requests from port `5173` to port `8000`:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

---

## 3. Axios Client Setup with JWT Authorization

Set up Axios to automatically read the token and attach it as a Bearer authorization token header to outgoing calls:

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1', // Maps to proxy target http://localhost:8000/api/v1
});

// Interceptor to inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
```

---

## 4. UI Design System Guidelines

Maintain premium aesthetics across screens:

* **Dark Mode Strategy**: Toggle `dark` class on root html node. Use classes like `bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-50`.
* **Harmonious Accents**:
  * *Expert Badge*: Blue border with soft cyan radial gradient background.
  * *Faculty Badge*: Crimson/Red pill with white bold typography.
  * *Admin Badge*: Golden glow border with metallic yellow fonts.
* **Micro-interactions**: Use CSS transition variables (`transition-all duration-300 ease-in-out`) on button states, card scaling, and sidebar sliding panels.

---

## 5. Development Launch Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Client**:
   ```bash
   npm run dev
   ```
   * Open: [http://localhost:5173](http://localhost:5173).

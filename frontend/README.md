# Frontend Architecture Blueprint

This document details the directory structure, styling guidelines, page routing, and local setup instructions for the **React + Vite + Tailwind CSS** frontend of CrowdFAQ.

---

## 1. Directory Structure

```
frontend/
├── public/                 # Static assets (favicons, manifest)
├── src/
│   ├── assets/             # Images, default avatars, background gradients
│   ├── components/         # Reusable presentation and UI components
│   │   ├── common/         # Button, Card, Badge, Modal, Input, Spinner
│   │   ├── layout/         # Navbar, Sidebar, Footer, Breadcrumbs
│   │   ├── question/       # QuestionCard, AskQuestionForm, TagSelector
│   │   ├── answer/         # AnswerCard, AnswerForm, CommentSection
│   │   ├── profile/        # ActivityList, BadgeGrid, ReputationWidget
│   │   └── ai/             # ChatBotWidget, SimilarityModal
│   ├── context/            # AuthContext, ThemeContext
│   ├── hooks/              # useAuth, useDebounce, useQuestion
│   ├── pages/              # Routing views
│   │   ├── AuthPage.jsx          # Login & Signup screen
│   │   ├── Dashboard.jsx         # User Feed & Ask Question gateway
│   │   ├── QuestionDetail.jsx    # Thread views with Answers & Comments
│   │   ├── Leaderboard.jsx       # Ranking list (daily/weekly/monthly/all-time)
│   │   ├── Profile.jsx           # User statistics & earned badges
│   │   ├── AdminDashboard.jsx    # Category editor, User roles, Reports log
│   │   └── NotFound.jsx          # Custom error page
│   ├── services/           # Api wrappers and endpoints
│   │   └── api.js          # Axios configuration with auth interceptors
│   ├── utils/              # Text formatting, date parsing, calculations
│   ├── App.jsx             # Root routing wrapper
│   ├── index.css           # Global Tailwind utilities & custom styles
│   └── main.jsx            # React root mounting script
├── package.json
├── tailwind.config.js      # Custom theme settings
└── vite.config.js          # Build & proxy configurations
```

---

## 2. Design System & Premium Aesthetics

To deliver a high-end, modern user experience, adhere to these UI tokens and visual styles:

### 2.1 Colors
* **Primary**: Indigo/Violet gradients (`#6366f1` to `#8b5cf6`).
* **Backgrounds**: Deep charcoal slate (`#0f172a` for dark mode) and soft cream slate (`#f8fafc` for light mode).
* **Accents**:
  * Success / Verified: Teal / Emerald (`#10b981`).
  * Warning / Flagged: Amber (`#f59e0b`).
  * Danger / Delete: Rose (`#f43f5e`).

### 2.2 Typography
* Font family: `Outfit` (for headings) and `Inter` (for bodies). Include from Google Fonts in `index.html`.

### 2.3 Visual Styles
* **Glassmorphism**: Use backdrop filters for navbars, sidebars, and overlays:
  ```css
  .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
  }
  ```
* **Micro-animations**: Smooth hover transitions for interactive states:
  ```css
  .hover-scale {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hover-scale:hover {
      transform: translateY(-2px) scale(1.02);
  }
  ```

---

## 3. Client-Side Routing Configuration

Route guards handle user access:

```jsx
// src/components/layout/ProtectedRoute.jsx snippet
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading account...</div>;
    if (!user) return <Navigate to="/auth" replace />;
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

// Route structure:
// <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
//     <Route path="/admin" element={<AdminDashboard />} />
// </Route>
```

---

## 4. Local Development Setup

1. **Initialize Project** (if starting fresh):
   ```bash
   npm create vite@latest . -- --template react
   npm install react-router-dom axios lucide-react classnames
   ```
2. **Install Tailwind CSS**:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. **Configure tailwind.config.js**:
   Add support for custom gradients, dark mode selection (`class`), and custom fonts.
4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
   * Open: [http://localhost:5173](http://localhost:5173).

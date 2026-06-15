# Samagama AQ Portal Context

This file is the working project memory for the Samagama AQ Portal. Update it after every meaningful code, configuration, dependency, architecture, or troubleshooting change.

## Project Goal

Samagama AQ Portal is a crowdsourced Asked Questions platform for student support. The core workflow is search-first question submission:

1. A student types a question.
2. The backend generates an embedding with OpenAI.
3. MongoDB Atlas Vector Search checks for similar verified or existing questions.
4. The frontend intercepts likely duplicates before posting.
5. If no duplicate is found, the question is posted.
6. An AI-generated provisional answer is created asynchronously.
7. Community answers and accepted answers resolve questions and reward reputation.

## Required Stack

- Monorepo with `backend` and `frontend`.
- Backend: Node.js, Express, Mongoose, MongoDB Atlas, OpenAI SDK, JWT cookies, Redis/Upstash later, Socket.IO.
- AI models:
  - Embeddings: `text-embedding-3-small`
  - Draft answers: `gpt-4o-mini`
- Frontend: React 18, Webpack 5, Module Federation, Tailwind CSS, Zustand, Axios, lucide-react.
- API prefix: `/api/v1`.
- Error handling: centralized Express error middleware.
- Auth: Stateless JWT in HttpOnly cookies (Implemented).

## Current Status

Completed phases:

- Phase 1: Backend foundation and Mongoose schemas.
- Phase 2: OpenAI service, triage controller, vector search route.
- Phase 3: Question and answer CRUD controllers/routes, AI fallback draft creation, reputation increment on accepted answers.
- Phase 4: Frontend React/Webpack/Tailwind/Module Federation scaffold, Axios client, Zustand store.
- Phase 5: Search-first UI component and AQ feed.
- Phase 6: Question detail route, AI draft rendering, answer submission form, voting UI, accept-answer UI.
- Phase 7: Authentication (JWT), Port Standardization (3000/5000), Vector Search Index Validation.
- Redesign pass: frontend reworked into a VINS/manual-style knowledge-base interface while keeping the existing AQ Portal API contracts.
- Latest redesign pass: home page now follows the supplied Vercel-style help-center reference with a centered hero panel, compact search bar, resource cards, and a recent AQ feed.
- Latest color pass: frontend now uses the supplied pastel palette across the app:
  - cream `#FEF9D9`
  - peach `#FCE0C6`
  - pale blue `#C1DCEB`
  - blue `#84BBE1`
- UX audit fix pass: addressed the screenshot audit issues with stronger contrast, clearer CTAs, trust signals, better offline recovery, action-oriented card labels, and fallback feed content.

## Important Runtime Notes

- Backend expected local URL: `http://localhost:5000`.
- Frontend dev server expected local URL: `http://localhost:3001`.
- Backend health endpoint: `GET /api/v1/health`.
- Frontend Axios base URL defaults to `http://localhost:5000/api/v1`.
- Axios uses `withCredentials: true` for HttpOnly cookie auth.
- Root scripts now exist:
  - `npm run build` builds the frontend workspace.
  - `npm run frontend:dev` starts the frontend dev server.
  - `npm run backend:dev` starts the backend in watch mode.
  - `npm run backend:start` starts the backend normally.
- React is pinned to `18.2.0` at both the root and frontend workspace to avoid mixed React runtime versions.
- `frontend/webpack.config.js` currently serves the app on port `3001`.
- `backend/.env` and `backend/.env.example` should use `CLIENT_ORIGIN=http://localhost:3001` for local CORS.

## Environment Variables

Backend `.env` must exist at `backend/.env`.

Required now:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/aq-portal?appName=Cluster0
OPENAI_API_KEY=<openai-api-key>
JWT_SECRET=<long-random-local-secret>
UPSTASH_REDIS_URL=
```

Do not commit real secrets.

Frontend optional env sample:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api/v1
```

## MongoDB Atlas Vector Search

The backend triage route expects an Atlas Vector Search index named exactly:

```text
vector_index
```

Create it on the `questions` collection with this JSON:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "status"
    },
    {
      "type": "filter",
      "path": "tags"
    }
  ]
}
```

The `1536` dimension count matches OpenAI `text-embedding-3-small`.

## Backend Structure

```text
backend/
  config/
    atlas-vector-search-index.json
  controllers/
    answerController.js
    questionController.js
    triageController.js
  middleware/
    authMiddleware.js
    errorHandler.js
  models/
    Answer.js
    Question.js
    User.js
  routes/
    answerRoutes.js
    authRoutes.js
    questionRoutes.js
    searchRoutes.js
  services/
    openaiService.js
  .env
  .env.example
  package.json
  server.js
```

### Backend Files

- `server.js`
  - Express app setup.
  - Credentialed CORS.
  - JSON body parser.
  - Cookie parser.
  - MongoDB connection.
  - Health route.
  - Route mounts:
    - `/api/v1/search`
    - `/api/v1/questions`
    - `/api/v1/answers`
    - `/api/v1/auth`
  - Centralized 404 and error middleware.
  - Was modified so the API can still start and expose health if MongoDB connection fails. Health includes `database` status.
  - Creates the Socket.IO server and stores it on the Express app for answer notifications.

- `middleware/authMiddleware.js`
  - `protect` middleware reads the JWT from the HttpOnly cookie and attaches the authenticated user to `req.user`.

- `middleware/errorHandler.js`
  - `notFoundHandler`
  - `errorHandler`
  - Avoids leaking stack traces to clients.

- `models/User.js`
  - Fields: `displayName`, `email`, `role`, `reputationScore`, `badges`, `streak`.

- `models/Question.js`
  - Fields: `title`, `body`, `author`, `tags`, `embedding`, `duplicateOf`, `duplicateScore`, `status`.
  - Embedding validation requires either empty array or 1536 dimensions.
  - Status currently includes `pending`, `answered`, `verified`, `resolved`, `duplicate`, `closed`.
  - Has virtual `answers` relation to `Answer`.

- `models/Answer.js`
  - Fields: `question`, `author`, `body`, `aiGenerated`, `isAccepted`.

- `services/openaiService.js`
  - Initializes OpenAI SDK.
  - `generateEmbedding(input)` uses `text-embedding-3-small`.
  - `generateProvisionalDraft({ title, body, tags })` uses `gpt-4o-mini`.
  - Draft prompt is strict: student support tone, no invented policies, provisional only.

- `controllers/triageController.js`
  - `searchAndTriage(req, res, next)`.
  - Reads `q`.
  - Generates embedding.
  - Uses MongoDB `$vectorSearch` with index `vector_index`, path `embedding`.
  - Returns:
    - `hard_intercept` for score `>= 0.90`
    - `soft_intercept` for score `>= 0.75`
    - `allow_post` for score `< 0.75`

- `controllers/questionController.js`
  - `createQuestion`
    - Reads `title`, `body`, `tags`, `authorId`.
    - Generates embedding from `title + " " + body`.
    - Saves question.
    - Starts background AI draft creation with `setImmediate`.
  - `getQuestions`
    - Cursor pagination using `_id`.
    - Returns open questions sorted newest first.
    - Excludes the `embedding` vector from normal API responses to avoid sending large 1536-number arrays to the frontend.
  - `getQuestionById`
    - Fetches one question and populates author and answers.
    - Excludes the `embedding` vector from the detail response.

- `controllers/answerController.js`
  - `createAnswer`
    - Creates human answer.
    - Marks pending question as `answered`.
  - `acceptAnswer`
    - Marks answer accepted.
    - Unaccepts other answers for same question.
    - Marks question `resolved`.
    - Increments answer author's `reputationScore` by 25.
  - `voteAnswer`
    - Increments answer `upvoteCount` or `downvoteCount`.

- `routes/authRoutes.js`
  - Development registration/logout flow.
  - Sets/clears the JWT HttpOnly cookie used by the frontend.

## Backend Endpoints

```text
GET    /api/v1/health
GET    /api/v1/search?q=<question text>
POST   /api/v1/questions
GET    /api/v1/questions
GET    /api/v1/questions/:id
POST   /api/v1/answers
PATCH  /api/v1/answers/:id/accept
POST   /api/v1/answers/:id/vote
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
```

## Frontend Structure

```text
frontend/
  public/
    index.html
  src/
    api/
      client.js
    components/
      AQFeed.jsx
      AnswerForm.jsx
      FAQKnowledgeBase.jsx
      Login.jsx
      QuestionDetail.jsx
      SearchWidget.jsx
    data/
      faqData.js
    store/
      useStore.js
    App.jsx
    index.jsx
    styles.css
  .env.example
  package.json
  postcss.config.js
  tailwind.config.js
  webpack.config.js
```

### Frontend Files

- `webpack.config.js`
  - Webpack 5 React build.
  - Module Federation configured:
    - `name: "aq_portal"`
    - `filename: "remoteEntry.js"`
    - exposes `./AQSearch` from `./src/components/SearchWidget`
    - shares `react` and `react-dom` as singletons.
  - Dev server port: `3001`.
  - `clean: false` because OneDrive locked generated files during build cleanup.
  - Babel currently transforms modules to CommonJS to avoid a workspace parser conflict.

- `src/api/client.js`
  - Axios instance.
  - Base URL from `REACT_APP_API_BASE_URL` or `http://localhost:5000/api/v1`.
  - `withCredentials: true`.

- `src/store/useStore.js`
  - Zustand store:
    - `user`
    - `isAuthenticated`
    - `setUser`
    - `logout`
    - `notifications`
    - `addNotification`
    - `removeNotification`

- `src/components/SearchWidget.jsx`
  - Debounced 400ms search-first flow.
  - Calls `GET /search?q=...`.
  - Handles:
    - `hard_intercept`: exact answer card, hides submit button.
    - `soft_intercept`: suggested match list and "submit anyway" button.
    - `allow_post`: normal post button.
  - Uses `Search`, `AlertCircle`, `CheckCircle` from lucide-react.
  - Redesigned as a compact zero-wait search/ask control that visually matches the help-center reference.
  - Keeps the empty state clean; the post action appears only after enough text is entered.
  - Updated to a cream search surface with blue actions and pastel duplicate-intercept states.
  - Copy now explicitly reinforces the search-first journey before posting.
  - Routes unauthenticated users to `/login` before posting.

- `src/components/AQFeed.jsx`
  - Calls `GET /questions` on mount.
  - Shows question title, body snippet, tags, answer count, and accepted answer checkmark if present.
  - Question titles link to `/question/:id`.
  - Redesigned into compact dark knowledge cards matching the VINS/manual reference style.
  - Updated with cream cards, pastel divider bars, pale-blue tags, and blue action links.
  - Error state no longer dead-ends users. It now shows a retry button, a manual link, and fallback official FAQ cards.
  - Fallback cards are generated from `src/data/faqData.js` when live community threads cannot load.

- `src/components/FAQKnowledgeBase.jsx`
  - Uses backend FAQ records from `GET /questions?tag=FAQ&limit=200` when available.
  - Falls back to local VINS manual entries from `src/data/faqData.js` while MongoDB is unavailable or before FAQ seed data exists.
  - Uses React state and Tailwind classes directly; no `framer-motion`, `clsx`, or `tailwind-merge` imports.
  - Updated to match the same pastel hero/search/card palette as the home screen.

- `src/data/faqData.js`
  - Local fallback FAQ/manual data for the knowledge-base route.

- `src/components/Login.jsx`
  - Lightweight register/login screen for the existing `/api/v1/auth/register` endpoint.
  - Sets the Zustand user from the backend response and routes back home.
  - Updated with pastel card, cream inputs, and blue primary action.

- `src/components/QuestionDetail.jsx`
  - Uses `useParams` to read the question ID from `/question/:id`.
  - Calls `GET /questions/:id` on mount.
  - Renders question title, body, author, and tags.
  - Renders answers with voting controls.
  - Renders AI-generated answers with a distinct indigo style, `Sparkles` icon, and "Provisional AI Draft - Pending Peer Review" disclaimer.
  - Shows "Mark as Accepted" only when the logged-in user matches the question author.
  - Calls `PATCH /answers/:answerId/accept` and refreshes question details after success.
  - Uses Socket.IO client for live answer notifications.
  - Refactored away from `framer-motion`, `clsx`, and `tailwind-merge`.
  - Updated with pastel question/answer panels, colored status badges, and blue voting controls.

- `src/components/AnswerForm.jsx`
  - Textarea and "Post Answer" button.
  - Calls `POST /answers` with `questionId`, `body`, and an author ID.
  - Routes unauthenticated users to `/login`; no mock ObjectId is used.
  - Calls a parent callback after successful post so `QuestionDetail` can refresh.
  - Updated with cream panel styling and blue post action.

- `src/App.jsx`
  - Dark help-center layout based on the supplied reference image.
  - Uses `BrowserRouter`, `Routes`, and `Route`.
  - `/` renders a local `Home` component with a centered hero, `SearchWidget`, resource cards, and `AQFeed`.
  - Uses the pastel hero gradient and resource cards based on the supplied color reference.
  - Resource cards now use action-oriented titles:
    - Browse official answers
    - Ask the community
    - Review AI suggestions
    - Explore resolved threads
  - Added trust signals to the hero: official manual guidance, peer-reviewed answers, and clearly labeled AI drafts.
  - Replaced the centered database warning with a smaller inline live-data notice and retry action.
  - `/question/:id` renders `QuestionDetail`.
  - `/faq` renders `FAQKnowledgeBase`.
  - `/login` renders `Login`.
  - Home is no longer blocked behind login; posting actions route unauthenticated users to login.

- `src/styles.css`
  - Uses Tailwind v4 CSS entry syntax with `@import "tailwindcss"`.
  - Adds explicit `@source` entries for `src` and `public/index.html` so spacing, sizing, and color utilities are generated correctly.
  - Adds small global resets for anchors, form controls, SVG display, and black body background.
  - Adds explicit `.aq-card-link`, `.aq-card-link-icon`, and `.aq-card-arrow` classes so critical card navigation contrast is guaranteed even when Tailwind arbitrary color output is inconsistent.

- `src/index.jsx` and `public/index.html`
  - Added a temporary visible boot/error fallback while debugging the frontend white screen.
  - If React fails before rendering, the page should display a frontend runtime error instead of staying blank.

## Issues Faced And Resolutions

### Git Safe Directory

Issue:

- `git status` failed with "detected dubious ownership".

Current handling:

- Did not modify Git global config.
- If needed later, run:

```powershell
git config --global --add safe.directory C:/Users/kamis/OneDrive/Documents/FAQ-VLED
```

### NPM Network Cache

Issue:

- Initial npm installs failed with `ENOTCACHED` because sandbox/cache mode did not have packages.

Resolution:

- Re-ran installs with approved network access.

### MongoDB URI Database Name

Issue:

- Initial MongoDB URI pointed at cluster root:

```text
mongodb+srv://<user>:<password>@cluster0.af4an5s.mongodb.net/?appName=Cluster0
```

Resolution:

- Updated URI to include database name:

```text
mongodb+srv://<user>:<password>@cluster0.af4an5s.mongodb.net/aq-portal?appName=Cluster0
```

### MongoDB TLS / Atlas Connection Error

Issue:

- Server startup failed with TLS alert/internal error from MongoDB Atlas:

```text
SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

Impact:

- Server exited before listening, so browser showed `localhost refused to connect`.

Resolution applied in code:

- `server.js` was changed to still start the Express server even if MongoDB connection fails.
- Health endpoint reports `database: "connection_failed"` when DB is unavailable.

Likely remaining Atlas-side checks:

- Confirm Atlas cluster is running.
- Confirm current IP is allowed in Atlas Network Access.
- Confirm database username/password are correct.
- Confirm MongoDB connection string is copied from the Drivers connection flow.
- Confirm local network/firewall is not blocking Atlas TLS.

### PowerShell Start-Process NPM Issue

Issue:

- `Start-Process` with `npm`/`npm.cmd` failed with duplicate `Path`/`PATH` environment key.

Resolution:

- Use direct terminal commands like:

```powershell
npm run dev
```

or:

```powershell
node server.js
```

### Tailwind v4 PostCSS Plugin Change

Issue:

- Build failed because Tailwind CSS can no longer be used directly as a PostCSS plugin.

Resolution:

- Installed `@tailwindcss/postcss`.
- Updated `frontend/postcss.config.js` to use:

```js
"@tailwindcss/postcss": {}
```

Follow-up:

- Tailwind v4 did not generate many spacing/sizing/color utilities from the older `@tailwind base/components/utilities` CSS entry.
- Updated `frontend/src/styles.css` to:

```css
@import "tailwindcss";

@source "./**/*.{js,jsx}";
@source "../public/index.html";
```

- Browser verification confirmed utilities such as `max-w-xl`, `gap-3`, and `px-2` are now emitted.

### React Version

Issue:

- Initial install pulled latest React instead of required React 18.
- `react-router-dom@7` also pulled React 19 dependencies into the workspace, causing risk of white-screen runtime failures.

Resolution:

- Installed:

```powershell
npm install react@18.2.0 react-dom@18.2.0
npm install react-router-dom@6.30.2 --workspace frontend
npm install react@18.2.0 react-dom@18.2.0
```

- Verified with `npm ls react react-dom react-router-dom`; all active React packages now resolve to `18.2.0`.

### Frontend Blank Page / Stale Port 3001

Issue:

- Browser at `http://localhost:3001/` stayed blank.
- `npm run frontend:dev` failed with `EADDRINUSE` because an old process was still listening on port `3001`.
- After restart, the page was still blank, so a visible boot/error fallback was added to expose runtime errors in the page.

Resolution:

- Identified listener with:

```powershell
netstat -ano | findstr :3001
```

- Stopped stale process with:

```powershell
Stop-Process -Id <pid> -Force
```

- Port had drifted to `3000`; it was reset to `3001` in `frontend/webpack.config.js` to match the expected frontend URL.

### Frontend Redesign Dependency Cleanup

Issue:

- Several frontend components had been changed to import `framer-motion`, `clsx`, and `tailwind-merge`.
- The redesign needed to follow the supplied knowledge-base reference without pasting it directly or depending on extra animation/helper abstractions.

Resolution:

- Refactored `SearchWidget`, `AQFeed`, `FAQKnowledgeBase`, `Login`, `QuestionDetail`, and `AnswerForm` into a cohesive VINS/manual-style dark knowledge-base UI.
- Kept the current API contracts: `/search`, `/questions`, `/answers`, `/auth/register`, and `/auth/logout`.
- Added `src/data/faqData.js` as a fallback knowledge-base dataset so the FAQ page still renders while MongoDB Atlas is unavailable.
- Removed all source imports of `framer-motion`, `clsx`, and `tailwind-merge`.
- Verified with `npm run build` and a successful dev-server compile on `http://localhost:3001/`.

Remaining cleanup:

- Attempted to uninstall `framer-motion`, `clsx`, and `tailwind-merge`, but Windows/OneDrive returned `EPERM` while unlinking `node_modules\clsx\clsx.d.ts`.
- Source code does not import those packages now; retry dependency cleanup later after closing processes/editors that may lock `node_modules`.

### SSL Alert 80 / IP Whitelist

Issue:

- Persistent `SSL routines:ssl3_read_bytes:tlsv1 alert internal error` (alert 80) when connecting to MongoDB Atlas.

Resolution:

- User updated Atlas Network Access with correct IP address.
- Verified database is "READY".
- Added `tlsAllowInvalidCertificates: true` to backend connection options to handle local dev environment handshake issues.

### Missing Field: voteCount / acceptedAnswerId

Issue:

- Frontend logic for voting and marking accepted answers failed because schemas lacked these fields.

Resolution:

- Updated `Question.js` and `Answer.js` schemas.
- Added `voteAnswer` controller logic.
- Implemented reputation rewards (+25 points) for accepted answer authors.

### Module Federation: Eager Consumption Error

Issue:

- "Shared module is not available for eager consumption" error in browser.
- Caused by synchronous imports of shared modules (React) in the entry point.

Resolution:

- Implemented the **Asynchronous Bootstrap Pattern**.
- Renamed the main entry logic to `bootstrap.jsx`.
- Updated `index.jsx` to use a dynamic `import("./bootstrap")`.

### Webpack/Babel ESM Parse Conflict

Issue:

- Build failed parsing `frontend/src/api/client.js` with:

```text
'import' and 'export' may appear only with 'sourceType: module'
```

Resolution:

- Updated Babel loader config:

```js
sourceType: "unambiguous",
presets: [
  ["@babel/preset-env", { modules: "commonjs" }],
  "@babel/preset-react",
]
```

## Verification Performed

Backend:

```powershell
node --check server.js
node --check services\openaiService.js
node --check controllers\triageController.js
node --check controllers\questionController.js
node --check controllers\answerController.js
node --check routes\searchRoutes.js
node --check routes\questionRoutes.js
node --check routes\answerRoutes.js
node --check models\Answer.js
```

Frontend:

```powershell
npm run build
```

Latest frontend build completed successfully after the redesign pass.

Latest backend API checks:

```powershell
node --check controllers\questionController.js
```

`GET /api/v1/health` returned `database: "connected"`.

`GET /api/v1/questions` returned paginated questions with `hasEmbedding: false`, confirming normal question responses no longer include vector payloads.

Root build command now works:

```powershell
npm run build
```

Frontend dev server was restarted and compiled successfully on:

```text
http://localhost:3001/
```

In-app browser verification confirmed the home page renders with:

- "Samagama AQ Portal"
- "Ask once. Find answers faster."
- the search-first input
- the community question feed populated from the backend

Latest redesign browser verification confirmed:

- "How can we help?"
- compact `Search...` input with `max-width: 576px`
- resource cards for Manual, Ask, AI Drafts, and Resolved
- recent community threads populated from the backend

Latest color verification:

- `npm run build` completed successfully.
- Frontend dev server was restarted on `http://localhost:3001/`.
- Browser inspection confirmed the hero gradient uses `#FEF9D9`, `#FCE0C6`, `#C1DCEB`, and `#84BBE1`.
- Resource cards render with cream surfaces (`rgb(255, 253, 242)`).

Latest UX audit verification:

- `npm run build` completed successfully.
- Frontend dev server responds at `http://localhost:3001/`.
- Browser inspection confirmed card link text now computes to `rgb(16, 36, 49)` instead of near-white.
- Home page includes trust signals and a clear search-first CTA.
- Feed failure state includes Retry, Browse Manual, and fallback official FAQ cards.

## Generated / Heavy Folders

Do not manually edit:

```text
backend/node_modules/
frontend/node_modules/
frontend/dist/
node_modules/
```

These are generated dependency/build folders.

## Current Gaps / Future Work

- Lightweight auth exists through `/api/v1/auth/register` and `/api/v1/auth/logout`.
- JWT HttpOnly cookie flow exists in basic development form, but still needs production hardening.
- Redis/Upstash caching and rate limiting are not implemented yet.
- Socket.IO real-time answer notifications exist for question rooms, but need final polish and broader notification UX.
- Voting backend persistence exists as simple counters, but duplicate voting per user is not prevented.
- Search flow posting is wired, but depends on login and backend/database availability.
- Answer submission routes unauthenticated users to login.
- Feed receives `answerCount`; accepted-answer display depends on `acceptedAnswerId`.
- Atlas Vector Search index must be created manually in MongoDB Atlas.
- Need seed/test data for users, questions, embeddings, and answers.
- Need better backend transaction handling for accepting answers if this becomes concurrent.

## Update Rule

After every future modification:

1. Update this file with what changed.
2. Add any new files/endpoints/env variables.
3. Record any issue encountered and how it was resolved.
4. Update the current gaps list if something is completed.
5. Keep secrets out of this file.

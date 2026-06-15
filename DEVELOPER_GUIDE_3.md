# Developer Quick Reference Guide

## 🚀 Quick Start

### Run the Project
```bash
cd /c/Users/kkp18/Downloads/FAQ-VLED-main

# Terminal 1: Backend
npm run backend:dev
# Runs on http://localhost:5000

# Terminal 2: Frontend
npm run frontend:dev
# Runs on http://localhost:3001

# MongoDB
# Already running locally on port 27017
```

### Test the API
```bash
# Health check
curl http://localhost:5000/api/v1/health

# Get questions
curl http://localhost:5000/api/v1/questions

# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test","email":"test@test.com"}'

# Search questions
curl "http://localhost:5000/api/v1/search?q=password"
```

---

## 📂 Project Structure

```
backend/
├── controllers/
│   ├── questionController.js     ✅ Create, list, get questions
│   ├── answerController.js       ✅ Answer CRUD, voting
│   └── triageController.js       ✅ Search & duplicate detection
├── routes/
│   ├── questionRoutes.js         ✅ Question endpoints
│   ├── answerRoutes.js           ✅ Answer endpoints
│   ├── searchRoutes.js           ✅ Search endpoint
│   └── authRoutes.js             ⚠️ Register/logout only (no login)
├── models/
│   ├── Question.js               ✅ Schema with validation
│   ├── Answer.js                 ✅ Schema with validation
│   └── User.js                   ✅ Schema ready
├── middleware/
│   ├── authMiddleware.js         ✅ JWT protection
│   └── errorHandler.js           ✅ Error handling
├── services/
│   └── openaiService.js          ⚠️ Fails without API key (fixed to skip)
└── server.js                     ✅ Express setup

frontend/
├── components/
│   ├── App.jsx                   ✅ Router setup
│   ├── SearchWidget.jsx          ⚠️ Search works, create form missing
│   ├── QuestionDetail.jsx        ✅ Question with answers
│   ├── AQFeed.jsx                ✅ Recent questions feed
│   ├── FAQKnowledgeBase.jsx       ✅ FAQ listing
│   ├── Login.jsx                 ⚠️ Calls register instead of login
│   ├── AdminDashboard.jsx        ❌ Route exists, incomplete
│   ├── AnswerForm.jsx            ✅ Answer submission
│   └── ...
├── api/
│   └── client.js                 ✅ Axios instance configured
├── store/
│   └── useStore.js               ⚠️ Only stores user, needs expansion
└── data/
    └── faqData.js                ✅ Sample FAQ data
```

---

## 🔧 Most Critical Files to Edit

### #1 Add Login Endpoint
**File:** `backend/routes/authRoutes.js`  
**Lines:** After line 32 (after register route)

```javascript
// ADD THIS:
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Email and password required" }
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password" }
      });
    }

    // TODO: Add password verification (needs bcrypt)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// ADD THIS:
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user }
  });
});
```

### #2 Fix Question Creation Form
**File:** `frontend/src/components/SearchWidget.jsx`  
**Lines:** 100-150 (where form submission happens)

```javascript
// REPLACE question posting logic with:
const handleCreateQuestion = async () => {
  if (!user) {
    navigate("/login");
    return;
  }

  if (query.length < 8) {
    setError("Question must be at least 8 characters");
    return;
  }

  try {
    setIsPosting(true);
    const response = await apiClient.post("questions", {
      title: query,
      body: body || query,
      tags: ["community"]
    });
    
    showSuccessMessage("Question posted!");
    setQuery("");
    setBody("");
    navigate(`/question/${response.data.data.question._id}`);
  } catch (err) {
    setError(err.response?.data?.error?.message || "Failed to post");
  } finally {
    setIsPosting(false);
  }
};
```

### #3 Fix Session Persistence
**File:** `frontend/src/App.jsx`  
**Lines:** After Router declaration

```javascript
// ADD THIS useEffect BEFORE rendering:
useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await apiClient.get("auth/me");
      setUser(response.data.data.user);
    } catch (error) {
      // Not logged in, try localStorage
      const cached = localStorage.getItem("user");
      if (cached) setUser(JSON.parse(cached));
    }
  };
  
  fetchUser();
}, []);

// ALSO UPDATE setUser in store:
useEffect(() => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
}, [user]);
```

---

## 🐛 Bugs to Fix (Priority Order)

### Bug #1: N+1 Query Problem
**File:** `backend/controllers/questionController.js`  
**Lines:** 130-134  
**Current:** Runs 1 query for questions + 20 queries for answer counts = 21 total

**Fix:** Use aggregation pipeline (1 query total)

### Bug #2: No Error Toasts
**File:** All components  
**Problem:** Errors silently fail  
**Fix:** Add `npm install react-hot-toast`

### Bug #3: OpenAI Crashes
**File:** `backend/services/openaiService.js`  
**Status:** ✅ FIXED

### Bug #4: Login Missing
**File:** `frontend/src/components/Login.jsx`  
**Status:** ❌ UNFIXED - Still calls register

---

## 📝 API Endpoints Cheatsheet

### Auth Endpoints
```
POST   /api/v1/auth/register          ✅ Create user
POST   /api/v1/auth/login             ❌ MISSING
GET    /api/v1/auth/me                ❌ MISSING
POST   /api/v1/auth/logout            ✅ Clear cookie
```

### Question Endpoints
```
GET    /api/v1/questions              ✅ List all (paginated)
GET    /api/v1/questions/:id          ✅ Get one with answers
POST   /api/v1/questions              ✅ Create (requires auth)
```

### Answer Endpoints
```
POST   /api/v1/answers                ✅ Create (requires auth)
PATCH  /api/v1/answers/:id/accept     ✅ Mark as accepted (requires auth)
POST   /api/v1/answers/:id/vote       ✅ Upvote/downvote
POST   /api/v1/answers/official/create ✅ Create official (admin only)
```

### Search Endpoints
```
GET    /api/v1/search?q=query         ✅ Search & triage
```

---

## 🧪 Test Commands

### Test Backend
```bash
# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John","email":"john@test.com"}'

# List questions
curl http://localhost:5000/api/v1/questions

# Get one question
curl http://localhost:5000/api/v1/questions/[QUESTION_ID]

# Search questions
curl "http://localhost:5000/api/v1/search?q=password"

# Create question (with JWT cookie from register)
curl -X POST http://localhost:5000/api/v1/questions \
  -H "Content-Type: application/json" \
  -H "Cookie: token=[JWT_TOKEN]" \
  -d '{"title":"How to reset password?","body":"I forgot my password"}'
```

### Check Frontend
1. Open http://localhost:3001
2. Check console for errors (F12 → Console)
3. Try registering user
4. Try logging out
5. Reload page (user should be gone - fix this!)

---

## 🎯 Implementation Checklist

### Week 1 - Critical Path
- [ ] Add `/auth/login` endpoint
- [ ] Add `/auth/me` endpoint
- [ ] Fix session persistence (localStorage + fetch on load)
- [ ] Update Login component to use /auth/login
- [ ] Complete question creation form in SearchWidget
- [ ] Test full user flow (register → create question → view)
- [ ] Fix N+1 query problem
- [ ] Add error handling with toasts

### Week 2 - High Priority
- [ ] Connect Socket.io from frontend
- [ ] Implement real-time answer updates
- [ ] Build admin dashboard
- [ ] Add input validation (sanitize-html, joi)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Write basic tests

### Week 3 - Polish
- [ ] Add loading skeletons
- [ ] Optimize database queries
- [ ] Setup error tracking (Sentry)
- [ ] Add monitoring (health checks)
- [ ] Write API documentation

---

## 🔍 Debugging Tips

### Backend Logs
```bash
# Backend running? Check console for:
# ✅ "AQ Portal API listening on port 5000"
# ✅ "MongoDB connection: connected"
# ❌ "MongoDB connection: connection_failed"
```

### Frontend Issues
```javascript
// Open browser console (F12)
// Look for:
// - CORS errors (check backend CORS config)
// - 404 errors (API endpoint doesn't exist)
// - Timeout errors (backend not responding)
// - Auth errors (JWT token missing/invalid)
```

### Database Checks
```bash
# Connect to MongoDB
mongo localhost:27017/faq-vled

# List users
db.users.find()

# List questions
db.questions.find()

# List answers
db.answers.find()
```

---

## 🚨 Common Issues & Fixes

### Issue: "CORS error"
**Solution:** Check CORS whitelist in `backend/server.js`

### Issue: "404 Route not found"
**Solution:** Check route is registered in `server.js`

### Issue: "Cannot find module"
**Solution:** Run `npm install` in affected workspace

### Issue: "Port already in use"
**Solution:** Kill process on port 3001 or 5000

### Issue: "Auth token missing"
**Solution:** HttpOnly cookies work differently in dev - check headers

---

## 📚 Useful Resources

### Documentation
- Express.js: https://expressjs.com/
- MongoDB Mongoose: https://mongoosejs.com/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/

### Libraries to Consider
- **Auth:** `bcryptjs` for password hashing
- **Validation:** `joi` or `zod` for input validation
- **Sanitization:** `sanitize-html` for XSS prevention
- **Rate Limiting:** `express-rate-limit`
- **Notifications:** `react-hot-toast`
- **Testing:** `jest` + `supertest`

---

## 🔐 Security Reminders

- ✅ JWT in HttpOnly cookies (secure)
- ❌ No password hashing (add bcrypt)
- ❌ No input sanitization (add sanitize-html)
- ❌ No rate limiting (add express-rate-limit)
- ✅ CORS configured (good)

---

## 📞 When Stuck

1. **Check the logs** - Frontend console (F12) and backend terminal
2. **Test the API** - Use curl to verify endpoint works
3. **Check database** - Verify data in MongoDB
4. **Trace the flow** - Follow request from frontend to backend to DB
5. **Read the error** - Error messages usually tell you what's wrong

---

**Last Updated:** 2026-06-12  
**Quick Reference Version:** 1.0

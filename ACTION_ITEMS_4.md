# Action Items & Implementation Guide

## Executive Summary
**Current Status:** 40% Complete - MVP Foundation Ready  
**Effort to Full Functionality:** 30-40 hours  
**Critical Blockers:** 3 (Auth, Question Creation, Session Persistence)

---

## 📋 Critical Issues (Block MVP)

### Issue #1: Missing Login Endpoint
**Severity:** 🔴 CRITICAL  
**Time:** 2-3 hours  
**Files to Change:** `backend/routes/authRoutes.js`, `frontend/src/components/Login.jsx`

**What's Wrong:**
- Users can register but can't log back in
- No way to recover session after browser close
- Passwordless authentication (security risk)

**Solution:**
```javascript
// backend/routes/authRoutes.js - ADD:
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie("token", token, { httpOnly: true });
  res.json({ success: true, data: { user } });
});

// backend/routes/authRoutes.js - ADD:
router.get("/me", protect, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
```

**Steps:**
1. Add password field to User schema with hashing
2. Implement login route with email/password validation
3. Add `/me` endpoint to fetch current user
4. Update Frontend Login.jsx to call `/auth/login` instead of register
5. Add session check on app load in App.jsx

---

### Issue #2: Question Creation Not Working
**Severity:** 🔴 CRITICAL  
**Time:** 3-4 hours  
**Files to Change:** `frontend/src/components/SearchWidget.jsx`, `frontend/src/api/client.js`

**What's Wrong:**
- SearchWidget has search but no create question form
- No integration with POST /api/v1/questions
- No feedback to user about question creation

**Solution Steps:**
1. Add form fields to SearchWidget (title, body, tags)
2. Call POST /api/v1/questions when user submits
3. Show triage results (potential duplicates)
4. Handle duplicate detection (soft/hard block)
5. Display AI-generated draft after creation
6. Show success message and redirect

**Code Changes:**
```javascript
// SearchWidget.jsx - Add question creation:
const handleCreateQuestion = async () => {
  try {
    const response = await apiClient.post("questions", {
      title: query,
      body, // full question details
      tags: selectedTags
    });
    showSuccessMessage("Question posted!");
    setUser(response.data.data.question);
  } catch (error) {
    showErrorMessage(error.message);
  }
};
```

---

### Issue #3: Session Lost on Page Refresh
**Severity:** 🔴 CRITICAL  
**Time:** 1-2 hours  
**Files to Change:** `frontend/src/App.jsx`, `backend/routes/authRoutes.js`

**What's Wrong:**
- No endpoint to fetch current user
- User state not persisted in store
- User logged out after page refresh

**Solution:**
1. Add `GET /api/v1/auth/me` endpoint (see Issue #1)
2. Call `/auth/me` on App.jsx mount
3. Update Zustand store with current user
4. Save user to localStorage as backup
5. Fetch from localStorage on app load first

**Code:**
```javascript
// App.jsx - Add useEffect:
useEffect(() => {
  const checkAuth = async () => {
    try {
      const response = await apiClient.get("auth/me");
      setUser(response.data.data.user);
    } catch {
      setUser(localStorage.getItem("user_cache"));
    }
  };
  checkAuth();
}, []);
```

---

## 🟠 High Priority Issues (2 weeks)

### Issue #4: Real-time Updates Not Working
**Severity:** 🟠 HIGH  
**Time:** 3-4 hours  
**Impact:** Live feed, instant answer notifications

**Files:** `frontend/src/App.jsx`, `frontend/src/components/AQFeed.jsx`, `frontend/src/components/QuestionDetail.jsx`

**Solution:**
1. Import Socket.io client: `import io from 'socket.io-client'`
2. Connect on app load: `const socket = io('http://localhost:5000')`
3. Join question room when viewing: `socket.emit('join_question', questionId)`
4. Listen for new answers: `socket.on('new_answer', updateUI)`
5. Add visual indicator for live updates

---

### Issue #5: Admin Dashboard Non-functional
**Severity:** 🟠 HIGH  
**Time:** 6-8 hours  
**Impact:** Content moderation impossible

**Build:**
- Question moderation queue
- User management interface
- Official answer creation UI
- Analytics dashboard

---

## 🟡 Medium Priority (3-4 weeks)

### Issue #6: N+1 Query Problem in Database
**Severity:** 🟡 MEDIUM (Performance)  
**Impact:** Slow page loads (1 query for questions + 20 queries for answer counts)

**Current Code (BAD):**
```javascript
// Runs 21 queries (1 + 20 for each question)
questions.forEach(async q => {
  await Answer.countDocuments({ question: q._id });
});
```

**Fixed Code (GOOD):**
```javascript
// Runs 1 query using aggregation
const result = await Question.aggregate([
  { $lookup: { from: "answers", as: "answers" } },
  { $addFields: { answerCount: { $size: "$answers" } } }
]);
```

---

### Issue #7: No Input Validation/Sanitization
**Severity:** 🟡 MEDIUM (Security)  
**Files:** All controllers, all form components

**Install dependencies:**
```bash
npm install sanitize-html express-rate-limit joi
```

**Add validation:**
```javascript
const sanitizeHtml = require('sanitize-html');

// In createQuestion controller:
const title = sanitizeHtml(req.body.title, { 
  allowedTags: [], 
  allowedAttributes: {} 
});
```

---

### Issue #8: No Error Toasts
**Severity:** 🟡 MEDIUM (UX)  
**Time:** 1-2 hours  
**Impact:** User confusion on errors

**Solution:**
```bash
npm install react-hot-toast
```

```javascript
// Use in components:
import toast from 'react-hot-toast';
toast.success('Question posted!');
toast.error('Failed to post question');
```

---

## 📊 Testing Checklist

### Frontend Workflows
- [ ] User Registration
  - [ ] Register new user
  - [ ] Check user appears in store
  - [ ] Check JWT cookie set
  
- [ ] User Login
  - [ ] Login with registered email
  - [ ] User persists on page refresh
  - [ ] Logout clears cookie
  
- [ ] Post Question
  - [ ] Search for existing questions
  - [ ] See duplicate detection results
  - [ ] Submit new question
  - [ ] See AI-generated draft
  
- [ ] Post Answer
  - [ ] Open question detail
  - [ ] See existing answers
  - [ ] Add new answer
  - [ ] See real-time update
  
- [ ] Vote Answer
  - [ ] Upvote answer
  - [ ] Vote count updates
  - [ ] Can't vote twice (prevent)
  
- [ ] Accept Answer
  - [ ] Only question author can accept
  - [ ] Marks as accepted
  - [ ] Author gets reputation
  
### Backend Endpoints
- [ ] `POST /api/v1/auth/register` - Create user
- [ ] `POST /api/v1/auth/login` - Login user
- [ ] `GET /api/v1/auth/me` - Get current user
- [ ] `POST /api/v1/questions` - Create question (auth)
- [ ] `GET /api/v1/questions` - List questions
- [ ] `GET /api/v1/questions/:id` - Get question with answers
- [ ] `POST /api/v1/answers` - Create answer (auth)
- [ ] `PATCH /api/v1/answers/:id/accept` - Accept answer (auth)
- [ ] `POST /api/v1/answers/:id/vote` - Vote on answer
- [ ] `GET /api/v1/search?q=query` - Search questions

---

## 📈 Performance Benchmarks

### Current State
- API response time: ~100-200ms
- Frontend bundle: 3.24MB
- Database query: 20+ queries for 20 questions

### Target State (After fixes)
- API response time: <100ms
- Frontend bundle: <500KB (with code splitting)
- Database query: 1 query for 20 questions

---

## 🔒 Security Checklist

- [ ] Add password hashing (bcrypt)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add input sanitization (sanitize-html)
- [ ] Add CSRF protection (csrf middleware)
- [ ] Add helmet for headers (helmet.js)
- [ ] Rotate JWT secret regularly
- [ ] Add request logging (Morgan)
- [ ] Add error tracking (Sentry)
- [ ] Enable HTTPS in production
- [ ] Set secure headers on responses

---

## 📚 Documentation Needed

1. **API Documentation** (1-2 hours)
   - Use Swagger/OpenAPI
   - Document all endpoints
   - Add example requests/responses

2. **Setup Guide** (1 hour)
   - Installation steps
   - Environment variables
   - How to run locally

3. **Contributing Guide** (1 hour)
   - Code style
   - PR process
   - Testing requirements

---

## 🎯 Success Criteria (MVP)

After Phase 1 (2 weeks):
- ✅ Users can register and login
- ✅ Users can post questions
- ✅ Users can answer questions
- ✅ Questions appear in feed
- ✅ Answers visible on question detail
- ✅ Search finds existing questions
- ✅ No major errors/crashes

After Phase 2 (3 weeks):
- ✅ Real-time answer notifications
- ✅ Admin dashboard working
- ✅ Better error messages
- ✅ Performance improved
- ✅ Basic tests passing

---

## 💡 Quick Wins (Do First)

These fixes take <1 hour each:
1. Fix database connection (DONE ✅)
2. Fix OpenAI service crash (DONE ✅)
3. Add error toast system (15 min)
4. Add loading spinners (15 min)
5. Add form validation (30 min)
6. Fix N+1 query (1 hour)

**Total: 2.5 hours for big UX improvement**

---

## 📱 Testing on Real Device

Before deployment, test on:
- [ ] Desktop (Chrome, Firefox)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone, Android)
- [ ] Check: Forms work, buttons clickable, text readable
- [ ] Check: Images load, animations smooth
- [ ] Check: Navigation works, no broken links

---

## 🚀 Ready to Ship?

**Minimum Requirements:**
- Login/logout working
- Post and answer questions working
- Search finding questions
- No console errors
- Mobile responsive
- Database backed up

**Nice to Have Before Launch:**
- Real-time updates
- Admin dashboard
- User profiles
- Voting system
- Notifications

---

**Last Updated:** 2026-06-12  
**Next Review:** After Phase 1 completion

# CrowdFAQ Testing Guide

This document contains testing documentation and test plans for the CrowdFAQ project.

Actual automated backend tests currently live in:

```text
testing/
```

The testing plans, checklists, and manual QA notes are now located in the `docs/` folder.

## Current Testing Stack

Backend:

```text
Jest
Supertest
Mongoose mocks where needed
OpenAI service mocks where needed
```

Frontend:

```text
Jest
React Testing Library
```

## Run Backend Tests

From the repository root:

```powershell
npm.cmd run test --workspace backend
```

Or from the backend folder:

```powershell
cd backend
npm.cmd test
```

## Backend Testing Documents

Detailed backend testing plan:

*   [backend_testing_plan.md](file:///c:/Users/kkp18/OneDrive/Pictures/Documents/IIT/CrowdFAQ/docs/backend_testing_plan.md)

## Backend Test File Location

Backend test files should be added here:

```text
testing/
```

Recommended files:

```text
testing/auth.test.js
testing/user.test.js
testing/question.test.js
testing/answer.test.js
testing/search.test.js
testing/admin.test.js
testing/health.test.js
```

## Testing Rules

- Do not hit real OpenAI in tests.
- Do not depend on MongoDB Atlas in unit tests.
- Mock external services.
- Test success cases and failure cases.
- Keep tests close to the backend behavior, not frontend UI behavior.
- Run tests before pushing a backend branch.

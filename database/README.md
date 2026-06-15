# CrowdFAQ Database Guide

This document describes the current MongoDB and Mongoose database design used by the CrowdFAQ backend.

The actual source of truth for schema details is:

```text
backend/models/User.js
backend/models/Question.js
backend/models/Answer.js
backend/services/openaiService.js
backend/seed.js
```

## Database Stack

- Database: MongoDB or MongoDB Atlas
- ODM: Mongoose
- Backend: Node.js + Express
- AI search: OpenAI embeddings with MongoDB Atlas Vector Search

## Current Collections

The current backend uses three main collections:

```text
users
questions
answers
```

Current relationship:

```mermaid
erDiagram
    USERS ||--o{ QUESTIONS : "asks"
    USERS ||--o{ ANSWERS : "writes"
    QUESTIONS ||--o{ ANSWERS : "has"
    QUESTIONS ||--o| ANSWERS : "accepted_answer"
    QUESTIONS ||--o| QUESTIONS : "duplicate_of"
```

## User Model

Collection:

```text
users
```

Current fields:

| Field | Type | Notes |
|---|---|---|
| `displayName` | String | Required, 2-80 chars |
| `email` | String | Required, unique, indexed |
| `passwordHash` | String | Required, excluded from query results by default |
| `role` | String | `student`, `moderator`, or `admin` |
| `reputationScore` | Number | Defaults to `0` |
| `badges` | String array | Defaults to `[]` |
| `streak` | Number | Defaults to `0` |
| `createdAt` | Date | Added by timestamps |
| `updatedAt` | Date | Added by timestamps |

Current role values:

```text
student
moderator
admin
```

Note: The current auth flow is still a simple development registration flow. Password values are stored as hashes with a lightweight built-in `scrypt` helper, but a future production version should add full login verification, email verification, password reset, and stronger session management.

## Question Model

Collection:

```text
questions
```

Current fields:

| Field | Type | Notes |
|---|---|---|
| `title` | String | Required, 8-180 chars |
| `body` | String | Required, 10-5000 chars |
| `author` | ObjectId | References `User`, required, indexed |
| `tags` | String array | Indexed |
| `embedding` | Number array | Optional, expected length `1536` when present |
| `duplicateOf` | ObjectId | References another `Question`, optional |
| `acceptedAnswerId` | ObjectId | References `Answer`, optional |
| `upvoteCount` | Number | Defaults to `0` |
| `downvoteCount` | Number | Defaults to `0` |
| `duplicateScore` | Number | Optional value from `0` to `1` |
| `status` | String | Indexed |
| `createdAt` | Date | Added by timestamps |
| `updatedAt` | Date | Added by timestamps |

Current question status values:

```text
pending
answered
verified
resolved
duplicate
closed
```

Current indexes:

```js
questionSchema.index({ createdAt: -1, _id: -1 });
```

Important built-in indexes from schema fields:

```text
author
tags
duplicateOf
acceptedAnswerId
status
```

Virtual relationship:

```text
Question.answers -> Answer documents where Answer.question equals Question._id
```

## Answer Model

Collection:

```text
answers
```

Current fields:

| Field | Type | Notes |
|---|---|---|
| `question` | ObjectId | References `Question`, required, indexed |
| `author` | ObjectId | References `User`, optional, indexed |
| `body` | String | Required, 2-5000 chars |
| `aiGenerated` | Boolean | Defaults to `false`, indexed |
| `isAccepted` | Boolean | Defaults to `false`, indexed |
| `isOfficial` | Boolean | Defaults to `false`, indexed |
| `upvoteCount` | Number | Defaults to `0` |
| `downvoteCount` | Number | Defaults to `0` |
| `createdAt` | Date | Added by timestamps |
| `updatedAt` | Date | Added by timestamps |

Virtual field:

```text
netVoteScore = upvoteCount - downvoteCount
```

Current index:

```js
answerSchema.index({ question: 1, createdAt: 1 });
```

## Search And Embeddings

The backend uses OpenAI embeddings for semantic search.

Current embedding model:

```text
text-embedding-3-small
```

Current expected embedding dimensions:

```text
1536
```

The backend stores the embedding on each question:

```text
Question.embedding
```

When OpenAI is unavailable or no API key is configured, the current search controller falls back to text search behavior where possible.

## MongoDB Atlas Vector Search

If using MongoDB Atlas Vector Search, create a vector index on the `questions` collection.

Recommended index name:

```text
vector_index
```

Recommended configuration for the current backend:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

The search controller currently queries:

```js
{
  $vectorSearch: {
    index: "vector_index",
    path: "embedding",
    queryVector: embedding,
    numCandidates: 100,
    limit: 5
  }
}
```

## Seed Script

The current seed script is:

```text
backend/seed.js
```

There is currently no `seed` script in `backend/package.json`, so run it directly:

```powershell
cd backend
node seed.js
```

## Current API Areas Using The Database

Authentication and users:

```text
POST /api/v1/auth/register
POST /api/v1/auth/logout
```

Questions:

```text
GET  /api/v1/questions
POST /api/v1/questions
GET  /api/v1/questions/:id
```

Answers:

```text
POST  /api/v1/answers
PATCH /api/v1/answers/:id/accept
POST  /api/v1/answers/:id/vote
POST  /api/v1/answers/official/create
```

Search:

```text
GET /api/v1/search?q=...
```

## Recommended Next Database Improvements

These are not fully implemented yet, but they are good next steps.

### Improve Authentication Fields

For production auth, improve:

```text
emailVerified
lastLoginAt
```

### Improve Official Answer Metadata

Current official answers use `Answer.isOfficial`. For richer admin history, add:

```text
Answer.officialSource
Answer.verifiedBy
Answer.verifiedAt
```

### Add Separate Vote Tracking

Current voting uses counters only. To prevent duplicate votes, add a separate vote collection:

```text
votes
```

Suggested fields:

```text
user
targetType
targetId
voteType
createdAt
updatedAt
```

### Add Categories

Current tags are strings. Categories can be added later:

```text
categories
```

Suggested fields:

```text
name
slug
description
createdAt
updatedAt
```

### Add Notifications

Useful for real-time and user engagement:

```text
notifications
```

Suggested fields:

```text
user
title
body
type
isRead
referenceType
referenceId
createdAt
```

### Add Reports And Moderation

Useful for admin workflows:

```text
reports
```

Suggested fields:

```text
reporter
targetType
targetId
reason
details
status
resolvedBy
resolvedAt
createdAt
```

## Team Guidance

For team development, use these files as ownership boundaries:

```text
Auth/User member:
  backend/models/User.js

Questions member:
  backend/models/Question.js

Answers member:
  backend/models/Answer.js

Search/AI member:
  backend/services/openaiService.js
  Question.embedding

Admin/QA member:
  seed data, indexes, docs, moderation-related future models
```

Avoid creating separate MongoDB connections in feature files. The backend should share one database connection through server startup/config.

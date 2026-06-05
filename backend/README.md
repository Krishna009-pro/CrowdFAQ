# Backend Architecture Blueprint

This document details the layout, routing patterns, dependency injections, and setup guides for the **FastAPI** backend of CrowdFAQ.

---

## 1. Directory Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # App configurations (Pydantic Settings)
│   │   ├── database.py       # SQLAlchemy engine & session definitions
│   │   └── security.py       # Password hashing, JWT token lifecycle
│   ├── crud/                 # Database helper queries (CRUD)
│   │   ├── crud_user.py
│   │   ├── crud_question.py
│   │   └── crud_answer.py
│   ├── models/               # SQLAlchemy / SQLModel models
│   │   ├── user.py
│   │   ├── question.py
│   │   ├── answer.py
│   │   └── base.py
│   ├── routers/              # API Route endpoints
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── questions.py
│   │   ├── answers.py
│   │   ├── categories.py
│   │   ├── moderation.py
│   │   └── analytics.py
│   ├── schemas/              # Pydantic schemas (request/response validation)
│   │   ├── user.py
│   │   ├── question.py
│   │   └── answer.py
│   ├── services/             # Integrations (AI Service clients, email triggers)
│   │   └── ai_client.py
│   ├── main.py               # Main application entrypoint
│   └── deps.py               # Common FastAPI dependencies (e.g., current_user)
├── requirements.txt          # Python dependencies
├── alembic.ini               # Database migration configurations
└── migrations/               # Alembic migration scripts
```

---

## 2. API Endpoints Reference

### 2.1 Authentication (`/api/v1/auth`)
* `POST /register`: Registers a new normal user account.
* `POST /login`: Validates credentials, returns JWT bearer token.
* `POST /forgot-password`: Generates reset token & sends password recovery link.
* `POST /reset-password`: Validates token and updates password.

### 2.2 User Profiles (`/api/v1/users`)
* `GET /me`: Returns profile of the currently logged-in user.
* `PUT /me`: Updates profile details (name, profile picture).
* `GET /{user_id}`: Views public user profile, reputation points, active badges.
* `GET /leaderboard`: Returns gamification leaderboard list (daily/weekly/monthly/all-time).

### 2.3 Question Management (`/api/v1/questions`)
* `GET /`: Lists questions (supports keyword query, filters, paginations).
* `POST /`: Creates a question. Runs asynchronous AI duplicate checks and tag recommendations.
* `GET /{question_slug}`: Retrieves single question detail, related questions list, and answer list.
* `PUT /{question_id}`: Edits title, description, or tags (Owner or Moderator/Admin only).
* `DELETE /{question_id}`: Deletes question (Owner or Moderator/Admin only).
* `POST /{question_id}/follow`: Toggles following a question for updates.

### 2.4 Answer Management (`/api/v1/answers`)
* `POST /{question_id}`: Post answer to a question. Triggers reputation updates.
* `PUT /{answer_id}`: Edits content.
* `DELETE /{answer_id}`: Deletes answer.
* `POST /{answer_id}/best`: Marks the answer as "Best Answer" (Question Author only).
* `POST /{answer_id}/verify`: Officially endorses the answer (Faculty or Expert only).

### 2.5 Categories (`/api/v1/categories`)
* `GET /`: Lists all active categories.
* `POST /`: Creates a new category (Admin only).
* `PUT /{id}`: Modifies category (Admin only).
* `DELETE /{id}`: Deletes category (Admin only).

### 2.6 Voting (`/api/v1/votes`)
* `POST /questions/{id}`: Upvotes/Downvotes/Removes vote on a question.
* `POST /answers/{id}`: Upvotes/Downvotes/Removes vote on an answer.

### 2.7 Moderation & Reports (`/api/v1/moderation`)
* `POST /report`: Flags content (question/answer/comment) for spam or wrong information.
* `GET /reports`: Lists all pending flags (Moderator/Admin only).
* `POST /reports/{report_id}/resolve`: Resolves a reported item (dismiss, hide, suspend).

---

## 3. Role-Based Access Control (RBAC) implementation

RBAC is enforced via FastAPI's Dependency Injection system (`Depends`). We check the user's role relation before serving guarded endpoints.

```python
# app/deps.py snippet
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.core.security import get_current_user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_verified:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        if user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        return user

# Example usage:
# @router.post("/categories", dependencies=[Depends(RoleChecker(["Admin"]))])
```

---

## 4. Local Development Setup

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PROJECT_NAME="CrowdFAQ"
   SECRET_KEY="your-super-secret-jwt-key"
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   DATABASE_URL="postgresql://postgres:password@localhost:5432/crowdfaq"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
4. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```
5. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   * The interactive OpenAPI Swagger documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs).

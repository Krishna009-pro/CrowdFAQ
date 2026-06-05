# Testing Strategy & Mocking Blueprint

This document defines the testing frameworks, directory structures, database transactional fixtures, and mocking conventions for CrowdFAQ.

---

## 1. Directory Structure

```
testing/
├── backend/                  # Python backend tests
│   ├── conftest.py           # Pytest shared fixtures (db, client)
│   ├── test_auth.py          # Signup, login, roles guards
│   ├── test_questions.py     # Ask, edit, query validation
│   ├── test_answers.py       # Posts, verifications, gamification updates
│   └── mocks/
│       ├── test_ai_mock.py   # Mock routines for LLM / embeddings
│       └── __init__.py
├── frontend/                 # React frontend tests
│   ├── setup.js              # Vitest environment setup
│   ├── test-utils.jsx        # Custom wrappers for providers (Auth, Route)
│   ├── components/           # Component unit tests
│   │   ├── QuestionCard.test.jsx
│   │   └── ChatBot.test.jsx
│   └── pages/                # Integration page tests
│       └── Dashboard.test.jsx
└── README.md
```

---

## 2. Backend testing (FastAPI + Pytest)

We use `pytest` alongside `httpx` to test API routes asynchronously.

### 2.1 Isolated Test Database Configuration
To ensure tests run in isolation and rollback changes automatically:
```python
# testing/backend/conftest.py snippet
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.main import app
from app.deps import get_db

TEST_DATABASE_URL = "postgresql://postgres:password@localhost:5432/crowdfaq_test"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```

### 2.2 Mocking Sentence Transformers & Gemini API
Running heavy AI models and external API requests during tests is slow, expensive, and fragile. We use mock fixtures:

```python
# testing/backend/mocks/test_ai_mock.py snippet
import pytest
from unittest.mock import MagicMock

@pytest.fixture(autouse=True)
def mock_embedder(monkeypatch):
    """Mocks the embedder package to return a dummy 384-dim array instantly."""
    mock_encode = MagicMock(return_value=[0.1] * 384)
    monkeypatch.setattr("ai.embedder.embedder.get_embedding", mock_encode)
    return mock_encode

@pytest.fixture(autouse=True)
def mock_gemini(monkeypatch):
    """Mocks Gemini generate_content to prevent external API calls."""
    mock_generate = MagicMock()
    mock_generate.return_value.text = "This is a mock summary/suggested tags output."
    
    # Mocking standard generative model
    monkeypatch.setattr(
        "google.generativeai.GenerativeModel.generate_content", 
        mock_generate
    )
    return mock_generate
```

---

## 3. Frontend Testing (React + Vitest)

We use `Vitest` with `React Testing Library` for checking rendering and states.

### 3.1 Setup Config
```javascript
// testing/frontend/setup.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia for responsive CSS elements
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 3.2 Running tests
* **Backend Command**:
  ```bash
  cd backend
  pytest ../testing/backend/
  ```
* **Frontend Command**:
  ```bash
  cd frontend
  npm run test
  ```

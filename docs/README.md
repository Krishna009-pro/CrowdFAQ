# Developer Onboarding & Documentation Guidelines

This folder contains the specifications, onboarding setups, and styling guides for developers contributing to the CrowdFAQ codebase.

---

## 1. Developer Onboarding Checklist

Follow these steps to set up CrowdFAQ on a local machine from scratch:

1. **System Requirements**:
   * Python (v3.9 or higher)
   * Node.js (v16 or higher)
   * PostgreSQL (v14 or higher) with `pgvector` enabled.

2. **Clone and Initialize**:
   ```bash
   git clone <repo-url>
   cd CrowdFAQ
   ```

3. **Backend Setup**:
   * Complete the environment configuration and run migrations as detailed in [Backend Blueprint](file:///c:/Users/kkp18/OneDrive/Pictures/Documents/IIT/CrowdFAQ/backend/README.md).
   * Seed categories and roles into the database (see Seed Data below).

4. **Frontend Setup**:
   * Configure state context and startup script as detailed in [Frontend Blueprint](file:///c:/Users/kkp18/OneDrive/Pictures/Documents/IIT/CrowdFAQ/frontend/README.md).

5. **AI Module Activation**:
   * Ensure your Gemini API Key is configured. Refer to the [AI Blueprint](file:///c:/Users/kkp18/OneDrive/Pictures/Documents/IIT/CrowdFAQ/ai/README.md) for how embeddings are loaded.

---

## 2. API Documentation (OpenAPI / Swagger)

FastAPI automatically compiles standard schemas under `/docs` (Swagger) and `/redoc` (ReDoc) based on function parameters and Pydantic schemas. 

* Use **Pydantic Descriptions** to ensure documentation remains self-explanatory:
  ```python
  from pydantic import BaseModel, Field

  class QuestionCreate(BaseModel):
      title: str = Field(..., description="A unique, concise summary of the question", example="How do I get an internship?")
      description: str = Field(..., description="Markdown detailed body containing instructions or resources")
  ```

---

## 3. Code Style & Conventions

To maintain a consistent codebase across contributors:

### 3.1 Python (Backend & AI)
* **Style Guide**: PEP 8 compliance.
* **Docstrings**: Use **Google Docstring Style**:
  ```python
  def calculate_reputation(action: str, current_reputation: int) -> int:
      """Calculates updated reputation points.

      Args:
          action: The trigger action (e.g., 'upvote', 'verified').
          current_reputation: User's existing reputation total.

      Returns:
          The newly computed reputation value.
      """
  ```

### 3.2 JavaScript/React (Frontend)
* **Formatting**: ESlint + Prettier.
* **Component Naming**: Use PascalCase (e.g., `AnswerList.jsx`).
* **Hook Naming**: Prefix custom hooks with `use` (e.g., `useAuth.js`).

---

## 4. Seed Data Script
You can seed initial data (such as default roles, initial categories like Placements and Academics, and starting admin/expert badges) using this utility:
```bash
# Run from within the backend directory
python -m app.utils.seed_db
```

---

## 5. Deployment Architectures

For production deployments:
* **Frontend**: Deploy to **Vercel** or Netlify (configured via `vercel.json` for SPA redirects).
* **Backend**: Deploy to **Render**, Railway, or AWS ECS.
* **Database**: Neon or Supabase Cloud PostgreSQL databases with `pgvector` enabled.

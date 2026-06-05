# AI Module & LLM Orchestration Blueprint

This document details the AI architecture, local embedding generation, Gemini integration, and prompt structures for duplicate detection, semantic search, summarization, and tag generation.

---

## 1. AI Architecture & RAG Pipeline

CrowdFAQ utilizes a hybrid Retrieval-Augmented Generation (RAG) and Semantic Similarity Pipeline:

```
[ User Input Question ]
          │
          ▼
┌──────────────────┐
│  Embedding Svc   │ ───► Generate 384-dim vector using 'all-MiniLM-L6-v2'
└──────────────────┘
          │
          ▼
┌──────────────────┐
│ PostgreSQL       │ ───► Cosine Similarity search using HNSW & pgvector
│ (Vector DB)      │      Threshold check (> 0.82) -> Duplicate flag
└──────────────────┘
          │
      If Found
          ▼
┌──────────────────┐
│ Suggest Existing │
│    Discussion    │
└──────────────────┘
```

---

## 2. Dependencies
Ensure you install the following dependencies:
```txt
google-generativeai>=0.3.0
sentence-transformers>=2.2.2
numpy>=1.22.0
```

---

## 3. Implementation Code Snippets

### 3.1 Local Vector Embeddings (Sentence Transformers)
We use `all-MiniLM-L6-v2` because it is highly efficient, generates compact 384-dimension vectors, and performs exceptionally well on semantic search tasks.

```python
# ai/embedder.py
from sentence_transformers import SentenceTransformer
import numpy as np

class Embedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        # Loads model to CPU or GPU automatically
        self.model = SentenceTransformer(model_name)

    def get_embedding(self, text: str) -> list[float]:
        if not text.strip():
            return [0.0] * 384
        embedding = self.model.encode(text)
        return embedding.tolist()

embedder = Embedder()
```

### 3.2 Semantic Similarity Database Queries
When a question is posted, calculate the similarity index:
```python
# backend/app/crud/crud_question.py snippet
from sqlalchemy.orm import Session
from pgvector.sqlalchemy import cocos_distance  # assuming pgvector wrapper is configured
from app.models.question import Question

def check_for_duplicates(db: Session, text_embedding: list[float], limit: int = 3):
    # Vector Cosine Distance threshold: distance = 1 - similarity.
    # Therefore, similarity > 0.82 is equivalent to distance < 0.18.
    threshold = 0.18
    duplicates = (
        db.query(Question)
        .filter(Question.embedding.cosine_distance(text_embedding) < threshold)
        .order_by(Question.embedding.cosine_distance(text_embedding))
        .limit(limit)
        .all()
    )
    return duplicates
```

### 3.3 Gemini API Configuration & Answer Summarization
For threads with multiple answers, we compile the dialogue into a structured summary.
```python
# ai/summarizer.py
import google.generativeai as genai
from app.core.config import settings

class GeminiOrchestrator:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def summarize_answers(self, question_title: str, answers: list[str]) -> str:
        if not answers:
            return "No answers provided yet."
        
        compiled_answers = "\n".join([f"- {ans}" for ans in answers])
        prompt = f"""
You are an expert technical editor. Summarize the discussions and answers to the question below.
Provide a concise 3-4 sentence paragraph that captures the most helpful and accurate details from the answers.

Question: {question_title}

Answers:
{compiled_answers}

Summary:
"""
        response = self.model.generate_content(prompt)
        return response.text.strip()

    def suggest_tags_and_category(self, title: str, description: str, categories: list[str]) -> dict:
        prompt = f"""
Given a question's title and description, choose the most relevant category from the options provided, and suggest 3-5 tags.
Return your response ONLY as a valid JSON object with keys "category" and "tags".

Available Categories: {', '.join(categories)}

Question Title: {title}
Question Description: {description}

JSON Response:
"""
        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        import json
        return json.loads(response.text)
```

### 3.4 AI Chat Assistant (RAG Engine)
When a user asks a question in the chatbot:
1. Search database questions for top 3 matching semantic context.
2. Formulate prompt containing matched context and user query.
3. Pass prompt to Gemini to construct the output.
```python
# ai/assistant.py
def answer_user_query(db_session, user_query: str) -> str:
    # 1. Generate Query Vector
    query_vector = embedder.get_embedding(user_query)
    
    # 2. Query top match questions with verified answers
    # (Pseudocode for fetching matching context)
    context_matches = fetch_best_matches(db_session, query_vector, limit=3)
    
    context_text = ""
    for match in context_matches:
        context_text += f"Q: {match.title}\nA: {match.best_answer_content}\n\n"
        
    # 3. Construct LLM payload
    prompt = f"""
You are the CrowdFAQ Community AI Assistant. Answer the user's question using the context provided.
If the context doesn't contain enough information, state that you don't know the answer but invite the user to post the question to the community.

Context:
{context_text}

User Question: {user_query}

Answer:
"""
    orchestrator = GeminiOrchestrator()
    response = orchestrator.model.generate_content(prompt)
    return response.text.strip()
```

---

## 4. Operational Instructions & Models

1. **Environment Config**: Provide `GEMINI_API_KEY` inside `backend/.env`.
2. **Cold Start Caching**: Sentence Transformers downloads the `all-MiniLM-L6-v2` model from Hugging Face on its first initialization. Keep this model cached locally in `<user_home>/.cache/huggingface` to speed up start times.
3. **Chunking**: For long descriptions, implement character limit capping (e.g. first 500 characters) before passing to sentence-transformers to avoid vector skewing.

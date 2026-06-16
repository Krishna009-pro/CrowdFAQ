import json

from embedding_service import generate_embedding
from vector_search import search
from decision_engine import decide

def chatbot(query):

    with open("embeddings.json") as f:
        data = json.load(f)

    query_embedding = generate_embedding(query)

    score, match = search(query_embedding, data)

    action = decide(score)

    return {
        "action": action,
        "score": score,
        "answer": match["answer"]
    }
from fastapi import FastAPI
from pydantic import BaseModel
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("faiss_index.bin")
with open("faiss_chunks.pkl", "rb") as f:
    chunks = pickle.load(f)

class QueryRequest(BaseModel):
    query: str
    top_n: int = 3

@app.post("/search")
def search(request: QueryRequest):
    embedding = model.encode([request.query], convert_to_numpy=True)
    D, I = index.search(embedding, request.top_n)
    results = [{"chunk": chunks[i], "score": float(1 - D[0][idx])} for idx, i in enumerate(I[0])]
    return {"results": results}

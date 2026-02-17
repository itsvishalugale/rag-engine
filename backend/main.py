from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.rag import get_rag_chain
from backend.ingest import ingest_documents
import os
import shutil

app = FastAPI(title="Optimized Smart Hybrid RAG Assistant")

# =========================
# CORS CONFIG
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = "data/pdfs"

# =========================
# LOAD RAG SYSTEM
# =========================
qa_chain = get_rag_chain()


class Question(BaseModel):
    query: str


# =========================
# ASK (STREAMING)
# =========================
@app.post("/ask")
def ask_question(question: Question):

    def generate():
        for chunk in qa_chain.stream(question.query):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")


# =========================
# UPLOAD ENDPOINT
# =========================
@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(DATA_PATH, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Re-index documents
    ingest_documents()

    # Reload RAG system
    global qa_chain
    qa_chain = get_rag_chain()

    return {
        "message": f"{file.filename} uploaded and indexed successfully."
    }

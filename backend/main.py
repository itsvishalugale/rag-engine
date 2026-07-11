from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.rag import get_rag_chain
from backend.ingest import ingest_documents
import os
import shutil
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Smart Rag AI Assistant")

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
os.makedirs(DATA_PATH, exist_ok=True)

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
    os.makedirs(DATA_PATH, exist_ok=True)
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


# =========================
# DOCUMENT MANAGEMENT
# =========================
@app.get("/documents")
def list_documents():
    os.makedirs(DATA_PATH, exist_ok=True)
    files = [f for f in os.listdir(DATA_PATH) if f.endswith(".pdf")]
    return files


@app.delete("/documents/{filename}")
def delete_document(filename: str):
    file_path = os.path.join(DATA_PATH, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(file_path)

    # Re-index documents
    ingest_documents()

    # Reload RAG system
    global qa_chain
    qa_chain = get_rag_chain()

    return {"message": f"{filename} deleted and vector store re-indexed."}


@app.delete("/documents")
def clear_documents():
    if os.path.exists(DATA_PATH):
        for f in os.listdir(DATA_PATH):
            if f.endswith(".pdf"):
                os.remove(os.path.join(DATA_PATH, f))

    # Re-index documents (creates empty placeholder index)
    ingest_documents()

    # Reload RAG system
    global qa_chain
    qa_chain = get_rag_chain()

    return {"message": "All documents deleted and vector store cleared."}

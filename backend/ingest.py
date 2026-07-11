import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

DATA_PATH = "data/pdfs"
DB_PATH = "vectorstore/db"


def ingest_documents():
    documents = []

    # Ensure directories exist
    os.makedirs(DATA_PATH, exist_ok=True)

    # Load all PDFs
    for file in os.listdir(DATA_PATH):
        if file.endswith(".pdf"):
            loader = PyPDFLoader(os.path.join(DATA_PATH, file))
            documents.extend(loader.load())

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    # If no documents are uploaded, initialize database with a placeholder text to prevent startup crashes
    if not documents:
        vectorstore = FAISS.from_texts(
            ["No documents uploaded yet. Please upload PDF documents to start chatting."],
            embeddings
        )
        os.makedirs(DB_PATH, exist_ok=True)
        vectorstore.save_local(DB_PATH)
        print("[SUCCESS] Vector store initialized with empty placeholder")
        return

    # 🔥 Balanced chunking (accuracy + speed)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)
    vectorstore = FAISS.from_documents(chunks, embeddings)

    os.makedirs(DB_PATH, exist_ok=True)
    vectorstore.save_local(DB_PATH)

    print(f"[SUCCESS] Ingested {len(chunks)} chunks successfully")


if __name__ == "__main__":
    ingest_documents()
